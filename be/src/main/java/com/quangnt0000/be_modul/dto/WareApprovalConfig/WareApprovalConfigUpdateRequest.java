package com.quangnt0000.be_modul.dto.WareApprovalConfig;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request để cập nhật TOÀN BỘ danh sách approval config
 * PUT /api/wh-template/{wareTemplateId}/approval-configs
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareApprovalConfigUpdateRequest {

    @NotNull(message = "Danh sách configs không được null")
    @NotEmpty(message = "Phải có ít nhất 1 config")
    @Valid
    private List<WareApprovalConfigItemRequest> configs;
}
