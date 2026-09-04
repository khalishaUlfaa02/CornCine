package corncine.example.ticket_service.controller;

import corncine.example.ticket_service.payload.req.BookingReq;
import corncine.example.ticket_service.payload.req.MidtransWebhookReq;
import corncine.example.ticket_service.payload.req.PaymentSimulateReq;
import corncine.example.ticket_service.payload.res.PaymentSimulateRes;
import corncine.example.ticket_service.payload.res.BookingDetailRes;
import corncine.example.ticket_service.payload.res.BookingRes;
import corncine.example.ticket_service.service.TicketPdfService;
import corncine.example.ticket_service.service.TicketService;
import corncine.example.ticket_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketPdfService ticketPdfService;

    @GetMapping("/schedules/{scheduleId}/occupied-seats")
    public ResponseEntity<Message<List<UUID>>> getOccupiedSeats(@PathVariable UUID scheduleId) {
        List<UUID> occupiedSeats = ticketService.getOccupiedSeats(scheduleId);
        return ResponseEntity.ok(Message.<List<UUID>>builder()
                .status(HttpStatus.OK.value())
                .message("Occupied seats fetched successfully")
                .data(occupiedSeats)
                .build());
    }

    @PostMapping("/bookings")
    public ResponseEntity<Message<BookingRes>> createBooking(@Valid @RequestBody BookingReq request, Authentication authentication) {
        BookingRes response = ticketService.createBooking(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Message.<BookingRes>builder()
                .status(HttpStatus.CREATED.value())
                .message("Booking created successfully")
                .data(response)
                .build());
    }

    @PostMapping("/midtrans/webhook")
    public ResponseEntity<Message<Void>> handleMidtransWebhook(@RequestBody MidtransWebhookReq request) {
        ticketService.handleMidtransWebhook(request);
        return ResponseEntity.ok(Message.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Webhook processed successfully")
                .data(null)
                .build());
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<Message<List<BookingDetailRes>>> getMyBookings(Authentication authentication) {
        List<BookingDetailRes> bookings = ticketService.getMyBookings(authentication.getName());
        return ResponseEntity.ok(Message.<List<BookingDetailRes>>builder()
                .status(HttpStatus.OK.value())
                .message("My bookings fetched successfully")
                .data(bookings)
                .build());
    }

    @GetMapping("/{bookingCode}/pdf")
    public ResponseEntity<byte[]> getTicketPdf(@PathVariable String bookingCode, Authentication authentication) {
        byte[] pdf = ticketPdfService.generateTicketPdf(bookingCode, authentication.getName());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "E-Ticket_" + bookingCode + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @PostMapping("/payments/simulate")
    public ResponseEntity<Message<PaymentSimulateRes>> simulatePayment(@Valid @RequestBody PaymentSimulateReq request, Authentication authentication) {
        PaymentSimulateRes response = ticketService.simulatePayment(request, authentication.getName());
        return ResponseEntity.ok(Message.<PaymentSimulateRes>builder()
                .status(HttpStatus.OK.value())
                .message("Pembayaran berhasil disimulasikan")
                .data(response)
                .build());
    }

    @PostMapping("/bookings/{bookingCode}/cancel")
    public ResponseEntity<Message<Void>> cancelBooking(@PathVariable String bookingCode, Authentication authentication) {
        ticketService.cancelBooking(bookingCode, authentication.getName());
        return ResponseEntity.ok(Message.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Pemesanan berhasil dibatalkan")
                .data(null)
                .build());
    }
}
