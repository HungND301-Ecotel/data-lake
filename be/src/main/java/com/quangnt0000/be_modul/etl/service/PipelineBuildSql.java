package com.quangnt0000.be_modul.etl.service;

import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.etl.entity.PipelineTaskConfigEntity;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PipelineBuildSql {

    public String build(PipelineTaskConfigEntity config) {
        return switch (config.getTargetTable()) {

            // --- NHÓM A: Danh mục nhỏ, Full-load ---
            case "dm_ca" -> buildDMCa();
            //
            case "dm_cvu" -> buildDMCVu();
            case "dm_cong" -> buildDMCong();
            case "dm_vitri" -> buildDMViTri();
            case "dm_xe" -> buildDMXe();
            case "dm_bep" -> buildDMBep();
            case "dm_congviec" -> buildDMCongViec();

            // --- NHÓM B: Danh mục Incremental (Dùng 1 dấu ?) ---
            case "dm_cbcnv" -> buildDMCBCNV();
            case "dm_pban" -> buildDMPBan();
            case "dm_nhom_pban" -> buildDMNhomPBan();
            case "dm_nhom_cvu" -> buildDMNhomCVu();

            // --- NHÓM D: Chứng từ Header + Chi tiết ---
            // 1. Task LSX
            case "lsx" -> buildLSX();
            case "lsx_ct" -> buildLSXCT();
            case "lsx_nghi" -> buildLSXNghi();

            // 2. Task LENH
            case "lenh" -> buildLenh();
            case "lenh_ct" -> buildLenhCT();
            case "lenh_ctcbcnv" -> buildLenhCTCBCNV();

            // 3. Task BCSC
            case "bcsc" -> buildBCSC();
            case "bcsc_nghi" -> buildBCSCNghi();

            // DB Vật tư
            case "vthh" -> buildVTHHView();
            case "dm_dtpn" -> buildDMDTPN();
            case "dm_ptnx" -> buildDMPTNX();

            case "dm_nhom_dtpn" -> buildDMNhomDTPN();
            case "dm_nhom_ptnx" -> buildDMNhomPTNX();
            case "dm_nhom_vthh" -> buildDMNhomVTHH();
            case "dm_nhom_vthh4" -> buildDMNhomVTHH4();

            default -> throw new IllegalArgumentException("Pipeline not found for table: " + config.getTargetTable());
        };
    }

    // =========================================================================
    // NHÓM A & C (FULL LOAD)
    // =========================================================================
    private String buildDMCa() {
        return "SELECT * FROM dbo.DM_CA WHERE USER_TIME > ?";
    }

    private String buildDMCVu() {
        return "SELECT * FROM dbo.DM_CVU WHERE USER_TIME > ?";
    }

    private String buildDMCong() {
        return "SELECT * FROM dbo.DM_CONG WHERE USER_TIME > ?";
    }

    private String buildDMViTri() {
        return "SELECT * FROM dbo.DM_VITRI WHERE USER_TIME > ?";
    }

    private String buildDMXe() {
        return "SELECT * FROM dbo.DM_XE WHERE USER_TIME > ?";
    }

    private String buildDMBep() {
        return "SELECT * FROM dbo.DM_BEP WHERE USER_TIME > ?";
    }

    private String buildDMCongViec() {
        return "SELECT * FROM dbo.DM_CONG_VIEC WHERE USER_TIME > ?";
    }

    // VÂT TƯ
    private String buildDMNhomDTPN() {
        return "SELECT * FROM dbo.DM_NHOM_DTPN";
    }

    private String buildDMNhomPTNX() {
        return "SELECT * FROM dbo.DM_NHOM_PTNX";
    }

    private String buildDMNhomVTHH() {
        return "SELECT * FROM dbo.DM_NHOM_VTHH";
    }

    private String buildDMNhomVTHH4() {
        return "SELECT * FROM dbo.DM_NHOM_VTHH4";
    }

    // =========================================================================
    // NHÓM B (INCREMENTAL)
    // Note: Không cần truyền object config vào nữa vì ta dùng dấu '?' an toàn cho
    // NiFi
    // =========================================================================
    private String buildDMCBCNV() {
        return """
                SELECT
                    MA_CBCNV,
                    TEN_CBCNV,
                    MA_NHOM_CBCNV,
                    DIA_CHI,
                    MA_PBAN,
                    MA_CVU,
                    MA_CONG_VIEC,
                    USER_TIME,
                    ACTIVE
                    FROM dbo.DM_CBCNV WHERE USER_TIME > ?
                    """;
    }

    private String buildDMPBan() {
        return "SELECT * FROM dbo.DM_PBAN WHERE USER_TIME > ?";
    }

    private String buildDMNhomPBan() {
        return "SELECT * FROM dbo.DM_NHOM_PBAN WHERE USER_TIME > ?";
    }

    private String buildDMNhomCVu() {
        return "SELECT * FROM dbo.DM_NHOM_CVU WHERE USER_TIME > ?";
    }

    // =========================================================================
    // NHÓM D (CHỨNG TỪ + CHI TIẾT)
    // =========================================================================

    // --- 1. TASK LSX ---
    private String buildLSX() {
        return """
                SELECT PR_KEY, TRAN_ID, NGAY_VAO_SO, SO_CTU, TEN_LSX, CAN_CU,
                       MA_NHOM_LSX, MA_DON_VI,
                       MA_CA, MA_PBAN, MA_TO, USER_TIME
                FROM dbo.LSX
                WHERE USER_TIME > ?
                """;
    }

    private String buildLSXCT() {
        return """
                SELECT
                    ct.PR_KEY,
                    ct.FR_KEY,
                    ct.LIST_ORDER,
                    ct.TT,
                    ct.MA_CBCNV,
                    ct.MA_CVU,
                    ct.MA_CONG_VIEC,
                    ct.MA_NOIDUNG,
                    ct.MA_VITRI,
                    ct.MA_XE,
                    ct.MA_CA,
                    ct.MA_PBAN,
                    ct.MA_TO,
                    l.USER_TIME
                FROM dbo.LSX_CT ct
                JOIN dbo.LSX l ON ct.FR_KEY = l.PR_KEY
                WHERE l.USER_TIME > ?
                                                """;
    }

    // --- 2. TASK LENH ---
    private String buildLenh() {
        return """
                SELECT PR_KEY, TRAN_ID, NGAY_VAO_SO, SO_CTU, CA, CAN_CU, MA_NHOM_LSX, DIEN_GIAI,
                       MA_NGIAO, NGUOI_GIAO, NGUOI_NHAN, USER_ID, USER_TIME, MA_CA, MA_PBAN, MA_TO
                FROM dbo.LENH
                WHERE USER_TIME > ?
                """;
    }

    private String buildLenhCT() {
        return """
                SELECT
                    ct.PR_KEY,
                    ct.FR_KEY,
                    ct.MA_NCV,
                    ct.MA_CONG_VIEC,
                    ct.MA_NOIDUNG,
                    l.USER_TIME
                FROM dbo.LENH_CT ct
                JOIN dbo.LENH l ON ct.FR_KEY = l.PR_KEY
                WHERE l.USER_TIME > ?
                                                """;
    }

    private String buildLenhCTCBCNV() {
        return """
                SELECT
                    cb.PR_KEY,
                    cb.FR_KEY,
                    cb.MA_CBCNV,
                    cb.MA_CVU,
                    cb.MA_VITRI,
                    cb.MA_BEP,
                    cb.MA_ANCA,
                    cb.MA_XE,
                    cb.MA_CA,
                    cb.MA_PBAN,
                    cb.MA_TO,
                    l.USER_TIME
                FROM dbo.LENH_CTCBCNV cb
                JOIN dbo.LENH_CT ct ON cb.FR_KEY = ct.PR_KEY
                JOIN dbo.LENH l      ON ct.FR_KEY = l.PR_KEY
                WHERE l.USER_TIME > ?
                                                """;
    }

    // --- 3. TASK BCSC ---
    private String buildBCSC() {
        return """
                SELECT PR_KEY, TRAN_ID, NGAY_VAO_SO, SO_CTU, MA_PBAN, MA_CA, DIEN_GIAI,
                       MA_DON_VI, USER_ID, USER_TIME, MA_CBCNV_TRUC, MA_TO
                FROM dbo.BCSC
                WHERE USER_TIME > ?
                """;
    }

    private String buildBCSCNghi() {
        return """
                SELECT
                    ng.PR_KEY,
                    ng.FR_KEY,
                    ng.LIST_ORDER,
                    ng.MA_CBCNV,
                    ng.MA_CVU,
                    ng.MA_CONG,
                    ng.MA_TO,
                    ng.MA_ANCA,
                    b.USER_TIME
                FROM dbo.BCSC_NGHI ng
                JOIN dbo.BCSC b ON ng.FR_KEY = b.PR_KEY
                WHERE b.USER_TIME > ?
                                                """;
    }

    private String buildLSXNghi() {
        return """
                SELECT
                    ng.PR_KEY,
                    ng.FR_KEY,
                    ng.LIST_ORDER,
                    ng.MA_CBCNV,
                    ng.MA_CVU,
                    ng.MA_CONG,
                    ng.MA_TO
                FROM dbo.LSX_NGHI ng
                                                """;
    }

    // kế toán vật tư
    private String buildVTHHView() {
        return """
                                SELECT
                    MA_DON_VI,
                    NGAY_VAO_SO,
                    NGAY_CTU,
                    MA_VTHH1,
                    TEN_VTHH1,
                    TEN_DVT,
                    MA_PTNX,
                    MA_DTPN,
                    MA_NHOM_DTPN,
                    TRAN_CLASS,
                    SO_LUONG_BC,
                    PR_KEY,
                    TEN_VTHH,
                    MA_LOAI_DTPN,
                    USER_TIME,
                    MA_NHOM_VTHH,
                    TEN_NHOM_VTHH,
                    MA_VTHH
                FROM dbo.VTHH_VIEW;
                                                """;
    }

    private String buildDMPTNX() {
        return """
                SELECT
                    MA_PTNX,
                    TEN_PTNX,
                    NHAP_XUAT,
                    TRAN_ID,
                    ACTIVE,
                    MA_DON_VI,
                    MA_NHOM_PTNX,
                    USER_TIME
                FROM dbo.DM_PTNX
                                """;
    }

    private String buildDMDTPN() {
        return """
                SELECT
                    MA_DTPN,
                    TEN_DTPN,
                    MA_LOAI_DTPN,
                    MA_NHOM_DTPN,
                    USER_TIME
                FROM dbo.DM_DTPN
                                """;
    }
}
