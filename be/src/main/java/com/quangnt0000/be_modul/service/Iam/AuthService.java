package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.dto.User.UserLogin;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Luồng xác thực của M01: mật khẩu → (MFA) → token; làm mới token; thu hồi.
 *
 * <p>Đăng nhập sai liên tiếp sẽ khoá tài khoản tạm thời. Mọi kết quả đều được
 * ghi audit, kể cả thất bại, theo mục 9.3.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    @Value("${iam.mfa.issuer:Ecotel Lakehouse}")
    private String mfaIssuer;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final TotpService totpService;
    private final AuthAuditService auditService;

    @Transactional
    public ResponseEntity<?> login(UserLogin request) {
        User user = userRepository.findByUsernameAndStatusTrue(request.getUsername());

        // Thông báo giống nhau cho mọi trường hợp sai, để không lộ tài khoản nào tồn tại.
        if (user == null) {
            auditService.failure(request.getUsername(), "LOGIN", "user", null, "unknown_user");
            return badCredentials();
        }
        if (user.getRevokedAt() != null) {
            auditService.denied(user.getId(), "LOGIN", "user", user.getId(), "account_revoked");
            return badCredentials();
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            auditService.denied(user.getId(), "LOGIN", "user", user.getId(), "account_locked");
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body("Tài khoản đang bị khoá tạm thời, vui lòng thử lại sau");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            registerFailedAttempt(user);
            auditService.failure(user.getId(), "LOGIN", "user", user.getId(), "bad_password");
            return badCredentials();
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);

        if (Boolean.TRUE.equals(user.getMfaEnabled()) && user.getMfaSecret() != null) {
            userRepository.save(user);
            auditService.record(user.getId(), user.getOrgCode(), "LOGIN_MFA_CHALLENGE",
                    "user", user.getId(), AuthAuditService.SUCCESS, null, null);
            return ResponseEntity.ok(new IamDtos.LoginResult(
                    true, tokenService.issueMfaChallengeToken(user),
                    null, null, null, null, null, null, null, null));
        }

        return ResponseEntity.ok(completeLogin(user));
    }

    @Transactional
    public ResponseEntity<?> verifyMfa(IamDtos.MfaVerifyRequest request) {
        Claims claims;
        try {
            claims = tokenService.parse(request.mfaToken());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Phiên xác thực đã hết hạn");
        }
        if (!TokenService.TYPE_MFA.equals(claims.get("typ", String.class))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token không hợp lệ");
        }

        User user = userRepository.findById(claims.getSubject()).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getStatus()) || user.getRevokedAt() != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Tài khoản không khả dụng");
        }

        if (!totpService.verify(user.getMfaSecret(), request.code())) {
            registerFailedAttempt(user);
            auditService.failure(user.getId(), "LOGIN_MFA", "user", user.getId(), "bad_totp");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mã xác thực không đúng");
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        return ResponseEntity.ok(completeLogin(user));
    }

    @Transactional
    public ResponseEntity<?> refresh(IamDtos.RefreshRequest request) {
        Claims claims;
        try {
            claims = tokenService.parse(request.refreshToken());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token không hợp lệ");
        }
        if (!TokenService.TYPE_REFRESH.equals(claims.get("typ", String.class))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token không hợp lệ");
        }

        User user = userRepository.findById(claims.getSubject()).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getStatus()) || user.getRevokedAt() != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Tài khoản không khả dụng");
        }

        // Token phát trước lần thu hồi gần nhất bị từ chối (UC01.05).
        Integer tokenVersion = claims.get("tv", Integer.class);
        int current = user.getTokenVersion() == null ? 0 : user.getTokenVersion();
        if (tokenVersion == null || tokenVersion != current) {
            auditService.denied(user.getId(), "TOKEN_REFRESH", "user", user.getId(),
                    "token_version_mismatch");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token đã bị thu hồi");
        }

        auditService.success(user.getId(), "TOKEN_REFRESH", "user", user.getId(), null);
        return ResponseEntity.ok(buildLoginResult(user));
    }

    /** Đăng xuất mọi phiên bằng cách tăng phiên bản token. */
    @Transactional
    public ResponseEntity<?> logoutEverywhere(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        user.setTokenVersion((user.getTokenVersion() == null ? 0 : user.getTokenVersion()) + 1);
        userRepository.save(user);
        auditService.success(userId, "LOGOUT_ALL_SESSIONS", "user", userId, null);
        return ResponseEntity.ok(Map.of("message", "Đã đăng xuất khỏi tất cả phiên"));
    }

    // ---- Ghi danh MFA ----------------------------------------------------

    @Transactional
    public ResponseEntity<?> startMfaEnrollment(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        // Khoá mới chỉ có hiệu lực sau khi người dùng xác nhận được một mã hợp lệ.
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);

        auditService.success(userId, "MFA_ENROLL_STARTED", "user", userId, null);
        return ResponseEntity.ok(new IamDtos.MfaEnrollResponse(
                secret, totpService.buildOtpAuthUri(mfaIssuer, user.getUsername(), secret)));
    }

    @Transactional
    public ResponseEntity<?> activateMfa(String userId, IamDtos.MfaActivateRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getMfaSecret() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Chưa bắt đầu ghi danh MFA");
        }
        if (!totpService.verify(user.getMfaSecret(), request.code())) {
            auditService.failure(userId, "MFA_ACTIVATE", "user", userId, "bad_totp");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mã xác thực không đúng");
        }
        user.setMfaEnabled(true);
        user.setMfaEnrolledAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.success(userId, "MFA_ACTIVATED", "user", userId, null);
        return ResponseEntity.ok(Map.of("message", "Đã bật xác thực hai lớp"));
    }

    /** Tắt MFA là hành động giảm mức bảo vệ nên chỉ quản trị viên được làm. */
    @Transactional
    public ResponseEntity<?> disableMfa(String targetUserId, String actorId, String reason) {
        User user = userRepository.findById(targetUserId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setMfaEnrolledAt(null);
        userRepository.save(user);
        auditService.record(actorId, user.getOrgCode(), "MFA_DISABLED", "user", targetUserId,
                AuthAuditService.SUCCESS, "security_downgrade", Map.of("reason", reason));
        return ResponseEntity.ok(Map.of("message", "Đã tắt xác thực hai lớp"));
    }

    // ---- Hỗ trợ ----------------------------------------------------------

    private IamDtos.LoginResult completeLogin(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.record(user.getId(), user.getOrgCode(), "LOGIN", "user", user.getId(),
                AuthAuditService.SUCCESS, null, null);
        return buildLoginResult(user);
    }

    private IamDtos.LoginResult buildLoginResult(User user) {
        Set<Role> roles = tokenService.effectiveRoles(user);
        List<String> roleCodes = roles.stream().map(Role::getCode).sorted().toList();
        return new IamDtos.LoginResult(
                false,
                null,
                tokenService.issueAccessToken(user),
                tokenService.issueRefreshToken(user),
                user.getRole(),
                roleCodes,
                List.copyOf(tokenService.permissionCodes(roles)),
                user.getOrgCode(),
                tokenService.effectiveClearance(user, roles),
                tokenService.accessTokenTtlSeconds());
    }

    private void registerFailedAttempt(User user) {
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
            user.setFailedLoginAttempts(0);
        }
        userRepository.save(user);
    }

    private ResponseEntity<?> badCredentials() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Sai thông tin đăng nhập");
    }
}
