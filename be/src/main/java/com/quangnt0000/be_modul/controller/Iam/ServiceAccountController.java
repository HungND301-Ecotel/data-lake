package com.quangnt0000.be_modul.controller.Iam;

import com.quangnt0000.be_modul.dto.Iam.IamDtos;
import com.quangnt0000.be_modul.service.Iam.ServiceAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Danh tính dịch vụ (UC01.07) và luồng cấp token máy-máy. */
@RestController
@RequestMapping("/iam")
@RequiredArgsConstructor
public class ServiceAccountController {

    private final ServiceAccountService serviceAccountService;

    /**
     * Đổi client credentials lấy token. Endpoint này public vì client chưa có
     * token tại thời điểm gọi; bản thân credentials là yếu tố xác thực.
     */
    @PostMapping("/auth/token")
    public ResponseEntity<?> issueToken(@RequestBody IamDtos.ClientCredentialsRequest request) {
        return serviceAccountService.issueToken(request);
    }

    @GetMapping("/service-accounts")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> list() {
        return serviceAccountService.list();
    }

    @PostMapping("/service-accounts")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> create(@RequestBody IamDtos.ServiceAccountRequest request) {
        return serviceAccountService.create(request, currentUserId());
    }

    @PostMapping("/service-accounts/{id}/rotate-secret")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> rotate(@PathVariable String id) {
        return serviceAccountService.rotateSecret(id, currentUserId());
    }

    @PostMapping("/service-accounts/{id}/revoke")
    @PreAuthorize("hasAuthority('iam.manage')")
    public ResponseEntity<?> revoke(@PathVariable String id,
                                    @RequestBody IamDtos.RevokeRequest request) {
        return serviceAccountService.revoke(id, currentUserId(), request.reason());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
