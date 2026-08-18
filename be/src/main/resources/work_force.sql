WITH BIEN_CHE AS (
    SELECT MA_PBAN, COUNT(*) AS TONG_NHAN_LUC
    FROM staging_lenhsx.DM_CBCNV
    WHERE ACTIVE = true
    GROUP BY MA_PBAN
),
DI_LAM AS (
    SELECT
        v.MA_PBAN,
        v.MA_CA,
        v.MA_CBCNV,
        cvu.MA_NHOM_CVU
    FROM staging_lenhsx.LENHSX_VIEW v
    LEFT JOIN staging_lenhsx.DM_CVU cvu ON cvu.MA_CVU = v.MA_CVU
    WHERE CAST(v.NGAY_VAO_SO AS DATE) = :ngayBaoCao
    GROUP BY v.MA_PBAN, v.MA_CA, v.MA_CBCNV, cvu.MA_NHOM_CVU
),
DI_LAM_TONG_HOP AS (
    SELECT
        MA_PBAN,
        MA_CA,
        COUNT(DISTINCT MA_CBCNV) AS TONG_DI_LAM,
        COUNT(DISTINCT CASE WHEN MA_NHOM_CVU = '02' THEN MA_CBCNV END) AS TLO_DI_LAM,
        COUNT(DISTINCT CASE WHEN MA_NHOM_CVU IN ('03','04') THEN MA_CBCNV END) AS CODIEN,
        COUNT(DISTINCT CASE WHEN MA_NHOM_CVU = '05' THEN MA_CBCNV END) AS QLY_PVU
    FROM DI_LAM
    GROUP BY MA_PBAN, MA_CA
),
-- VANG_MAT: gộp TẤT CẢ nguồn vắng mặt (BCSC_NGHI + LSX_NGHI), join mapping để
-- chuẩn hóa mã về 5 loại chuẩn. Mã KHÔNG có trong mapping vẫn có mặt ở đây
-- (loai_chuan_hoa sẽ là NULL) - vẫn được COUNT vào TONG_VANG bình thường.
VANG_MAT AS (
    SELECT b.MA_PBAN, b.MA_CA, b.MA_CBCNV, cvu.MA_NHOM_CVU, m.loai_chuan_hoa AS MA_CONG_CHUAN
    FROM staging_lenhsx.BCSC_NGHI_VIEW b
    LEFT JOIN staging_lenhsx.DM_CVU cvu
           ON cvu.MA_CVU = b.MA_CVU
    LEFT JOIN staging_common.ma_cong_mapping m
           ON m.source_view = 'BCSC_NGHI_VIEW' AND m.ma_cong_goc = b.MA_CONG
    WHERE CAST(b.NGAY_VAO_SO AS DATE) = :ngayBaoCao

    UNION

    SELECT l.MA_PBAN, l.MA_CA, l.MA_CBCNV,
           cvu.MA_NHOM_CVU,
           m.loai_chuan_hoa AS MA_CONG_CHUAN
    FROM staging_lenhsx.LSX_NGHI_VIEW l
    LEFT JOIN staging_lenhsx.DM_CVU cvu
           ON cvu.MA_CVU = l.MA_CVU
    LEFT JOIN staging_common.ma_cong_mapping m
           ON m.source_view = 'LSX_NGHI_VIEW' AND m.ma_cong_goc = l.MA_CONG
    WHERE CAST(l.NGAY_VAO_SO AS DATE) = :ngayBaoCao
),
VANG_MAT_TONG_HOP AS (
    SELECT
        MA_PBAN,
        MA_CA,
        COUNT(DISTINCT MA_CBCNV) AS TONG_VANG,   -- đếm TẤT CẢ, không lọc mã
        COUNT(DISTINCT CASE WHEN MA_CONG_CHUAN = 'O'   THEN MA_CBCNV END) AS O,
        COUNT(DISTINCT CASE WHEN MA_CONG_CHUAN = 'P'   THEN MA_CBCNV END) AS P,
        COUNT(DISTINCT CASE WHEN MA_CONG_CHUAN = 'TT' THEN MA_CBCNV END) AS TT,
        COUNT(DISTINCT CASE WHEN MA_CONG_CHUAN = 'H'   THEN MA_CBCNV END) AS H,
        COUNT(DISTINCT CASE WHEN MA_CONG_CHUAN = 'V'   THEN MA_CBCNV END) AS V,
        COUNT(DISTINCT CASE WHEN MA_NHOM_CVU = '02'     THEN MA_CBCNV END) AS TLO_VANG_TRONG_NGAY  
    FROM VANG_MAT
    GROUP BY MA_PBAN, MA_CA
),
DANH_SACH_CA AS (
    SELECT DISTINCT MA_PBAN, MA_CA FROM DI_LAM_TONG_HOP
    UNION
    SELECT DISTINCT MA_PBAN, MA_CA FROM VANG_MAT_TONG_HOP
)
SELECT
    p.MA_PBAN,
    p.TEN_PBAN,
    p.MA_NHOM_PBAN,
    np.TEN_NHOM_PBAN,
    n.MA_CA,
    ca.TEN_CA,
    COALESCE(bc.TONG_NHAN_LUC,0)   AS TONG_NHAN_LUC,
    COALESCE(d.TONG_DI_LAM, 0)      AS TONG_DI_LAM,
    COALESCE(d.TLO_DI_LAM, 0)       AS TLO_DI_LAM,
    COALESCE(d.CODIEN, 0)           AS CODIEN,
    COALESCE(d.QLY_PVU, 0)          AS QLY_PVU,
    COALESCE(v.TONG_VANG, 0)        AS TONG_VANG,
    COALESCE(v.O, 0)   AS OM,
    COALESCE(v.P, 0)   AS PHEP,
    COALESCE(v.TT, 0) AS TU_TUC,
    COALESCE(v.H, 0)   AS HOI_HOP,
    COALESCE(v.V, 0)   AS VANG,
    COALESCE(v.TLO_VANG_TRONG_NGAY, 0) AS TLO_VANG_TRONG_NGAY
FROM staging_lenhsx.DM_PBAN p
LEFT JOIN staging_lenhsx.DM_NHOM_PBAN np ON np.MA_NHOM_PBAN = p.MA_NHOM_PBAN
LEFT JOIN staging_common.nhom_pban_config nc ON nc.ma_nhom_pban = p.MA_NHOM_PBAN
LEFT JOIN BIEN_CHE bc         ON bc.MA_PBAN = p.MA_PBAN
LEFT JOIN DANH_SACH_CA n      ON n.MA_PBAN = p.MA_PBAN
LEFT JOIN DI_LAM_TONG_HOP d   ON d.MA_PBAN = n.MA_PBAN AND d.MA_CA = n.MA_CA
LEFT JOIN VANG_MAT_TONG_HOP v ON v.MA_PBAN = n.MA_PBAN AND v.MA_CA = n.MA_CA
LEFT JOIN staging_lenhsx.DM_CA ca        ON ca.MA_CA = n.MA_CA
WHERE p.ACTIVE = true AND COALESCE(nc.loai_tru_bao_cao, false) = false
ORDER BY p.MA_NHOM_PBAN, p.MA_PBAN, n.MA_CA;

