package corncine.example.ticket_service.service;

import java.util.UUID;

public interface TicketPdfService {
    byte[] generateTicketPdf(String bookingCode, String username);
}