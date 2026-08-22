package com.quangnt0000.be_modul.controller.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.dto.User.UserLogin;
import com.quangnt0000.be_modul.service.Iam.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Xác thực của M01: đăng nhập, MFA, làm mới token, đăng xuất toàn phiên.
 *
 * <p>Endpoint đăng nhập cũ {@code POST /user/login} vẫn hoạt động và nay dùng
 * chung luồng này, nên client hiện tại không phải sửa gì.
 */
@RestController
@RequestMapping("/iam/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLogin request) {
        return authService.login(request);
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verifyMfa(@RequestBody IamDtos.MfaVerifyRequest request) {
        return authService.verifyMfa(request);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody IamDtos.RefreshRequest request) {
        return authService.refresh(request);
    }

    /** Ghi danh MFA cho chính mình; khoá chỉ có hiệu lực sau khi kích hoạt. */
    @PostMapping("/mfa/enroll")
    public ResponseEntity<?> enrollMfa() {
        return authService.startMfaEnrollment(currentUserId());
    }

    @PostMapping("/mfa/activate")
    public ResponseEntity<?> activateMfa(@RequestBody IamDtos.MfaActivateRequest request) {
        return authService.activateMfa(currentUserId(), request);
    }

    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll() {
        return authService.logoutEverywhere(currentUserId());
    }

    /** Tắt MFA của người khác là hành động giảm bảo vệ, cần quyền quản trị. */
    @PostMapping("/users/{userId}/mfa/disable")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> disableMfa(@PathVariable String userId,
                                        @RequestBody IamDtos.RevokeRequest request) {
        return authService.disableMfa(userId, currentUserId(), request.reason());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
