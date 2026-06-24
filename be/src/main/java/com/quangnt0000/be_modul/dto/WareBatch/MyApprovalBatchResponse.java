package com.quangnt0000.be_modul.dto.WareBatch;

import com.quangnt0000.be_modul.enums.WareBatchEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO cho màn hình "Danh sách WareBatch của người duyệt"
 * Chứa đầy đủ context để FE quyết định hiển thị và action
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MyApprovalBatchResponse {
    
    // Batch info
    private Integer batchId;
    private String batchCode;
    private String batchName;
    private String batchDescription;
    private LocalDateTime createdAt;
    private String tableCode;
    private String reportName;

    // Thời gian báo cáo
    private Integer reportYear;
    private Integer reportMonth;
    private Integer reportDay;

    // Trạng thái batch
    private WareBatchEnum batchStatus;

    // Approval context của user hiện tại
    private Integer myApprovalId;
    private WareBatchEnum myApprovalStatus;
    private Integer myApprovalOrder;
    private Integer currentApprovalOrder;

    // Quyết định action
    private Boolean canApprove;
    
    // Push status
    private Boolean isPushed;
}
