package corncine.example.ticket_service.service.impl;

import corncine.example.ticket_service.entity.*;
import corncine.example.ticket_service.exception.ResourceNotFoundException;
import corncine.example.ticket_service.payload.req.BookingReq;
import corncine.example.ticket_service.payload.req.MidtransWebhookReq;
import corncine.example.ticket_service.payload.res.BookingDetailRes;
import corncine.example.ticket_service.payload.res.BookingRes;
import corncine.example.ticket_service.payload.req.PaymentSimulateReq;
import corncine.example.ticket_service.payload.res.PaymentSimulateRes;
import corncine.example.ticket_service.repository.*;
import corncine.example.ticket_service.service.MidtransService;
import corncine.example.ticket_service.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final BookingTransactionRepository transactionRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final MidtransService midtransService;

    @Override
    public List<UUID> getOccupiedSeats(UUID scheduleId) {
        return bookingSeatRepository.findOccupiedSeatIdsBySchedule(scheduleId);
    }

    @Override
    @Transactional
    public BookingRes createBooking(BookingReq request, String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ScheduleEntity schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        // Validasi Anti Double-Booking dengan mendapatkan occupied seats yang terbaru
        List<UUID> occupiedSeats = getOccupiedSeats(request.getScheduleId());
        
        List<SeatEntity> seatsToBook = new ArrayList<>();
        double totalPrice = 0.0;
        
        for (UUID seatId : request.getSeatIds()) {
            if (occupiedSeats.contains(seatId)) {
                throw new IllegalStateException("Satu atau lebih kursi yang dipilih sudah dipesan orang lain.");
            }
            // Lock Seat dengan Pessimistic Write untuk mencegah race condition
            SeatEntity seat = seatRepository.findByIdWithLock(seatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + seatId));
            seatsToBook.add(seat);
            totalPrice += schedule.getPrice(); 
        }

        String bookingCode = "CORNCINE-" + System.currentTimeMillis();
        String paymentCode = "VA-BCA-" + (int)(Math.random() * 900000 + 100000); // 6 digit random

        BookingTransactionEntity transaction = BookingTransactionEntity.builder()
                .userId(user.getId())
                .scheduleId(schedule.getId())
                .orderId(bookingCode)
                .totalPrice(totalPrice)
                .paymentStatus("PENDING")
                // Kita gunakan paymentUrl untuk menyimpan paymentCode simulasi karena field paymentCode belum ada di entity
                .paymentUrl(paymentCode)
                .build();
        
        transaction = transactionRepository.save(transaction);

        List<BookingSeatEntity> bookingSeats = new ArrayList<>();
        List<UUID> bookedSeatIds = new ArrayList<>();
        
        for (SeatEntity seat : seatsToBook) {
            BookingSeatEntity bs = BookingSeatEntity.builder()
                    .transaction(transaction)
                    .seatId(seat.getId())
                    .price(schedule.getPrice())
                    .build();
            bookingSeats.add(bs);
            bookedSeatIds.add(seat.getId());
        }
        bookingSeatRepository.saveAll(bookingSeats);

        // Jangan panggil Midtrans, skip saja sesuai instruksi
        // Map<String, Object> snapRes = midtransService.createSnapTransaction(orderId, totalPrice, user.getEmail());

        BookingRes response = new BookingRes();
        response.setBookingCode(bookingCode);
        response.setTotalAmount(totalPrice);
        response.setPaymentStatus("PENDING");
        response.setPaymentCode(paymentCode);
        response.setSeats(bookedSeatIds);

        return response;
    }

    @Override
    @Transactional
    public void handleMidtransWebhook(MidtransWebhookReq request) {
        BookingTransactionEntity transaction = transactionRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        String txStatus = request.getTransactionStatus();
        String fraudStatus = request.getFraudStatus();

        if (txStatus.equals("capture")) {
            if (fraudStatus.equals("challenge")) {
                transaction.setPaymentStatus("CHALLENGE");
            } else if (fraudStatus.equals("accept")) {
                transaction.setPaymentStatus("PAID");
            }
        } else if (txStatus.equals("settlement")) {
            transaction.setPaymentStatus("PAID");
        } else if (txStatus.equals("cancel") || txStatus.equals("deny") || txStatus.equals("expire")) {
            transaction.setPaymentStatus("FAILED");
        } else if (txStatus.equals("pending")) {
            transaction.setPaymentStatus("PENDING");
        }

        transactionRepository.save(transaction);
    }

    @Override
    public List<BookingDetailRes> getMyBookings(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<BookingTransactionEntity> transactions = transactionRepository.findByUserId(user.getId());
        
        return transactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(tx -> {
            BookingDetailRes res = new BookingDetailRes();
            res.setBookingCode(tx.getOrderId());
            res.setPaymentStatus(tx.getPaymentStatus());
            res.setTotalAmount(tx.getTotalPrice());
            res.setPaymentCode(tx.getPaymentUrl()); // Simulasi paymentCode
            res.setPaymentMethod(tx.getPaymentMethod());
            res.setBookingTime(tx.getCreatedAt());

            ScheduleEntity sched = tx.getSchedule();
            if (sched != null) {
                res.setShowTime(sched.getShowTime() != null ? sched.getShowTime() : sched.getStartTime());
                MovieEntity movie = sched.getMovie();
                if (movie != null) res.setMovieTitle(movie.getTitle());
                StudioEntity studio = sched.getStudio();
                if (studio != null) {
                    res.setStudioName(studio.getName());
                    CinemaEntity cinema = studio.getCinema();
                    if (cinema != null) res.setCinemaName(cinema.getName());
                }
            }

            List<BookingSeatEntity> bookedSeats = bookingSeatRepository.findByTransactionId(tx.getId());
            List<String> seatCodes = bookedSeats.stream()
                .map(bs -> {
                    SeatEntity s = seatRepository.findById(bs.getSeatId()).orElse(null);
                    return s != null ? s.getSeatRow() + s.getSeatNumber() : "Unknown";
                })
                .collect(Collectors.toList());
            res.setSeatCodes(seatCodes);
            
            return res;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentSimulateRes simulatePayment(PaymentSimulateReq request, String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        BookingTransactionEntity transaction = transactionRepository.findByOrderId(request.getBookingCode())
                .orElseThrow(() -> new ResourceNotFoundException("Transaksi dengan booking code " + request.getBookingCode() + " tidak ditemukan"));
                
        if (!transaction.getUserId().equals(user.getId())) {
            throw new IllegalStateException("Anda tidak memiliki akses ke transaksi ini.");
        }
        
        if ("PAID".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi ini sudah lunas.");
        } else if ("CANCELLED".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi ini sudah dibatalkan.");
        }
        
        transaction.setPaymentStatus("PAID");
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setPaymentTime(LocalDateTime.now());
        
        transactionRepository.save(transaction);
        
        PaymentSimulateRes response = new PaymentSimulateRes();
        response.setBookingCode(transaction.getOrderId());
        response.setTotalAmount(transaction.getTotalPrice());
        response.setPaymentStatus(transaction.getPaymentStatus());
        response.setPaymentMethod(transaction.getPaymentMethod());
        response.setPaymentTime(transaction.getPaymentTime());
        
        return response;
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingCode, String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        BookingTransactionEntity transaction = transactionRepository.findByOrderId(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Transaksi dengan booking code " + bookingCode + " tidak ditemukan"));
                
        if (!transaction.getUserId().equals(user.getId())) {
            throw new IllegalStateException("Anda tidak memiliki akses ke transaksi ini.");
        }
        
        if ("PAID".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi sudah dibayar dan tidak dapat dibatalkan.");
        } else if ("CANCELLED".equals(transaction.getPaymentStatus())) {
            throw new IllegalStateException("Transaksi sudah berstatus batal.");
        }
        
        transaction.setPaymentStatus("CANCELLED");
        transactionRepository.save(transaction);
    }
}
