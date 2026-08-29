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