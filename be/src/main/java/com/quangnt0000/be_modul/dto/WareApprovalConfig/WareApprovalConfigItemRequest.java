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
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareApprovalConfigItemRequest {

    private Integer id;

    @NotBlank(message = "ApproverId không được để trống")
    private String approverId;

    @NotNull(message = "ApprovalOrder không được null")
    @Min(value = 1, message = "ApprovalOrder phải >= 1")
    private Integer approvalOrder;

    @NotNull(message = "IsActive không được null")
    private Boolean isActive;

}
