package corncine.example.ticket_service.service.impl;

import corncine.example.ticket_service.entity.BookingTransactionEntity;
import corncine.example.ticket_service.entity.UserEntity;
import corncine.example.ticket_service.exception.ResourceNotFoundException;
import corncine.example.ticket_service.payload.req.XenditInvoiceReq;
import corncine.example.ticket_service.repository.BookingTransactionRepository;
import corncine.example.ticket_service.repository.UserRepository;
import corncine.example.ticket_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final BookingTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String XENDIT_URL = "https://api.xendit.co/v2/invoices";

    @Value("${xendit.secret-key}")
    private String xenditSecretKey;

    @Override
    @Transactional
    public Map<String, Object> createInvoice(XenditInvoiceReq request, String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BookingTransactionEntity transaction = transactionRepository.findByOrderId(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaksi dengan booking code " + request.getBookingId() + " tidak ditemukan"));

        if (!transaction.getUserId().equals(user.getId())) {
            throw new IllegalStateException("Anda tidak memiliki akses ke transaksi ini.");
        }

        if ("PAID".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi ini sudah lunas.");
        } else if ("CANCELLED".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi ini sudah dibatalkan.");
        }

        String payerEmail = (request.getUserEmail() != null && !request.getUserEmail().isBlank())
                ? request.getUserEmail()
                : user.getEmail();

        // bookingCode kita (orderId) sudah berformat "CORNCINE-...", jadi pakai apa adanya
        // agar tidak menjadi "CORNCINE-CORNCINE-..."
        String externalId = request.getBookingId().startsWith("CORNCINE-")
                ? request.getBookingId()
                : "CORNCINE-" + request.getBookingId();

        String description = (request.getDescription() != null && !request.getDescription().isBlank())
                ? request.getDescription()
                : "Pembayaran tiket CornCine " + transaction.getOrderId();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((xenditSecretKey + ":").getBytes());
        headers.set("Authorization", authHeader);

        Map<String, Object> body = new HashMap<>();
        body.put("external_id", externalId);
        body.put("amount", request.getAmount().longValue());
        body.put("payer_email", payerEmail);
        body.put("description", description);
        body.put("success_redirect_url", "http://localhost:5173/my-tickets?status=success");
        body.put("failure_redirect_url", "http://localhost:5173/my-tickets?status=failed");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(XENDIT_URL, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null
                    && response.getBody().get("invoice_url") != null) {
                // Simpan invoice_url agar bisa dipakai ulang / dilacak dari riwayat
                transaction.setPaymentUrl(response.getBody().get("invoice_url").toString());
                transaction.setPaymentMethod("XENDIT");
                transactionRepository.save(transaction);
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Gagal membuat invoice Xendit untuk bookingId: {}", request.getBookingId(), e);
            throw new RuntimeException("Gagal membuat invoice pembayaran Xendit: " + e.getMessage());
        }

        throw new RuntimeException("Respon tidak valid dari Xendit (invoice_url tidak ditemukan).");
    }

    @Override
    @Transactional
    public Map<String, Object> syncPaymentStatus(String bookingCode, String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BookingTransactionEntity transaction = transactionRepository.findByOrderId(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaksi dengan booking code " + bookingCode + " tidak ditemukan"));

        if (!transaction.getUserId().equals(user.getId())) {
            throw new IllegalStateException("Anda tidak memiliki akses ke transaksi ini.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("bookingCode", transaction.getOrderId());

        // Sudah final di sisi kita -> tidak perlu tanya Xendit lagi
        if ("PAID".equals(transaction.getPaymentStatus()) || "CANCELLED".equals(transaction.getPaymentStatus())) {
            result.put("paymentStatus", transaction.getPaymentStatus());
            result.put("invoiceStatus", transaction.getPaymentStatus());
            return result;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((xenditSecretKey + ":").getBytes());
        headers.set("Authorization", authHeader);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        String url = XENDIT_URL + "?external_id=" + transaction.getOrderId();

        String invoiceStatus = null;
        String paymentMethod = null;
        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && !response.getBody().isEmpty()) {
                Object first = response.getBody().get(0);
                if (first instanceof Map) {
                    Map invoice = (Map) first;
                    Object st = invoice.get("status");
                    if (st != null) invoiceStatus = st.toString();
                    Object pm = invoice.get("payment_method");
                    if (pm == null) pm = invoice.get("payment_channel");
                    if (pm != null) paymentMethod = pm.toString();
                }
            }
        } catch (Exception e) {
            log.error("Gagal sinkron status Xendit untuk booking {}", bookingCode, e);
            throw new RuntimeException("Gagal mengecek status ke Xendit: " + e.getMessage());
        }

        if (invoiceStatus == null) {
            throw new ResourceNotFoundException("Invoice " + bookingCode + " tidak ditemukan di Xendit.");
        }

        if ("PAID".equalsIgnoreCase(invoiceStatus) || "SETTLED".equalsIgnoreCase(invoiceStatus)) {
            transaction.setPaymentStatus("PAID");
            transaction.setPaymentMethod(paymentMethod != null ? paymentMethod : "XENDIT");
            transaction.setPaymentTime(LocalDateTime.now());
        } else if ("EXPIRED".equalsIgnoreCase(invoiceStatus) || "FAILED".equalsIgnoreCase(invoiceStatus)) {
            // CANCELLED otomatis membebaskan kursi (query occupied hanya menghitung PENDING/PAID)
            transaction.setPaymentStatus("CANCELLED");
        }
        transactionRepository.save(transaction);

        result.put("paymentStatus", transaction.getPaymentStatus());
        result.put("invoiceStatus", invoiceStatus);
        log.info("Sync Xendit: {} -> invoice {}, status tiket {}", bookingCode, invoiceStatus, transaction.getPaymentStatus());
        return result;
    }

    @Override
    @Transactional
    public void handleXenditWebhook(Map<String, Object> payload) {
        if (payload == null || payload.get("external_id") == null) {
            log.warn("Menerima webhook Xendit tanpa external_id, diabaikan.");
            return;
        }

        String externalId = payload.get("external_id").toString();

        // Cari transaksi: coba exact match dulu, lalu coba tanpa prefix
        Optional<BookingTransactionEntity> txOpt = transactionRepository.findByOrderId(externalId);
        if (txOpt.isEmpty() && externalId.startsWith("CORNCINE-")) {
            txOpt = transactionRepository.findByOrderId(externalId.substring("CORNCINE-".length()));
        }

        BookingTransactionEntity transaction = txOpt.orElseThrow(
                () -> new ResourceNotFoundException("Transaksi dengan external_id " + externalId + " tidak ditemukan"));

        Object statusObj = payload.get("status");
        String status = statusObj != null ? statusObj.toString() : "";

        if ("PAID".equalsIgnoreCase(status) || "SETTLED".equalsIgnoreCase(status)) {
            transaction.setPaymentStatus("PAID");
            Object methodObj = payload.getOrDefault("payment_method", payload.getOrDefault("payment_channel", "XENDIT"));
            transaction.setPaymentMethod(methodObj != null ? methodObj.toString() : "XENDIT");
            transaction.setPaymentTime(LocalDateTime.now());
        } else if ("EXPIRED".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status)) {
            // Status CANCELLED otomatis membebaskan kursi (query occupied hanya menghitung PENDING/PAID)
            transaction.setPaymentStatus("CANCELLED");
        } else {
            log.info("Webhook Xendit status {} untuk {} belum ditangani, diabaikan.", status, externalId);
            return;
        }

        transactionRepository.save(transaction);
        log.info("Webhook Xendit: transaksi {} diubah menjadi {}", externalId, transaction.getPaymentStatus());
    }
}
