package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.enums.IamCatalog;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.modal.Iam.Permission;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.modal.Iam.ServiceAccount;
import com.quangnt0000.be_modul.modal.Iam.UserAttribute;
import com.quangnt0000.be_modul.repository.Iam.RoleRepository;
import com.quangnt0000.be_modul.repository.Iam.UserAttributeRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

/**
 * Phát hành JWT cho người dùng và service account.
 *
 * <p>Bộ claim được thiết kế để cả hai phía cùng dùng được:
 * <ul>
 *   <li>{@code role} - chuỗi vai trò cũ, giữ cho giao diện hiện tại;</li>
 *   <li>{@code roles} - danh sách mã vai trò, worker suy ra quyền từ đây;</li>
 *   <li>{@code perms} - danh sách mã quyền, dùng cho {@code @PreAuthorize};</li>
 *   <li>{@code org_id} - mã đơn vị, worker tra cứu theo id hoặc code;</li>
 *   <li>{@code clearance_level} - mức độ mật tối đa được tiếp cận;</li>
 *   <li>{@code tv} - phiên bản token, để thu hồi có hiệu lực tức thì.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class TokenService {

    /** Loại token, ngăn dùng token MFA tạm thời như token truy cập. */
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";
    public static final String TYPE_MFA = "mfa";

    private static final long ACCESS_TTL_MS = 1000L * 60 * 60 * 8;
    private static final long REFRESH_TTL_MS = 1000L * 60 * 60 * 24 * 7;
    private static final long MFA_TTL_MS = 1000L * 60 * 5;
    private static final long SERVICE_TTL_MS = 1000L * 60 * 60;

    @Value("${jwt.secret}")
    private String secretKey;

    private final RoleRepository roleRepository;
    private final UserAttributeRepository userAttributeRepository;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Base64.getDecoder().decode(secretKey));
    }

    /**
     * Vai trò hiệu lực của người dùng. Nếu chưa được gán vai trò trong bảng
     * {@code iam_user_role}, suy ra từ chuỗi {@code user.role} cũ để tài khoản
     * hiện có không mất quyền sau khi nâng cấp.
     */
    public Set<Role> effectiveRoles(User user) {
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            return user.getRoles();
        }
        String legacy = user.getRole() == null ? IamCatalog.ROLE_USER : user.getRole().toUpperCase();
        return roleRepository.findByCode(legacy)
                .map(Set::of)
                .orElseGet(() -> roleRepository.findByCode(IamCatalog.ROLE_USER)
                        .map(Set::of)
                        .orElseGet(Set::of));
    }

    public Set<String> permissionCodes(Set<Role> roles) {
        Set<String> codes = new TreeSet<>();
        for (Role role : roles) {
            if (!Boolean.TRUE.equals(role.getActive())) {
                continue;
            }
            for (Permission permission : role.getPermissions()) {
                codes.add(permission.getCode());
            }
        }
        return codes;
    }

    /**
     * Clearance hiệu lực: mức do Security Officer đặt cho người dùng, nhưng
     * không vượt quá mức tối đa của bất kỳ vai trò nào họ giữ. Deny thắng allow.
     */
    public int effectiveClearance(User user, Set<Role> roles) {
        int roleCeiling = roles.stream()
                .map(Role::getMaxClearanceLevel)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);
        int assigned = user.getClearanceLevel() == null ? 0 : user.getClearanceLevel();
        return Math.min(assigned, roleCeiling);
    }

    public String issueAccessToken(User user) {
        Set<Role> roles = effectiveRoles(user);
        List<String> roleCodes = roles.stream().map(Role::getCode).sorted().toList();

        Map<String, Object> attrs = new LinkedHashMap<>();
        for (UserAttribute attribute : userAttributeRepository.findByUserId(user.getId())) {
            if (attribute.getExpiresAt() == null
                    || attribute.getExpiresAt().isAfter(LocalDateTime.now())) {
                attrs.put(attribute.getKey(), attribute.getValue());
            }
        }

        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(user.getId())
                .claim("typ", TYPE_ACCESS)
                .claim("username", user.getUsername())
                .claim("role", user.getRole())
                .claim("roles", roleCodes)
                .claim("perms", List.copyOf(permissionCodes(roles)))
                .claim("org_id", user.getOrgCode())
                .claim("clearance_level", effectiveClearance(user, roles))
                .claim("attrs", attrs)
                .claim("tv", user.getTokenVersion() == null ? 0 : user.getTokenVersion())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TTL_MS))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String issueRefreshToken(User user) {
        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(user.getId())
                .claim("typ", TYPE_REFRESH)
                .claim("tv", user.getTokenVersion() == null ? 0 : user.getTokenVersion())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TTL_MS))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Token trung gian sau bước mật khẩu, chỉ đủ để gọi endpoint xác minh MFA.
     * Không mang vai trò hay quyền nào.
     */
    public String issueMfaChallengeToken(User user) {
        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(user.getId())
                .claim("typ", TYPE_MFA)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + MFA_TTL_MS))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String issueServiceToken(ServiceAccount account) {
        List<String> roleCodes = account.getRoles().stream().map(Role::getCode).sorted().toList();
        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject(account.getClientId())
                .claim("typ", TYPE_ACCESS)
                .claim("username", account.getClientId())
                .claim("actor_type", "service_account")
                .claim("roles", roleCodes)
                .claim("perms", List.copyOf(permissionCodes(account.getRoles())))
                .claim("org_id", account.getOrgCode())
                .claim("clearance_level",
                        account.getClearanceLevel() == null ? 0 : account.getClearanceLevel())
                .claim("tv", 0)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + SERVICE_TTL_MS))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    public io.jsonwebtoken.Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public long accessTokenTtlSeconds() {
        return ACCESS_TTL_MS / 1000;
    }

    public long serviceTokenTtlSeconds() {
        return SERVICE_TTL_MS / 1000;
    }
}
