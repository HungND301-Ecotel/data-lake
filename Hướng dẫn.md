# HƯỚNG DẪN QUY TRÌNH HOẠT ĐỘNG & CHỨC NĂNG HỆ THỐNG DATA LAKE

Tài liệu này hướng dẫn chi tiết quy trình vận hành và chức năng của phần mềm dựa trên hai vai trò chính: **ADMIN** (Quản trị viên cấu hình) và **USER** (Nhân viên vận hành/đẩy dữ liệu).

---

## I. VAI TRÒ ADMIN (QUẢN TRỊ VIÊN CẤU HÌNH)
Admin chịu trách nhiệm cấu hình nền tảng, quản lý nhân sự, danh mục và ánh xạ cấu trúc dữ liệu trước khi nhân viên (User) thực hiện nhập liệu.

### 1. Quản lý danh mục Phòng ban và Danh mục TKV (Vinacomin)
*   **Đường dẫn**: 
    *   Phòng ban: `/category/departments` (Danh mục > Phòng ban)
    *   Danh mục TKV: `/category/ware` (Danh mục > Danh mục TKV)
*   **Các chức năng chính**:
    *   **Thêm/Sửa/Xóa phòng ban**: Tạo các đơn vị phòng ban trong hệ thống (mỗi phòng ban sẽ quản lý các Mẫu dữ liệu/Template riêng biệt).
    *   **Thêm/Sửa/Xóa Danh mục TKV**: Quản lý các nhóm danh mục báo cáo của Tập đoàn Công nghiệp Than - Khoáng sản Việt Nam (TKV).
*   **Quy trình thực hiện**:
    1. Truy cập vào menu **Danh mục**.
    2. Chọn **Phòng ban** hoặc **Danh mục TKV**.
    3. Nhấn **Thêm mới** và nhập thông tin (Tên, Mã, Mô tả).
    4. Nhấn **Lưu** để lưu cấu hình hoặc **Sửa/Xóa** đối với bản ghi hiện tại.

### 2. Quản lý Nhân viên và Phân quyền Tài khoản
*   **Đường dẫn**: `/employee` (Nhân viên)
*   **Chức năng**: Quản lý danh sách nhân viên, gán tài khoản đăng nhập và phân vai trò (`ADMIN`, `USER`, `MANAGER`).
*   **Quy trình thực hiện**:
    1. Truy cập vào menu **Nhân viên**.
    2. Nhấn **Thêm mới** để tạo hồ sơ nhân viên mới, nhập thông tin liên lạc (Họ tên, Email, Phòng ban, Vai trò).
    3. Hệ thống sẽ tự động gán vai trò tài khoản (`role`) cho nhân sự đó.
    4. Để chỉnh sửa thông tin hoặc xóa tài khoản nhân viên, nhấn nút **Sửa** hoặc **Xóa** trực tiếp trên hàng tương ứng trong bảng.

### 3. Thiết lập Mẫu Cấu hình Dữ liệu (Template)
*   **Đường dẫn**: `/ware` (Báo cáo > Báo cáo TKV) -> Chọn phòng ban muốn cấu hình -> Trình duyệt chuyển hướng đến `/ware/department/:departmentId`.
*   **Chức năng**: Tạo các Mẫu cấu hình (`Template`) cho từng bảng dữ liệu đích phía Vinacomin.
*   **Quy trình thực hiện**:
    1. Truy cập vào **Báo cáo TKV** (`/ware`), chọn Phòng ban tương ứng.
    2. Nhấn nút **Thêm mới** ở góc phải để tạo Template mới.
    3. Nhập các thông tin:
       *   **Tên**: Tên hiển thị của mẫu báo cáo.
       *   **Category**: Chọn nhóm danh mục TKV đã cấu hình trước đó.
       *   **Table Name** & **Table Code**: Tên bảng và mã bảng đích trong hệ thống cơ sở dữ liệu của Vinacomin (cần chính xác để gọi API).
       *   **Bắt đầu (Start Row)**: Số dòng trong file Excel bắt đầu chứa dữ liệu giao dịch thực tế (bỏ qua các dòng tiêu đề).
       *   **Mô tả**: Ghi chú cho Template.
    4. Nhấn **Lưu** để hoàn thành tạo Mẫu Template.

### 4. Ánh xạ Cấu trúc Cột Dữ liệu (Mapping Table)
*   **Đường dẫn**: `/ware/template/detail/:templateId` (Nhấn nút **Cấu hình** tại hàng tương ứng của Template trên trang quản lý Template).
*   **Chức năng**: Cấu hình quy tắc trích xuất dữ liệu từ các ô/cột của file Excel để đẩy vào các trường (fields) của bảng đích.
*   **Quy trình thực hiện**:
    1. Tại trang chi tiết cấu hình Template, nhấn **Thêm mới** trong bảng **Cấu hình dữ liệu**.
    2. Thiết lập cấu hình cho từng trường:
       *   **Tên dữ liệu (`fieldName`)**: Tên cột tương ứng trong database đích của Vinacomin (phải chính xác 100%).
       *   **Kiểu trọc (`fieldType`)**:
           *   `ROW` (Đối chiếu cột): Áp dụng cho các cột dữ liệu thay đổi theo dòng (Ví dụ: cột Số lượng, cột Mã vật tư).
           *   `CELL` (Đối chiếu ô): Áp dụng cho các ô chứa giá trị cố định chung cho toàn bộ file Excel (Ví dụ: Ô ghi nhận Ngày báo cáo, Mã đơn vị).
           *   `TEXT` (Nhập dữ liệu): Nhập giá trị tĩnh trực tiếp mà không lấy từ Excel.
       *   **Địa chỉ ô/cột (`cellAddress`)**: Nhập ký tự cột (như `A`, `B`, `C` đối với kiểu `ROW`) hoặc địa chỉ ô cụ thể (như `B3`, `C5` đối với kiểu `CELL`).
       *   **Kiểu giá trị (`fieldValue`)**: Định dạng dữ liệu (`INTEGER` - Số nguyên, `NUMBER` - Số thực, `STRING` - Chuỗi ký tự).
       *   **Key (`isKeyColumn`)**: Tích chọn nếu cột này là khóa chính định danh duy nhất (dùng để kiểm tra trùng lặp).
       *   **Scope_Filter (`isScopFilter`)**: Tích chọn nếu cột này dùng làm bộ lọc phạm vi dữ liệu khi Push/Pull (Ví dụ: Mã đơn vị, Ngày).
    3. Nhấn **Lưu** sau khi cấu hình xong cho mỗi trường. Lặp lại cho tất cả các cột dữ liệu cần thu thập.

### 5. Quản lý Mẫu Báo cáo động (Dynamic Report Templates)
*   **Đường dẫn**: `/reports/template` hoặc `/reports/template/department/:departmentId`
*   **Chức năng**: Thiết kế mẫu báo cáo động bao gồm các đoạn văn bản tĩnh, bảng dữ liệu và truy vấn dữ liệu động từ PostgreSQL.
*   **Quy trình thực hiện**:
    1. Admin tạo mẫu báo cáo mới, cấu hình kích thước trang (ngang/dọc, lề trang).
    2. Thiết kế nội dung báo cáo:
       *   **Văn bản thô (Text block)**: Soạn thảo văn bản, điều chỉnh căn lề.
       *   **Bảng dữ liệu tĩnh (Static Table)**: Cấu hình số hàng, số cột và nhập dữ liệu trực tiếp vào các ô.
       *   **Dữ liệu động (Dynamic Data Table)**: Kết nối cơ sở dữ liệu (PostgreSQL) ngoài bằng URL, username, password. Chọn bảng dữ liệu chính, thêm các bảng liên kết (Join), định nghĩa các cột hiển thị, bộ lọc (Filter), sắp xếp (Order By) và gom nhóm (Group By).

---

## II. VAI TRÒ USER (NHÂN VIÊN VẬN HÀNH / ĐẨY DỮ LIỆU)
User là người sử dụng các Template đã được Admin cấu hình sẵn để đăng tải file Excel, kiểm tra số liệu và thực hiện đồng bộ lên Kho dữ liệu Vinacomin.

### 1. Tạo Lô dữ liệu (Batch) & Tải lên Excel
*   **Đường dẫn**: `/ware` (Báo cáo TKV) -> Chọn phòng ban quản lý -> Tại hàng của Template cần nhập liệu, nhấn **Nhập Liệu** -> Chuyển hướng đến `/ware/template/:templateId`.
*   **Chức năng**: Đăng tải tệp Excel giao dịch thô lên hệ thống và tự động phân tích (parse) dữ liệu theo quy tắc mapping của Admin.
*   **Quy trình thực hiện**:
    1. Truy cập trang Template tương ứng, nhấn nút **Thêm dữ liệu**.
    2. Trong hộp thoại hiện ra, điền thông tin:
       *   **Tên Batch**: Tên của lô dữ liệu (ví dụ: *Báo cáo Kho ngày 20/08/2026*).
       *   **Mô tả**: Thông tin bổ sung (nếu có).
       *   **Chọn file**: Đăng tải tệp Excel chứa dữ liệu thô.
    3. Nhấn **Thêm**. Hệ thống sẽ tải tệp lên và tự động chuyển đổi các dòng dữ liệu Excel thành định dạng bảng theo cấu hình ánh xạ đã cài đặt trước đó.

### 2. Kiểm tra dữ liệu thô (Preview)
*   **Đường dẫn**: `/ware/batch/:wareBatchId` (Nhấn nút **Xem** tại hàng tương ứng của lô dữ liệu/batch vừa tạo).
*   **Chức năng**: Xem trước toàn bộ dữ liệu đã được parse từ Excel sang dạng lưới trước khi đẩy lên hệ thống ngoài.
*   **Quy trình thực hiện**:
    1. Xem danh sách các dòng dữ liệu hiển thị trên bảng.
    2. Các tiêu đề cột sẽ hiển thị đúng theo `fieldName` đã ánh xạ.
    3. Sử dụng ô **Tìm kiếm theo ID** ở trên cùng nếu muốn tìm nhanh dòng dữ liệu cụ thể.
    4. Nếu phát hiện sai sót, User có thể xóa Batch này và tạo Batch mới với tệp Excel đã được chỉnh sửa.

### 3. Đồng bộ Dữ liệu lên Kho dữ liệu Vinacomin (Push Transaction)
*   **Đường dẫn**: Thực hiện ngay tại trang chi tiết lô dữ liệu (`/ware/batch/:wareBatchId`).
*   **Chức năng**: Đẩy toàn bộ các dòng giao dịch của lô dữ liệu (Batch) lên API ngoài của Vinacomin qua cổng bảo mật.
*   **Quy trình thực hiện**:
    1. Tại trang chi tiết Batch, nhấn nút **Upload dữ liệu**.
    2. Hộp thoại cấu hình đẩy dữ liệu hiện ra, nhập các thông tin:
       *   **Xoá dữ liệu cũ**: 
           *   Chọn *Có* (tương đương `deleteMissing = true`) nếu muốn dọn dẹp các dữ liệu cũ đã nạp trước đó bị trùng khóa hoặc không còn trong lô mới.
           *   Chọn *Không* nếu muốn nạp bổ sung dữ liệu vào kho.
       *   **Username / Password**: Nhập tài khoản và mật khẩu của đơn vị được cấp để nạp dữ liệu vào Vinacomin API.
    3. Nhấn **Push**. Hệ thống sẽ thực hiện xác thực xin cấp Access Token và gọi POST `/v1/push-transaction`.
    4. Kiểm tra thông báo kết quả trả về từ hệ thống:
       *   Nếu thành công: Hiển thị số lượng dòng được thêm mới (`inserted`) và số lượng dòng được cập nhật (`updated`). Cột trạng thái **Upload** ở trang danh sách lô dữ liệu sẽ hiển thị dấu tích xanh biểu thị đã hoàn thành.

### 4. Kiểm tra Lịch sử Giao dịch (Audit Log)
*   **Đường dẫn**: Nhấp vào dấu tích xanh **Đã đẩy dữ liệu** tại trang danh sách Batch (`/ware/template/:templateId`).
*   **Chức năng**: Truy vết chi tiết các thao tác đồng bộ đã diễn ra để phục vụ việc đối chiếu khi có lỗi phát sinh.
*   **Quy trình thực hiện**:
    *   Hệ thống sẽ hiển thị nhật ký đồng bộ bao gồm:
        *   Tên bảng đích đã thực hiện tác động.
        *   Loại tác động (Insert/Update).
        *   Số dòng đã nạp / cập nhật thành công.
        *   Nội dung Request JSON gửi đi và Response JSON trả về từ Vinacomin API để kỹ thuật viên đối chiếu trực tiếp.

### 5. Xem, Xuất Bản Báo cáo & Lưu trữ tài nguyên
*   **Đường dẫn**: `/reports/storage` (Kho lưu trữ) hoặc `/reports/storage/department/:departmentId`
*   **Chức năng**: Xem trước báo cáo, xuất file PDF/Excel hoặc tải lên các tệp thô để lưu trữ tập trung trên đám mây AWS S3.
*   **Quy trình thực hiện**:
    *   **Xem & Xuất báo cáo**: 
        1. Người dùng chọn mẫu báo cáo đã được thiết kế sẵn.
        2. Bấm Xem chi tiết để xem trước nội dung dưới dạng PDF bằng trình đọc trực tuyến.
        3. Nhấn nút xuất bản báo cáo ra tệp **PDF** hoặc **Excel** để lưu về thiết bị cá nhân.
    *   **Lưu trữ tài nguyên**:
        1. Truy cập vào **Kho lưu trữ**, nhấn nút tải lên để chọn tệp tài liệu cần lưu trữ.
        2. Tệp tin được đẩy trực tiếp lên đám mây AWS S3 dưới dạng an toàn và quản lý theo mã ID phòng ban.
