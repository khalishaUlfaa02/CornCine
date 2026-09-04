package corncine.example.ticket_service.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import corncine.example.ticket_service.entity.BookingSeatEntity;
import corncine.example.ticket_service.entity.BookingTransactionEntity;
import corncine.example.ticket_service.entity.SeatEntity;
import corncine.example.ticket_service.exception.ResourceNotFoundException;
import corncine.example.ticket_service.repository.BookingSeatRepository;
import corncine.example.ticket_service.repository.BookingTransactionRepository;
import corncine.example.ticket_service.repository.SeatRepository;
import corncine.example.ticket_service.repository.UserRepository;
import corncine.example.ticket_service.service.TicketPdfService;
import corncine.example.ticket_service.utility.QrCodeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketPdfServiceImpl implements TicketPdfService {

    private final BookingTransactionRepository transactionRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;

    @Override
    public byte[] generateTicketPdf(String bookingCode, String username) {
        BookingTransactionEntity tx = transactionRepository.findByOrderId(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!tx.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("Anda tidak berhak mengunduh tiket ini");
        }

        if (!"PAID".equals(tx.getPaymentStatus())) {
            throw new IllegalStateException("Tiket belum lunas atau sudah dibatalkan");
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            Paragraph title = new Paragraph("CORNCINE - OFFICIAL E-TICKET", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Data Info
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            
            String movieTitle = tx.getSchedule().getMovie().getTitle();
            String cinemaName = tx.getSchedule().getStudio().getCinema().getName();
            String studioName = "Studio " + tx.getSchedule().getStudio().getName();
            
            LocalDateTime st = tx.getSchedule().getShowTime() != null ? tx.getSchedule().getShowTime() : tx.getSchedule().getStartTime();
            String showTime = st != null ? st.format(formatter) : "-";

            List<BookingSeatEntity> bookedSeats = bookingSeatRepository.findByTransactionId(tx.getId());
            String seats = bookedSeats.stream()
                    .map(bs -> {
                        SeatEntity s = seatRepository.findById(bs.getSeatId()).orElse(null);
                        return s != null ? s.getSeatRow() + s.getSeatNumber() : "";
                    })
                    .collect(Collectors.joining(", "));

            addTableRow(table, "Kode Booking:", tx.getOrderId(), boldFont, normalFont);
            addTableRow(table, "Judul Film:", movieTitle, boldFont, normalFont);
            addTableRow(table, "Bioskop:", cinemaName, boldFont, normalFont);
            addTableRow(table, "Studio:", studioName, boldFont, normalFont);
            addTableRow(table, "Waktu Tayang:", showTime, boldFont, normalFont);
            addTableRow(table, "Kursi:", seats, boldFont, normalFont);
            addTableRow(table, "Total Bayar:", "Rp " + tx.getTotalPrice(), boldFont, normalFont);
            
            String paymentTime = tx.getPaymentTime() != null ? tx.getPaymentTime().format(formatter) : "-";
            addTableRow(table, "Waktu Pelunasan:", paymentTime, boldFont, normalFont);

            document.add(table);

            // QR Code
            byte[] qrCodeBytes = QrCodeUtil.generateQRCodeImage(tx.getOrderId());
            Image qrImage = Image.getInstance(qrCodeBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.scaleAbsolute(150, 150);
            document.add(qrImage);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF", e);
            throw new RuntimeException("Gagal mencetak e-ticket PDF");
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label, labelFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setPadding(5);
        
        PdfPCell cell2 = new PdfPCell(new Phrase(value, valueFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setPadding(5);
        
        table.addCell(cell1);
        table.addCell(cell2);
    }
}