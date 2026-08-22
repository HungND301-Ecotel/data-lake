-- Nhật ký kiểm toán chỉ được ghi thêm - tài liệu mục 9.3.
--
-- "Audit storage append-only; application account không có quyền update/delete."
--
-- Trigger là cách thực thi được ngay cả khi ứng dụng dùng chung tài khoản
-- superuser với migration. Ở môi trường thật nên làm thêm lớp phân quyền: tạo
-- vai trò riêng cho ứng dụng và REVOKE UPDATE, DELETE trên hai bảng này (xem
-- phần cuối file).

CREATE OR REPLACE FUNCTION public.audit_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Bảng % chỉ cho phép ghi thêm (tài liệu mục 9.3)', TG_TABLE_NAME
        USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- Chỉ áp cho bảng audit của portal. Bảng audit của worker nằm ở cơ sở dữ liệu
-- riêng và được xử lý bằng migration Alembic tương ứng.
DROP TRIGGER IF EXISTS trg_iam_auth_audit_append_only ON public.iam_auth_audit_event;

CREATE TRIGGER trg_iam_auth_audit_append_only
    BEFORE UPDATE OR DELETE ON public.iam_auth_audit_event
    FOR EACH ROW EXECUTE FUNCTION public.audit_append_only();

-- Ghi chú vận hành: khi tách tài khoản ứng dụng khỏi tài khoản chạy migration,
-- chạy thêm các lệnh sau bằng tài khoản sở hữu bảng.
--
--   REVOKE UPDATE, DELETE ON public.iam_auth_audit_event FROM <app_role>;
--   GRANT  INSERT, SELECT ON public.iam_auth_audit_event TO   <app_role>;
