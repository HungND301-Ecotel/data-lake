SELECT PR_KEY, TRAN_ID, NGAY_VAO_SO, SO_CTU, MA_PBAN, MA_CA, DIEN_GIAI,
                       MA_DON_VI, USER_ID, USER_TIME, MA_CBCNV_TRUC, MA_TO
                FROM dbo.BCSC
                WHERE USER_TIME > ?