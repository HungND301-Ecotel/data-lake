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