package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.modal.Iam.ServiceAccount;
import com.quangnt0000.be_modul.repository.Iam.OrganizationRepository;
import com.quangnt0000.be_modul.repository.Iam.RoleRepository;
import com.quangnt0000.be_modul.repository.Iam.ServiceAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Danh tính dịch vụ và luồng client_credentials (UC01.07).
 *
 * <p>Secret chỉ tồn tại dưới dạng hash trong cơ sở dữ liệu; giá trị gốc trả về
 * đúng một lần. Mỗi service account bắt buộc có hạn sử dụng.
 */
@Service
@RequiredArgsConstructor
public class ServiceAccountService {

    private static final int DEFAULT_TTL_DAYS = 180;

    private final ServiceAccountRepository serviceAccountRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthAuditService auditService;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public ResponseEntity<?> create(IamDtos.ServiceAccountRequest request, String actorId) {
        if (request.clientId() == null || request.clientId().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu clientId");
        }
        if (serviceAccountRepository.existsByClientId(request.clientId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("clientId đã tồn tại");
        }
        if (request.orgCode() != null
                && organizationRepository.findByCode(request.orgCode()).isEmpty()) {
            return ResponseEntity.badRequest().body("Đơn vị không tồn tại: " + request.orgCode());
        }

        Set<Role> roles = new HashSet<>();
        for (String code : request.roleCodes() == null ? List.<String>of() : request.roleCodes()) {
            Role role = roleRepository.findByCode(code.toUpperCase()).orElse(null);
            if (role == null) {
                return ResponseEntity.badRequest().body("Vai trò không hợp lệ: " + code);
            }
            roles.add(role);
        }

        String secret = generateSecret();
        LocalDateTime expiresAt = request.expiresAt() != null
                ? request.expiresAt()
                : LocalDateTime.now().plusDays(DEFAULT_TTL_DAYS);

        ServiceAccount account = serviceAccountRepository.save(ServiceAccount.builder()
                .clientId(request.clientId())
                .clientSecretHash(passwordEncoder.encode(secret))
                .name(request.name() == null ? request.clientId() : request.name())
                .description(request.description())
                .orgCode(request.orgCode())
                .clearanceLevel(request.clearanceLevel() == null ? 0 : request.clearanceLevel())
                .roles(roles)
                .active(true)
                .expiresAt(expiresAt)
                .createdBy(actorId)
                .build());

        auditService.record(actorId, request.orgCode(), "SERVICE_ACCOUNT_CREATED",
                "service_account", account.getClientId(), AuthAuditService.SUCCESS, null,
                Map.of("roles", request.roleCodes() == null ? List.of() : request.roleCodes(),
                        "expiresAt", String.valueOf(expiresAt)));

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new IamDtos.ServiceAccountSecretResponse(account.getClientId(), secret, expiresAt));
    }

    @Transactional
    public ResponseEntity<?> rotateSecret(String id, String actorId) {
        ServiceAccount account = serviceAccountRepository.findById(id).orElse(null);
        if (account == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy service account");
        }
        String secret = generateSecret();
        account.setClientSecretHash(passwordEncoder.encode(secret));
        serviceAccountRepository.save(account);

        auditService.record(actorId, account.getOrgCode(), "SERVICE_ACCOUNT_SECRET_ROTATED",
                "service_account", account.getClientId(), AuthAuditService.SUCCESS, null, null);
        return ResponseEntity.ok(new IamDtos.ServiceAccountSecretResponse(
                account.getClientId(), secret, account.getExpiresAt()));
    }

    @Transactional
    public ResponseEntity<?> revoke(String id, String actorId, String reason) {
        ServiceAccount account = serviceAccountRepository.findById(id).orElse(null);
        if (account == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy service account");
        }
        account.setActive(false);
        serviceAccountRepository.save(account);
        auditService.record(actorId, account.getOrgCode(), "SERVICE_ACCOUNT_REVOKED",
                "service_account", account.getClientId(), AuthAuditService.SUCCESS, null,
                Map.of("reason", reason == null ? "" : reason));
        return ResponseEntity.ok(toResponse(account));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> list() {
        List<IamDtos.ServiceAccountResponse> items =
                serviceAccountRepository.findAllByOrderByCreatedAtDesc().stream()
                        .map(this::toResponse)
                        .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    /** Cấp token máy-máy. Thông báo lỗi giữ nguyên một dạng để không dò được clientId. */
    @Transactional
    public ResponseEntity<?> issueToken(IamDtos.ClientCredentialsRequest request) {
        ServiceAccount account = request.clientId() == null
                ? null
                : serviceAccountRepository.findByClientId(request.clientId()).orElse(null);

        if (account == null
                || !Boolean.TRUE.equals(account.getActive())
                || request.clientSecret() == null
                || !passwordEncoder.matches(request.clientSecret(), account.getClientSecretHash())) {
            auditService.failure(request.clientId(), "SERVICE_TOKEN_ISSUED", "service_account",
                    request.clientId(), "invalid_client");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Thông tin client không hợp lệ");
        }
        if (account.getExpiresAt() != null && account.getExpiresAt().isBefore(LocalDateTime.now())) {
            auditService.denied(account.getClientId(), "SERVICE_TOKEN_ISSUED", "service_account",
                    account.getClientId(), "expired");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Service account đã hết hạn");
        }

        account.setLastUsedAt(LocalDateTime.now());
        serviceAccountRepository.save(account);

        auditService.record(account.getClientId(), account.getOrgCode(), "SERVICE_TOKEN_ISSUED",
                "service_account", account.getClientId(), AuthAuditService.SUCCESS, null, null);

        return ResponseEntity.ok(new IamDtos.ServiceTokenResponse(
                tokenService.issueServiceToken(account),
                "Bearer",
                tokenService.serviceTokenTtlSeconds(),
                List.copyOf(tokenService.permissionCodes(account.getRoles()))));
    }

    private IamDtos.ServiceAccountResponse toResponse(ServiceAccount account) {
        return new IamDtos.ServiceAccountResponse(
                account.getId(), account.getClientId(), account.getName(), account.getDescription(),
                account.getOrgCode(), account.getClearanceLevel(),
                account.getRoles().stream().map(Role::getCode).sorted().toList(),
                account.getActive(), account.getExpiresAt(), account.getLastUsedAt(),
                account.getCreatedAt());
    }

    private String generateSecret() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
