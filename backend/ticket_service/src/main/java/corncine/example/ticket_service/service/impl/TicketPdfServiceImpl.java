package corncine.example.ticket_service.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfContentByte;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketPdfServiceImpl implements TicketPdfService {

    private static final Color NAVY = new Color(0x0B, 0x13, 0x25);
    private static final Color SKY = new Color(0x7D, 0xD3, 0xFC);
    private static final Color DARK = new Color(0x1F, 0x29, 0x37);
    private static final Color GRAY = new Color(0x6B, 0x72, 0x80);
    private static final Color GREEN = new Color(0x16, 0xA3, 0x4A);
    private static final Color LIGHT_SKY_BG = new Color(0xF0, 0xF9, 0xFF);

    private final BookingTransactionRepository transactionRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${cinema.service.base-url:http://localhost:8042}")
    private String cinemaServiceBaseUrl;

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

        TicketInfo info = resolveScheduleInfo(tx);

        List<String> seatList = bookingSeatRepository.findByTransactionId(tx.getId()).stream()
                .map(bs -> {
                    if (bs.getSeatId() != null) {
                        SeatEntity s = seatRepository.findById(bs.getSeatId()).orElse(null);
                        if (s != null) return s.getSeatRow() + s.getSeatNumber();
                    }
                    return bs.getSeatRef() != null ? bs.getSeatRef() : "";
                })
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Ukuran tiket bioskop portrait (lebih ramping dari A4 yang kosong melompong)
            Rectangle ticketSize = new Rectangle(340, 720);
            Document document = new Document(ticketSize, 20, 20, 20, 20);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // ===== Header: Dark Navy =====
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell brandCell = new PdfPCell(new Phrase("CornCine",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD, Color.WHITE)));
            brandCell.setBackgroundColor(NAVY);
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            brandCell.setPaddingTop(12);
            brandCell.setPaddingBottom(0);
            headerTable.addCell(brandCell);

            PdfPCell subCell = new PdfPCell(new Phrase("E-TICKET",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Font.BOLD, SKY)));
            subCell.setBackgroundColor(NAVY);
            subCell.setBorder(Rectangle.NO_BORDER);
            subCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            subCell.setPaddingTop(0);
            subCell.setPaddingBottom(12);
            headerTable.addCell(subCell);

            document.add(headerTable);
            addSpacer(document, 10);

            // ===== Judul Film =====
            Paragraph movieTitle = new Paragraph(info.movieTitle,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Font.BOLD, DARK));
            movieTitle.setAlignment(Element.ALIGN_CENTER);
            movieTitle.setSpacingAfter(2);
            document.add(movieTitle);

            Paragraph bookingCodePara = new Paragraph(tx.getOrderId(),
                    FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, GRAY));
            bookingCodePara.setAlignment(Element.ALIGN_CENTER);
            bookingCodePara.setSpacingAfter(8);
            document.add(bookingCodePara);

            // ===== Tabel info 2 kolom =====
            PdfPTable table = new PdfPTable(new float[]{2f, 3f});
            table.setWidthPercentage(100);
            table.setSpacingBefore(4f);
            table.setSpacingAfter(4f);

            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, GRAY);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.BOLD, DARK);

            addInfoRow(table, "Bioskop", info.cinemaName, labelFont, valueFont);
            addInfoRow(table, "Studio", info.studioName, labelFont, valueFont);
            addInfoRow(table, "Tanggal", info.showDate, labelFont, valueFont);
            addInfoRow(table, "Jam Tayang", info.startTime, labelFont, valueFont);
            addInfoRow(table, "Total Bayar", rupiah(tx.getTotalPrice()), labelFont,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, DARK));
            document.add(table);

            // ===== Nomor Kursi (badge/kotak tegas) =====
            Paragraph seatLabel = new Paragraph("Nomor Kursi:",
                    FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, GRAY));
            seatLabel.setSpacingBefore(4);
            seatLabel.setSpacingAfter(4);
            document.add(seatLabel);

            if (!seatList.isEmpty()) {
                PdfPTable seatTable = new PdfPTable(Math.min(seatList.size(), 6));
                seatTable.setWidthPercentage(100);
                for (String seat : seatList) {
                    PdfPCell seatCell = new PdfPCell(new Phrase(seat,
                            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, NAVY)));
                    seatCell.setBackgroundColor(LIGHT_SKY_BG);
                    seatCell.setBorderColor(SKY);
                    seatCell.setBorderWidth(1f);
                    seatCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    seatCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    seatCell.setPadding(6);
                    seatTable.addCell(seatCell);
                }
                // Genapkan baris terakhir agar tabel tetap rapi
                int remainder = seatList.size() % 6;
                if (remainder != 0) {
                    for (int i = 0; i < 6 - remainder; i++) {
                        PdfPCell empty = new PdfPCell(new Phrase(""));
                        empty.setBorder(Rectangle.NO_BORDER);
                        seatTable.addCell(empty);
                    }
                }
                document.add(seatTable);
            }
            addSpacer(document, 8);

            // ===== Garis putus-putus khas tiket =====
            addDashedSeparator(writer, document);
            addSpacer(document, 8);

            // ===== QR Code tengah 120x120 =====
            byte[] qrCodeBytes = QrCodeUtil.generateQRCodeImage(tx.getOrderId());
            Image qrImage = Image.getInstance(qrCodeBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.scaleAbsolute(120, 120);
            document.add(qrImage);

            Paragraph qrHint = new Paragraph("Tunjukkan QR Code ini kepada petugas bioskop.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, GRAY));
            qrHint.setAlignment(Element.ALIGN_CENTER);
            qrHint.setSpacingBefore(4);
            qrHint.setSpacingAfter(8);
            document.add(qrHint);

            // ===== Footer: LUNAS / VERIFIED =====
            Paragraph paidLabel = new Paragraph("LUNAS / VERIFIED",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, GREEN));
            paidLabel.setAlignment(Element.ALIGN_CENTER);
            paidLabel.setSpacingAfter(2);
            document.add(paidLabel);

            String paymentTime = tx.getPaymentTime() != null ? tx.getPaymentTime().format(formatter) : "-";
            Paragraph paidTime = new Paragraph("Dilunasi pada: " + paymentTime,
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, GRAY));
            paidTime.setAlignment(Element.ALIGN_CENTER);
            document.add(paidTime);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF", e);
            throw new RuntimeException("Gagal mencetak e-ticket PDF");
        }
    }

    // Ambil relasi jadwal: tabel lokal dulu (booking UUID lama),
    // lalu REST ke cinema_service untuk booking jalur cinema (scheduleRef).
    private TicketInfo resolveScheduleInfo(BookingTransactionEntity tx) {
        TicketInfo info = new TicketInfo();

        if (tx.getSchedule() != null) {
            if (tx.getSchedule().getMovie() != null && tx.getSchedule().getMovie().getTitle() != null) {
                info.movieTitle = tx.getSchedule().getMovie().getTitle();
            }
            if (tx.getSchedule().getStudio() != null) {
                if (tx.getSchedule().getStudio().getCinema() != null
                        && tx.getSchedule().getStudio().getCinema().getName() != null) {
                    info.cinemaName = tx.getSchedule().getStudio().getCinema().getName();
                }
                info.studioName = "Studio " + tx.getSchedule().getStudio().getName();
            }
            if (tx.getSchedule().getShowTime() != null) {
                info.showDate = tx.getSchedule().getShowTime().toLocalDate().toString();
                info.startTime = tx.getSchedule().getShowTime().toLocalTime().toString().substring(0, 5);
            } else if (tx.getSchedule().getStartTime() != null) {
                info.startTime = tx.getSchedule().getStartTime().toString().substring(0, 5);
            }
            return info;
        }

        if (tx.getScheduleRef() != null && !tx.getScheduleRef().isBlank()) {
            try {
                ResponseEntity<Map> response = restTemplate.getForEntity(
                        cinemaServiceBaseUrl + "/schedules/" + tx.getScheduleRef(), Map.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null
                        && response.getBody().get("data") instanceof Map) {
                    Map data = (Map) response.getBody().get("data");
                    if (data.get("movieTitle") != null) info.movieTitle = data.get("movieTitle").toString();
                    if (data.get("cinemaName") != null) info.cinemaName = data.get("cinemaName").toString();
                    Object studioNumber = data.get("studioNumber");
                    Object studioType = data.get("studioType");
                    if (studioNumber != null) {
                        info.studioName = "Studio " + studioNumber
                                + (studioType != null ? " (" + studioType + ")" : "");
                    }
                    if (data.get("showDate") != null) info.showDate = data.get("showDate").toString();
                    if (data.get("startTime") != null) {
                        info.startTime = data.get("startTime").toString().substring(0, 5);
                    }
                }
            } catch (Exception e) {
                log.warn("Gagal mengambil detail jadwal cinema {} untuk PDF: {}",
                        tx.getScheduleRef(), e.getMessage());
            }
        }

        return info;
    }

    private String rupiah(Double amount) {
        if (amount == null) return "Rp 0";
        return "Rp " + String.format("%,d", amount.longValue()).replace(',', '.');
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label, labelFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setPadding(4);

        PdfPCell cell2 = new PdfPCell(new Phrase(value, valueFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setPadding(4);

        table.addCell(cell1);
        table.addCell(cell2);
    }

    private void addDashedSeparator(PdfWriter writer, Document document) {
        try {
            PdfContentByte cb = writer.getDirectContent();
            float y = writer.getVerticalPosition(true) - 4;
            float x1 = document.leftMargin();
            float x2 = document.getPageSize().getWidth() - document.rightMargin();
            cb.saveState();
            cb.setLineDash(5, 4);
            cb.setColorStroke(GRAY);
            cb.setLineWidth(1f);
            cb.moveTo(x1, y);
            cb.lineTo(x2, y);
            cb.stroke();
            cb.restoreState();
        } catch (Exception e) {
            log.warn("Gagal menggambar garis putus-putus: {}", e.getMessage());
        }
    }

    private void addSpacer(Document document, int height) throws DocumentException {
        Paragraph spacer = new Paragraph(" ",
                FontFactory.getFont(FontFactory.HELVETICA, height, Font.NORMAL, Color.WHITE));
        spacer.setSpacingBefore(0);
        spacer.setSpacingAfter(0);
        spacer.setLeading(height);
        document.add(spacer);
    }

    private static class TicketInfo {
        String movieTitle = "-";
        String cinemaName = "-";
        String studioName = "-";
        String showDate = "-";
        String startTime = "-";
    }
}
