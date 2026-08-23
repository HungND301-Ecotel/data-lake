---
name: deploy
description: Triển khai data-lake (postgres + backend + worker + frontend) lên máy chủ staging fullstack-server qua Docker Compose, hoặc dựng lại một dịch vụ sau khi sửa mã. Dùng khi người dùng nói "deploy", "triển khai lên server", "cập nhật server", "restart backend/worker/frontend trên server", hoặc khi cần kiểm tra tình trạng hệ thống đang chạy trên máy chủ.
---

# Triển khai lên fullstack-server

Toàn bộ hệ chạy bằng `deploy/docker-compose.yml`, mã nguồn nằm ở `~/lakehouse/`
trên máy chủ. Bốn dịch vụ, cổng cố định trong dải 50001–50010 (dải duy nhất được
mở trên tường lửa):

| Dịch vụ | Cổng ngoài | Cổng trong | Kiểm tra sống |
|---|---|---|---|
| frontend (nginx) | 50001 | **6228** | `GET /` → 200 |
| backend (Spring Boot) | 50002 | 8080, context-path `/api` | `GET /api/actuator/health` → `{"status":"UP"}` |
| worker (Flask/gunicorn) | 50003 | 2803 | `GET /health` → `status: healthy` |
| postgres | 50004 | 5432 | `pg_isready` |

Một PostgreSQL phục vụ hai database: `report` (backend) và `lakehouse` (worker).
Máy chủ đang chạy 4 hệ staging khác — đĩa ~88%, RAM còn ~5G — nên đừng thêm
dịch vụ phụ (pgadmin, MinIO) và đừng xoá network/volume của người khác.

## Kết nối

Không có `sshpass`. Dùng `SSH_ASKPASS`; mật khẩu lấy từ biến môi trường, không
viết thẳng vào lệnh:

```bash
S="<scratchpad>"; cat > "$S/askpass.sh" <<'EOF'
#!/bin/sh
echo "$DEPLOY_PW"
EOF
chmod +x "$S/askpass.sh"
export DEPLOY_PW='<mật khẩu>' SSH_ASKPASS="$S/askpass.sh" SSH_ASKPASS_REQUIRE=force
O="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PreferredAuthentications=password -o NumberOfPasswordPrompts=1"
ssh $O -p 2223 ecotel-admin@118.70.151.69 '<lệnh>' < /dev/null
```

`< /dev/null` là bắt buộc, nếu không ssh sẽ đọc stdin và treo.

## Quy trình chuẩn

1. **Đồng bộ mã** — `scp` đúng những tệp đã sửa sang `~/lakehouse/<đường dẫn>`.
   Đừng đẩy cả cây thư mục; `~/lakehouse` đã là bản sao của repo.
2. **Build ở chế độ nền.** Build backend ~4 phút, frontend ~5 phút, vượt hạn giờ
   10 phút của tool nếu chạy tiền cảnh và làm đứt kết nối giữa chừng:
   ```bash
   ssh ... 'cd ~/lakehouse/deploy && nohup docker compose build backend > /tmp/build_be.log 2>&1 & echo da-chay'
   ```
   Rồi chờ bằng một phiên riêng:
   ```bash
   ssh ... 'for i in $(seq 1 100); do pgrep -f "compose build backend" >/dev/null || break; sleep 5; done; tail -5 /tmp/build_be.log'
   ```
3. **Khởi động** — `docker compose up -d <dịch vụ>`.
4. **Xác minh** — xem mục kiểm tra bên dưới. Đừng báo xong khi chưa thấy log
   `Started BeModulApplication` / `status: healthy`.

## Kiểm tra sau khi triển khai

Chạy `curl` **từ máy của bạn**, không phải từ máy chủ: máy chủ không hairpin NAT
nên tự gọi IP công khai của nó luôn trả HTTP 000, dễ bị hiểu nhầm là hỏng.

```bash
curl -s http://118.70.151.69:50002/api/actuator/health   # {"status":"UP"}
curl -s http://118.70.151.69:50003/health                # status: healthy
curl -s -o /dev/null -w '%{http_code}\n' http://118.70.151.69:50001/
```

Trạng thái container: `docker compose ps --format "table {{.Name}}\t{{.Status}}"`.

## Cơ sở dữ liệu

Backend chạy `JPA_DDL_AUTO=validate` + Flyway. Lược đồ chỉ được đổi bằng
migration trong `be/src/main/resources/db/migration/`, **không bao giờ** để
`ddl-auto: update` sống trong cấu hình đã triển khai.

Khi Hibernate báo `Schema-validation: missing column [x] in table [y]`, nghĩa là
entity đã đi trước migration. Cách tìm chênh lệch:

1. Dump lược đồ hiện tại: `pg_dump -s -U admin -d report > /tmp/before.sql`.
2. Chạy backend một lần với `JPA_DDL_AUTO=update`, rồi dump lại thành `after.sql`.
3. So từng bảng để biết cột nào thuộc bảng nào — `diff` cả tệp sẽ trộn lẫn:
   ```bash
   for t in $(grep -oP '^CREATE TABLE public\.\K\w+' /tmp/after.sql); do
     d=$(diff <(sed -n "/^CREATE TABLE public.$t (/,/^);/p" /tmp/before.sql) \
              <(sed -n "/^CREATE TABLE public.$t (/,/^);/p" /tmp/after.sql) | grep '^>')
     [ -n "$d" ] && { echo "=== $t ==="; echo "$d"; }
   done
   ```
4. Viết `V<n>__*.sql` với `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`
   để môi trường đã từng chạy `update` vẫn áp được, rồi trả `ddl-auto` về
   `validate`.
5. Xác minh bằng cách dựng lại từ số 0 — `DROP DATABASE report; CREATE DATABASE report;`
   — chứ đừng chỉ thử trên database đã vá tay.

Worker dùng Alembic (`SCHEMA_MODE=alembic`), tự chạy khi khởi động.

## Bí mật

`deploy/.env` và `be/.env` chỉ tồn tại trên máy chủ, không nằm trong git.
`JWT_SECRET` phải giống nhau giữa backend và worker, nếu không worker sẽ từ chối
token do portal cấp. `DEV_AUTH_ENABLED` luôn là `false` trên máy chủ — bật lên là
worker tin thẳng header `X-User-Id`/`X-Roles` do người gọi tự khai.

## Những cái bẫy đã gặp

- **Cạn dải mạng Docker**: "all predefined address pools have been fully
  subnetted". Máy chủ đã có 33 network. `deploy/docker-compose.yml` vì thế khai
  báo subnet tường minh `10.200.0.0/24`. Đừng xoá network của hệ khác để lấy chỗ.
- **nginx của frontend nghe 6228**, không phải 80 — ánh xạ cổng là `50001:6228`.
  `.nginx/nginx.conf` được nạp vào container nên `root` phải là
  `/usr/share/nginx/html` và upstream phải là tên service (`backend`, `worker`),
  không phải `127.0.0.1`.
- **Biến `VITE_*` bị nướng vào bundle lúc build**, nên chúng là build-arg. Đổi
  URL backend/worker thì phải build lại frontend, restart không ăn thua.
- **Healthcheck của backend phải gồm context-path**: `/api/actuator/health`.
  Endpoint này đã được `permitAll` trong `SecurityConfig`.
- **Worker chỉ chạy 1 tiến trình gunicorn** (nhiều luồng). Vòng lặp job nằm trong
  tiến trình, nhiều worker sẽ nhân bản nó và tranh nhau lease.
- **Thiếu `OPENAI_API_KEY` không được làm sập worker.** Client OpenAI dựng lười ở
  lần dùng đầu tiên (`ocr_service`, `ai_service`, `excel_mapping_service`); chỉ
  thao tác cần AI mới hỏng, phần còn lại vẫn chạy.
- **`.env.production` trong repo thắng build-arg của Vite.** Tệp đó trỏ về cổng
  máy chủ cũ, nên bundle triển khai gọi nhầm địa chỉ dù compose truyền đúng
  `VITE_API`. Dockerfile của frontend vì thế ghi đè tệp này từ build-arg.
  `VITE_API` phải gồm cả `/api` — `axiosClient` lấy thẳng nó làm `baseURL`.
- **`axiosDataLakeClient` vẫn hardcode `118.70.151.69:1313`** — dịch vụ cũ,
  không nằm trong cụm này. Các màn hình `/datalake/*` phụ thuộc nó.

## Chụp ảnh màn hình để làm báo cáo

`docs/Bao_cao_chay_thu_Lakehouse.docx` dựng bằng Playwright + python-docx chạy
trong Docker. Kịch bản nằm ở thư mục scratchpad của phiên, gồm:

- `gieo*.py` — bơm dữ liệu mẫu **qua HTTP như người dùng thường**, không ghi
  thẳng vào cơ sở dữ liệu. Nhờ vậy chỗ nào bị chính sách chặn thì hiện ra thật.
- `chup.py` — đăng nhập qua chính màn hình đăng nhập rồi chụp từng route. Vài
  màn hình chỉ có nội dung sau một thao tác (ô tìm kiếm), khai trong
  `routes.json` ở khoá `hanh_dong`.
- `dung_docx.py` — gom lại thành tài liệu, mỗi module một mục.

Ảnh chứa dữ liệu công ty nên đừng đưa lên dịch vụ bên ngoài.

Vài điểm khi dựng lại:

- Ảnh `mcr.microsoft.com/playwright/python` có sẵn trình duyệt nhưng **thiếu gói
  `playwright`** — phải `pip install` thêm.
- Ant Design để nền cao bằng màn hình dù nội dung ngắn, nên `full_page=True` cho
  ra một dải trắng dài. Đo đáy thật bằng cách lấy `getBoundingClientRect` của
  các phần tử lá có nội dung rồi `clip` theo đó.
- Nhãn bảo mật và dataset hiển thị theo `clearance_level` của người đăng nhập.
  Tài khoản seed `admin` có mức 0 nên chỉ thấy nhãn PUBLIC — không phải lỗi.
- Bốn mắt cần hai chủ thể khác nhau. Tạo tài khoản dịch vụ qua
  `POST /iam/service-accounts` rồi lấy token qua `POST /iam/auth/token` để đóng
  vai người duyệt thứ hai.
- Dataset Gold không công bố được nếu chưa có dòng dữ liệu thật: luật chất lượng
  trả `UNKNOWN` ("không có dòng nào để đánh giá") chứ không tự coi là đạt.
  Dataset Silver thì công bố thẳng, dùng nó khi cần một bản PUBLISHED để minh hoạ.
