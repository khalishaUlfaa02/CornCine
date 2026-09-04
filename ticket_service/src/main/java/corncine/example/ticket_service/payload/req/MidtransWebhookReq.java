package corncine.example.ticket_service.payload.req;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MidtransWebhookReq {
    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("transaction_status")
    private String transactionStatus;

    @JsonProperty("fraud_status")
    private String fraudStatus;

    @JsonProperty("gross_amount")
    private String grossAmount;
    
    @JsonProperty("signature_key")
    private String signatureKey;
    
    @JsonProperty("status_code")
    private String statusCode;
}
