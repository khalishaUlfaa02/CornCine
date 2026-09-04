package corncine.example.ticket_service.service;

import corncine.example.ticket_service.payload.req.BookingReq;
import corncine.example.ticket_service.payload.req.MidtransWebhookReq;
import corncine.example.ticket_service.payload.req.PaymentSimulateReq;
import corncine.example.ticket_service.payload.res.BookingDetailRes;
import corncine.example.ticket_service.payload.res.BookingRes;
import corncine.example.ticket_service.payload.res.PaymentSimulateRes;

import java.util.List;
import java.util.UUID;

public interface TicketService {
    List<UUID> getOccupiedSeats(UUID scheduleId);
    BookingRes createBooking(BookingReq request, String username);
    void handleMidtransWebhook(MidtransWebhookReq request);
    List<BookingDetailRes> getMyBookings(String username);
    
    PaymentSimulateRes simulatePayment(PaymentSimulateReq request, String username);
    void cancelBooking(String bookingCode, String username);
}
