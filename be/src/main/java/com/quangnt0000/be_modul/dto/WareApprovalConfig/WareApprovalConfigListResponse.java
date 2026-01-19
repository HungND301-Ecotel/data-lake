package com.quangnt0000.be_modul.dto.WareApprovalConfig;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response cho API lấy danh sách approval configs
 * GET /api/wh-template/{wareTemplateId}/approval-configs
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareApprovalConfigListResponse {

    private Integer wareTemplateId;

    private String wareTemplateName;

    private List<WareApprovalConfigDTO> configs;
}
