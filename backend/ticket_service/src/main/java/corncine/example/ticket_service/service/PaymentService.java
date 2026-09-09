package corncine.example.ticket_service.service;

import java.util.Map;
import corncine.example.ticket_service.payload.req.XenditInvoiceReq;

public interface PaymentService {
    Map<String, Object> createInvoice(XenditInvoiceReq req);
    void handleXenditWebhook(Map<String, Object> payload);
}