package com.quangnt0000.be_modul.dto.WareApprovalConfig;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho 1 item trong request update approval configs
 * 
 * LƯU Ý:
 * - KHÔNG dùng id để xác định config (không để FE phải biết DB id)
 * - Xác định config dựa trên khóa nghiệp vụ: (wareTemplateId + approverId)
 * - FE chỉ gửi danh sách approver đang ACTIVE (isActive = true)
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareApprovalConfigItemRequest {

    @NotBlank(message = "ApproverId không được để trống")
    private String approverId;

    @NotNull(message = "ApprovalOrder không được null")
    @Min(value = 1, message = "ApprovalOrder phải >= 1")
    private Integer approvalOrder;

    @NotNull(message = "AutoApprove không được null")
    private Boolean autoApprove;
}
