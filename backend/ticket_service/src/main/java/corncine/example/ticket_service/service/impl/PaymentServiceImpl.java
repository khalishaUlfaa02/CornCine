package corncine.example.ticket_service.service.impl;

import corncine.example.ticket_service.entity.BookingTransactionEntity;
import corncine.example.ticket_service.payload.req.XenditInvoiceReq;
import corncine.example.ticket_service.repository.BookingTransactionRepository;
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

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final BookingTransactionRepository transactionRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${xendit.secret-key}")
    private String xenditSecretKey;

    private static final String XENDIT_URL = "https://api.xendit.co/v2/invoices";

    @Override
    public Map<String, Object> createInvoice(XenditInvoiceReq req) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((xenditSecretKey + ":").getBytes());
        headers.set("Authorization", authHeader);

        Map<String, Object> body = new HashMap<>();
        String externalId = "CORNCINE-" + req.getBookingId();
        body.put("external_id", externalId);
        body.put("amount", req.getAmount());
        body.put("payer_email", req.getUserEmail());
        body.put("description", req.getDescription());
        body.put("success_redirect_url", "http://localhost:5173/my-tickets?status=success");
        body.put("failure_redirect_url", "http://localhost:5173/my-tickets?status=failed");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(XENDIT_URL, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Simpan invoice_url ke database (di payment_url)
                Optional<BookingTransactionEntity> txOpt = transactionRepository.findByOrderId(req.getBookingId());
                if (txOpt.isPresent()) {
                    BookingTransactionEntity tx = txOpt.get();
                    tx.setPaymentUrl(response.getBody().get("invoice_url").toString());
                    transactionRepository.save(tx);
                }
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Gagal memanggil API Xendit untuk bookingId: {}", req.getBookingId(), e);
            throw new RuntimeException("Gagal membuat invoice pembayaran Xendit");
        }
        
        throw new RuntimeException("Respon tidak valid dari Xendit");
    }

    @Override
    @Transactional
    public void handleXenditWebhook(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("external_id")) {
            return;
        }

        String externalId = payload.get("external_id").toString();
        String bookingCode = externalId.replace("CORNCINE-", "");
        String status = payload.get("status").toString();

        Optional<BookingTransactionEntity> txOpt = transactionRepository.findByOrderId(bookingCode);
        if (txOpt.isPresent()) {
            BookingTransactionEntity tx = txOpt.get();
            if ("PAID".equalsIgnoreCase(status) || "SETTLED".equalsIgnoreCase(status)) {
                tx.setPaymentStatus("PAID");
                tx.setPaymentMethod(payload.getOrDefault("payment_method", "XENDIT").toString());
                tx.setPaymentTime(java.time.LocalDateTime.now());
            } else if ("EXPIRED".equalsIgnoreCase(status)) {
                tx.setPaymentStatus("CANCELLED");
            }
            transactionRepository.save(tx);
            log.info("Status tiket {} diubah menjadi {}", bookingCode, tx.getPaymentStatus());
        } else {
            log.warn("Menerima webhook untuk transaksi yang tidak ditemukan: {}", externalId);
        }
    }
}