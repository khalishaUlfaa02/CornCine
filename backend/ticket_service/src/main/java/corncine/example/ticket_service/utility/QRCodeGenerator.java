package corncine.example.ticket_service.utility;

import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class QRCodeGenerator {
    // Basic mock because zxing dependency missing
    public byte[] generateQRCodeImage(String text, int width, int height) throws Exception {
        return text.getBytes();
    }
}
