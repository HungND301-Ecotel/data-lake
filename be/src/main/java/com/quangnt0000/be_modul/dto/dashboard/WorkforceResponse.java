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
    private String maPban;
    private String tenPban;
    private String maNhomPban;     // I, II, III... (khối trực tiếp, gián tiếp...)
    private String tenNhomPban;    // Khối trực tiếp, Khối phục vụ...
    private String maCa;           // có thể null nếu PX không có dữ liệu ngày đó
    private String tenCa;
 
    // Tổng biên chế
    private int tongNhanLuc;
 
    // Nhóm 1: Nhân lực đi làm trong ngày
    private int tongDiLam;
    private int thoLoDiLam;   // Thợ lò (MA_NHOM_CVU = 02)
    private int coDien;     // Cơ điện + Công nhân khác (MA_NHOM_CVU = 03, 04)
    private int qlyPhongVu;     // Chỉ huy, phục vụ (MA_NHOM_CVU = 05)
 
    // Nhóm 2: Nhân lực vắng mặt trong ngày
    private int tongVangMat;
    private int om;    // Ốm
    private int phep;    // Phép
    private int ttuc;  // Thai sản / TT.ức (theo mã nghiệp vụ TTUC)
    private int h2;    // H2 (hội họp/học...)
    private int vang;    // Vô kỷ luật / vắng không lý do (VO)
 
    private int thoLoVangTrongNgay;
}
