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