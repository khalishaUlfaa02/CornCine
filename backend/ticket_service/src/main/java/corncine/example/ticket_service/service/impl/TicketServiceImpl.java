package corncine.example.ticket_service.service.impl;

import corncine.example.ticket_service.entity.*;
import corncine.example.ticket_service.exception.ResourceNotFoundException;
import corncine.example.ticket_service.payload.req.BookingReq;
import corncine.example.ticket_service.payload.req.MidtransWebhookReq;
import corncine.example.ticket_service.payload.res.BookingDetailRes;
import corncine.example.ticket_service.payload.res.BookingRes;
import corncine.example.ticket_service.payload.req.PaymentSimulateReq;
import corncine.example.ticket_service.payload.req.ValidateTicketReq;
import corncine.example.ticket_service.payload.res.ValidateTicketRes;
import corncine.example.ticket_service.payload.res.PaymentSimulateRes;
import corncine.example.ticket_service.repository.*;
import corncine.example.ticket_service.service.MidtransService;
import corncine.example.ticket_service.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

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
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${cinema.service.base-url:http://localhost:8042}")
    private String cinemaServiceBaseUrl;

    @Override
    public List<String> getOccupiedSeats(String scheduleId) {
        List<String> occupied = new ArrayList<>();

        // Jalur 1: data booking lama yang memakai UUID lokal
        UUID legacyId = tryParseUuid(scheduleId);
        if (legacyId != null) {
            bookingSeatRepository.findOccupiedSeatIdsBySchedule(legacyId)
                    .forEach(id -> {
                        if (id != null) occupied.add(id.toString());
                    });
        }

        // Jalur 2: booking baru yang memakai referensi cinema (ID integer / kode)
        occupied.addAll(bookingSeatRepository.findOccupiedSeatRefsByScheduleRef(scheduleId));

        return occupied;
    }

    private UUID tryParseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            return null;
        }
    }

    // Ambil detail jadwal dari cinema_service (sistem utama katalog).
    // Mengembalikan Map "data" (berisi price, dll) atau null jika tidak ditemukan.
    private Map fetchCinemaSchedule(String cinemaScheduleId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    cinemaServiceBaseUrl + "/schedules/" + cinemaScheduleId, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object data = response.getBody().get("data");
                if (data instanceof Map) {
                    return (Map) data;
                }
            }
        } catch (Exception e) {
            log.warn("Jadwal cinema {} tidak ditemukan: {}", cinemaScheduleId, e.getMessage());
        }
        return null;
    }

    @Override
    @Transactional
    public BookingRes createBooking(BookingReq request, String username) {
        // Auto-provision: tabel users milik ticket_service terpisah dari auth_service,
        // jadi user yang login (username dari JWT) belum tentu ada di sini.
        // Daripada 404 "User not found", buatkan barisnya otomatis saat pertama booking.
        UserEntity user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(UserEntity.builder()
                        .username(username)
                        .build()));

        String rawScheduleId = request.getScheduleId() != null ? request.getScheduleId().trim() : "";
        if (rawScheduleId.isEmpty()) {
            throw new IllegalStateException("Schedule ID wajib diisi.");
        }

        List<String> rawSeatIds = request.getSeatIds() == null ? new ArrayList<>() : request.getSeatIds().stream()
                .map(s -> s == null ? "" : s.trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (rawSeatIds.isEmpty()) {
            throw new IllegalStateException("Seat IDs wajib diisi.");
        }

        // Validasi Anti Double-Booking dengan mendapatkan occupied seats yang terbaru
        List<String> occupiedSeats = getOccupiedSeats(rawScheduleId);
        for (String seatId : rawSeatIds) {
            if (occupiedSeats.contains(seatId)) {
                throw new IllegalStateException("Satu atau lebih kursi yang dipilih sudah dipesan orang lain.");
            }
        }

        // Jalur 1: ID UUID lama -> pakai tabel lokal (perilaku lama, tetap didukung)
        UUID legacyScheduleId = tryParseUuid(rawScheduleId);
        if (legacyScheduleId != null && scheduleRepository.findById(legacyScheduleId).isPresent()) {
            return createLegacyBooking(user, legacyScheduleId, rawSeatIds);
        }

        // Jalur 2: ID cinema (integer, mis. "1") -> validasi + harga dari cinema_service
        Map cinemaSchedule = fetchCinemaSchedule(rawScheduleId);
        if (cinemaSchedule == null) {
            throw new ResourceNotFoundException("Schedule not found");
        }
        Object priceObj = cinemaSchedule.get("price");
        if (!(priceObj instanceof Number)) {
            throw new IllegalStateException("Harga jadwal tidak valid.");
        }
        double unitPrice = ((Number) priceObj).doubleValue();
        double finalTotalPrice = unitPrice * rawSeatIds.size();

        // Suffiks acak: dua request dalam milidetik yang sama (mis. double-submit)
        // tidak boleh menghasilkan order_id kembar (kolom unique).
        String bookingCode = "CORNCINE-" + System.currentTimeMillis() + "-"
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String paymentCode = "VA-BCA-" + (int) (Math.random() * 900000 + 100000); // 6 digit random

        BookingTransactionEntity transaction = BookingTransactionEntity.builder()
                .userId(user.getId())
                .scheduleRef(rawScheduleId)
                .orderId(bookingCode)
                .totalPrice(finalTotalPrice)
                .paymentStatus("PENDING")
                // Kita gunakan paymentUrl untuk menyimpan paymentCode simulasi karena field paymentCode belum ada di entity
                .paymentUrl(paymentCode)
                .build();

        transaction = transactionRepository.save(transaction);

        List<BookingSeatEntity> bookingSeats = new ArrayList<>();
        for (String seatRef : rawSeatIds) {
            BookingSeatEntity bs = BookingSeatEntity.builder()
                    .transaction(transaction)
                    .seatRef(seatRef)
                    .price(unitPrice)
                    .build();
            bookingSeats.add(bs);
        }
        bookingSeatRepository.saveAll(bookingSeats);

        BookingRes response = new BookingRes();
        response.setBookingCode(bookingCode);
        response.setTotalAmount(transaction.getTotalPrice());
        response.setPaymentStatus("PENDING");
        response.setPaymentCode(paymentCode);
        response.setSeats(new ArrayList<>(rawSeatIds));

        return response;
    }

    // Alur lama untuk booking yang memakai UUID lokal (dipertahankan agar data lama tetap jalan)
    private BookingRes createLegacyBooking(UserEntity user, UUID scheduleId, List<String> rawSeatIds) {
        ScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        List<SeatEntity> seatsToBook = new ArrayList<>();
        double totalPrice = 0.0;

        for (String rawSeatId : rawSeatIds) {
            UUID seatId = tryParseUuid(rawSeatId);
            if (seatId == null) {
                throw new ResourceNotFoundException("Seat not found: " + rawSeatId);
            }
            // Lock Seat dengan Pessimistic Write untuk mencegah race condition
            SeatEntity seat = seatRepository.findByIdWithLock(seatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + rawSeatId));
            seatsToBook.add(seat);
            totalPrice += schedule.getPrice();
        }

        // Suffiks acak: dua request dalam milidetik yang sama (mis. double-submit)
        // tidak boleh menghasilkan order_id kembar (kolom unique).
        String bookingCode = "CORNCINE-" + System.currentTimeMillis() + "-"
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String paymentCode = "VA-BCA-" + (int) (Math.random() * 900000 + 100000); // 6 digit random

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
        List<String> bookedSeatIds = new ArrayList<>();

        for (SeatEntity seat : seatsToBook) {
            BookingSeatEntity bs = BookingSeatEntity.builder()
                    .transaction(transaction)
                    .seatId(seat.getId())
                    .price(schedule.getPrice())
                    .build();
            bookingSeats.add(bs);
            bookedSeatIds.add(seat.getId().toString());
        }
        bookingSeatRepository.saveAll(bookingSeats);

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
                    // Baris UUID lama: seatId terisi -> resolve label dari tabel lokal
                    if (bs.getSeatId() != null) {
                        SeatEntity s = seatRepository.findById(bs.getSeatId()).orElse(null);
                        if (s != null) return s.getSeatRow() + s.getSeatNumber();
                    }
                    // Baris cinema: seatId null -> pakai seatRef apa adanya ("5", "C4", ...)
                    return bs.getSeatRef() != null ? bs.getSeatRef() : "Unknown";
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

    @Override
    @Transactional
    public ValidateTicketRes validateTicket(ValidateTicketReq req) {
        BookingTransactionEntity tx = transactionRepository.findByOrderId(req.getBookingCode())
                .orElseThrow(() -> new ResourceNotFoundException("Tiket tidak ditemukan"));

        if ("USED".equals(tx.getPaymentStatus())) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String usedAt = tx.getUpdatedAt() != null ? tx.getUpdatedAt().format(formatter) : "sebelumnya";
            throw new IllegalStateException("Tiket sudah pernah digunakan pada " + usedAt);
        }

        if (!"PAID".equals(tx.getPaymentStatus())) {
            throw new IllegalStateException("Tiket belum lunas atau telah dibatalkan");
        }

        // Set status to USED to mark as checked in
        tx.setPaymentStatus("USED");
        transactionRepository.save(tx);

        // Fetch details to return to the scanner
        String movieTitle = "-";
        String cinemaName = "-";
        String studioName = "-";
        String showTime = "-";

        if (tx.getSchedule() != null) {
            if (tx.getSchedule().getMovie() != null) {
                movieTitle = tx.getSchedule().getMovie().getTitle();
            }
            if (tx.getSchedule().getStudio() != null) {
                if (tx.getSchedule().getStudio().getCinema() != null) {
                    cinemaName = tx.getSchedule().getStudio().getCinema().getName();
                }
                studioName = "Studio " + tx.getSchedule().getStudio().getName();
            }
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            LocalDateTime st = tx.getSchedule().getShowTime() != null ? tx.getSchedule().getShowTime() : tx.getSchedule().getStartTime();
            showTime = st != null ? st.format(fmt) : "-";
        } else if (tx.getScheduleRef() != null && !tx.getScheduleRef().isBlank()) {
            Map data = fetchCinemaSchedule(tx.getScheduleRef());
            if (data != null) {
                if (data.get("movieTitle") != null) movieTitle = data.get("movieTitle").toString();
                if (data.get("cinemaName") != null) cinemaName = data.get("cinemaName").toString();
                Object studioNum = data.get("studioNumber");
                Object studioType = data.get("studioType");
                if (studioNum != null) {
                    studioName = "Studio " + studioNum + (studioType != null ? " (" + studioType + ")" : "");
                }
                String dDate = data.get("showDate") != null ? data.get("showDate").toString() : "";
                String dTime = data.get("startTime") != null ? data.get("startTime").toString() : "";
                showTime = dDate + " " + (dTime.length() >= 5 ? dTime.substring(0, 5) : dTime);
            }
        }

        List<BookingSeatEntity> bookedSeats = bookingSeatRepository.findByTransactionId(tx.getId());
        String seats = bookedSeats.stream()
                .map(bs -> {
                    if (bs.getSeatId() != null) {
                        SeatEntity s = seatRepository.findById(bs.getSeatId()).orElse(null);
                        if (s != null) return s.getSeatRow() + s.getSeatNumber();
                    }
                    return bs.getSeatRef() != null ? bs.getSeatRef() : "";
                })
                .collect(Collectors.joining(", "));

        return ValidateTicketRes.builder()
                .bookingCode(tx.getOrderId())
                .movieTitle(movieTitle)
                .cinemaName(cinemaName)
                .studioName(studioName)
                .showTime(showTime)
                .seatCodes(seats)
                .build();
    }
}
