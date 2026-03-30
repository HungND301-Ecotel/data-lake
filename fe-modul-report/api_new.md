# DB LAKEHOUSE API DOCUMENTATION

> **Pipeline: `.bak` File → Bronze → Silver → Gold + Chatbot & Charts**
>
> Base URL: `http://localhost:8000/api/v1/db-lakehouse`
>
> Version: 1.0.0

---

## MỤC LỤC

1. [Tổng quan Pipeline](#1-tổng-quan-pipeline)
2. [Quản lý Server SQL (Chọn server lưu trữ)](#2-quản-lý-server-sql-chọn-server-lưu-trữ)
3. [Bronze Layer - Import dữ liệu thô](#3-bronze-layer---import-dữ-liệu-thô)
   - 3.1 [POST /bronze/upload](#31-post-bronzeupload) - Upload file .bak
   - 3.2 [POST /bronze/import](#32-post-bronzeimport) - Import .bak từ path
   - 3.3 [GET /bronze/{database_name}](#33-get-bronzedatabase_name)
   - 3.4 [POST /remote/import](#34-post-remoteimport) - Import từ server khác
   - 3.5 [POST /remote/import/stream](#35-post-remoteimportstream) - Import remote + SSE
4. [Silver Layer - Clean & Validate](#4-silver-layer---clean--validate)
   - 4.1 [POST /silver/transform](#41-post-silvertransform)
   - 4.2 [GET /silver/{database_name}](#42-get-silverdatabase_name)
5. [Gold Layer - Chuẩn hoá dữ liệu](#5-gold-layer---chuẩn-hoá-dữ-liệu)
   - 5.1 [POST /gold/transform](#51-post-goldtransform)
   - 5.2 [GET /gold/{database_name}](#52-get-golddatabase_name)
6. [Full Pipeline](#6-full-pipeline---chạy-toàn-bộ)
   - 6.1 [POST /pipeline/upload](#61-post-pipelineupload)
   - 6.2 [POST /pipeline/run](#62-post-pipelinerun)
7. [Chat & Biểu đồ](#7-chat--biểu-đồ)
   - 7.1 [POST /chat](#71-post-chat)
   - 7.2 [POST /chat/stream](#72-post-chatstream)
   - 7.3 [POST /chart](#73-post-chart)
   - 7.4 [GET /chat/history/{session_id}](#74-get-chathistorysession_id)
8. [Quản lý Pipeline Database](#8-quản-lý-pipeline-database)
   - 8.1 [GET /databases](#81-get-databases)
   - 8.2 [GET /database/{database_name}](#82-get-databasedatabase_name)
9. [Value Mapping - Chuẩn hoá dữ liệu theo bảng mapping](#9-value-mapping---chuẩn-hoá-dữ-liệu-theo-bảng-mapping)
   - 9.1 [POST /mapping/save](#91-post-mappingsave)
   - 9.2 [GET /mapping/list](#92-get-mappinglist)
   - 9.3 [GET /mapping/{name}](#93-get-mappingname)
   - 9.4 [DELETE /mapping/{name}](#94-delete-mappingname)
   - 9.5 [POST /mapping/apply](#95-post-mappingapply)
   - 9.6 [POST /mapping/apply/stream](#96-post-mappingapplystream)
10. [Streaming APIs (SSE)](#10-streaming-apis-sse)
11. [Error Handling](#11-error-handling)
12. [Flow Diagram & Gợi ý triển khai FE](#12-flow-diagram--gợi-ý-triển-khai-fe)

---

## 1. TỔNG QUAN PIPELINE

DB Lakehouse là hệ thống xử lý dữ liệu theo mô hình **Medallion Architecture** (Bronze → Silver → Gold) dành cho file backup SQL Server (.bak). Hệ thống cung cấp chatbot hỏi đáp và vẽ biểu đồ tự động.

### Kiến trúc 3 tầng:

| Tầng | Database | Mô tả | Xử lý |
|------|----------|-------|-------|
| **Bronze** | `bronze_*` | Dữ liệu thô (raw) - giữ nguyên từ file .bak | Restore .bak → DB |
| **Silver** | `silver_*` | Dữ liệu đã clean & validate | Trim, remove duplicates, fix types, AI auto-clean |
| **Gold** | `gold_*` | Dữ liệu chuẩn hoá (standardized) | Rename columns, normalize dates/phones/names, format currency |

### Tính năng Chatbot:
- Hỏi đáp bằng tiếng Việt → AI sinh SQL → trả về kết quả + giải thích
- Tự động phát hiện yêu cầu biểu đồ và sinh Plotly chart config
- Hỗ trợ các loại: `bar`, `line`, `pie`, `scatter`, `histogram`
- Lưu lịch sử chat theo session

---

## 2. QUẢN LÝ SERVER SQL (Chọn server lưu trữ)

> **Base URL:** `http://localhost:8000/api/v1/servers`
>
> Đây là bước **bắt buộc đầu tiên** trước khi sử dụng pipeline. Tất cả các API trong DB Lakehouse đều nhận tham số `server_id` để xác định dữ liệu sẽ được lưu trữ trên SQL Server nào.

### Workflow trên FE:

```
Bước 1: Gọi GET /servers → Lấy danh sách server đã cấu hình
Bước 2: Nếu chưa có → Gọi POST /servers → Thêm server mới
Bước 3: Gọi POST /servers/{id}/test → Kiểm tra kết nối
Bước 4: Gọi GET /servers/{id}/databases → Xem danh sách database trên server đó
Bước 5: Truyền server_id vào tất cả API pipeline (Bronze/Silver/Gold/Chat)
```

### Lưu ý quan trọng:
- Nếu **không truyền `server_id`** → hệ thống dùng server mặc định (default)
- Có thể đổi server mặc định bằng `POST /servers/{id}/set-default`
- Mỗi server có 1 `id` duy nhất (VD: `"f20bd538"`) - dùng ID này cho tham số `server_id` trong các API khác

---

### 2.1 GET /api/v1/servers

> **Lấy danh sách tất cả SQL Server đã cấu hình**

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `servers` | ServerConfig[] | Danh sách server |
| `total` | integer | Tổng số server |

#### Schema: ServerConfig

| Field | Type | Mô tả |
|-------|------|-------|
| `id` | string | **ID duy nhất** - dùng cho tham số `server_id` ở các API khác |
| `name` | string | Tên hiển thị (VD: "Server Kế toán") |
| `host` | string | Địa chỉ server (VD: `"192.168.1.100"`, `"localhost\\SQLEXPRESS"`) |
| `port` | integer | Port SQL Server (mặc định 1433) |
| `username` | string | Tên đăng nhập SQL |
| `driver` | string | ODBC driver |
| `trust_cert` | boolean | Trust server certificate |
| `windows_auth` | boolean | Dùng Windows Authentication |
| `is_default` | boolean | **Server mặc định** - dùng khi không truyền `server_id` |
| `created_at` | string | Thời điểm tạo |

#### Example Response:
```json
{
  "servers": [
    {
      "id": "f20bd538",
      "name": "Server Kế toán",
      "host": "192.168.1.100",
      "port": 1433,
      "username": "sa",
      "driver": "{ODBC Driver 18 for SQL Server}",
      "trust_cert": true,
      "windows_auth": false,
      "is_default": true,
      "created_at": "2026-03-29T08:00:00"
    },
    {
      "id": "a1b2c3d4",
      "name": "Server Nhân sự",
      "host": "192.168.1.200",
      "port": 1433,
      "username": "sa",
      "driver": "{ODBC Driver 18 for SQL Server}",
      "trust_cert": true,
      "windows_auth": false,
      "is_default": false,
      "created_at": "2026-03-30T10:00:00"
    }
  ],
  "total": 2
}
```

---

### 2.2 POST /api/v1/servers

> **Thêm SQL Server mới**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `name` | string | **Yes** | - | Tên hiển thị (VD: `"Server Kế toán"`) |
| `host` | string | **Yes** | - | Địa chỉ server (VD: `"192.168.1.100"` hoặc `"localhost\\SQLEXPRESS"`) |
| `port` | integer | No | 1433 | Port SQL Server (bỏ qua nếu dùng named instance) |
| `username` | string | No | `"sa"` | Tên đăng nhập |
| `password` | string | **Yes** | - | Mật khẩu |
| `driver` | string | No | `"{ODBC Driver 18 for SQL Server}"` | ODBC driver |
| `trust_cert` | boolean | No | true | Trust server certificate |
| `windows_auth` | boolean | No | false | Dùng Windows Auth thay vì SQL Auth |

#### Example Request:
```json
{
  "name": "Server Kế toán",
  "host": "192.168.1.100",
  "port": 1433,
  "username": "sa",
  "password": "MyPassword123",
  "trust_cert": true,
  "windows_auth": false
}
```

#### Example Response:
```json
{
  "id": "f20bd538",
  "name": "Server Kế toán",
  "host": "192.168.1.100",
  "port": 1433,
  "username": "sa",
  "driver": "{ODBC Driver 18 for SQL Server}",
  "trust_cert": true,
  "windows_auth": false,
  "is_default": false,
  "created_at": "2026-03-30T10:00:00"
}
```

---

### 2.3 POST /api/v1/servers/{server_id}/test

> **Kiểm tra kết nối đến SQL Server**

Trả về trạng thái kết nối và danh sách database có sẵn trên server.

#### Path Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `server_id` | string | **Yes** | ID của server cần test |

#### Example Response (thành công):
```json
{
  "success": true,
  "message": "Kết nối thành công đến 192.168.1.100",
  "databases": ["EFS_KETOAN", "EFS_NHANSU", "EFS_UB2023", "QLTS_2024"]
}
```

#### Example Response (thất bại):
```json
{
  "success": false,
  "message": "Kết nối thất bại: Login failed for user 'sa'",
  "databases": []
}
```

---

### 2.4 GET /api/v1/servers/{server_id}/databases

> **Lấy danh sách database trên 1 server**

#### Response:
```json
["EFS_KETOAN", "EFS_NHANSU", "EFS_UB2023", "QLTS_2024"]
```

---

### 2.5 POST /api/v1/servers/{server_id}/set-default

> **Đặt server làm mặc định**

Server mặc định được dùng khi không truyền `server_id` trong các API khác.

#### Response:
```json
{
  "status": "ok",
  "message": "Server 'f20bd538' is now the default"
}
```

---

### 2.6 PUT /api/v1/servers/{server_id}

> **Cập nhật thông tin server**

Chỉ truyền các field cần thay đổi, các field còn lại giữ nguyên.

#### Request Body:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `name` | string | No | Tên hiển thị mới |
| `host` | string | No | Địa chỉ mới |
| `port` | integer | No | Port mới |
| `username` | string | No | Username mới |
| `password` | string | No | Password mới |
| `trust_cert` | boolean | No | Trust certificate |
| `windows_auth` | boolean | No | Windows Auth |

---

### 2.7 DELETE /api/v1/servers/{server_id}

> **Xoá server**

#### Response:
```json
{
  "status": "deleted",
  "server_id": "a1b2c3d4"
}
```

---

### Cách FE sử dụng `server_id` trong Pipeline

Sau khi có danh sách server, FE truyền `server_id` vào **tất cả API** của DB Lakehouse:

```tsx
// 1. Lấy danh sách server
const { data: servers } = await axios.get('/api/v1/servers');

// 2. Cho người dùng chọn server (dropdown)
const selectedServerId = servers.servers[0].id; // VD: "f20bd538"

// 3. Truyền server_id vào mọi API pipeline
// Upload Bronze:
formData.append('server_id', selectedServerId);
await fetch('/api/v1/db-lakehouse/bronze/upload', { body: formData });

// Transform Silver:
await fetch('/api/v1/db-lakehouse/silver/transform', {
  body: JSON.stringify({
    bronze_database: 'bronze_mydb',
    server_id: selectedServerId,  // ← Dữ liệu sẽ lưu trên server này
    auto_clean: true,
  })
});

// Chat:
await fetch('/api/v1/db-lakehouse/chat/stream', {
  body: JSON.stringify({
    question: 'Thống kê doanh thu',
    database: 'gold_mydb',
    server_id: selectedServerId,  // ← Query trên server này
  })
});
```

> **Nếu không truyền `server_id`** → dùng server có `is_default: true`

---

## 3. BRONZE LAYER - Import dữ liệu thô

Bronze layer là tầng đầu tiên, lưu trữ dữ liệu nguyên bản. Hỗ trợ **2 nguồn import:**

| Nguồn | API | Mô tả |
|-------|-----|-------|
| **File .bak** | `POST /bronze/upload` hoặc `/bronze/import` | Restore file backup SQL Server |
| **Remote Server** | `POST /remote/import` | Copy dữ liệu từ SQL Server khác về local |

---

### 3.1 POST /bronze/upload

> **Upload file .bak và import vào Bronze database**

**Content-Type:** `multipart/form-data`

#### Request (Form Data):

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `file` | File (.bak) | **Yes** | - | File backup SQL Server (.bak) |
| `server_id` | string | No | null | Server ID để restore (mặc định = default server) |
| `database_name` | string | No | auto | Tên Bronze DB tuỳ chỉnh (auto = `bronze_{filename}_{timestamp}`) |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Tên database Bronze đã tạo |
| `tables_imported` | string[] | Danh sách tên bảng đã import |
| `table_count` | integer | Số lượng bảng |
| `total_rows` | integer | Tổng số dòng dữ liệu |
| `message` | string | Thông báo kết quả |

#### Example Response:
```json
{
  "status": "success",
  "bronze_database": "bronze_MyDatabase_20260329_143000",
  "tables_imported": ["Customers", "Orders", "Products"],
  "table_count": 3,
  "total_rows": 15000,
  "message": "Da import 3 bang voi 15000 dong vao Bronze database [bronze_MyDatabase_20260329_143000]"
}
```

---

### 3.2 POST /bronze/import

> **Import file .bak từ đường dẫn có sẵn trên server**

**Content-Type:** `application/json`

#### Query Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `bak_file_path` | string | **Yes** | Đường dẫn tuyệt đối đến file .bak trên server |

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `server_id` | string | No | null | Server ID |
| `database_name` | string | No | auto | Tên Bronze DB tuỳ chỉnh |
| `tables` | string[] | No | null | Chỉ import các bảng này (null = tất cả) |

#### Example Request:
```
POST /api/v1/db-lakehouse/bronze/import?bak_file_path=D:\backups\MyDB.bak
```
```json
{
  "server_id": null,
  "database_name": "bronze_mydb",
  "tables": ["Customers", "Orders"]
}
```

#### Example Response:
```json
{
  "status": "success",
  "bronze_database": "bronze_mydb",
  "tables_imported": ["Customers", "Orders"],
  "table_count": 2,
  "total_rows": 8500,
  "message": "Da import 2 bang voi 8500 dong vao Bronze database [bronze_mydb]"
}
```

---

### 3.3 GET /bronze/{database_name}

> **Xem chi tiết Bronze database**

#### Path Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `database_name` | string | **Yes** | Tên Bronze database |

#### Query Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `server_id` | string | No | Server ID (mặc định = default) |

#### Response: `DatabaseInfoResponse`

| Field | Type | Mô tả |
|-------|------|-------|
| `database_name` | string | Tên database |
| `layer` | string | `"bronze"` |
| `tables` | BronzeTableInfo[] | Danh sách bảng (xem schema bên dưới) |
| `total_rows` | integer | Tổng số dòng |
| `total_tables` | integer | Tổng số bảng |

#### Schema: BronzeTableInfo

| Field | Type | Mô tả |
|-------|------|-------|
| `table_name` | string | Tên bảng |
| `row_count` | integer | Số dòng |
| `column_count` | integer | Số cột |
| `columns` | object[] | `[{name, type, nullable, max_length}]` |

#### Example Response:
```json
{
  "database_name": "bronze_mydb",
  "layer": "bronze",
  "tables": [
    {
      "table_name": "Customers",
      "row_count": 5000,
      "column_count": 8,
      "columns": [
        {"name": "Id", "type": "int", "nullable": false, "max_length": null},
        {"name": "FullName", "type": "nvarchar", "nullable": true, "max_length": 200},
        {"name": "Phone", "type": "varchar", "nullable": true, "max_length": 20},
        {"name": "Email", "type": "varchar", "nullable": true, "max_length": 100}
      ]
    }
  ],
  "total_rows": 5000,
  "total_tables": 1
}
```

---

### 3.4 POST /remote/import

> **Import dữ liệu từ SQL Server khác về Bronze database**

**Content-Type:** `application/json`

Tương tự import .bak nhưng nguồn là database đang chạy trên server khác. Hệ thống sẽ đọc từng bảng trên remote server và copy dữ liệu sang Bronze DB trên server đích (local hoặc server khác).

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `source_server_id` | string | **Yes** | - | Server ID nguồn (server chứa dữ liệu cần import) - lấy từ `GET /servers` |
| `source_database` | string | **Yes** | - | Tên database nguồn trên remote server |
| `target_server_id` | string | No | null | Server ID đích để lưu Bronze DB (null = server mặc định/local) |
| `bronze_database` | string | No | auto | Tên Bronze DB trên server đích (auto = `bronze_{db}_{timestamp}`) |
| `tables` | string[] | No | null | Chỉ import các bảng này (null = tất cả) |

#### Workflow:

```
Server nguồn (remote)              Server đích (local)
┌──────────────────────┐           ┌──────────────────────┐
│  source_database     │           │  bronze_database     │
│  ├── Customers ──────│──copy──→  │  ├── Customers       │
│  ├── Orders    ──────│──copy──→  │  ├── Orders          │
│  └── Products  ──────│──copy──→  │  └── Products        │
└──────────────────────┘           └──────────────────────┘
   source_server_id                   target_server_id
```

#### Example Request:
```json
{
  "source_server_id": "a1b2c3d4",
  "source_database": "EFS_KETOAN",
  "target_server_id": "f20bd538",
  "bronze_database": "bronze_ketoan",
  "tables": ["DM_REPORT_CTHUC", "DM_BCTC"]
}
```

#### Example Response:
```json
{
  "status": "success",
  "bronze_database": "bronze_ketoan",
  "tables_imported": ["DM_REPORT_CTHUC", "DM_BCTC"],
  "table_count": 2,
  "total_rows": 12500,
  "message": "Đã import 2 bảng (12500 dòng) từ [EFS_KETOAN] sang Bronze [bronze_ketoan]"
}
```

---

### 3.5 POST /remote/import/stream

> **Import từ remote server với SSE streaming progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giống [POST /remote/import](#34-post-remoteimport)

#### SSE Events:

| Event | Khi nào | Data fields |
|-------|---------|-------------|
| `start` | Bắt đầu import | `source_server_id`, `source_database`, `progress: 0` |
| `progress` | Tạo DB / quét bảng | `step`, `message`, `tables_total`, `progress` |
| `table_start` | Bắt đầu copy 1 bảng | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Copy xong 1 bảng | `table`, `row_count`, `column_count`, `tables_done`, `progress` |
| `table_error` | Lỗi copy 1 bảng | `table`, `message` |
| `complete` | Hoàn tất | `status: "success"`, `bronze_database`, `tables_imported`, `total_rows`, `progress: 100` |
| `error` | Lỗi nghiêm trọng | `message` |

#### Example FE - Import từ remote:
```tsx
// 1. Lấy danh sách server
const { data: servers } = await axios.get('/api/v1/servers');
// servers: [{id: "f20bd538", name: "Local"}, {id: "a1b2c3d4", name: "Server Kế toán"}]

// 2. Lấy danh sách database trên server nguồn
const { data: databases } = await axios.get('/api/v1/servers/a1b2c3d4/databases');
// databases: ["EFS_KETOAN", "EFS_NHANSU"]

// 3. Import với streaming
const res = await fetch('/api/v1/db-lakehouse/remote/import/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source_server_id: 'a1b2c3d4',    // Server Kế toán (remote)
    source_database: 'EFS_KETOAN',
    target_server_id: 'f20bd538',     // Local server
    tables: null,                      // Tất cả bảng
  }),
});
// ... đọc SSE events như các API stream khác ...
```

---

## 4. SILVER LAYER - Clean & Validate

Silver layer làm sạch và validate dữ liệu từ Bronze. Các bước xử lý: trim whitespace, remove duplicates, fill nulls, validate types. Có thể dùng AI auto-detect hoặc truyền custom rules.

---

### 4.1 POST /silver/transform

> **Chuyển đổi Bronze → Silver (clean & validate)**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `bronze_database` | string | **Yes** | - | Tên Bronze database nguồn |
| `silver_database` | string | No | auto | Tên Silver DB đích (auto = `silver_{...}`) |
| `tables` | string[] | No | null | Chỉ transform các bảng này (null = tất cả) |
| `auto_clean` | boolean | No | true | Sử dụng AI để tự động phát hiện và clean |
| `custom_rules` | CleaningRule[] | No | null | Các quy tắc clean tuỳ chỉnh (xem bảng dưới) |
| `remove_duplicates` | boolean | No | true | Xoá các dòng trùng lặp |
| `remove_null_rows` | boolean | No | false | Xoá dòng có tất cả giá trị NULL |

#### Schema: CleaningRule

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `column` | string | **Yes** | Tên cột cần áp dụng |
| `action` | string | **Yes** | Loại action (xem bảng tham chiếu) |
| `params` | object | No | Tham số cho action |

#### Bảng tham chiếu: CleaningRule actions

| Action | Mô tả | Params |
|--------|-------|--------|
| `trim` | Xoá khoảng trắng đầu/cuối | Không cần |
| `lowercase` | Chuyển chữ thường | Không cần |
| `uppercase` | Chuyển chữ hoa | Không cần |
| `fill_default` | Điền giá trị mặc định cho NULL | `{"value": "gia_tri"}` |
| `cast_type` | Chuyển đổi kiểu dữ liệu | `{"target_type": "int\|float\|str\|datetime"}` |
| `remove_empty_strings` | Thay chuỗi rỗng bằng NULL | Không cần |
| `regex_replace` | Thay thế theo regex | `{"pattern": "...", "replacement": "..."}` |
| `normalize_date` | Chuẩn hoá định dạng ngày | `{"format": "%Y-%m-%d"}` |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Database nguồn |
| `silver_database` | string | Database đích đã tạo |
| `tables_transformed` | string[] | Danh sách bảng đã transform |
| `cleaning_report` | object | Báo cáo chi tiết từng bảng |
| `message` | string | Thông báo kết quả |

#### Example Request:
```json
{
  "bronze_database": "bronze_mydb",
  "silver_database": "silver_mydb",
  "auto_clean": true,
  "remove_duplicates": true,
  "custom_rules": [
    {"column": "Phone", "action": "trim", "params": null},
    {"column": "Email", "action": "lowercase", "params": null},
    {"column": "Age", "action": "fill_default", "params": {"value": 0}}
  ]
}
```

#### Example Response:
```json
{
  "status": "success",
  "bronze_database": "bronze_mydb",
  "silver_database": "silver_mydb",
  "tables_transformed": ["Customers", "Orders"],
  "cleaning_report": {
    "Customers": {
      "original_rows": 5000,
      "cleaned_rows": 4850,
      "duplicates_removed": 120,
      "nulls_filled": 45,
      "issues_found": ["Column [Address] has 65.2% null values"],
      "actions_applied": [
        "Trimmed whitespace in 5 string columns",
        "Removed 120 duplicate rows",
        "Filled 45 nulls in [Age] with '0'",
        "Lowercased [Email]"
      ]
    }
  },
  "message": "Da clean va validate 2 bang tu Bronze sang Silver [silver_mydb]"
}
```

---

### 4.2 GET /silver/{database_name}

> **Xem chi tiết Silver database**

Tương tự [GET /bronze/{database_name}](#23-get-bronzedatabase_name). Response có cùng format `DatabaseInfoResponse`, với `layer = "silver"`.

---

## 5. GOLD LAYER - Chuẩn hoá dữ liệu

Gold layer chuẩn hoá dữ liệu từ Silver: đổi tên bảng/cột, normalize định dạng ngày tháng, số điện thoại, tên người, tiền tệ. Có thể tự động (AI) hoặc cấu hình thủ công qua `table_mappings`.

---

### 5.1 POST /gold/transform

> **Chuyển đổi Silver → Gold (chuẩn hoá)**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `silver_database` | string | **Yes** | - | Tên Silver database nguồn |
| `gold_database` | string | No | auto | Tên Gold DB đích (auto = `gold_{...}`) |
| `table_mappings` | GoldTableMapping[] | No | null | Cấu hình mapping từng bảng |
| `auto_standardize` | boolean | No | true | AI tự động chuẩn hoá |

#### Schema: GoldTableMapping

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `source_table` | string | **Yes** | Tên bảng trong Silver database |
| `target_table` | string | No | Tên bảng mới trong Gold (null = giữ nguyên) |
| `columns` | GoldColumnMapping[] | No | Mapping từng cột (null = giữ tất cả, AI tự chuẩn hoá) |
| `exclude_columns` | string[] | No | Danh sách cột cần loại bỏ khỏi Gold |

#### Schema: GoldColumnMapping

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `source_column` | string | **Yes** | Tên cột gốc trong Silver |
| `target_column` | string | No | Tên cột mới trong Gold (null = giữ nguyên) |
| `transform` | string | No | Loại transform (xem bảng dưới) |
| `params` | object | No | Tham số cho transform |

#### Bảng tham chiếu: Gold transforms

| Transform | Mô tả | Params | Ví dụ |
|-----------|-------|--------|-------|
| `normalize_date` | Chuẩn hoá ngày tháng | `{"format": "%Y-%m-%d"}` | `01/03/2026` → `2026-03-01` |
| `normalize_phone` | Chuẩn hoá SĐT (+84) | Không cần | `0912345678` → `+84912345678` |
| `normalize_name` | Chuẩn hoá tên (Title Case) | Không cần | `nguyen van A ` → `Nguyen Van A` |
| `uppercase` | Chuyển chữ hoa | Không cần | `abc` → `ABC` |
| `lowercase` | Chuyển chữ thường | Không cần | `ABC` → `abc` |
| `trim` | Xoá khoảng trắng thừa | Không cần | `  abc  ` → `abc` |
| `format_currency` | Làm tròn số tiền | `{"decimal_places": 2}` | `1234.5678` → `1234.57` |
| `cast_type` | Chuyển kiểu dữ liệu | `{"target_type": "int"}` | `"123"` → `123` |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | `"success"` |
| `silver_database` | string | Database nguồn |
| `gold_database` | string | Database đích đã tạo |
| `tables_transformed` | string[] | Danh sách bảng đã chuẩn hoá |
| `standardization_report` | object | Báo cáo chi tiết từng bảng |
| `message` | string | Thông báo kết quả |

#### Example Request:
```json
{
  "silver_database": "silver_mydb",
  "gold_database": "gold_mydb",
  "auto_standardize": true,
  "table_mappings": [
    {
      "source_table": "KhachHang",
      "target_table": "Customers",
      "columns": [
        {
          "source_column": "HoTen",
          "target_column": "FullName",
          "transform": "normalize_name"
        },
        {
          "source_column": "SDT",
          "target_column": "Phone",
          "transform": "normalize_phone"
        },
        {
          "source_column": "NgaySinh",
          "target_column": "BirthDate",
          "transform": "normalize_date",
          "params": {"format": "%Y-%m-%d"}
        },
        {
          "source_column": "DoanhThu",
          "target_column": "Revenue",
          "transform": "format_currency",
          "params": {"decimal_places": 2}
        }
      ],
      "exclude_columns": ["TempField", "OldId"]
    }
  ]
}
```

#### Example Response:
```json
{
  "status": "success",
  "silver_database": "silver_mydb",
  "gold_database": "gold_mydb",
  "tables_transformed": ["Customers", "Orders"],
  "standardization_report": {
    "KhachHang": {
      "source_table": "KhachHang",
      "target_table": "Customers",
      "columns_renamed": ["HoTen -> FullName", "SDT -> Phone", "NgaySinh -> BirthDate"],
      "data_transforms": [
        "Normalized names in [FullName]",
        "Normalized phone numbers in [Phone]",
        "Normalized dates in [BirthDate] -> %Y-%m-%d",
        "Formatted currency in [Revenue] (2 decimals)"
      ],
      "rows": 4850
    }
  },
  "message": "Da chuan hoa 2 bang tu Silver sang Gold [gold_mydb]"
}
```

---

### 5.2 GET /gold/{database_name}

> **Xem chi tiết Gold database**

Tương tự [GET /bronze/{database_name}](#23-get-bronzedatabase_name). Response có cùng format `DatabaseInfoResponse`, với `layer = "gold"`.

---

## 6. FULL PIPELINE - Chạy toàn bộ

Chạy toàn bộ pipeline từ file `.bak` → Bronze → Silver → Gold trong 1 bước. Thích hợp khi muốn nhanh chóng xử lý dữ liệu mà không cần can thiệp từng bước.

---

### 6.1 POST /pipeline/upload

> **Upload .bak và chạy full pipeline**

**Content-Type:** `multipart/form-data`

#### Request (Form Data):

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `file` | File (.bak) | **Yes** | - | File backup SQL Server |
| `server_id` | string | No | null | Server ID |
| `bronze_database` | string | No | auto | Tên Bronze DB |
| `silver_database` | string | No | auto | Tên Silver DB |
| `gold_database` | string | No | auto | Tên Gold DB |
| `auto_clean` | boolean | No | true | AI auto clean cho Silver |
| `auto_standardize` | boolean | No | true | AI auto standardize cho Gold |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Tên Bronze DB đã tạo |
| `silver_database` | string | Tên Silver DB đã tạo |
| `gold_database` | string | Tên Gold DB đã tạo |
| `tables_processed` | integer | Số bảng đã xử lý |
| `bronze_report` | object | Báo cáo Bronze (tables, rows) |
| `silver_report` | object | Báo cáo Silver (cleaning details) |
| `gold_report` | object | Báo cáo Gold (standardization details) |
| `message` | string | Thông báo kết quả |

#### Example Response:
```json
{
  "status": "success",
  "bronze_database": "bronze_MyDB_20260329_143000",
  "silver_database": "silver_MyDB_20260329_143000",
  "gold_database": "gold_MyDB_20260329_143000",
  "tables_processed": 5,
  "bronze_report": {
    "table_count": 5,
    "total_rows": 25000
  },
  "silver_report": {
    "tables_transformed": ["T1", "T2", "T3", "T4", "T5"],
    "cleaning_report": {"...": "..."}
  },
  "gold_report": {
    "tables_transformed": ["T1", "T2", "T3", "T4", "T5"],
    "standardization_report": {"...": "..."}
  },
  "message": "Pipeline hoan tat: MyDB.bak -> [bronze_...] -> [silver_...] -> [gold_...]"
}
```

---

### 6.2 POST /pipeline/run

> **Chạy full pipeline từ đường dẫn .bak có sẵn**

**Content-Type:** `application/json`

#### Query Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `bak_file_path` | string | **Yes** | Đường dẫn tuyệt đối đến file .bak |

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `server_id` | string | No | null | Server ID |
| `bronze_database` | string | No | auto | Tên Bronze DB |
| `silver_database` | string | No | auto | Tên Silver DB |
| `gold_database` | string | No | auto | Tên Gold DB |
| `tables` | string[] | No | null | Chỉ xử lý các bảng này (null = tất cả) |
| `auto_clean` | boolean | No | true | AI auto clean |
| `auto_standardize` | boolean | No | true | AI auto standardize |
| `table_mappings` | GoldTableMapping[] | No | null | Gold mapping tuỳ chỉnh |

#### Response:
Cùng format với [POST /pipeline/upload](#51-post-pipelineupload).

---

## 7. CHAT & BIỂU ĐỒ

Chatbot hỏi đáp bằng tiếng Việt và vẽ biểu đồ tự động từ dữ liệu Gold database. Hệ thống sử dụng AI để sinh SQL query, trả về dữ liệu và giải thích kết quả.

---

### 7.1 POST /chat

> **Hỏi đáp dữ liệu Gold database bằng tiếng Việt**

**Content-Type:** `application/json`

**Flow xử lý:**
1. Phân tích câu hỏi và sinh SQL query
2. Thực thi SQL trên Gold database
3. Sinh câu trả lời bằng tiếng Việt
4. Tự động vẽ biểu đồ nếu phù hợp (`generate_chart=true`)

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `question` | string | **Yes** | - | Câu hỏi bằng tiếng Việt |
| `database` | string | **Yes** | - | Tên Gold database để truy vấn |
| `server_id` | string | No | null | Server ID |
| `session_id` | string | No | auto | Session ID để lưu lịch sử (auto = tạo mới) |
| `generate_chart` | boolean | No | true | Tự động phát hiện và vẽ biểu đồ |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `answer` | string | Câu trả lời bằng tiếng Việt |
| `sql_query` | string \| null | SQL query đã sinh và thực thi |
| `data` | object[] \| null | Dữ liệu trả về (tối đa 100 dòng) |
| `columns` | string[] \| null | Danh sách tên cột |
| `total_rows` | integer \| null | Tổng số dòng kết quả |
| `chart` | object \| null | Plotly chart config (nếu có - xem chi tiết bên dưới) |
| `session_id` | string \| null | Session ID để tiếp tục hỏi đáp |

#### Example Request:
```json
{
  "question": "Thong ke so luong khach hang theo thanh pho, ve bieu do cot",
  "database": "gold_mydb",
  "session_id": "abc123",
  "generate_chart": true
}
```

#### Example Response:
```json
{
  "answer": "Theo du lieu, TP.HCM co so luong khach hang lon nhat voi 2,500 khach, tiep theo la Ha Noi voi 1,800 khach va Da Nang voi 950 khach.",
  "sql_query": "SELECT [City], COUNT(*) as [SoLuong] FROM [Customers] GROUP BY [City] ORDER BY COUNT(*) DESC",
  "data": [
    {"City": "TP.HCM", "SoLuong": 2500},
    {"City": "Ha Noi", "SoLuong": 1800},
    {"City": "Da Nang", "SoLuong": 950}
  ],
  "columns": ["City", "SoLuong"],
  "total_rows": 3,
  "chart": {
    "chart_type": "bar",
    "data": [
      {
        "type": "bar",
        "x": ["TP.HCM", "Ha Noi", "Da Nang"],
        "y": [2500, 1800, 950]
      }
    ],
    "layout": {
      "title": {"text": "Bieu do cot: Thong ke so luong khach hang theo thanh pho"},
      "xaxis": {"title": "City"},
      "yaxis": {"title": "SoLuong"},
      "template": "plotly_white"
    }
  },
  "session_id": "abc123"
}
```

---

### Chi tiết: Chart object (Plotly config)

Object `chart` trả về dùng **trực tiếp** với [Plotly.js](https://plotly.com/javascript/) để render biểu đồ phía FE.

| Field | Type | Mô tả |
|-------|------|-------|
| `chart_type` | string | Loại biểu đồ: `bar`, `line`, `pie`, `scatter`, `histogram` |
| `data` | object[] | Mảng Plotly trace objects (`type`, `x`, `y`, `name`, `mode`, `labels`, `values`) |
| `layout` | object | Plotly layout (`title`, `xaxis`, `yaxis`, `template`) |

#### Cách sử dụng trên FE (React):
```jsx
// Cai dat: npm install react-plotly.js plotly.js
import Plot from 'react-plotly.js';

function ChartComponent({ chartData }) {
  if (!chartData) return null;

  return (
    <Plot
      data={chartData.data}
      layout={chartData.layout}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true }}
    />
  );
}

// Su dung:
// <ChartComponent chartData={response.chart} />
```

#### Cách sử dụng trên FE (Vue):
```vue
<!-- Cai dat: npm install vue-plotly -->
<template>
  <Plotly
    v-if="chart"
    :data="chart.data"
    :layout="chart.layout"
    :config="{ responsive: true }"
  />
</template>
```

---

### 7.2 POST /chat/stream

> **Hỏi đáp Gold database với SSE streaming - trả lời từng token realtime**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

Đây là API **quan trọng nhất cho FE chatbot** - câu trả lời được stream từng token ngay khi LLM sinh ra, không cần đợi hết.

#### Request Body:
Giống [POST /chat](#61-post-chat) (cùng request body).

#### SSE Events theo thứ tự:

| Event | Khi nào | Data |
|-------|---------|------|
| `start` | Bắt đầu xử lý | `session_id`, `question`, `database` |
| `schema_loaded` | Đã load schema | `tables_count`, `message` |
| `sql_generating` | Đang sinh SQL | `message` |
| `sql_generated` | SQL đã sinh | `sql_query` |
| `sql_fixed` | SQL lỗi đã được sửa | `sql_query` (SQL mới) |
| `query_executing` | Đang thực thi SQL | `message` |
| `query_result` | Dữ liệu trả về | `columns`, `total_rows`, `data_preview` (5 dòng đầu) |
| `answer_streaming` | Bắt đầu stream trả lời | `message` |
| **`answer_token`** | **Từng token câu trả lời** | **`token`** - FE nối các token lại |
| `answer_done` | Trả lời hoàn tất | `answer` (full text) |
| `data` | Dữ liệu đầy đủ | `data` (100 dòng), `columns`, `total_rows`, `sql_query` |
| `chart` | Biểu đồ (nếu có) | `chart` (Plotly config) |
| `complete` | Tất cả xong | `session_id` |
| `error` | Lỗi | `message` |

#### Xử lý Context quá dài (tự động):
- Schema quá lớn: Tự động cắt gọn, ưu tiên bảng liên quan đến câu hỏi
- Data quá nhiều: Tự động giảm số dòng gửi cho LLM
- Nếu vẫn lỗi: Retry với context nhỏ hơn (tối đa 3 lần)
- FE **không cần xử lý gì** - backend tự động handle

#### Example FE (React) - Streaming Chat Component:
```tsx
import { useState, useCallback } from 'react';

function ChatStream() {
  const [answer, setAnswer] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [data, setData] = useState([]);
  const [chart, setChart] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState('');

  const sendMessage = useCallback(async (question: string, database: string) => {
    setAnswer('');
    setSqlQuery('');
    setData([]);
    setChart(null);
    setStatus('loading');

    const response = await fetch('/api/v1/db-lakehouse/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        database,
        server_id: 'your-server-id',  // tu GET /servers
        session_id: sessionId,
        generate_chart: true,
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;

        let eventName = 'message';
        let eventData: any = {};

        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7);
          if (line.startsWith('data: ')) {
            try { eventData = JSON.parse(line.slice(6)); } catch {}
          }
        }

        switch (eventName) {
          case 'schema_loaded':
          case 'sql_generating':
          case 'query_executing':
          case 'answer_streaming':
            setProgress(eventData.message);
            break;

          case 'sql_generated':
          case 'sql_fixed':
            setSqlQuery(eventData.sql_query);
            break;

          case 'query_result':
            setProgress(`${eventData.total_rows} dong du lieu`);
            break;

          case 'answer_token':
            // === QUAN TRONG: Noi tung token lai thanh cau tra loi ===
            setAnswer(prev => prev + eventData.token);
            break;

          case 'answer_done':
            // Cau tra loi hoan chinh (dung de verify)
            break;

          case 'data':
            setData(eventData.data);
            break;

          case 'chart':
            setChart(eventData.chart);
            break;

          case 'complete':
            setStatus('done');
            break;

          case 'error':
            setStatus('error');
            setAnswer(eventData.message);
            break;
        }
      }
    }
  }, []);

  return (
    <div>
      {/* Input */}
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') sendMessage(e.currentTarget.value, 'gold_mydb');
      }} />

      {/* Progress */}
      {status === 'loading' && <Spin />}
      {progress && <Tag>{progress}</Tag>}

      {/* SQL */}
      {sqlQuery && <pre>{sqlQuery}</pre>}

      {/* Answer - hien thi tung token khi stream */}
      {answer && <div className="answer">{answer}</div>}

      {/* Data table */}
      {data.length > 0 && <Table dataSource={data} />}

      {/* Chart */}
      {chart && <Plot data={chart.data} layout={chart.layout} />}
    </div>
  );
}
```

#### Example FE (Vue 3):
```vue
<script setup>
import { ref } from 'vue';

const answer = ref('');
const sqlQuery = ref('');
const data = ref([]);
const chart = ref(null);
const loading = ref(false);

async function sendMessage(question, database) {
  answer.value = '';
  loading.value = true;

  const res = await fetch('/api/v1/db-lakehouse/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, database, generate_chart: true }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();

    for (const block of blocks) {
      const eventLine = block.split('\n').find(l => l.startsWith('event: '));
      const dataLine = block.split('\n').find(l => l.startsWith('data: '));
      if (!dataLine) continue;

      const evt = eventLine?.slice(7) || '';
      const d = JSON.parse(dataLine.slice(6));

      if (evt === 'answer_token') answer.value += d.token;
      if (evt === 'sql_generated') sqlQuery.value = d.sql_query;
      if (evt === 'data') data.value = d.data;
      if (evt === 'chart') chart.value = d.chart;
      if (evt === 'complete') loading.value = false;
    }
  }
}
</script>

<template>
  <input @keydown.enter="sendMessage($event.target.value, 'gold_mydb')" />
  <div v-if="answer">{{ answer }}</div>
  <Plotly v-if="chart" :data="chart.data" :layout="chart.layout" />
</template>
```

#### Example SSE Stream:
```
event: start
data: {"session_id":"abc123","question":"Thong ke doanh thu theo thang","database":"gold_mydb"}

event: schema_loaded
data: {"tables_count":15,"message":"Da load schema: 15 bang"}

event: sql_generating
data: {"message":"Dang sinh SQL query..."}

event: sql_generated
data: {"sql_query":"SELECT [Month], SUM([Revenue]) as [Total] FROM [Sales] GROUP BY [Month] ORDER BY [Month]"}

event: query_executing
data: {"message":"Dang thuc thi SQL..."}

event: query_result
data: {"columns":["Month","Total"],"total_rows":12,"data_preview":[{"Month":"01","Total":150000000}]}

event: answer_streaming
data: {"message":"Dang tao cau tra loi..."}

event: answer_token
data: {"token":"Theo"}

event: answer_token
data: {"token":" du"}

event: answer_token
data: {"token":" lieu"}

event: answer_token
data: {"token":" thong"}

event: answer_token
data: {"token":" ke"}

event: answer_token
data: {"token":", doanh"}

event: answer_token
data: {"token":" thu cao nhat"}

event: answer_token
data: {"token":" vao thang 12..."}

event: answer_done
data: {"answer":"Theo du lieu thong ke, doanh thu cao nhat vao thang 12..."}

event: data
data: {"data":[{"Month":"01","Total":150000000},...],"columns":["Month","Total"],"total_rows":12,"sql_query":"SELECT..."}

event: chart
data: {"chart":{"chart_type":"bar","data":[{"type":"bar","x":["01","02",...],"y":[150000000,...]}],"layout":{"title":{"text":"..."}}}}

event: complete
data: {"session_id":"abc123"}
```

---

### 7.3 POST /chart

> **Vẽ biểu đồ trực tiếp từ Gold database**

**Content-Type:** `application/json`

Khác với `/chat`, API này **chỉ trả về biểu đồ**, không trả về câu trả lời.

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `database` | string | **Yes** | - | Tên Gold database |
| `question` | string | **Yes** | - | Mô tả biểu đồ cần vẽ |
| `server_id` | string | No | null | Server ID |
| `chart_type` | string | No | auto | Ép kiểu biểu đồ: `bar`, `line`, `pie`, `scatter`, `heatmap` (auto = AI tự chọn) |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `chart_type` | string | Loại biểu đồ đã chọn |
| `chart_config` | object | Plotly config đầy đủ (`data` + `layout`) |
| `sql_query` | string | SQL query đã dùng để lấy dữ liệu |
| `data_summary` | string | Tóm tắt dữ liệu (số dòng, số cột) |

#### Example Request:
```json
{
  "database": "gold_mydb",
  "question": "Bieu do tron ty le doanh thu theo san pham",
  "chart_type": "pie"
}
```

#### Example Response:
```json
{
  "chart_type": "pie",
  "chart_config": {
    "chart_type": "pie",
    "data": [
      {
        "type": "pie",
        "labels": ["San pham A", "San pham B", "San pham C"],
        "values": [45000000, 32000000, 18000000]
      }
    ],
    "layout": {
      "title": {"text": "Bieu do tron ty le doanh thu theo san pham"},
      "template": "plotly_white"
    }
  },
  "sql_query": "SELECT [ProductName], SUM([Revenue]) as [TotalRevenue] FROM [Sales] GROUP BY [ProductName]",
  "data_summary": "3 dong du lieu, 2 cot"
}
```

---

### 7.4 GET /chat/history/{session_id}

> **Lấy lịch sử hỏi đáp theo session**

#### Path Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `session_id` | string | **Yes** | Session ID từ response của `/chat` |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `session_id` | string | Session ID |
| `messages` | object[] | Mảng các message `{question, answer, timestamp}` |

#### Example Response:
```json
{
  "session_id": "abc123",
  "messages": [
    {
      "question": "Co bao nhieu khach hang?",
      "answer": "Tong co 5000 khach hang trong he thong.",
      "timestamp": "2026-03-29T14:30:00"
    },
    {
      "question": "Thong ke theo thanh pho",
      "answer": "TP.HCM: 2500, Ha Noi: 1800, Da Nang: 950...",
      "timestamp": "2026-03-29T14:31:00"
    }
  ]
}
```

---

## 8. QUẢN LÝ PIPELINE DATABASE

---

### 8.1 GET /databases

> **Danh sách tất cả pipeline databases**

Trả về danh sách tất cả database Bronze, Silver, Gold đã tạo cùng metadata.

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `databases` | object | Map: `{database_name: metadata_object}` |

#### Example Response:
```json
{
  "databases": {
    "bronze_mydb": {
      "database": "bronze_mydb",
      "layer": "bronze",
      "source_bak": "D:\\backups\\mydb.bak",
      "tables": ["Customers", "Orders"],
      "total_rows": 8500,
      "imported_at": "2026-03-29T14:00:00"
    },
    "silver_mydb": {
      "database": "silver_mydb",
      "layer": "silver",
      "source_bronze": "bronze_mydb",
      "tables": ["Customers", "Orders"],
      "transformed_at": "2026-03-29T14:05:00"
    },
    "gold_mydb": {
      "database": "gold_mydb",
      "layer": "gold",
      "source_silver": "silver_mydb",
      "tables": ["Customers", "Orders"],
      "transformed_at": "2026-03-29T14:10:00"
    }
  }
}
```

---

### 8.2 GET /database/{database_name}

> **Chi tiết bất kỳ database nào trong pipeline**

#### Path Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `database_name` | string | **Yes** | Tên database (Bronze/Silver/Gold) |

#### Query Parameters:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `server_id` | string | No | Server ID |

#### Response:
Cùng format `DatabaseInfoResponse` như [GET /bronze/{database_name}](#23-get-bronzedatabase_name).

---

## 9. VALUE MAPPING - Chuẩn hoá dữ liệu theo bảng mapping

Tính năng cho phép chuẩn hoá dữ liệu dựa trên bảng mapping (VD: viết tắt -> đầy đủ). Quét tất cả các cột string trong database và thay thế giá trị theo quy tắc.

**Ví dụ:** `TSCD` -> `Tài sản cố định`, `DT` -> `Doanh thu`, `CP` -> `Chi phí`

---

### 9.1 POST /mapping/save

> **Lưu bộ mapping chuẩn hoá để tái sử dụng**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `name` | string | **Yes** | - | Tên bộ mapping (VD: `"viet_tat_ke_toan"`) |
| `description` | string | No | null | Mô tả |
| `case_insensitive` | boolean | No | true | Không phân biệt hoa thường |
| `match_mode` | string | No | `"contains"` | `"exact"`, `"contains"`, hoặc `"word"` |
| `mappings` | ValueMappingEntry[] | **Yes** | - | Danh sách các cặp mapping |

#### Schema: ValueMappingEntry

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `from_value` | string | **Yes** | Giá trị gốc (VD: `"TSCD"`) |
| `to_value` | string | **Yes** | Giá trị chuẩn hoá (VD: `"Tài sản cố định"`) |

#### Match Modes:

| Mode | Mô tả | Ví dụ |
|------|-------|-------|
| `exact` | Khớp chính xác cả ô dữ liệu | Ô chứa đúng `"TSCD"` -> thay thành `"Tài sản cố định"` |
| `contains` | Khớp nếu ô chứa chuỗi con | `"Loại TSCD nhỏ"` -> `"Loại Tài sản cố định nhỏ"` |
| `word` | Khớp theo từ (có khoảng trắng bao quanh) | `"TSCD và DT"` -> `"Tài sản cố định và DT"` |

#### Example Request:
```json
{
  "name": "viet_tat_ke_toan",
  "description": "Chuyen doi viet tat ke toan sang day du",
  "case_insensitive": true,
  "match_mode": "contains",
  "mappings": [
    {"from_value": "TSCD", "to_value": "Tai san co dinh"},
    {"from_value": "DT", "to_value": "Doanh thu"},
    {"from_value": "CP", "to_value": "Chi phi"},
    {"from_value": "GTGT", "to_value": "Gia tri gia tang"},
    {"from_value": "BHXH", "to_value": "Bao hiem xa hoi"},
    {"from_value": "TNCN", "to_value": "Thu nhap ca nhan"},
    {"from_value": "CCDC", "to_value": "Cong cu dung cu"}
  ]
}
```

#### Example Response:
```json
{
  "status": "success",
  "mapping": {
    "name": "viet_tat_ke_toan",
    "description": "Chuyen doi viet tat ke toan sang day du",
    "case_insensitive": true,
    "match_mode": "contains",
    "mappings": [...],
    "created_at": "2026-03-30T10:00:00"
  }
}
```

---

### 9.2 GET /mapping/list

> **Danh sách các bộ mapping đã lưu**

#### Example Response:
```json
{
  "mappings": [
    {
      "name": "viet_tat_ke_toan",
      "description": "Chuyen doi viet tat ke toan sang day du",
      "mapping_count": 7,
      "match_mode": "contains",
      "created_at": "2026-03-30T10:00:00"
    }
  ]
}
```

---

### 9.3 GET /mapping/{name}

> **Xem chi tiết 1 bộ mapping**

Trả về toàn bộ config bao gồm danh sách mappings.

---

### 9.4 DELETE /mapping/{name}

> **Xoá 1 bộ mapping**

---

### 9.5 POST /mapping/apply

> **Áp dụng mapping chuẩn hoá dữ liệu vào database**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `database` | string | **Yes** | - | Tên database cần chuẩn hoá (Bronze/Silver/Gold) |
| `server_id` | string | No | null | Server ID |
| `tables` | string[] | No | null | Chỉ áp dụng cho các bảng này (null = tất cả) |
| `columns` | string[] | No | null | Chỉ áp dụng cho các cột này (null = tất cả cột string) |
| `mapping_name` | string | No* | null | Tên bộ mapping đã lưu |
| `custom_mappings` | ValueMappingEntry[] | No* | null | Mapping tuỳ chỉnh (ưu tiên hơn mapping_name) |
| `case_insensitive` | boolean | No | true | Không phân biệt hoa thường |
| `match_mode` | string | No | `"contains"` | `"exact"`, `"contains"`, `"word"` |
| `dry_run` | boolean | No | false | **true = chỉ xem trước, không lưu thay đổi** |

> *Bắt buộc có `mapping_name` hoặc `custom_mappings` (1 trong 2)

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | `"success"` |
| `database` | string | Database đã xử lý |
| `tables_processed` | string[] | Danh sách bảng đã quét |
| `total_replacements` | integer | Tổng số thay thế |
| `results` | ValueMappingResult[] | Chi tiết từng bảng (xem bên dưới) |
| `dry_run` | boolean | Có phải dry run không |
| `message` | string | Thông báo kết quả |

#### Schema: ValueMappingResult

| Field | Type | Mô tả |
|-------|------|-------|
| `table_name` | string | Tên bảng |
| `columns_scanned` | integer | Số cột đã quét |
| `total_replacements` | integer | Số thay thế trong bảng này |
| `details` | object[] | Chi tiết: `{column, from_value, to_value, matches, applied}` |

#### Example Request - Dùng mapping đã lưu:
```json
{
  "database": "gold_mydb",
  "server_id": "f20bd538",
  "tables": ["BaoCaoTaiChinh", "SoKeToan"],
  "mapping_name": "viet_tat_ke_toan",
  "dry_run": true
}
```

#### Example Request - Dùng custom mapping:
```json
{
  "database": "silver_mydb",
  "server_id": "f20bd538",
  "tables": ["DanhMuc"],
  "columns": ["TenDanhMuc", "MoTa"],
  "custom_mappings": [
    {"from_value": "TSCD", "to_value": "Tai san co dinh"},
    {"from_value": "DT", "to_value": "Doanh thu"}
  ],
  "case_insensitive": true,
  "match_mode": "contains",
  "dry_run": false
}
```

#### Example Response (dry_run=true):
```json
{
  "status": "success",
  "database": "gold_mydb",
  "tables_processed": ["BaoCaoTaiChinh", "SoKeToan"],
  "total_replacements": 156,
  "results": [
    {
      "table_name": "BaoCaoTaiChinh",
      "columns_scanned": 5,
      "total_replacements": 120,
      "details": [
        {
          "column": "TenChiTieu",
          "from_value": "TSCD",
          "to_value": "Tai san co dinh",
          "matches": 45,
          "applied": false
        },
        {
          "column": "TenChiTieu",
          "from_value": "DT",
          "to_value": "Doanh thu",
          "matches": 30,
          "applied": false
        },
        {
          "column": "GhiChu",
          "from_value": "TSCD",
          "to_value": "Tai san co dinh",
          "matches": 15,
          "applied": false
        }
      ]
    },
    {
      "table_name": "SoKeToan",
      "columns_scanned": 3,
      "total_replacements": 36,
      "details": [...]
    }
  ],
  "dry_run": true,
  "message": "[DRY RUN] Da thay the 156 gia tri trong 2 bang"
}
```

---

### 9.6 POST /mapping/apply/stream

> **Áp dụng mapping với SSE streaming progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giống [POST /mapping/apply](#85-post-mappingapply)

#### SSE Events:

| Event | Khi nào | Data fields |
|-------|---------|-------------|
| `start` | Bắt đầu | `tables_total`, `mapping_count`, `dry_run`, `progress: 0` |
| `table_start` | Bắt đầu 1 bảng | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Xong 1 bảng | `table`, `replacements`, `columns_scanned`, `progress` |
| `table_error` | Lỗi 1 bảng | `table`, `message` |
| `complete` | Hoàn tất | `total_replacements`, `tables_processed`, `dry_run`, `progress: 100` |
| `error` | Lỗi | `message` |

---

## 10. STREAMING APIs (SSE)

Tất cả các API upload/transform đều có phiên bản **streaming** trả về **Server-Sent Events (SSE)** để FE hiển thị progress realtime.

### Cách sử dụng SSE trên FE

#### React/TypeScript:
```tsx
async function runPipelineWithProgress(bakFile: File, onEvent: (event: any) => void) {
  const formData = new FormData();
  formData.append('file', bakFile);

  const response = await fetch('/api/v1/db-lakehouse/pipeline/upload/stream', {
    method: 'POST',
    body: formData,
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const block of lines) {
      if (!block.trim()) continue;
      let eventName = 'message';
      let data = '';

      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) eventName = line.slice(7);
        if (line.startsWith('data: ')) data = line.slice(6);
      }

      if (data) {
        onEvent({ event: eventName, ...JSON.parse(data) });
      }
    }
  }
}

// Su dung:
runPipelineWithProgress(file, (evt) => {
  console.log(evt.event, evt.message, evt.progress || evt.overall_progress);
  setProgress(evt.overall_progress || evt.progress || 0);
  setMessage(evt.message);
});
```

#### Vue 3 Composition API:
```vue
<script setup>
const progress = ref(0);
const message = ref('');

async function upload(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/v1/db-lakehouse/pipeline/upload/stream', {
    method: 'POST', body: formData
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();
    for (const block of blocks) {
      const dataLine = block.split('\n').find(l => l.startsWith('data: '));
      if (dataLine) {
        const evt = JSON.parse(dataLine.slice(6));
        progress.value = evt.overall_progress || evt.progress || 0;
        message.value = evt.message || '';
      }
    }
  }
}
</script>
```

---

### 10.1 POST /bronze/upload/stream

> **Upload .bak + import Bronze với SSE progress**

**Content-Type:** `multipart/form-data`
**Response Content-Type:** `text/event-stream`

**Request:** Giống [POST /bronze/upload](#21-post-bronzeupload)

#### SSE Events:

| Event | Khi nào | Data fields |
|-------|---------|-------------|
| `start` | Bắt đầu restore | `step`, `message`, `progress: 0` |
| `progress` | Đang restore .bak | `step: "restore"`, `message`, `progress: 10-50` |
| `table_done` | Mỗi bảng đọc xong | `table`, `row_count`, `column_count`, `tables_done`, `tables_total`, `progress` |
| `table_error` | Lỗi đọc 1 bảng | `table`, `message` |
| `complete` | Hoàn tất | `status: "success"`, `bronze_database`, `tables_imported`, `total_rows`, `progress: 100` |
| `error` | Lỗi nghiêm trọng | `message` |

#### Example SSE Stream:
```
event: start
data: {"step":"bronze","message":"Bat dau restore file .bak vao [bronze_mydb]...","progress":0}

event: progress
data: {"step":"restore","message":"Dang restore MyDB.bak...","progress":10}

event: progress
data: {"step":"restore","message":"Restore hoan tat","progress":50}

event: table_done
data: {"table":"Customers","row_count":5000,"column_count":8,"tables_done":1,"tables_total":3,"progress":72}

event: table_done
data: {"table":"Orders","row_count":8000,"column_count":12,"tables_done":2,"tables_total":3,"progress":83}

event: table_done
data: {"table":"Products","row_count":200,"column_count":6,"tables_done":3,"tables_total":3,"progress":95}

event: complete
data: {"status":"success","bronze_database":"bronze_mydb","tables_imported":["Customers","Orders","Products"],"table_count":3,"total_rows":13200,"progress":100}
```

---

### 10.2 POST /silver/transform/stream

> **Clean Bronze -> Silver với SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giống [POST /silver/transform](#31-post-silvertransform)

#### SSE Events:

| Event | Khi nào | Data fields |
|-------|---------|-------------|
| `start` | Bắt đầu Silver | `step: "silver"`, `message`, `progress: 0` |
| `progress` | Tổng quan | `tables_total`, `progress: 5` |
| `table_start` | Bắt đầu clean 1 bảng | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Clean xong 1 bảng | `table`, `report` (original_rows, cleaned_rows, duplicates_removed, actions_applied), `progress` |
| `table_error` | Lỗi clean 1 bảng | `table`, `message` |
| `complete` | Hoàn tất | `status: "success"`, `silver_database`, `tables_transformed`, `cleaning_report`, `progress: 100` |

---

### 10.3 POST /gold/transform/stream

> **Chuẩn hoá Silver -> Gold với SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giống [POST /gold/transform](#41-post-goldtransform)

#### SSE Events:

| Event | Khi nào | Data fields |
|-------|---------|-------------|
| `start` | Bắt đầu Gold | `step: "gold"`, `message`, `progress: 0` |
| `progress` | Tổng quan | `tables_total`, `progress: 5` |
| `table_start` | Bắt đầu chuẩn hoá 1 bảng | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Chuẩn hoá xong 1 bảng | `table`, `target_table`, `report` (columns_renamed, data_transforms, rows), `progress` |
| `table_error` | Lỗi chuẩn hoá 1 bảng | `table`, `message` |
| `complete` | Hoàn tất | `status: "success"`, `gold_database`, `tables_transformed`, `standardization_report`, `progress: 100` |

---

### 10.4 POST /pipeline/upload/stream

> **Upload .bak + full pipeline Bronze->Silver->Gold với SSE progress**

**Content-Type:** `multipart/form-data`
**Response Content-Type:** `text/event-stream`

**Request:** Giống [POST /pipeline/upload](#51-post-pipelineupload)

Đây là API **quan trọng nhất** cho FE - chạy toàn bộ pipeline và stream progress realtime.

#### Overall progress: Bronze 0-33%, Silver 33-66%, Gold 66-100%

Mỗi event có thêm 2 field:
- `overall_progress` (0-100): Progress toàn bộ pipeline
- `pipeline_step` (`"bronze"` | `"silver"` | `"gold"`): Bước hiện tại

#### SSE Events:

| Event | Phase | Data fields |
|-------|-------|-------------|
| `pipeline_start` | - | `message`, `progress: 0` |
| `bronze_start` | Bronze | `message`, `overall_progress: 0` |
| `bronze_progress` | Bronze | `message`, `overall_progress: 3-16` |
| `bronze_table_done` | Bronze | `table`, `row_count`, `overall_progress` |
| `bronze_complete` | Bronze | `bronze_database`, `overall_progress: 33` |
| `silver_start` | Silver | `message`, `overall_progress: 33` |
| `silver_table_start` | Silver | `table`, `overall_progress` |
| `silver_table_done` | Silver | `table`, `report`, `overall_progress` |
| `silver_complete` | Silver | `silver_database`, `overall_progress: 66` |
| `gold_start` | Gold | `message`, `overall_progress: 66` |
| `gold_table_start` | Gold | `table`, `overall_progress` |
| `gold_table_done` | Gold | `table`, `target_table`, `report`, `overall_progress` |
| `gold_complete` | Gold | `gold_database`, `overall_progress: 100` |
| `pipeline_complete` | - | `status`, `bronze_database`, `silver_database`, `gold_database`, `overall_progress: 100` |
| `pipeline_error` | - | `step`, `message` |

#### Example FE Progress Bar:
```tsx
function PipelineUpload() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/v1/db-lakehouse/pipeline/upload/stream', {
      method: 'POST', body: formData
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        let eventName = '', data: any = {};
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7);
          if (line.startsWith('data: ')) data = JSON.parse(line.slice(6));
        }

        setProgress(data.overall_progress || data.progress || 0);
        setStep(data.pipeline_step || data.step || '');
        setMessage(data.message || '');

        if (eventName === 'pipeline_complete') {
          setResult(data);
        }
      }
    }
  };

  return (
    <div>
      <Upload onChange={(f) => handleUpload(f)}>Upload .bak</Upload>
      <Progress percent={progress} />
      <Tag>{step}</Tag>
      <p>{message}</p>
      {result && <Result status="success" title={result.message} />}
    </div>
  );
}
```

---

### 10.5 POST /pipeline/run/stream

> **Full pipeline từ path .bak với SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request:** Giống [POST /pipeline/run](#52-post-pipelinerun) (query param `bak_file_path` + JSON body)

**Events:** Giống [POST /pipeline/upload/stream](#84-post-pipelineuploadstream)

---

## 11. ERROR HANDLING

Tất cả API trả về HTTP status code chuẩn và error detail:

| HTTP Code | Ý nghĩa | Khi nào xảy ra |
|-----------|---------|----------------|
| **200** | Thành công | Request xử lý thành công |
| **400** | Bad Request | File không phải .bak, dữ liệu không hợp lệ, không thể vẽ biểu đồ |
| **404** | Not Found | File .bak không tồn tại trên server |
| **422** | Validation Error | Thiếu field bắt buộc hoặc sai kiểu dữ liệu |
| **500** | Server Error | Lỗi SQL Server, lỗi AI, lỗi hệ thống |

#### Error response format:
```json
// HTTP 400 / 404 / 500:
{
  "detail": "Mo ta loi chi tiet"
}

// HTTP 422 (Validation Error):
{
  "detail": [
    {
      "loc": ["body", "bronze_database"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

---

## 12. FLOW DIAGRAM & GỢI Ý TRIỂN KHAI FE

### A. Full Pipeline Flow

```
[Upload .bak file]
       |
       v
+------------------+
|   BRONZE LAYER   |  POST /bronze/upload
|  (Dữ liệu thô)  |  Restore .bak -> SQL Server DB
+------------------+
       |
       v
+------------------+
|   SILVER LAYER   |  POST /silver/transform
|  (Clean & Valid) |  Trim, dedupe, AI auto-clean
+------------------+
       |
       v
+------------------+
|    GOLD LAYER    |  POST /gold/transform
|  (Chuẩn hoá)    |  Rename, normalize, format
+------------------+
       |
       v
+------------------+
|  CHATBOT & CHART |  POST /chat, POST /chart
|  Hỏi đáp + Biểu |  Text2SQL + Plotly charts
|  đồ từ Gold DB   |
+------------------+
```

### B. Chat Flow

```
[Người dùng hỏi: "Thống kê doanh thu theo tháng"]
       |
       v
[AI phân tích câu hỏi]
       |
       v
[Sinh SQL: SELECT Month, SUM(Revenue) ... GROUP BY Month]
       |
       v
[Thực thi SQL trên Gold DB]
       |
       v
[AI sinh câu trả lời tiếng Việt]
       |
       v
[Detect yêu cầu biểu đồ? -> Sinh Plotly config]
       |
       v
[Trả về: answer + data + chart (Plotly JSON)]
```

### C. Gợi ý triển khai FE

| Trang | Mô tả | API sử dụng |
|-------|-------|-------------|
| **Upload** | Form upload file .bak, hiện progress | `POST /pipeline/upload` hoặc `POST /bronze/upload` |
| **Quản lý DB** | Hiện danh sách Bronze/Silver/Gold, click xem chi tiết | `GET /databases`, `GET /database/{name}` |
| **Transform** | Cho phép cấu hình Silver rules và Gold mappings, chạy từng bước | `POST /silver/transform`, `POST /gold/transform` |
| **Chatbot** | Giao diện chat, hiện answer + data table + chart | `POST /chat`, `GET /chat/history/{session_id}` |
| **Biểu đồ** | Giao diện vẽ biểu đồ riêng, chọn kiểu chart | `POST /chart` |

### D. FE Libraries gợi ý

| Thư viện | Mục đích |
|----------|----------|
| `react-plotly.js` / `vue-plotly` | Render biểu đồ từ Plotly config |
| `axios` / `fetch` | Gọi API |
| `ant-design` / `shadcn` | UI components (table, form, upload) |
| `react-markdown` | Render markdown trong câu trả lời chatbot |

---

## Phụ lục: Lakehouse APIs (Module cũ)

Các API dưới đây thuộc module Lakehouse gốc (xử lý tài liệu: PDF, Word, ảnh), **không nằm trong DB Lakehouse** nhưng cùng chung hệ thống.

> **Base URL:** `http://localhost:8000/api/v1/lakehouse`

---

### POST /lakehouse/excel-mapping/analyze

> **Phân tích file Excel và tự động map cột với data mapping có sẵn**

**Content-Type:** `multipart/form-data`

Upload file Excel (.xlsx, .xls), AI sẽ phân tích cấu trúc file (header ở dòng nào, data bắt đầu từ dòng nào) và map các cột với bộ `data_mapping.json` có sẵn trên server.

#### Request (Form Data):

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `file` | File (.xlsx, .xls) | **Yes** | File Excel cần phân tích |

#### Response:

| Field | Type | Mô tả |
|-------|------|-------|
| `success` | boolean | `true` nếu thành công |
| `filename` | string | Tên file đã upload |
| `result` | object | Kết quả phân tích (xem chi tiết bên dưới) |

#### Schema: result

| Field | Type | Mô tả |
|-------|------|-------|
| `company_id` | string | Mã công ty (AI tự nhận diện từ file) |
| `company_name` | string | Tên công ty |
| `day` | integer | Ngày |
| `month` | integer | Tháng |
| `year` | integer | Năm |
| `header_row` | integer | Dòng chứa header (0-indexed) |
| `data_start_row` | integer | Dòng bắt đầu dữ liệu thực (0-indexed) |
| `column_mapping` | ColumnMapping[] | Mapping từng cột Excel với data_mapping |

#### Schema: ColumnMapping

| Field | Type | Mô tả |
|-------|------|-------|
| `excel_column_index` | integer | Index cột trong Excel (0-indexed) |
| `excel_column_name` | string | Tên cột gốc trong file Excel |
| `mapped_key` | string \| null | Key tương ứng trong `data_mapping.json` (null = không tìm thấy) |
| `mapped_name` | string \| null | Tên tiếng Việt từ data_mapping |
| `data_type` | string \| null | Kiểu dữ liệu: `CHAR`, `NUMBER`, `VARCHAR`, `DATETIME` |
| `data_length` | integer \| null | Độ dài dữ liệu |

#### Cơ chế hoạt động:
1. Upload file Excel → đọc 20 dòng đầu
2. Gửi cho AI cùng với file `data/data_mapping.json` (chứa định nghĩa các cột chuẩn)
3. AI phân tích:
   - Tìm dòng header và dòng data bắt đầu
   - Map từng cột Excel với key trong data_mapping
   - Nhận diện thông tin công ty, ngày tháng
4. Trả về JSON mapping

#### data_mapping.json (ví dụ):
```json
[
  {"key": "bukrs", "data_type": "CHAR", "data_length": 4, "name": "Công ty"},
  {"key": "year", "data_type": "NUMBER", "data_length": 4, "name": "Năm"},
  {"key": "matnr", "data_type": "CHAR", "data_length": 400, "sname": "Mã chỉ tiêu"},
  {"key": "name_matnr", "data_type": "CHAR", "data_length": 400, "name": "Chỉ tiêu"},
  {"key": "gt_01", "data_type": "NUMBER", "data_length": 25, "name": "Kế hoạch thực hiện"},
  {"key": "dvt", "data_type": "CHAR", "data_length": 500, "name": "Đơn vị tính"}
]
```

#### Example Response:
```json
{
  "success": true,
  "filename": "BaoCao_KH_2026.xlsx",
  "result": {
    "company_id": "1000",
    "company_name": "Công ty CP Ecotel",
    "day": 15,
    "month": 3,
    "year": 2026,
    "header_row": 4,
    "data_start_row": 5,
    "column_mapping": [
      {
        "excel_column_index": 0,
        "excel_column_name": "STT",
        "mapped_key": "stt",
        "mapped_name": "STT",
        "data_type": "NUMBER",
        "data_length": 4
      },
      {
        "excel_column_index": 1,
        "excel_column_name": "Mã chỉ tiêu",
        "mapped_key": "matnr",
        "mapped_name": "Mã chỉ tiêu",
        "data_type": "CHAR",
        "data_length": 400
      },
      {
        "excel_column_index": 2,
        "excel_column_name": "Tên chỉ tiêu",
        "mapped_key": "name_matnr",
        "mapped_name": "Chỉ tiêu",
        "data_type": "CHAR",
        "data_length": 400
      },
      {
        "excel_column_index": 3,
        "excel_column_name": "ĐVT",
        "mapped_key": "dvt",
        "mapped_name": "Đơn vị tính",
        "data_type": "CHAR",
        "data_length": 500
      },
      {
        "excel_column_index": 4,
        "excel_column_name": "KH thực hiện",
        "mapped_key": "gt_01",
        "mapped_name": "Kế hoạch thực hiện",
        "data_type": "NUMBER",
        "data_length": 25
      },
      {
        "excel_column_index": 5,
        "excel_column_name": "Ghi chú",
        "mapped_key": null,
        "mapped_name": null,
        "data_type": null,
        "data_length": null
      }
    ]
  }
}
```

#### Cách sử dụng trên FE:
```tsx
// Upload Excel
const formData = new FormData();
formData.append('file', excelFile);

const res = await fetch('/api/v1/lakehouse/excel-mapping/analyze', {
  method: 'POST',
  body: formData,
});
const { result } = await res.json();

// Hiển thị kết quả mapping cho user review
// result.header_row → dòng header
// result.data_start_row → dòng bắt đầu data
// result.column_mapping → bảng mapping cột (cho user xem/sửa trước khi import)
```
