package com.quangnt0000.be_modul.service.Iam;

import com.quangnt0000.be_modul.enums.IamCatalog;
import com.quangnt0000.be_modul.modal.Iam.Organization;
import com.quangnt0000.be_modul.modal.Iam.Permission;
import com.quangnt0000.be_modul.modal.Iam.Role;
import com.quangnt0000.be_modul.repository.Iam.OrganizationRepository;
import com.quangnt0000.be_modul.repository.Iam.PermissionRepository;
import com.quangnt0000.be_modul.repository.Iam.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Nạp danh mục quyền, vai trò và đơn vị gốc khi khởi động.
 *
 * <p>Chạy lặp lại an toàn: chỉ tạo bản ghi còn thiếu và đồng bộ lại tập quyền
 * của các vai trò hệ thống, không đụng tới vai trò do quản trị viên tự tạo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Order(10)
public class IamSeedService implements ApplicationRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedPermissions();
        seedRoles();
        seedRootOrganization();
    }

    private void seedPermissions() {
        List<String> created = IamCatalog.PERMISSIONS.entrySet().stream()
                .filter(entry -> permissionRepository.findByCode(entry.getKey()).isEmpty())
                .map(entry -> {
                    permissionRepository.save(Permission.builder()
                            .code(entry.getKey())
                            .name(entry.getValue()[0])
                            .category(entry.getValue()[1])
                            .build());
                    return entry.getKey();
                })
                .toList();
        if (!created.isEmpty()) {
            log.info("IAM seed - đã tạo {} quyền: {}", created.size(), created);
        }
    }

    private void seedRoles() {
        for (IamCatalog.RoleDef def : IamCatalog.ROLES) {
            Set<Permission> permissions = new HashSet<>(
                    permissionRepository.findByCodeIn(List.copyOf(def.permissions())));

            Role role = roleRepository.findByCode(def.code()).orElse(null);
            if (role == null) {
                roleRepository.save(Role.builder()
                        .code(def.code())
                        .name(def.name())
                        .maxClearanceLevel(def.maxClearance())
                        .crossOrg(def.crossOrg())
                        .systemRole(true)
                        .active(true)
                        .permissions(permissions)
                        .build());
                log.info("IAM seed - đã tạo vai trò {}", def.code());
                continue;
            }

            // Vai trò hệ thống luôn được đồng bộ lại theo danh mục trong mã nguồn,
            // để một lần thêm quyền mới có hiệu lực ngay sau khi deploy.
            if (Boolean.TRUE.equals(role.getSystemRole())) {
                Set<String> current = role.getPermissions().stream()
                        .map(Permission::getCode).collect(Collectors.toSet());
                if (!current.equals(def.permissions())
                        || !def.name().equals(role.getName())
                        || !Integer.valueOf(def.maxClearance()).equals(role.getMaxClearanceLevel())
                        || !Boolean.valueOf(def.crossOrg()).equals(role.getCrossOrg())) {
                    role.setName(def.name());
                    role.setMaxClearanceLevel(def.maxClearance());
                    role.setCrossOrg(def.crossOrg());
                    role.setPermissions(permissions);
                    roleRepository.save(role);
                    log.info("IAM seed - đã đồng bộ vai trò {}", def.code());
                }
            }
        }
    }

    private void seedRootOrganization() {
        if (organizationRepository.findByCode(IamCatalog.DEFAULT_ORG_CODE).isEmpty()) {
            organizationRepository.save(Organization.builder()
                    .code(IamCatalog.DEFAULT_ORG_CODE)
                    .name("Tổ chức gốc")
                    .description("Đơn vị mặc định; mã trùng với bản seed của worker")
                    .active(true)
                    .build());
            log.info("IAM seed - đã tạo đơn vị gốc {}", IamCatalog.DEFAULT_ORG_CODE);
        }
    }
}
