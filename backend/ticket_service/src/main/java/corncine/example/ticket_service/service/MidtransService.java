package corncine.example.ticket_service.service;

import java.util.Map;

public interface MidtransService {
    Map<String, Object> createSnapTransaction(String orderId, double grossAmount, String userEmail);
}
