package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.modal.Iam.AuthAuditEvent;
import com.quangnt0000.be_modul.modal.Iam.Organization;
import com.quangnt0000.be_modul.modal.Iam.Permission;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.repository.Iam.AuthAuditEventRepository;
import com.quangnt0000.be_modul.repository.Iam.OrganizationRepository;
import com.quangnt0000.be_modul.repository.Iam.PermissionRepository;
import com.quangnt0000.be_modul.repository.Iam.RoleRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Quản trị danh mục vai trò, quyền, đơn vị và tra cứu nhật ký kiểm toán. */
@Service
@RequiredArgsConstructor
public class IamAdminService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthAuditEventRepository auditEventRepository;
    private final AuthAuditService auditService;

    // ---- Vai trò ---------------------------------------------------------

    @Transactional(readOnly = true)
    public ResponseEntity<?> listRoles() {
        List<IamDtos.RoleResponse> items = roleRepository.findByActiveTrueOrderByCodeAsc()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional
    public ResponseEntity<?> createRole(IamDtos.RoleRequest request, String actorId) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu mã vai trò");
        }
        String code = request.code().toUpperCase();
        if (roleRepository.existsByCode(code)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã vai trò đã tồn tại");
        }
        Set<Permission> permissions = resolvePermissions(request.permissions());
        if (permissions == null) {
            return ResponseEntity.badRequest().body("Danh sách quyền không hợp lệ");
        }

        Role role = roleRepository.save(Role.builder()
                .code(code)
                .name(request.name() == null ? code : request.name())
                .description(request.description())
                .maxClearanceLevel(request.maxClearanceLevel() == null ? 0 : request.maxClearanceLevel())
                .crossOrg(Boolean.TRUE.equals(request.crossOrg()))
                .systemRole(false)
                .active(true)
                .permissions(permissions)
                .build());

        auditService.record(actorId, null, "ROLE_CREATED", "role", code,
                AuthAuditService.SUCCESS, null,
                Map.of("permissions", request.permissions() == null ? List.of() : request.permissions()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(role));
    }

    @Transactional
    public ResponseEntity<?> updateRole(String id, IamDtos.RoleRequest request, String actorId) {
        Role role = roleRepository.findById(id).orElse(null);
        if (role == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy vai trò");
        }
        // Vai trò hệ thống do danh mục trong mã nguồn định nghĩa; sửa tay sẽ bị
        // ghi đè ở lần khởi động sau, nên chặn ngay tại đây.
        if (Boolean.TRUE.equals(role.getSystemRole())) {
            auditService.denied(actorId, "ROLE_UPDATED", "role", role.getCode(), "system_role");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Không sửa được vai trò hệ thống");
        }
        Set<Permission> permissions = resolvePermissions(request.permissions());
        if (permissions == null) {
            return ResponseEntity.badRequest().body("Danh sách quyền không hợp lệ");
        }
        role.setName(request.name() == null ? role.getName() : request.name());
        role.setDescription(request.description());
        if (request.maxClearanceLevel() != null) {
            role.setMaxClearanceLevel(request.maxClearanceLevel());
        }
        if (request.crossOrg() != null) {
            role.setCrossOrg(request.crossOrg());
        }
        role.setPermissions(permissions);
        roleRepository.save(role);

        auditService.record(actorId, null, "ROLE_UPDATED", "role", role.getCode(),
                AuthAuditService.SUCCESS, null,
                Map.of("permissions", request.permissions() == null ? List.of() : request.permissions()));
        return ResponseEntity.ok(toResponse(role));
    }

    @Transactional
    public ResponseEntity<?> deactivateRole(String id, String actorId) {
        Role role = roleRepository.findById(id).orElse(null);
        if (role == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy vai trò");
        }
        if (Boolean.TRUE.equals(role.getSystemRole())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Không vô hiệu hoá được vai trò hệ thống");
        }
        role.setActive(false);
        roleRepository.save(role);
        auditService.success(actorId, "ROLE_DEACTIVATED", "role", role.getCode(), null);
        return ResponseEntity.ok(toResponse(role));
    }

    // ---- Quyền -----------------------------------------------------------

    @Transactional(readOnly = true)
    public ResponseEntity<?> listPermissions() {
        List<IamDtos.PermissionResponse> items = permissionRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Permission::getCode))
                .map(permission -> new IamDtos.PermissionResponse(
                        permission.getCode(), permission.getName(),
                        permission.getCategory(), permission.getDescription()))
                .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    // ---- Đơn vị ----------------------------------------------------------

    @Transactional(readOnly = true)
    public ResponseEntity<?> listOrganizations() {
        List<IamDtos.OrganizationResponse> items =
                organizationRepository.findByActiveTrueOrderByCodeAsc().stream()
                        .map(this::toResponse).toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional
    public ResponseEntity<?> createOrganization(IamDtos.OrganizationRequest request, String actorId) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu mã đơn vị");
        }
        if (organizationRepository.existsByCode(request.code())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã đơn vị đã tồn tại");
        }
        Organization organization = organizationRepository.save(Organization.builder()
                .code(request.code())
                .name(request.name() == null ? request.code() : request.name())
                .parentId(request.parentId())
                .description(request.description())
                .active(true)
                .build());
        auditService.success(actorId, "ORGANIZATION_CREATED", "organization",
                organization.getCode(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(organization));
    }

    // ---- Audit -----------------------------------------------------------

    @Transactional(readOnly = true)
    public ResponseEntity<?> searchAudit(String actor, String action, String result,
                                         LocalDateTime from, LocalDateTime to,
                                         int page, int size) {
        Specification<AuthAuditEvent> spec = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (actor != null && !actor.isBlank()) {
                predicates.add(builder.equal(root.get("actor"), actor));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(builder.equal(root.get("action"), action));
            }
            if (result != null && !result.isBlank()) {
                predicates.add(builder.equal(root.get("result"), result));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("occurredAt"), from));
            }
            if (to != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("occurredAt"), to));
            }
            return builder.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuthAuditEvent> result_ = auditEventRepository.findAll(spec,
                PageRequest.of(Math.max(0, page - 1), Math.min(500, Math.max(1, size)),
                        Sort.by(Sort.Direction.DESC, "occurredAt")));

        List<IamDtos.AuthAuditResponse> items = result_.getContent().stream()
                .map(event -> new IamDtos.AuthAuditResponse(
                        event.getId(), event.getOccurredAt(), event.getActor(), event.getActorOrg(),
                        event.getAction(), event.getResourceType(), event.getResourceId(),
                        event.getResult(), event.getPolicyDecision(), event.getSourceIp(),
                        event.getCorrelationId(), event.getDetails()))
                .toList();

        return ResponseEntity.ok(Map.of(
                "total", result_.getTotalElements(),
                "page", page,
                "size", size,
                "items", items));
    }

    // ---- Hỗ trợ ----------------------------------------------------------

    /** Trả về null khi có mã quyền không tồn tại, để caller báo lỗi 400. */
    private Set<Permission> resolvePermissions(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return new HashSet<>();
        }
        List<Permission> found = permissionRepository.findByCodeIn(codes);
        if (found.size() != codes.stream().distinct().count()) {
            return null;
        }
        return new HashSet<>(found);
    }

    private IamDtos.RoleResponse toResponse(Role role) {
        return new IamDtos.RoleResponse(
                role.getId(), role.getCode(), role.getName(), role.getDescription(),
                role.getMaxClearanceLevel(), role.getCrossOrg(), role.getSystemRole(),
                role.getActive(),
                role.getPermissions().stream().map(Permission::getCode).sorted().toList());
    }

    private IamDtos.OrganizationResponse toResponse(Organization organization) {
        return new IamDtos.OrganizationResponse(
                organization.getId(), organization.getCode(), organization.getName(),
                organization.getParentId(), organization.getDescription(), organization.getActive());
    }
}
