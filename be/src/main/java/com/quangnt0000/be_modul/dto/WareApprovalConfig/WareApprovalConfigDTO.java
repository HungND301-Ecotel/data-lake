package com.quangnt0000.be_modul.dto.WareApprovalConfig;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho 1 approval config item
 * Dùng cho cả response và request
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareApprovalConfigDTO {

    private Integer id;

    private String approverId;

    private String approverName;

    private Integer approvalOrder;

    private Boolean autoApprove;

    private Boolean isActive;

}
