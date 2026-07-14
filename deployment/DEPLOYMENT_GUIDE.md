# TÀI LIỆU HƯỚNG DẪN DEPLOY DỰ ÁN DATA LAKE (MULTI-TENANT)

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) hệ thống báo cáo Data Lake hỗ trợ đa khách hàng (Multi-Tenant). Dành cho các lập trình viên mới, quản trị viên hệ thống (DevOps) để nắm bắt kiến trúc và các bước vận hành.

---

## I. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI

Hệ thống Data Lake được thiết kế chạy dưới hai hình thức chính tùy theo hạ tầng của từng khách hàng (Tenant):
1. **Triển khai qua Docker (Staging & Production phần lớn các bên):** Sử dụng các container Docker riêng biệt cho từng Tenant để cô lập tài nguyên, mạng và cơ sở dữ liệu.
2. **Triển khai Bare-Metal (Uông Bí):** Cài đặt và chạy trực tiếp file JAR (Backend) và các tệp tĩnh Nginx (Frontend) trực tiếp trên Hệ điều hành VPS.

### Sơ đồ định tuyến trong Docker (Ví dụ: cổng 1144 của Servertest)
```mermaid
graph TD
    User([Trình duyệt Người dùng]) -->|HTTP Port 1144| RP[Reverse Proxy Nginx Container]
    
    subgraph Docker Internal Network (backnet / frontnet)
        RP -->|/| FE[Frontend Nginx Container - Port 6228]
        RP -->|/api/| BE[Backend Tomcat Container - Port 8080]
        BE -->|Kết nối CSDL| PG[(PostgreSQL Container - Port 5432)]
    end
```

---

## II. DANH SÁCH CÁC TRƯỜNG HỢP DEPLOY

Dự án hiện có các môi trường triển khai sau:
* **Staging (Môi trường thử nghiệm):** Tự động qua CI/CD GitHub Actions khi push code lên nhánh `dev/main` (hoặc trigger thủ công qua workflow "Deploy Staging").
* **Release (Môi trường chạy thực tế - Production):** Trigger thủ công qua workflow "Deploy Release" trên GitHub Actions.
* **Bare-Metal:** Deploy thủ công trực tiếp trên VPS đối với các đơn vị đặc thù (Uông Bí).

---

## III. HƯỚNG DẪN DEPLOY QUA DOCKER COMPOSE (CI/CD TỰ ĐỘNG)

Môi trường Docker Compose áp dụng cho các bên như: `servertest`, `servertest2`, `deonaicocsau`, `maokhe`, `nammau`, `caoson`, `mongduong`...

### 1. Quy trình Deploy LẦN ĐẦU TIÊN (Setup Môi Trường Mới)

Khi cấu hình một Tenant mới (ví dụ: `newtenant`), hãy làm theo các bước chuẩn bị sau:

#### **Bước 1: Cấu hình biến môi trường cục bộ**
1. **Tạo cấu hình giao diện FE:** Tạo file `fe-modul-report/tenants/newtenant.env` để thiết lập màu sắc, logo, hotline của tenant đó.
2. **Tạo cấu hình deploy:** Tạo file `deployment/tenants/newtenant/.env` để định cấu hình port cho proxy, pgadmin và đường dẫn lưu CSDL trên ổ cứng VPS.
   * *Ví dụ:*
     ```properties
     TENANT=newtenant
     REGISTRY=hungnd301
     VERSION=latest
     PROXY_PORT=1188         # Cổng truy cập web
     PGADMIN_PORT=1189       # Cổng quản trị DB
     POSTGRES_VOLUME_PATH=/mnt/hdd/newtenant_report_postgres_data
     PGADMIN_VOLUME_PATH=/mnt/hdd/newtenant_report_pgadmin_data
     ```

#### **Bước 2: Cài đặt Secrets trên GitHub**
Truy cập kho mã nguồn GitHub $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**, thêm các secret sau cho tenant mới (thay `{TENANT}` bằng tên viết hoa, vd: `NEWTENANT_HOST`):
* `{TENANT}_HOST`: IP của VPS deploy.
* `{TENANT}_USER`: Username SSH (thường là `ecotel-admin` hoặc `root`).
* `{TENANT}_SSH_KEY`: Private Key SSH của VPS.
* `{TENANT}_PORT`: Port SSH (thường là `22` hoặc `2222`).

#### **Bước 3: Chuẩn bị thư mục và tệp tin trên VPS**
SSH vào VPS của tenant mới và chạy các lệnh chuẩn bị:
1. **Tạo thư mục chứa data cho CSDL (Bắt buộc do dùng bind mount):**
   ```bash
   mkdir -p /mnt/hdd/newtenant_report_postgres_data /mnt/hdd/newtenant_report_pgadmin_data
   ```
2. **Tạo thư mục deploy và cấu hình Database cho Backend:**
   ```bash
   mkdir -p ~/data-lake/newtenant/deployment/staging
   ```
3. **Tạo file `.env_backend`:**
   Tạo file `~/data-lake/newtenant/deployment/staging/.env_backend` trên VPS để lưu trữ thông tin kết nối CSDL và các khoá bí mật:
   ```properties
   AWS_ACCESSKEYID=xxx
   AWS_SECRETACCESSKEY=xxx
   AWS_S3_BUCKET=xxx
   AWS_REGION=ap-southeast-1
   JWT_SECRET=xxx
   DB_URL=jdbc:postgresql://postgres:5432/report   # Chú ý: luôn kết nối qua hostname "postgres" trong Docker
   DB_USERNAME=admin
   DB_PASSWORD=admin
   ```

> [!NOTE]
> **HỖ TRỢ TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY):**
> Trong file `docker-compose`, dịch vụ database `postgres` đã được cấu hình thêm alias `aliases: - ${TENANT}_postgres` (ví dụ: `maokhe_postgres`). Do đó, các bên cũ chuyển sang hệ thống mới **không cần thay đổi** biến kết nối CSDL cũ trong file `.env_backend` trên VPS (vẫn chạy tốt với cả `jdbc:postgresql://postgres:...` và `jdbc:postgresql://{tenant_name}_postgres:...`).

#### **Bước 4: Cấu hình thêm Tenant vào CI/CD Workflow**
Mở file [.github/workflows/deploy-staging.yml](file:///d:/Ecotel/Datalake/data-lake/.github/workflows/deploy-staging.yml) và thêm tên tenant mới vào danh sách `matrix.tenant`:
```yaml
    strategy:
      fail-fast: false
      matrix:
        tenant: [servertest, servertest2, newtenant]  # Thêm vào đây
```

#### **Bước 5: Push code để kích hoạt deploy**
Khi code được push lên nhánh `dev/main`, GitHub Actions sẽ tự động build image Docker, đẩy lên Docker Hub và SSH vào VPS để khởi chạy dự án lần đầu.

---

### 2. Quy trình Deploy từ LẦN THỨ 2 TRỞ ĐI (Cập nhật Code/Tính năng)

Từ lần thứ 2, mọi thứ đã tự động hóa 100%. Quy trình cập nhật như sau:

1. **Đối với Staging:**
   * Bạn chỉ cần push/merge code vào nhánh `dev/main`. 
   * GitHub Actions tự động build lại Docker image mới, đẩy lên Registry, SSH vào VPS kéo image về và chạy lệnh reload các container.
2. **Đối với Production (Release):**
   * Merge code vào nhánh `main`.
   * Vào tab **Actions** trên GitHub $\rightarrow$ Chọn workflow **"Deploy Release"** $\rightarrow$ Nhấn **Run workflow** $\rightarrow$ Chọn tên Tenant cần cập nhật $\rightarrow$ Chạy.

---

## IV. HƯỚNG DẪN DEPLOY BARE-METAL (Dành riêng cho Uông Bí)

Với khách hàng Uông Bí, hệ thống chạy trực tiếp trên VPS và cấu hình Nginx cài đặt trên Hệ điều hành VPS để trỏ thẳng tới file tĩnh.

### 1. Chuẩn bị VPS
Yêu cầu VPS đã cài đặt:
* Java 21 (Eclipse Temurin JRE/JDK)
* Node.js v20 & npm
* Nginx

### 2. Các bước triển khai (Deploy) lần đầu và cập nhật (Re-deploy):
Chạy các lệnh trực tiếp trên VPS của Uông Bí:

```bash
# 1. Di chuyển vào thư mục dự án trên VPS
cd /home/ecotel-admin/datalake/data-lake/fe-modul-report

# 2. Cập nhật mã nguồn mới nhất
git pull

# 3. Cài đặt các gói phụ thuộc và build Frontend
npm install
npm run build

# 4. Phân quyền thư mục build cho Nginx đọc
sudo chown -R www-data:www-data /home/ecotel-admin/datalake/data-lake/fe-modul-report/dist

# 5. Khởi động lại Nginx dịch vụ trên VPS
sudo systemctl restart nginx

# 6. Chạy file JAR của Backend (Chạy ngầm bằng nohup hoặc systemd service)
cd /home/ecotel-admin/datalake/data-lake/be
mvn clean package -DskipTests
nohup java -jar target/app.jar --spring.profiles.active=prod > backend.log 2>&1 &
```

---

## V. CÁC LỖI THƯỜNG GẶP KHI DEPLOY & CÁCH XỬ LÝ (TROUBLESHOOTING)

### 1. Lỗi 500 Internal Server Error (Vòng lặp try_files ở Frontend)
* **Triệu chứng:** Người dùng vào trang chủ nhận lỗi `500 Internal Server Error` từ Nginx. Log của frontend báo lỗi `rewrite or internal redirection cycle while internally redirecting to "/index.html"`.
* **Nguyên nhân:** File cấu hình Nginx của FE (`nginx.conf`) bị chỉ sai đường dẫn `root`.
* **Giải pháp:** 
  * Đảm bảo tệp [nginx_docker.conf](file:///d:/Ecotel/Datalake/data-lake/fe-modul-report/.nginx/nginx_docker.conf#L6) dùng cho Docker có:
    ```nginx
    root /usr/share/nginx/html;
    ```
  * Chỉ có tệp [.nginx/nginx.conf](file:///d:/Ecotel/Datalake/data-lake/fe-modul-report/.nginx/nginx.conf#L16) dùng cho Bare-Metal (Uông Bí) mới được dùng đường dẫn tuyệt đối `/home/ecotel-admin/.../dist`.

### 2. Dịch vụ Backend báo `unhealthy` liên tục
* **Triệu chứng:** Chạy `docker ps` thấy container Backend ở trạng thái `unhealthy` dù Spring Boot đã log `Started BeModulApplication`.
* **Nguyên nhân:** Do cấu hình `server.servlet.context-path: /api` làm thay đổi endpoint của actuator check-health, nhưng lệnh `HEALTHCHECK` trong Dockerfile vẫn gọi vào cổng gốc `/actuator/health` không có tiền tố `/api`.
* **Giải pháp:** Sửa dòng `HEALTHCHECK` trong [be/Dockerfile](file:///d:/Ecotel/Datalake/data-lake/be/Dockerfile#L32) thành:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1
  ```

### 3. Backend kết nối nhầm sang Database của Tenant khác
* **Triệu chứng:** Dữ liệu chạy thử của Tenant này lại xuất hiện hoặc ghi đè lên database của Tenant khác.
* **Nguyên nhân:** File `.env_backend` trên VPS được copy từ local hoặc từ tenant khác mà quên sửa biến `DB_URL`.
* **Giải pháp:** Sửa file `.env_backend` trên VPS của đúng tenant đó, cấu hình kết nối chuẩn vào Docker DNS nội bộ:
  ```properties
  DB_URL=jdbc:postgresql://postgres:5432/report
  ```
  *(Luôn dùng `postgres` làm tên máy chủ DB vì Docker Compose tự động điều hướng đúng container DB đi kèm của cụm mạng đó).*
