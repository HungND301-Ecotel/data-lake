package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.modal.Iam.UserAttribute;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.repository.Iam.OrganizationRepository;
import com.quangnt0000.be_modul.repository.Iam.RoleRepository;
import com.quangnt0000.be_modul.repository.Iam.UserAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Gán vai trò, thuộc tính, đơn vị và mức độ mật cho người dùng (UC01.03–UC01.05).
 *
 * <p>Mọi thay đổi đều tăng {@code tokenVersion} để token đang lưu hành mất hiệu
 * lực ngay, thay vì phải chờ hết hạn - đây là điều kiện để "revoke có hiệu lực
 * theo SLA" trong tiêu chí chấp nhận của M01.
 */
@Service
@RequiredArgsConstructor
public class UserAccessService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final UserAttributeRepository userAttributeRepository;
    private final TokenService tokenService;
    private final AuthAuditService auditService;

    @Transactional(readOnly = true)
    public ResponseEntity<?> describe(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> listAll() {
        List<IamDtos.UserAccessResponse> items = userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional
    public ResponseEntity<?> assignRoles(String userId, IamDtos.AssignRolesRequest request,
                                         String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        List<String> codes = request.roleCodes() == null ? List.of() : request.roleCodes();

        Set<Role> roles = new HashSet<>();
        for (String code : codes) {
            Role role = roleRepository.findByCode(code.toUpperCase()).orElse(null);
            if (role == null || !Boolean.TRUE.equals(role.getActive())) {
                return ResponseEntity.badRequest().body("Vai trò không hợp lệ: " + code);
            }
            roles.add(role);
        }

        Set<String> before = user.getRoles().stream().map(Role::getCode).collect(java.util.stream.Collectors.toSet());
        user.setRoles(roles);
        bumpTokenVersion(user);
        userRepository.save(user);

        auditService.record(actorId, user.getOrgCode(), "ROLE_ASSIGNED", "user", userId,
                AuthAuditService.SUCCESS, null,
                Map.of("before", before, "after", codes, "reason", nullSafe(request.reason())));
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional
    public ResponseEntity<?> setClearance(String userId, IamDtos.SetClearanceRequest request,
                                          String actorId) {
        if (request.clearanceLevel() == null || request.clearanceLevel() < 0
                || request.clearanceLevel() > 4) {
            return ResponseEntity.badRequest().body("Mức độ mật phải nằm trong khoảng 0-4");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        Integer before = user.getClearanceLevel();
        user.setClearanceLevel(request.clearanceLevel());
        bumpTokenVersion(user);
        userRepository.save(user);

        // Nâng mức độ mật là thay đổi nhạy cảm, luôn phải có lý do trong audit.
        auditService.record(actorId, user.getOrgCode(), "CLEARANCE_CHANGED", "user", userId,
                AuthAuditService.SUCCESS, null,
                Map.of("before", String.valueOf(before), "after", request.clearanceLevel(),
                        "reason", nullSafe(request.reason())));
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional
    public ResponseEntity<?> setOrganization(String userId, IamDtos.SetOrganizationRequest request,
                                             String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        if (request.orgCode() != null
                && organizationRepository.findByCode(request.orgCode()).isEmpty()) {
            return ResponseEntity.badRequest().body("Đơn vị không tồn tại: " + request.orgCode());
        }
        String before = user.getOrgCode();
        user.setOrgCode(request.orgCode());
        bumpTokenVersion(user);
        userRepository.save(user);

        auditService.record(actorId, request.orgCode(), "ORGANIZATION_CHANGED", "user", userId,
                AuthAuditService.SUCCESS, null,
                Map.of("before", nullSafe(before), "after", nullSafe(request.orgCode()),
                        "reason", nullSafe(request.reason())));
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional
    public ResponseEntity<?> upsertAttribute(String userId, IamDtos.AttributeRequest request,
                                             String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        if (request.key() == null || request.key().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu tên thuộc tính");
        }

        UserAttribute attribute = userAttributeRepository
                .findByUserIdAndKey(userId, request.key())
                .orElseGet(() -> UserAttribute.builder().userId(userId).key(request.key()).build());
        attribute.setValue(request.value());
        attribute.setExpiresAt(request.expiresAt());
        attribute.setGrantedBy(actorId);
        attribute.setGrantedAt(LocalDateTime.now());
        userAttributeRepository.save(attribute);

        bumpTokenVersion(user);
        userRepository.save(user);

        auditService.record(actorId, user.getOrgCode(), "ATTRIBUTE_GRANTED", "user", userId,
                AuthAuditService.SUCCESS, null,
                Map.of("key", request.key(), "value", nullSafe(request.value())));
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional
    public ResponseEntity<?> deleteAttribute(String userId, String key, String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        userAttributeRepository.deleteByUserIdAndKey(userId, key);
        bumpTokenVersion(user);
        userRepository.save(user);
        auditService.record(actorId, user.getOrgCode(), "ATTRIBUTE_REVOKED", "user", userId,
                AuthAuditService.SUCCESS, null, Map.of("key", key));
        return ResponseEntity.ok(toResponse(user));
    }

    /** UC01.05 - thu hồi tài khoản: khoá đăng nhập và vô hiệu token đang lưu hành. */
    @Transactional
    public ResponseEntity<?> revoke(String userId, IamDtos.RevokeRequest request, String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        user.setStatus(false);
        user.setRevokedAt(LocalDateTime.now());
        user.setRevokedBy(actorId);
        bumpTokenVersion(user);
        userRepository.save(user);

        auditService.record(actorId, user.getOrgCode(), "ACCESS_REVOKED", "user", userId,
                AuthAuditService.SUCCESS, null, Map.of("reason", nullSafe(request.reason())));
        return ResponseEntity.ok(toResponse(user));
    }

    @Transactional
    public ResponseEntity<?> reinstate(String userId, IamDtos.RevokeRequest request, String actorId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }
        user.setStatus(true);
        user.setRevokedAt(null);
        user.setRevokedBy(null);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        auditService.record(actorId, user.getOrgCode(), "ACCESS_REINSTATED", "user", userId,
                AuthAuditService.SUCCESS, null, Map.of("reason", nullSafe(request.reason())));
        return ResponseEntity.ok(toResponse(user));
    }

    IamDtos.UserAccessResponse toResponse(User user) {
        Set<Role> roles = tokenService.effectiveRoles(user);
        Map<String, String> attributes = new LinkedHashMap<>();
        userAttributeRepository.findByUserId(user.getId()).forEach(
                attribute -> attributes.put(attribute.getKey(), attribute.getValue()));

        return new IamDtos.UserAccessResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getOrgCode(),
                user.getClearanceLevel(),
                tokenService.effectiveClearance(user, roles),
                user.getMfaEnabled(),
                user.getStatus(),
                user.getRevokedAt(),
                user.getLastLoginAt(),
                user.getLockedUntil(),
                roles.stream().map(Role::getCode).sorted().toList(),
                List.copyOf(tokenService.permissionCodes(roles)),
                attributes);
    }

    private void bumpTokenVersion(User user) {
        user.setTokenVersion((user.getTokenVersion() == null ? 0 : user.getTokenVersion()) + 1);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
