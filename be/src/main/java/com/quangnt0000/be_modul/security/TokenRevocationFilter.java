package com.quangnt0000.be_modul.security;

import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Chặn token đã bị thu hồi - UC01.05.
 *
 * <p>Chữ ký hợp lệ chỉ chứng minh token do hệ thống phát ra, không chứng minh
 * nó còn hiệu lực. Filter đối chiếu claim {@code tv} với {@code tokenVersion}
 * hiện tại của người dùng; mọi thay đổi quyền đều tăng giá trị này nên token cũ
 * mất hiệu lực ngay, không phải chờ hết hạn.
 *
 * <p>Token của service account mang {@code actor_type=service_account} và không
 * gắn với bảng người dùng; vòng đời của chúng do cờ {@code active} và hạn dùng
 * kiểm soát tại thời điểm cấp phát.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenRevocationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            Jwt jwt = jwtAuthentication.getToken();

            if ("service_account".equals(jwt.getClaimAsString("actor_type"))) {
                filterChain.doFilter(request, response);
                return;
            }

            String reason = validate(jwt);
            if (reason != null) {
                SecurityContextHolder.clearContext();
                log.warn("Từ chối token của {} - {}", jwt.getSubject(), reason);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"error\":\"TOKEN_REVOKED\",\"message\":\"Phiên đăng nhập đã hết hiệu lực\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /** Trả về lý do từ chối, hoặc null nếu token còn hiệu lực. */
    private String validate(Jwt jwt) {
        User user = userRepository.findById(jwt.getSubject()).orElse(null);
        if (user == null) {
            return "user_not_found";
        }
        if (!Boolean.TRUE.equals(user.getStatus()) || user.getRevokedAt() != null) {
            return "account_revoked";
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            return "account_locked";
        }

        Integer tokenVersion = jwt.getClaim("tv") instanceof Number number
                ? number.intValue()
                : null;
        int current = user.getTokenVersion() == null ? 0 : user.getTokenVersion();
        if (tokenVersion == null || tokenVersion != current) {
            return "token_version_mismatch";
        }
        return null;
    }

    /**
     * Bỏ qua các endpoint công khai để một token cũ không chặn được chính thao
     * tác đăng nhập lại.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/iam/auth/login")
                || path.startsWith("/iam/auth/mfa/verify")
                || path.startsWith("/iam/auth/refresh")
                || path.startsWith("/iam/auth/token")
                || path.startsWith("/user/login")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs");
    }
}
