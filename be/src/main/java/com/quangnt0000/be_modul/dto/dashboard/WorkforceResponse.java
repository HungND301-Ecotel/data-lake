package com.quangnt0000.be_modul.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkforceResponse {
    private String departmentCode;
    private String departmentName;
    private String departmentGroupCode;     // mã nhóm phòng ban
    private String departmentGroupName;    // tên nhóm phòng ban
    private String shiftCode;           // có thể null nếu PX không có dữ liệu ngày đó
    private String shiftName;
 
    // Tổng biên chế
     private int totalHeadcount;
 
    // Nhóm 1: Nhân lực đi làm trong ngày
    private int totalWorking;
    private int undergroundWorkers;   // Thợ lò
    private int electricalAndOtherWorkers;     // Cơ điện + Công nhân khác
    private int managementAndSupport;     // Chỉ huy, phục vụ 
 
    // Nhóm 2: Nhân lực vắng mặt trong ngày
    private int totalAbsent;
    private int sickLeave;    // Ốm
    private int annualLeave;    // Phép
    private int maternityLeave;  // Tự túc (theo mã nghiệp vụ TTUC)
    private int meetingAndTraining;    // H (hội họp/học...)
     private int unauthorizedAbsence;    //Vắng không lý do (VO)
 
    private int undergroundWorkersAbsent; // thợ lò vắng trong ngày
}
