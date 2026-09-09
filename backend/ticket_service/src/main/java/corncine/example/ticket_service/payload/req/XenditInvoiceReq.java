package corncine.example.ticket_service.payload.req;

import lombok.Data;

@Data
public class XenditInvoiceReq {
    private String bookingId;
    private String userEmail;
    private Double amount;
    private String description;
}