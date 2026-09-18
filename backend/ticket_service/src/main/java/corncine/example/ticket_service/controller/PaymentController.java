package corncine.example.ticket_service.controller;

import corncine.example.ticket_service.payload.req.XenditInvoiceReq;
import corncine.example.ticket_service.service.PaymentService;
import corncine.example.ticket_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/payments/create-invoice")
    public ResponseEntity<Message<Map<String, Object>>> createInvoice(
            @Valid @RequestBody XenditInvoiceReq request,
            Authentication authentication) {
        Map<String, Object> invoice = paymentService.createInvoice(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Message.<Map<String, Object>>builder()
                .status(HttpStatus.CREATED.value())
                .message("Invoice Xendit berhasil dibuat")
                .data(invoice)
                .build());
    }

    @PostMapping("/api/webhooks/xendit")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> payload) {
        paymentService.handleXenditWebhook(payload);
        return ResponseEntity.ok("OK");
    }

    // Dipanggil frontend setelah redirect dari Xendit (webhook tak bisa menembus localhost)
    @GetMapping("/api/payments/sync-status/{bookingCode}")
    public ResponseEntity<Message<Map<String, Object>>> syncStatus(
            @PathVariable String bookingCode,
            Authentication authentication) {
        Map<String, Object> result = paymentService.syncPaymentStatus(bookingCode, authentication.getName());
        return ResponseEntity.ok(Message.<Map<String, Object>>builder()
                .status(HttpStatus.OK.value())
                .message("Status pembayaran diperbarui")
                .data(result)
                .build());
    }
}
