package corncine.example.auth_service.utility;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private Boolean success;
    private String message;
    private Object data;

    public static Message success(String message, Object data){
        return new Message(true, message, data);
    }

    public static Message error(String message){
        return new Message(false, message, null);
    }
}
