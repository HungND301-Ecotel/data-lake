package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareApprovalConfig.WareApprovalConfigUpdateRequest;
import com.quangnt0000.be_modul.service.DataWH.WareApprovalConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý approval configuration của WareTemplate
 * 
 * APIs:
 * 1. GET  /api/wh-template/{wareTemplateId}/approval-configs - Lấy danh sách approval configs
 * 2. PUT  /api/wh-template/{wareTemplateId}/approval-configs - Cập nhật toàn bộ approval configs
 */
@RestController
@RequestMapping("/wh-template")
@RequiredArgsConstructor
public class WareTemplateApprovalConfigController {

    private final WareApprovalConfigService approvalConfigService;


    @GetMapping("/{template-id}/approval-configs")
    public ResponseEntity<?> getApprovalConfigs(
            @PathVariable("template-id") Integer wareTemplateId) {
        return approvalConfigService.getApprovalConfigs(wareTemplateId);
    }

    
    @PutMapping("/{template-id}/approval-configs")
    public ResponseEntity<?> updateApprovalConfigs(
            @PathVariable("template-id") Integer wareTemplateId,
            @Valid @RequestBody WareApprovalConfigUpdateRequest request) {
        return approvalConfigService.updateApprovalConfigs(wareTemplateId, request);
    }
}
