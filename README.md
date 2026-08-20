# HƯỚNG DẪN QUY TRÌNH & KHẮC PHỤC SỰ CỐ DỰ ÁN DATA LAKE

Tài liệu này cung cấp hướng dẫn chi tiết về cấu trúc hệ thống, quy trình chạy dự án, các luồng nghiệp vụ chính, các lỗi có thể phát sinh trong từng quy trình và phương pháp xử lý sự cố.

---

## 1. TỔNG QUAN HỆ THỐNG & KIẾN TRÚC

Dự án **Data Lake** là hệ thống quản lý báo cáo, lưu trữ tài liệu thô và đồng bộ giao dịch với Kho dữ liệu (Data Warehouse - WH) của Vinacomin. Hệ thống được chia thành 3 phân hệ chính:
1. **Backend (be):** Spring Boot (Java 21), Maven, JPA/Hibernate kết hợp JDBC, Spring Security (OAuth2 JWT), AWS S3 SDK (Lưu trữ tài liệu), Apache POI (Xử lý Excel) và iTextPDF (Xuất PDF). Xem chi tiết cấu hình tại [pom.xml](file:///c:/Users/MALV2025/data-lake/be/pom.xml).
2. **Frontend (fe-modul-report):** React, TypeScript, Vite, Ant Design, Axios, và Luckysheet (LuckeyExcel) hỗ trợ xem trước file Excel trực tuyến. Các tuyến đường chính được định nghĩa tại [router/index.tsx](file:///c:/Users/MALV2025/data-lake/fe-modul-report/src/router/index.tsx).
3. **Reverse Proxy (reverse_proxy):** Nginx Gateway điều phối yêu cầu từ client, giải quyết CORS ở mức Gateway. Cấu hình tại [nginx_staging.conf](file:///c:/Users/MALV2025/data-lake/reverse_proxy/nginx_staging.conf).

---

## 2. HƯỚNG DẪN CẤU HÌNH & KHỞI CHẠY DỰ ÁN

Dự án được quản lý thông qua [Makefile](file:///c:/Users/MALV2025/data-lake/Makefile) và [docker-compose-build.yaml](file:///c:/Users/MALV2025/data-lake/docker-compose-build.yaml).

### Bước 1: Tạo các file môi trường (.env)
1. **Tại thư mục gốc (`data-lake/`):**
   Tạo file `.env` chứa thông tin Docker Registry:
   ```env
   REGISTRY=ecoteldev
   VERSION=staging-latest
   ```

2. **Tại thư mục triển khai tương ứng (`deployment/staging/` hoặc `deployment/release/`):**
   Tạo file `.env_backend` cấu hình cho phân hệ Backend kết nối Cơ sở dữ liệu, AWS S3, và JWT:
   ```env
   # Database Configuration (Khai báo đúng cổng nội bộ 5432 trong mạng Docker)
   DB_URL=jdbc:postgresql://postgres:5432/report
   DB_USERNAME=admin
   DB_PASSWORD=admin

   # AWS S3 Configuration
   AWS_ACCESSKEYID=your_aws_access_key
   AWS_SECRETACCESSKEY=your_aws_secret_key
   AWS_S3_BUCKET=your_s3_bucket_name
   AWS_REGION=ap-southeast-1

   # JWT Signature Key (Mã hóa Base64 cho khóa ký HS512, bắt buộc bảo mật)
   JWT_SECRET=Y2h1b2lfYmltYXRfbG9uX2hvbl81MTJfYml0c19kZW9fY29fZ2lhX3RyaV9tYXVfZ2VuZXJhdGVkX3NlY3JldF9rZXlfc3ByaW5nX2Jvb3Q=

   # PgAdmin Default Account
   PGADMIN_DEFAULT_EMAIL=admin@system.com
   PGADMIN_DEFAULT_PASSWORD=admin
   ```

3. **Tại phân hệ Frontend (`fe-modul-report/.env`):**
   ```env
   VITE_API=/api
   ```
   *(Lưu ý: Luôn để `/api` làm tiền tố để Nginx Gateway định tuyến chính xác về Backend, tránh lỗi CORS).*

### Bước 2: Khởi chạy dự án bằng Makefile
- **Môi trường Phát triển (Cục bộ):**
  - Chạy hệ thống: Chạy lệnh `make up` (dọn dẹp container cũ và chạy `docker compose up --build`).
  - Dừng hệ thống: Chạy lệnh `make clean`.
- **Môi trường Thử nghiệm (Staging):**
  - Chạy lệnh `make staging` để build ảnh Docker, gán tag Staging và đẩy (push) lên Docker Hub.
  - Sử dụng file cấu hình [staging-docker-compose.yaml](file:///c:/Users/MALV2025/data-lake/deployment/staging/staging-docker-compose.yaml) và khởi chạy thông qua script [start-app.sh](file:///c:/Users/MALV2025/data-lake/deployment/staging/start-app.sh).
- **Môi trường Phát hành (Release / Production):**
  - Chạy lệnh `make release` để đóng gói và push ảnh Docker Release.
  - Khởi chạy bằng file cấu hình [docker-compose.yml](file:///c:/Users/MALV2025/data-lake/deployment/release/docker-compose.yml).

---

## 3. CÁC QUY TRÌNH NGHIỆP VỤ CHÍNH

### 3.1. Quy trình Đăng Nhập & Xác Thực (Authentication Flow)
- **Luồng hoạt động:** Người dùng nhập thông tin đăng nhập tại `/login`. Client gửi request qua [axiosClient.ts](file:///c:/Users/MALV2025/data-lake/fe-modul-report/src/services/axiosClient.ts) tới `/user/login`.
- **Backend xử lý:** [UserService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataLake/UserService.java) truy vấn cơ sở dữ liệu để tìm tài khoản hoạt động và so khớp mật khẩu bằng `BCryptPasswordEncoder`. Nếu chính xác, hệ thống trả về mã Access Token và Refresh Token JWT có chứa claim `role` và chữ ký mã hóa HS512 (thời hạn 24 giờ).
- **Lưu trữ phía Client:** Client lưu trữ Token vào `localStorage` và nạp vào Header `Authorization: Bearer <Token>` cho tất cả các yêu cầu API tiếp theo.

### 3.2. Quy trình Quản Lý Báo Cáo & Dữ Liệu Động (Report Management Flow)
- **Luồng hoạt động:** Người dùng thiết kế báo cáo động (gồm khối văn bản thô `text`, bảng dữ liệu tĩnh `table`, bảng dữ liệu động `data`).
- **Backend xử lý:** [ReportService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/ReportService.java) phân tách và lưu trữ các thành phần báo cáo. Đối với bảng dữ liệu động (`data`), [DataService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataService.java) sẽ tạo câu truy vấn SQL động (SELECT, JOIN, WHERE, GROUP BY, ORDER BY) dựa trên cài đặt giao diện của người dùng. Hệ thống hỗ trợ kết nối database PostgreSQL ngoài nếu được cấu hình `url`, `username`, `password` động.

### 3.3. Quy trình Xuất Bản Báo Cáo PDF & Excel (Document Export Flow)
- **Luồng hoạt động:** Người dùng bấm nút xuất báo cáo PDF hoặc Excel trên giao diện.
- **Backend xử lý:** 
  - **Xuất PDF:** [PdfService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/PdfService.java) nạp font chữ tiếng Việt (Arial, Times New Roman...) từ tài nguyên cục bộ qua [FontUtils.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/utils/FontUtils.java), xây dựng các phần tử bảng/văn bản thô qua iTextPDF và trả về luồng dữ liệu file PDF (được lọc bỏ dấu tiếng Việt ở tên file).
  - **Xuất Excel:** [ExcelService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/ExcelService.java) sử dụng Apache POI để vẽ bảng dữ liệu, điều chỉnh độ cao tự động và xuất file XLSX.

### 3.4. Quy trình Lưu Trữ Tài Nguyên (Data Lake Storage Flow)
- **Luồng hoạt động:** Cho phép người dùng lưu trữ các tệp thô trực tiếp lên hệ thống đám mây.
- **Backend xử lý:** Khi có yêu cầu tải file lên [ReportStorageService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataLake/ReportStorageService.java), backend gọi [S3Service.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/S3Service.java) đẩy tệp lên AWS S3 Bucket của dự án với khóa lưu trữ định dạng `storage/UUID.<ext>`. Thông tin tệp được lưu trong DB với trạng thái mặc định ban đầu là `PENDING`.

### 3.5. Quy trình Đồng Bộ Kho Dữ Liệu Data Warehouse (DataWH Integration Flow)
- **Luồng hoạt động:** Gồm 4 bước khép kín để đẩy hoặc kéo dữ liệu từ hệ thống API bên ngoài của Vinacomin:
  1. **Bước 1 (Mapping):** Định nghĩa cấu trúc cột, kiểu dữ liệu, các cột khóa (keyColumns) và bộ lọc phạm vi (isScopFilter) trong biểu mẫu thông qua [WareTemplate.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/modal/DataWH/WareTemplate.java) và [WareMapping.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/modal/DataWH/WareMapping.java).
  2. **Bước 2 (Import Excel):** Người dùng đăng tải file Excel giao dịch. [WareBatchService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareBatchService.java) sẽ quét các dòng Excel bắt đầu từ dòng cấu hình (`startRow`), trích xuất giá trị theo quy tắc mapping (ROW, CELL, TEXT) và lưu thành các bản ghi `WareDataRow`.
  3. **Bước 3 (Truy vấn Master Data từ Vinacomin):** Gửi yêu cầu GET tới API Vinacomin `/v1/master-data` để kéo dữ liệu danh mục đồng bộ. Quá trình này tự động xác thực lấy Token JWT từ hệ thống API Vinacomin qua `/auth/token` bằng tài khoản hệ thống (`VHTC` / `Vin@comin123`).
  4. **Bước 4 (Đẩy Giao Dịch lên Data Warehouse):** Người dùng bấm "Push", hệ thống trích xuất dòng dữ liệu đầu tiên để áp bộ lọc scopeFilter, gói toàn bộ danh sách dòng dữ liệu giao dịch thành payload gửi POST tới API Vinacomin `/v1/push-transaction` thông qua WebClient ([WareApiService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareApiService.java)). Lịch sử đồng bộ được ghi lại trong `WareBatchAction`.

---

## 4. CHI TIẾT CÁC LỖI THƯỜNG GẶP (TROUBLESHOOTING)

Các sự cố có thể phát sinh trong quá trình vận hành, nguyên nhân kỹ thuật và cách xử lý tương ứng:

### 4.1. Lỗi 401 Unauthorized (Lỗi Xác Thực)
*   **Hiện tượng 1 (Giao diện người dùng):** Giao diện bị đẩy văng ra màn hình đăng nhập, xuất hiện thông báo đỏ *"Phiên đăng nhập đã hết hạn"*.
    *   *Nguyên nhân:* Token Access JWT trong Client đã hết hạn (quá 24 giờ) hoặc cấu hình `JWT_SECRET` của Backend bị thay đổi sau khi restart khiến chữ ký JWT không còn khớp.
    *   *Hướng xử lý:* 
        1. Người dùng tiến hành đăng nhập lại trang `/login` để nhận Token mới.
        2. Quản trị viên (DevOps) cần cấu hình cố định giá trị `JWT_SECRET` trong file `.env_backend` trên server để tránh việc tự động sinh ngẫu nhiên khi khởi chạy backend.
*   **Hiện tượng 2 (Lỗi đồng bộ DataWH):** Khi thực hiện "Get Master Data" hoặc "Push", backend trả về mã `401` hoặc ném lỗi *"Sai thông tin tài khoản"*.
    *   *Nguyên nhân:* Tài khoản kết nối Vinacomin trong cài đặt Batch/Template bị sai thông tin mật khẩu hoặc tài khoản mặc định `VHTC` bị thay đổi thông tin trên hệ thống của Vinacomin.
    *   *Hướng xử lý:*
        1. Kiểm tra lại tài khoản và mật khẩu của Batch đồng bộ trong trang quản lý.
        2. Nếu lỗi phát sinh ở phần lấy Master Data, kiểm tra và cập nhật lại thông tin tài khoản tĩnh `VHTC` / mật khẩu `Vin@comin123` tại phương thức `getMasterData` trong [WareApiService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareApiService.java#L64-L68).

### 4.2. Lỗi 403 Forbidden (Lỗi Phân Quyền)
*   **Hiện tượng:** Giao diện hiển thị lỗi *"Bạn không có quyền truy cập"* khi người dùng thực hiện một số chức năng quản lý hệ thống.
    *   *Nguyên nhân:* Endpoint yêu cầu vai trò quyền hạn cao (ví dụ: `ADMIN`), nhưng tài khoản đăng nhập hiện tại có role không khớp trong database (thiếu claim `role: ADMIN` trong Access Token JWT).
    *   *Hướng xử lý:* Truy cập Cơ sở dữ liệu và kiểm tra trường `role` của người dùng trong bảng `users`. Cập nhật giá trị thành `ADMIN` nếu tài khoản đó cần quyền quản trị.

### 4.3. Lỗi CORS (Cross-Origin Resource Sharing)
*   **Hiện tượng:** Lỗi trình duyệt đỏ lòm ở Console, chặn đứng toàn bộ các request từ Frontend gửi lên Backend.
    *   *Nguyên nhân:* Xảy ra ở môi trường Local/Staging do Frontend gọi API trực tiếp vào cổng cổng phụ của Backend (ví dụ: `8080` hoặc `8484`) thay vì gọi qua cổng của Nginx Gateway (cổng `6363` đối với Staging, cổng `6565` đối với Release).
    *   *Hướng xử lý:* Đảm bảo file cấu hình `.env` của Frontend có `VITE_API=/api` và người dùng luôn truy cập hệ thống qua địa chỉ IP cổng của Nginx Reverse Proxy (ví dụ: `http://<domain_hoac_ip>:6363` đối với Staging).

### 4.4. Lỗi 404 Not Found (Không Tìm Thấy Tài Nguyên)
*   **Hiện tượng 1 (Lỗi gọi API):** Gọi API bị báo lỗi `404 API không tồn tại`.
    *   *Nguyên nhân:* Gửi request thiếu tiền tố `/api` hoặc cấu hình định tuyến Nginx Gateway chuyển tiếp bị sai.
    *   *Hướng xử lý:* Kiểm tra tiền tố URL gọi từ client. Nginx được cấu hình bắt buộc chuyển tiếp từ `/api/` sang cổng backend nội bộ ([nginx_staging.conf](file:///c:/Users/MALV2025/data-lake/reverse_proxy/nginx_staging.conf#L57-L131)).
*   **Hiện tượng 2 (Lỗi tải file):** Khi tải tài liệu từ trang lưu trữ báo cáo, hệ thống trả về `404`.
    *   *Nguyên nhân:* Bản ghi tệp có tồn tại trong database nhưng tệp vật lý tương ứng đã bị xóa hoặc không tải lên được AWS S3 do cấu hình bucket bị lỗi ([S3Service.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/S3Service.java#L78-L95) bắt Exception và trả về `.notFound().build()`).
    *   *Hướng xử lý:* Kiểm tra mã lỗi log S3 trên backend để xác định tệp tin có tồn tại thực tế trên Bucket của AWS S3 Console hay không.

### 4.5. Lỗi 500 / 400 trong Quá trình Import Excel (DataWH)
*   **Hiện tượng:** Tải Excel lên hệ thống báo lỗi 500 kèm nội dung lỗi kỹ thuật hoặc *"Error checking empty row"*.
    *   *Nguyên nhân:* Người dùng nhập sai dữ liệu trong cột Excel so với quy tắc mapping. Ví dụ: cột dữ liệu định nghĩa kiểu Số (`NUMBER`, `INTEGER`) trong database, nhưng ô Excel tương ứng lại chứa chuỗi văn bản hoặc ô trống không đúng định dạng. Thư viện Apache POI sẽ ném lỗi `IllegalStateException` khi parse dữ liệu ([WareBatchService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareBatchService.java#L228-L233)).
    *   *Hướng xử lý:* Kiểm tra lại file Excel tải lên. Đảm bảo dữ liệu ở các cột khớp định dạng kiểu Số/Ngày tháng, không chứa văn bản thô hoặc ký tự đặc biệt.

### 4.6. Lỗi Xuất PDF Bị Lỗi Hiển Thị Tiếng Việt (Chữ Ô Vuông/Hỏi Chấm)
*   **Hiện tượng:** Báo cáo PDF tiếng Việt xuất ra bị hiển thị thành các ký tự ô vuông, dấu hỏi chấm hoặc lỗi font nghiêm trọng.
    *   *Nguyên nhân:* **Đường dẫn nạp font bị gán cứng.** Trong file [FontUtils.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/utils/FontUtils.java#L12), thư mục font được định nghĩa cứng là `"src/main/resources/fonts/"`. Khi đóng gói dự án thành file `.jar` chạy trong Container Docker, đường dẫn vật lý này hoàn toàn không tồn tại trên hệ điều hành container. Khối `catch` được kích hoạt và trả về font mặc định `TIMES_ROMAN` của iText (font này không hỗ trợ bảng mã tiếng Việt Identity-H).
    *   *Hướng xử lý:* 
        1. *Cách xử lý nhanh:* Mount thư mục font từ máy host vào thư mục chạy container thông qua cấu hình `volumes` trong docker-compose hoặc copy thư mục `fonts` vào đúng đường dẫn `/app/src/main/resources/fonts/` trong container khi build Dockerfile.
        2. *Cách sửa triệt để (Mã nguồn):* Cần viết lại `FontUtils` để đọc font dạng Stream từ Classpath Resource thông qua phương thức `getClass().getClassLoader().getResourceAsStream(...)`.

### 4.7. Lỗi Đăng Nhập Báo Lỗi 500 (Trường hợp tài khoản không tồn tại)
*   **Hiện tượng:** Nhập sai tài khoản đăng nhập nhưng hệ thống không trả về lỗi *"Sai thông tin"* thông thường mà trả về lỗi `500 Lỗi server`.
    *   *Nguyên nhân:* **Bug logic trong UserService.** Tại [UserService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataLake/UserService.java#L58-L59), hàm `findByUsernameAndStatusTrue` trả về `null` nếu không tìm thấy tài khoản. Tuy nhiên hệ thống lập tức gọi `user.getPassword()` trực tiếp ở dòng tiếp theo mà không kiểm tra kiểm dịnh `null` trước, gây ra lỗi `NullPointerException` (Lỗi 500).
    *   *Hướng xử lý:* Quản trị viên kiểm tra xem tài khoản người dùng có tồn tại trong cơ sở dữ liệu và đang có trạng thái `status = true` hay không. Mã nguồn cần sửa bằng cách bổ sung kiểm tra điều kiện `if (user == null) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Sai thông tin đăng nhập"); }`.

### 4.8. Lỗi Giao Dịch DataWH Trống (IndexOutOfBoundsException)
*   **Hiện tượng:** Thực hiện "Get Master Data" trên một Batch đồng bộ vừa tạo thì hệ thống báo lỗi 500.
    *   *Nguyên nhân:* **Lỗi logic nạp phần tử đầu tiên.** Phương thức `getMasterData` trong [WareBatchService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareBatchService.java#L353-L354) lấy bộ lọc từ dòng dữ liệu đầu tiên bằng câu lệnh `wareBatch.getWareDataRows().get(0)`. Nếu Batch đó rỗng (chưa import Excel hoặc Excel không có dữ liệu), hàm sẽ ném ra ngoại lệ `IndexOutOfBoundsException`.
    *   *Hướng xử lý:* Không thực hiện thao tác kéo Master Data hoặc Push giao dịch đối với các Batch rỗng chưa được import dữ liệu Excel thành công.

### 4.9. Lỗi Gọi DB Động Trực Tiếp (MySQL/SqlServer) trong Data Lake
*   **Hiện tượng:** Thiết lập báo cáo kết nối tới nguồn dữ liệu bên ngoài báo lỗi truy vấn.
    *   *Nguyên nhân:* Trong phương thức kết nối cơ sở dữ liệu động của [DataService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataService.java#L24-L31), driver JDBC được khai báo cứng là `org.postgresql.Driver`. Do đó, nếu URL kết nối động được trỏ đến cơ sở dữ liệu khác PostgreSQL (như MySQL, SQL Server, Oracle), hệ thống sẽ bị lỗi không nạp được driver tương thích.
    *   *Hướng xử lý:* Hiện tại hệ thống chỉ hỗ trợ liên kết động tới các cơ sở dữ liệu nguồn chạy trên nền tảng **PostgreSQL**. Đảm bảo cơ sở dữ liệu nguồn được trỏ tới sử dụng đúng hệ quản trị PostgreSQL.

### 4.10. Lỗi Backend Không Kết Nối Được PostgreSQL ở Release (Production)
*   **Hiện tượng:** Khi chạy môi trường Release, Backend báo lỗi liên tục không kết nối được PostgreSQL (`Connection refused`).
    *   *Nguyên nhân:* Trong file cấu hình docker-compose của Staging, service `postgres` tham gia mạng `backnet` nên backend kết nối được. Tuy nhiên, trong [docker-compose.yml (release)](file:///c:/Users/MALV2025/data-lake/deployment/release/docker-compose.yml#L48-L60), service `postgres` không được khai báo thuộc mạng `backnet`, dẫn đến việc các container backend (chỉ tham gia `backnet`) không thể phân giải tên miền của container DB.
    *   *Hướng xử lý:* Quản trị viên cần cập nhật file [docker-compose.yml](file:///c:/Users/MALV2025/data-lake/deployment/release/docker-compose.yml) ở phân hệ Release để bổ sung cấu hình mạng cho service `postgres`:
        ```yaml
        postgres:
          ...
          networks:
            - backnet
        ```
## 5. HƯỚNG DẪN CHẨN ĐOÁN & CÁC LỖI TỪ HỆ THỐNG API NGOÀI (VINACOMIN API)

Trong quá trình đồng bộ Kho dữ liệu (Data Warehouse), hệ thống sẽ tương tác trực tiếp với API của Vinacomin (`https://apidatabi.vinacomin.vn`). Khi xảy ra sự cố, lỗi có thể xuất phát từ cấu hình phần mềm hoặc từ quy tắc nghiệp vụ/dữ liệu phía API ngoài.

### 5.1. Cách nhận biết lỗi từ API ngoài
Khi thực hiện thao tác **"Upload dữ liệu" (Push)** tại giao diện [WareBatchDetail.tsx](file:///c:/Users/MALV2025/data-lake/fe-modul-report/src/features/ware/pages/WareBatchDetail.tsx) hoặc **"Get Master Data"**:
*   Nếu lỗi phát sinh từ Vinacomin API, thông báo lỗi hiển thị trên màn hình Frontend (thông báo đỏ góc phải) sẽ bắt đầu bằng:
    *   `Push error: <Nội dung phản hồi từ Vinacomin>`
    *   `Master error: <Nội dung phản hồi từ Vinacomin>`
*   Backend ([WareApiService.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/service/DataWH/WareApiService.java)) khi gọi API ngoài và nhận về HttpStatusCode dạng lỗi (4xx, 5xx) sẽ trích xuất phản hồi thô (JSON/Text) từ Vinacomin và ném ra RuntimeException dạng `"Push error: " + body` để truyền thẳng ra giao diện.

### 5.2. Các lỗi dữ liệu khách hàng thường gặp từ Vinacomin API

| Nội dung thông báo lỗi (UI) | Nguyên nhân chi tiết phía Vinacomin | Hướng xử lý cho Khách hàng & Kỹ thuật |
| :--- | :--- | :--- |
| **Push error: {"message":"Table '...' not found"}** | Tên bảng đích (`tableCode`) cấu hình trong Template không tồn tại trên hệ thống dữ liệu Vinacomin. | Khách hàng hoặc Admin kiểm tra lại trường **Table Code** trong cấu hình Template xem đã đúng tên bảng của Vinacomin cung cấp chưa (phân biệt hoa thường). |
| **Push error: {"message":"invalid input syntax for type..."}** | Dữ liệu trong cột của file Excel không tương thích với kiểu dữ liệu của cột đích trên DB Vinacomin (ví dụ: gửi chữ vào cột Số, hoặc định dạng ngày tháng không hợp lệ). | 1. Đối chiếu quy tắc `WareMapping` xem đã cấu hình đúng định dạng kiểu cột chưa.<br>2. Kiểm tra lại file Excel dữ liệu đầu vào xem có dòng nào bị nhập sai kiểu dữ liệu hay không. |
| **Push error: {"message":"column ... of relation ... does not exist"}** | File Excel hoặc cấu hình `WareMapping` định nghĩa một cột (`fieldName`) mà bảng đích phía Vinacomin không có cột này. | Kiểm tra lại danh sách cột ánh xạ trong Template. Đảm bảo tên trường (`FieldName`) khớp chính xác 100% với tên cột trong tài liệu mô tả API của Vinacomin. |
| **Push error: {"message":"null value in column ... violates not-null constraint"}** | Cột bắt buộc (not-null) trên hệ thống Vinacomin bị gửi giá trị trống (null hoặc blank) từ file Excel. | 1. Kiểm tra lại file Excel xem có cột bắt buộc nào bị bỏ trống dữ liệu không.<br>2. Đảm bảo cột này được định cấu hình đầy đủ trong `WareMapping`. |
| **Push error: {"message":"duplicate key value violates unique constraint..."}** | Xảy ra khi thực hiện Push dữ liệu trùng khóa chính (ID) với bản ghi đã tồn tại ở Vinacomin DB và cơ chế ghi đè bị xung đột. | 1. Khi bấm "Upload dữ liệu", chọn tùy chọn **Xoá dữ liệu cũ: Có** (tương đương `deleteMissing = true`) để hệ thống dọn dẹp các bản ghi cũ trước khi nạp.<br>2. Kiểm tra tính trùng lặp của cột Khóa chính (`isKeyColumn`) trong file Excel. |
| **Push error: {"message":"Token expired" / "Invalid signature"}** | Token xác thực kết nối giữa hệ thống Data Lake và API Vinacomin bị hết hạn hoặc sai thông tin chữ ký. | 1. Người dùng thực hiện Push lại để hệ thống tự động chạy quy trình xin cấp mới Token qua `/auth/token`.<br>2. Kiểm tra tài khoản và mật khẩu nạp vào modal Push. |
| **Push error: Connection refused / Read timeout** | Máy chủ API Vinacomin bị sập, đang bảo trì, hoặc VPN/Mạng kết nối giữa 2 hệ thống bị gián đoạn. | 1. Kiểm tra trạng thái API ngoài bằng cách truy cập endpoint kiểm tra sức khỏe hệ thống (nếu có).<br>2. Liên hệ quản trị mạng Vinacomin kiểm tra xem IP máy chủ Data Lake có bị tường lửa chặn hay không. |

### 5.3. Hướng dẫn các bước chẩn đoán và xác minh nguồn gốc lỗi

Khi khách hàng báo lỗi đồng bộ dữ liệu Kho, kỹ thuật viên thực hiện kiểm tra theo các bước sau để xác định lỗi do đâu:

*   **Bước 1: Đọc kỹ thông báo lỗi trên UI:**
    Nếu thông báo bắt đầu bằng chữ `"Push error:"` hoặc `"Master error:"` thì chắc chắn 100% đây là phản hồi trả về từ Vinacomin API. Lỗi do cấu trúc dữ liệu hoặc kết nối, không phải do phần mềm Data Lake bị crash.
*   **Bước 2: Kiểm tra lịch sử giao dịch (Audit Log):**
    Truy cập Dashboard Kho dữ liệu tại [WareBatchDasboard.tsx](file:///c:/Users/MALV2025/data-lake/fe-modul-report/src/features/ware/pages/WareBatchDasboard.tsx) hoặc kiểm tra bảng [WareBatchAction.java](file:///c:/Users/MALV2025/data-lake/be/src/main/java/com/quangnt0000/be_modul/modal/DataWH/WareBatchAction.java) trong database. Mỗi lượt Push thành công hay thất bại đều lưu lại chi tiết:
    *   `request`: Dữ liệu JSON đã gửi đi (giúp đối chiếu xem dữ liệu có bị null hoặc sai định dạng trước khi gửi hay không).
    *   `response`: Phản hồi chi tiết nhận về từ Vinacomin.
*   **Bước 3: Kiểm tra Log hệ thống (Docker Logs):**
    Chạy lệnh kiểm tra log container backend để xem lỗi chi tiết:
    ```bash
    docker logs --tail 200 -f report_backend_service
    ```
    Tìm kiếm các dòng log có chứa `Push master-data failed` hoặc `Get master-data failed` kèm theo thông tin StackTrace lỗi để xác định chính xác thời điểm xảy ra sự cố và nội dung lỗi từ thư viện WebClient.
*   **Bước 4: Kiểm tra độc lập bằng Postman (Nếu cần thiết):**
    Để cô lập hoàn toàn lỗi, có thể dùng Postman giả lập quy trình:
    1. Gọi POST `https://apidatabi.vinacomin.vn/auth/token` với tài khoản hệ thống để nhận mã Token.
    2. Gọi POST `https://apidatabi.vinacomin.vn/v1/push-transaction` gửi kèm payload JSON lấy từ bước 2 xem kết quả API trả về có trùng khớp với thông báo lỗi hay không.

---
*Tài liệu này được biên soạn dựa trên khảo sát thực tế toàn bộ mã nguồn của dự án data-lake. Nếu phát hiện thêm sự cố ngoài danh mục, vui lòng báo cáo đội ngũ phát triển để cập nhật.*
