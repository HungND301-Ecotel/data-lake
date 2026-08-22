package com.quangnt0000.be_modul.controller.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.service.Iam.UserAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Gán vai trò, thuộc tính, đơn vị, mức độ mật và thu hồi tài khoản. */
@RestController
@RequestMapping("/iam/users")
@RequiredArgsConstructor
public class UserAccessController {

    private final UserAccessService userAccessService;

    @GetMapping
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> listAll() {
        return userAccessService.listAll();
    }

    /** Người dùng luôn xem được quyền hiệu lực của chính mình. */
    @GetMapping("/me/access")
    public ResponseEntity<?> myAccess() {
        return userAccessService.describe(currentUserId());
    }

    @GetMapping("/{userId}/access")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> describe(@PathVariable String userId) {
        return userAccessService.describe(userId);
    }

    @PutMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> assignRoles(@PathVariable String userId,
                                         @RequestBody IamDtos.AssignRolesRequest request) {
        return userAccessService.assignRoles(userId, request, currentUserId());
    }

    /**
     * Đặt mức độ mật là quyết định thuộc thẩm quyền cán bộ an toàn thông tin,
     * không phải quản trị viên nghiệp vụ (phụ lục A).
     */
    @PutMapping("/{userId}/clearance")
    @PreAuthorize("hasAuthority('admin.manage')")
    public ResponseEntity<?> setClearance(@PathVariable String userId,
                                          @RequestBody IamDtos.SetClearanceRequest request) {
        return userAccessService.setClearance(userId, request, currentUserId());
    }

    @PutMapping("/{userId}/organization")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> setOrganization(@PathVariable String userId,
                                             @RequestBody IamDtos.SetOrganizationRequest request) {
        return userAccessService.setOrganization(userId, request, currentUserId());
    }

    @PutMapping("/{userId}/attributes")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> upsertAttribute(@PathVariable String userId,
                                             @RequestBody IamDtos.AttributeRequest request) {
        return userAccessService.upsertAttribute(userId, request, currentUserId());
    }

    @DeleteMapping("/{userId}/attributes/{key}")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> deleteAttribute(@PathVariable String userId, @PathVariable String key) {
        return userAccessService.deleteAttribute(userId, key, currentUserId());
    }

    @PostMapping("/{userId}/revoke")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> revoke(@PathVariable String userId,
                                    @RequestBody IamDtos.RevokeRequest request) {
        return userAccessService.revoke(userId, request, currentUserId());
    }

    @PostMapping("/{userId}/reinstate")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> reinstate(@PathVariable String userId,
                                       @RequestBody IamDtos.RevokeRequest request) {
        return userAccessService.reinstate(userId, request, currentUserId());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
