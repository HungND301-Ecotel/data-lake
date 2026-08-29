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