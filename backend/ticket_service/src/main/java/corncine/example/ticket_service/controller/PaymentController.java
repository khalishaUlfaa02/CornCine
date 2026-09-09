package corncine.example.ticket_service.controller;

import corncine.example.ticket_service.payload.req.XenditInvoiceReq;
import corncine.example.ticket_service.service.PaymentService;
import corncine.example.ticket_service.utility.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/payments/create-invoice")
    public ResponseEntity<Message<Map<String, Object>>> createInvoice(@RequestBody XenditInvoiceReq req) {
        Map<String, Object> invoice = paymentService.createInvoice(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Message.<Map<String, Object>>builder()
                .status(HttpStatus.CREATED.value())
                .message("Invoice berhasil dibuat")
                .data(invoice)
                .build());
    }

    @PostMapping("/api/webhooks/xendit")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> payload) {
        paymentService.handleXenditWebhook(payload);
        return ResponseEntity.ok("OK");
    }
}