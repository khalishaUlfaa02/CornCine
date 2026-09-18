package corncine.example.ticket_service.service;

import corncine.example.ticket_service.payload.req.XenditInvoiceReq;

import java.util.Map;

public interface PaymentService {
    Map<String, Object> createInvoice(XenditInvoiceReq req, String username);
    void handleXenditWebhook(Map<String, Object> payload);
    // Tarik status terbaru langsung dari Xendit (dipakai saat webhook tak bisa menembus localhost)
    Map<String, Object> syncPaymentStatus(String bookingCode, String username);
}
