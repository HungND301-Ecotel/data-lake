package com.quangnt0000.be_modul.controller.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.service.Iam.IamAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/** Danh mục vai trò, quyền, đơn vị và tra cứu nhật ký kiểm toán danh tính. */
@RestController
@RequestMapping("/iam")
@RequiredArgsConstructor
public class IamAdminController {

    private final IamAdminService iamAdminService;

    // ---- Vai trò ---------------------------------------------------------

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> listRoles() {
        return iamAdminService.listRoles();
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> createRole(@RequestBody IamDtos.RoleRequest request) {
        return iamAdminService.createRole(request, currentUserId());
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> updateRole(@PathVariable String id,
                                        @RequestBody IamDtos.RoleRequest request) {
        return iamAdminService.updateRole(id, request, currentUserId());
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> deactivateRole(@PathVariable String id) {
        return iamAdminService.deactivateRole(id, currentUserId());
    }

    // ---- Quyền và đơn vị -------------------------------------------------

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> listPermissions() {
        return iamAdminService.listPermissions();
    }

    /** Danh sách đơn vị dùng chung cho form tải dữ liệu nên chỉ cần data.read. */
    @GetMapping("/organizations")
    @PreAuthorize("hasAuthority('data.read')")
    public ResponseEntity<?> listOrganizations() {
        return iamAdminService.listOrganizations();
    }

    @PostMapping("/organizations")
    @PreAuthorize("hasAuthority('admin.manage')")
    public ResponseEntity<?> createOrganization(@RequestBody IamDtos.OrganizationRequest request) {
        return iamAdminService.createOrganization(request, currentUserId());
    }

    // ---- Audit -----------------------------------------------------------

    @GetMapping("/audit")
    @PreAuthorize("hasAuthority('audit.read')")
    public ResponseEntity<?> searchAudit(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String result,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size) {
        return iamAdminService.searchAudit(actor, action, result, from, to, page, size);
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
