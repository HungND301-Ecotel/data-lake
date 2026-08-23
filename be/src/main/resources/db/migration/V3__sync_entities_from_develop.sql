-- V1 chụp lược đồ tại thời điểm chuyển sang Flyway. Sau đó nhánh develop còn
-- đi tiếp 195 commit và bổ sung thêm entity, nên Hibernate `validate` báo thiếu
-- cột ngay khi khởi động: "missing column [parent_id] in table [department]".
--
-- Migration này đưa lược đồ bắt kịp các entity hiện có. Nội dung lấy từ chênh
-- lệch giữa lược đồ do V1+V2 dựng và lược đồ Hibernate tự tạo từ entity, nên nó
-- mô tả đúng những gì mã nguồn đang cần — không thêm không bớt.
--
-- Tất cả đều dùng IF NOT EXISTS: môi trường nào đã chạy `ddl-auto: update` từ
-- trước thì migration này thành không-thao-tác thay vì hỏng.

-- ---------------------------------------------------------------- department
ALTER TABLE department ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6);
ALTER TABLE department ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255);

-- -------------------------------------------------------------- ware_category
ALTER TABLE ware_category ADD COLUMN IF NOT EXISTS department_id VARCHAR(255);
ALTER TABLE ware_category ADD COLUMN IF NOT EXISTS report_type VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ware_category_report_type_check'
    ) THEN
        ALTER TABLE ware_category
            ADD CONSTRAINT ware_category_report_type_check
            CHECK (report_type IS NULL OR report_type IN ('Noi_Bo', 'Tap_Doan'));
    END IF;
END $$;

-- --------------------------------------------------------------- ware_mapping
ALTER TABLE ware_mapping ADD COLUMN IF NOT EXISTS ware_template_id INTEGER;
ALTER TABLE ware_mapping ADD COLUMN IF NOT EXISTS aggregate_type VARCHAR(255);
ALTER TABLE ware_mapping ADD COLUMN IF NOT EXISTS is_summable BOOLEAN;
ALTER TABLE ware_mapping ADD COLUMN IF NOT EXISTS role VARCHAR(255);

-- --------------------------------------------------------- target, chỉ tiêu
CREATE TABLE IF NOT EXISTS target (
    id            VARCHAR(255) NOT NULL,
    code          VARCHAR(255),
    deleted       BOOLEAN,
    month         INTEGER,
    name          VARCHAR(255),
    parent_id     VARCHAR(255),
    unit          VARCHAR(255),
    value         NUMERIC(38, 2),
    department_id VARCHAR(255),
    CONSTRAINT target_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS target_report (
    id                    VARCHAR(255) NOT NULL,
    date                  DATE,
    deleted               BOOLEAN,
    done_percent          NUMERIC(38, 2),
    month_ly_cumulative   NUMERIC(38, 2),
    perform_done          NUMERIC(38, 2),
    production_date       DATE,
    production_order_id   INTEGER,
    shift_done            INTEGER,
    shift_plus            INTEGER,
    shift_remain          INTEGER,
    target_per_day        NUMERIC(38, 2),
    target_per_day_remain NUMERIC(38, 2),
    total_days            INTEGER,
    target_id             VARCHAR(255),
    CONSTRAINT target_report_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'target_department_fk'
    ) THEN
        ALTER TABLE target
            ADD CONSTRAINT target_department_fk
            FOREIGN KEY (department_id) REFERENCES department (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'target_report_target_fk'
    ) THEN
        ALTER TABLE target_report
            ADD CONSTRAINT target_report_target_fk
            FOREIGN KEY (target_id) REFERENCES target (id);
    END IF;
END $$;
