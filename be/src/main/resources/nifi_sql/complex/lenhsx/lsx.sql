SELECT PR_KEY, TRAN_ID, NGAY_VAO_SO, SO_CTU, TEN_LSX, CAN_CU,
                       MA_NHOM_LSX, MA_DON_VI,
                       MA_CA, MA_PBAN, MA_TO, USER_TIME
                FROM dbo.LSX
                WHERE USER_TIME > ?