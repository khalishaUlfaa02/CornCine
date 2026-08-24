package corncine.example.auth_service.service;

import corncine.example.auth_service.payload.req.ForgotPasswordReq;
import corncine.example.auth_service.payload.req.LoginReq;
import corncine.example.auth_service.payload.req.RegisterReq;
import corncine.example.auth_service.payload.req.ResetPasswordReq;
import corncine.example.auth_service.payload.res.JwtRes;

public interface AuthService {
    JwtRes login(LoginReq req);
    void register(RegisterReq req);
    void forgotPassword(ForgotPasswordReq req);
    void resetPassword(ResetPasswordReq req);
}
