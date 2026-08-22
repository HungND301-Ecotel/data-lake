# Migration lược đồ cơ sở dữ liệu

Từ 20/08/2026, lược đồ của cả hai hệ được quản lý bằng migration có phiên bản.
Trước đó backend dùng `ddl-auto: update` và worker dùng `create_all` — cả hai đều
tự sửa schema theo entity, không có đường lùi và không kiểm soát được thay đổi
phá vỡ. Tài liệu giải pháp mục 10 yêu cầu "migration versioned; runbook;
rollback".

| Hệ | Công cụ | Thư mục |
|---|---|---|
| Backend (`be`) | Flyway | `src/main/resources/db/migration/` |
| Worker (`ai_worker_lake_house`) | Alembic | `migrations/versions/` |

---

## Backend — Flyway

### Cách hoạt động

- `V1__baseline_schema.sql` là ảnh chụp lược đồ do Hibernate tạo ra trước đây,
  sinh bằng `pg_dump --schema-only` (46 bảng).
- `V2__audit_append_only.sql` gắn trigger chặn UPDATE/DELETE trên bảng
  `iam_auth_audit_event` (mục 9.3).
- Hibernate chạy ở `ddl-auto: validate`: nó **không** sửa schema nữa, chỉ đối
  chiếu entity với bảng và làm ứng dụng chết ngay nếu lệch. Đây là điều mong
  muốn — lệch schema phải lộ ra lúc khởi động, không phải lúc chạy nghiệp vụ.

### Cơ sở dữ liệu đang chạy

`baseline-on-migrate: true` và `baseline-version: 1` khiến database đã có sẵn
bảng được đánh mốc sang phiên bản 1 mà không chạy lại `V1`. Lần deploy đầu tiên
sau thay đổi này chỉ áp `V2`.

Database rỗng thì Flyway dựng toàn bộ từ `V1` rồi `V2`.

### Thêm thay đổi mới

```bash
# Đặt tên theo thứ tự tăng dần, không sửa file đã chạy.
be/src/main/resources/db/migration/V3__them_cot_abc.sql
```

Quy tắc:

1. **Không bao giờ sửa một migration đã chạy.** `validate-on-migrate: true` sẽ
   phát hiện checksum lệch và chặn khởi động. Muốn đổi thì viết file mới.
2. Sửa entity JPA **và** viết migration tương ứng trong cùng một commit; nếu
   thiếu một trong hai, `validate` sẽ báo lỗi khi khởi động.
3. Thay đổi phá vỡ (đổi tên, xoá cột) cần hai bước qua hai lần phát hành: thêm
   cái mới → chuyển dữ liệu → bỏ cái cũ.

### Biến môi trường

| Biến | Mặc định | Dùng khi |
|---|---|---|
| `FLYWAY_ENABLED` | `true` | Đặt `false` khi schema do đội DBA quản lý ngoài |
| `JPA_DDL_AUTO` | `validate` | Chỉ đổi tạm khi gỡ lỗi, không dùng ở môi trường thật |

### Sinh lại baseline (chỉ khi cần)

```bash
# Chạy ứng dụng với JPA_DDL_AUTO=update FLYWAY_ENABLED=false trên DB rỗng,
# rồi dump lược đồ và dọn thành file migration.
docker exec <postgres> pg_dump -U <user> -d <db> --schema-only --no-owner \
  --no-privileges --no-comments > target/baseline_raw.sql
node be/tools/clean_baseline.js target/baseline_raw.sql \
  be/src/main/resources/db/migration/V1__baseline_schema.sql
```

---

## Worker — Alembic

### Cách hoạt động

- `app/db/session.py` gọi `alembic upgrade head` khi khởi động, nên container
  chạy lên là schema đã đúng phiên bản.
- `migrations/env.py` lấy URL và metadata từ chính ứng dụng, nên migration
  không thể trỏ nhầm cơ sở dữ liệu so với app.
- `render_as_batch` bật khi dùng SQLite: SQLite không ALTER được nhiều thứ,
  batch mode dựng lại bảng nên cùng một migration chạy được trên cả SQLite lẫn
  PostgreSQL.

### Thêm thay đổi mới

```bash
cd ai_worker_lake_house
alembic revision --autogenerate -m "mo ta ngan"
# Đọc lại file sinh ra trước khi commit: autogenerate không đoán được ý định
# đổi tên cột, nó sẽ hiểu thành xoá cột cũ và thêm cột mới.
alembic upgrade head
```

Nếu máy không có Python:

```bash
docker run --rm -v "$PWD:/app" -w /app -e "DATABASE_URL=sqlite:////tmp/gen.db" \
  lakehouse-smoke alembic revision --autogenerate -m "mo ta ngan"
```

### Biến môi trường

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `SCHEMA_MODE` | `alembic` | `create_all` chỉ để chữa cháy; nó không sửa được bảng đã có |

### Cơ sở dữ liệu đang chạy

Database đã có bảng do `create_all` tạo trước đây cần được đánh mốc một lần,
nếu không Alembic sẽ cố tạo lại bảng và lỗi:

```bash
alembic stamp head
```

---

## Kiểm chứng

```bash
# Worker: migration dựng đủ bảng và chạy lại không đổi gì
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/check_migrations.py

# Backend: khởi động trên DB rỗng phải thấy Flyway áp đủ migration rồi mới tới JPA
docker logs <container> | grep -i "Successfully applied"
```

## Một cái bẫy đã gặp

`spring.jpa.defer-datasource-initialization: true` khiến Spring Boot bắt Flyway
**chờ** EntityManagerFactory — đúng ý nghĩa của nó khi Hibernate là bên tạo
schema, nhưng sai hoàn toàn khi Flyway mới là bên tạo. Kết quả là phụ thuộc
vòng giữa `flywayInitializer` và `entityManagerFactory`. Cấu hình này đã được
đặt về `false`; đừng bật lại.
