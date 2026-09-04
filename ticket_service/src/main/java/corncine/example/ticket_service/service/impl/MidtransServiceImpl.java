package corncine.example.ticket_service.service.impl;

import corncine.example.ticket_service.service.MidtransService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MidtransServiceImpl implements MidtransService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String SERVER_KEY = "SB-Mid-server-12345"; 
    private static final String MIDTRANS_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

    @Override
    public Map<String, Object> createSnapTransaction(String orderId, double grossAmount, String userEmail) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((SERVER_KEY + ":").getBytes());
        headers.set("Authorization", authHeader);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> transactionDetails = new HashMap<>();
        transactionDetails.put("order_id", orderId);
        transactionDetails.put("gross_amount", grossAmount);
        body.put("transaction_details", transactionDetails);

        Map<String, Object> customerDetails = new HashMap<>();
        customerDetails.put("email", userEmail);
        body.put("customer_details", customerDetails);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(MIDTRANS_URL, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to create snap transaction for orderId: {}", orderId, e);
        }
        
        // Return a mock fallback if call fails
        Map<String, Object> mockRes = new HashMap<>();
        mockRes.put("token", "dummy-snap-token-" + orderId);
        mockRes.put("redirect_url", "https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy-snap-token-" + orderId);
        return mockRes;
    }
}
