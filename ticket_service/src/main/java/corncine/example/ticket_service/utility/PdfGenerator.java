package corncine.example.ticket_service.utility;

import org.springframework.stereotype.Component;
import java.io.ByteArrayOutputStream;

@Component
public class PdfGenerator {
    // Basic mock because iText dependency missing
    public byte[] generateTicketPdf(String bookingId, String movieTitle, String cinemaName, String showTime, String seats) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        String content = "CORNCINE - e-Ticket\n" +
                         "Booking ID: " + bookingId + "\n" +
                         "Movie: " + movieTitle + "\n" +
                         "Cinema: " + cinemaName + "\n" +
                         "Time: " + showTime + "\n" +
                         "Seats: " + seats;
        out.write(content.getBytes());
        return out.toByteArray();
    }
}
