# DB LAKEHOUSE API DOCUMENTATION

> **Pipeline: `.bak` File → Bronze → Silver → Gold + Chatbot & Charts**
>
> Base URL: `http://localhost:8000/api/v1/db-lakehouse`
>
> Version: 1.0.0

---

## MUC LUC

1. [Tong quan Pipeline](#1-tong-quan-pipeline)
2. [Bronze Layer - Import du lieu tho](#2-bronze-layer---import-du-lieu-tho)
   - 2.1 [POST /bronze/upload](#21-post-bronzeupload)
   - 2.2 [POST /bronze/import](#22-post-bronzeimport)
   - 2.3 [GET /bronze/{database_name}](#23-get-bronzedatabase_name)
3. [Silver Layer - Clean & Validate](#3-silver-layer---clean--validate)
   - 3.1 [POST /silver/transform](#31-post-silvertransform)
   - 3.2 [GET /silver/{database_name}](#32-get-silverdatabase_name)
4. [Gold Layer - Chuan hoa du lieu](#4-gold-layer---chuan-hoa-du-lieu)
   - 4.1 [POST /gold/transform](#41-post-goldtransform)
   - 4.2 [GET /gold/{database_name}](#42-get-golddatabase_name)
5. [Full Pipeline](#5-full-pipeline---chay-toan-bo)
   - 5.1 [POST /pipeline/upload](#51-post-pipelineupload)
   - 5.2 [POST /pipeline/run](#52-post-pipelinerun)
6. [Chat & Bieu do](#6-chat--bieu-do)
   - 6.1 [POST /chat](#61-post-chat)
   - 6.2 [POST /chart](#62-post-chart)
   - 6.3 [GET /chat/history/{session_id}](#63-get-chathistorysession_id)
7. [Quan ly Database](#7-quan-ly-database)
   - 7.1 [GET /databases](#71-get-databases)
   - 7.2 [GET /database/{database_name}](#72-get-databasedatabase_name)
8. [Streaming APIs (SSE)](#8-streaming-apis-sse)
   - 8.1 [POST /bronze/upload/stream](#81-post-bronzeuploadstream)
   - 8.2 [POST /silver/transform/stream](#82-post-silvertransformstream)
   - 8.3 [POST /gold/transform/stream](#83-post-goldtransformstream)
   - 8.4 [POST /pipeline/upload/stream](#84-post-pipelineuploadstream)
   - 8.5 [POST /pipeline/run/stream](#85-post-pipelinerunstream)
9. [Error Handling](#9-error-handling)
10. [Flow Diagram & Goi y trien khai FE](#10-flow-diagram--goi-y-trien-khai-fe)

---

## 1. TONG QUAN PIPELINE

DB Lakehouse la he thong xu ly du lieu theo mo hinh **Medallion Architecture** (Bronze → Silver → Gold) danh cho file backup SQL Server (.bak). He thong cung cap chatbot hoi dap va ve bieu do tu dong.

### Kien truc 3 tang:

| Tang | Database | Mo ta | Xu ly |
|------|----------|-------|-------|
| **Bronze** | `bronze_*` | Du lieu tho (raw) - giu nguyen tu file .bak | Restore .bak → DB |
| **Silver** | `silver_*` | Du lieu da clean & validate | Trim, remove duplicates, fix types, AI auto-clean |
| **Gold** | `gold_*` | Du lieu chuan hoa (standardized) | Rename columns, normalize dates/phones/names, format currency |

### Tinh nang Chatbot:
- Hoi dap bang tieng Viet → AI sinh SQL → tra ve ket qua + giai thich
- Tu dong phat hien yeu cau bieu do va sinh Plotly chart config
- Ho tro cac loai: `bar`, `line`, `pie`, `scatter`, `histogram`
- Luu lich su chat theo session

---

## 2. BRONZE LAYER - Import du lieu tho

Bronze layer la tang dau tien, luu tru du lieu nguyen ban tu file `.bak`. Du lieu duoc restore truc tiep vao SQL Server database moi.

---

### 2.1 POST /bronze/upload

> **Upload file .bak va import vao Bronze database**

**Content-Type:** `multipart/form-data`

#### Request (Form Data):

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `file` | File (.bak) | **Yes** | - | File backup SQL Server (.bak) |
| `server_id` | string | No | null | Server ID de restore (mac dinh = default server) |
| `database_name` | string | No | auto | Ten Bronze DB tuy chinh (auto = `bronze_{filename}_{timestamp}`) |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Ten database Bronze da tao |
| `tables_imported` | string[] | Danh sach ten bang da import |
| `table_count` | integer | So luong bang |
| `total_rows` | integer | Tong so dong du lieu |
| `message` | string | Thong bao ket qua |

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

### 2.2 POST /bronze/import

> **Import file .bak tu duong dan co san tren server**

**Content-Type:** `application/json`

#### Query Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `bak_file_path` | string | **Yes** | Duong dan tuyet doi den file .bak tren server |

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `server_id` | string | No | null | Server ID |
| `database_name` | string | No | auto | Ten Bronze DB tuy chinh |
| `tables` | string[] | No | null | Chi import cac bang nay (null = tat ca) |

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

### 2.3 GET /bronze/{database_name}

> **Xem chi tiet Bronze database**

#### Path Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `database_name` | string | **Yes** | Ten Bronze database |

#### Query Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `server_id` | string | No | Server ID (mac dinh = default) |

#### Response: `DatabaseInfoResponse`

| Field | Type | Mo ta |
|-------|------|-------|
| `database_name` | string | Ten database |
| `layer` | string | `"bronze"` |
| `tables` | BronzeTableInfo[] | Danh sach bang (xem schema ben duoi) |
| `total_rows` | integer | Tong so dong |
| `total_tables` | integer | Tong so bang |

#### Schema: BronzeTableInfo

| Field | Type | Mo ta |
|-------|------|-------|
| `table_name` | string | Ten bang |
| `row_count` | integer | So dong |
| `column_count` | integer | So cot |
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

## 3. SILVER LAYER - Clean & Validate

Silver layer lam sach va validate du lieu tu Bronze. Cac buoc xu ly: trim whitespace, remove duplicates, fill nulls, validate types. Co the dung AI auto-detect hoac truyen custom rules.

---

### 3.1 POST /silver/transform

> **Chuyen doi Bronze → Silver (clean & validate)**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `bronze_database` | string | **Yes** | - | Ten Bronze database nguon |
| `silver_database` | string | No | auto | Ten Silver DB dich (auto = `silver_{...}`) |
| `tables` | string[] | No | null | Chi transform cac bang nay (null = tat ca) |
| `auto_clean` | boolean | No | true | Su dung AI de tu dong phat hien va clean |
| `custom_rules` | CleaningRule[] | No | null | Cac quy tac clean tuy chinh (xem bang duoi) |
| `remove_duplicates` | boolean | No | true | Xoa cac dong trung lap |
| `remove_null_rows` | boolean | No | false | Xoa dong co tat ca gia tri NULL |

#### Schema: CleaningRule

| Field | Type | Required | Mo ta |
|-------|------|----------|-------|
| `column` | string | **Yes** | Ten cot can ap dung |
| `action` | string | **Yes** | Loai action (xem bang tham chieu) |
| `params` | object | No | Tham so cho action |

#### Bang tham chieu: CleaningRule actions

| Action | Mo ta | Params |
|--------|-------|--------|
| `trim` | Xoa khoang trang dau/cuoi | Khong can |
| `lowercase` | Chuyen chu thuong | Khong can |
| `uppercase` | Chuyen chu hoa | Khong can |
| `fill_default` | Dien gia tri mac dinh cho NULL | `{"value": "gia_tri"}` |
| `cast_type` | Chuyen doi kieu du lieu | `{"target_type": "int\|float\|str\|datetime"}` |
| `remove_empty_strings` | Thay chuoi rong bang NULL | Khong can |
| `regex_replace` | Thay the theo regex | `{"pattern": "...", "replacement": "..."}` |
| `normalize_date` | Chuan hoa dinh dang ngay | `{"format": "%Y-%m-%d"}` |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Database nguon |
| `silver_database` | string | Database dich da tao |
| `tables_transformed` | string[] | Danh sach bang da transform |
| `cleaning_report` | object | Bao cao chi tiet tung bang |
| `message` | string | Thong bao ket qua |

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

### 3.2 GET /silver/{database_name}

> **Xem chi tiet Silver database**

Tuong tu [GET /bronze/{database_name}](#23-get-bronzedatabase_name). Response co cung format `DatabaseInfoResponse`, voi `layer = "silver"`.

---

## 4. GOLD LAYER - Chuan hoa du lieu

Gold layer chuan hoa du lieu tu Silver: doi ten bang/cot, normalize dinh dang ngay thang, so dien thoai, ten nguoi, tien te. Co the tu dong (AI) hoac cau hinh thu cong qua `table_mappings`.

---

### 4.1 POST /gold/transform

> **Chuyen doi Silver → Gold (chuan hoa)**

**Content-Type:** `application/json`

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `silver_database` | string | **Yes** | - | Ten Silver database nguon |
| `gold_database` | string | No | auto | Ten Gold DB dich (auto = `gold_{...}`) |
| `table_mappings` | GoldTableMapping[] | No | null | Cau hinh mapping tung bang |
| `auto_standardize` | boolean | No | true | AI tu dong chuan hoa |

#### Schema: GoldTableMapping

| Field | Type | Required | Mo ta |
|-------|------|----------|-------|
| `source_table` | string | **Yes** | Ten bang trong Silver database |
| `target_table` | string | No | Ten bang moi trong Gold (null = giu nguyen) |
| `columns` | GoldColumnMapping[] | No | Mapping tung cot (null = giu tat ca, AI tu chuan hoa) |
| `exclude_columns` | string[] | No | Danh sach cot can loai bo khoi Gold |

#### Schema: GoldColumnMapping

| Field | Type | Required | Mo ta |
|-------|------|----------|-------|
| `source_column` | string | **Yes** | Ten cot goc trong Silver |
| `target_column` | string | No | Ten cot moi trong Gold (null = giu nguyen) |
| `transform` | string | No | Loai transform (xem bang duoi) |
| `params` | object | No | Tham so cho transform |

#### Bang tham chieu: Gold transforms

| Transform | Mo ta | Params | Vi du |
|-----------|-------|--------|-------|
| `normalize_date` | Chuan hoa ngay thang | `{"format": "%Y-%m-%d"}` | `01/03/2026` → `2026-03-01` |
| `normalize_phone` | Chuan hoa SDT (+84) | Khong can | `0912345678` → `+84912345678` |
| `normalize_name` | Chuan hoa ten (Title Case) | Khong can | `nguyen van A ` → `Nguyen Van A` |
| `uppercase` | Chuyen chu hoa | Khong can | `abc` → `ABC` |
| `lowercase` | Chuyen chu thuong | Khong can | `ABC` → `abc` |
| `trim` | Xoa khoang trang thua | Khong can | `  abc  ` → `abc` |
| `format_currency` | Lam tron so tien | `{"decimal_places": 2}` | `1234.5678` → `1234.57` |
| `cast_type` | Chuyen kieu du lieu | `{"target_type": "int"}` | `"123"` → `123` |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `status` | string | `"success"` |
| `silver_database` | string | Database nguon |
| `gold_database` | string | Database dich da tao |
| `tables_transformed` | string[] | Danh sach bang da chuan hoa |
| `standardization_report` | object | Bao cao chi tiet tung bang |
| `message` | string | Thong bao ket qua |

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

### 4.2 GET /gold/{database_name}

> **Xem chi tiet Gold database**

Tuong tu [GET /bronze/{database_name}](#23-get-bronzedatabase_name). Response co cung format `DatabaseInfoResponse`, voi `layer = "gold"`.

---

## 5. FULL PIPELINE - Chay toan bo

Chay toan bo pipeline tu file `.bak` → Bronze → Silver → Gold trong 1 buoc. Thich hop khi muon nhanh chong xu ly du lieu ma khong can can thiep tung buoc.

---

### 5.1 POST /pipeline/upload

> **Upload .bak va chay full pipeline**

**Content-Type:** `multipart/form-data`

#### Request (Form Data):

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `file` | File (.bak) | **Yes** | - | File backup SQL Server |
| `server_id` | string | No | null | Server ID |
| `bronze_database` | string | No | auto | Ten Bronze DB |
| `silver_database` | string | No | auto | Ten Silver DB |
| `gold_database` | string | No | auto | Ten Gold DB |
| `auto_clean` | boolean | No | true | AI auto clean cho Silver |
| `auto_standardize` | boolean | No | true | AI auto standardize cho Gold |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `status` | string | `"success"` |
| `bronze_database` | string | Ten Bronze DB da tao |
| `silver_database` | string | Ten Silver DB da tao |
| `gold_database` | string | Ten Gold DB da tao |
| `tables_processed` | integer | So bang da xu ly |
| `bronze_report` | object | Bao cao Bronze (tables, rows) |
| `silver_report` | object | Bao cao Silver (cleaning details) |
| `gold_report` | object | Bao cao Gold (standardization details) |
| `message` | string | Thong bao ket qua |

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

### 5.2 POST /pipeline/run

> **Chay full pipeline tu duong dan .bak co san**

**Content-Type:** `application/json`

#### Query Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `bak_file_path` | string | **Yes** | Duong dan tuyet doi den file .bak |

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `server_id` | string | No | null | Server ID |
| `bronze_database` | string | No | auto | Ten Bronze DB |
| `silver_database` | string | No | auto | Ten Silver DB |
| `gold_database` | string | No | auto | Ten Gold DB |
| `tables` | string[] | No | null | Chi xu ly cac bang nay (null = tat ca) |
| `auto_clean` | boolean | No | true | AI auto clean |
| `auto_standardize` | boolean | No | true | AI auto standardize |
| `table_mappings` | GoldTableMapping[] | No | null | Gold mapping tuy chinh |

#### Response:
Cung format voi [POST /pipeline/upload](#51-post-pipelineupload).

---

## 6. CHAT & BIEU DO

Chatbot hoi dap bang tieng Viet va ve bieu do tu dong tu du lieu Gold database. He thong su dung AI de sinh SQL query, tra ve du lieu va giai thich ket qua.

---

### 6.1 POST /chat

> **Hoi dap du lieu Gold database bang tieng Viet**

**Content-Type:** `application/json`

**Flow xu ly:**
1. Phan tich cau hoi va sinh SQL query
2. Thuc thi SQL tren Gold database
3. Sinh cau tra loi bang tieng Viet
4. Tu dong ve bieu do neu phu hop (`generate_chart=true`)

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `question` | string | **Yes** | - | Cau hoi bang tieng Viet |
| `database` | string | **Yes** | - | Ten Gold database de truy van |
| `server_id` | string | No | null | Server ID |
| `session_id` | string | No | auto | Session ID de luu lich su (auto = tao moi) |
| `generate_chart` | boolean | No | true | Tu dong phat hien va ve bieu do |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `answer` | string | Cau tra loi bang tieng Viet |
| `sql_query` | string \| null | SQL query da sinh va thuc thi |
| `data` | object[] \| null | Du lieu tra ve (toi da 100 dong) |
| `columns` | string[] \| null | Danh sach ten cot |
| `total_rows` | integer \| null | Tong so dong ket qua |
| `chart` | object \| null | Plotly chart config (neu co - xem chi tiet ben duoi) |
| `session_id` | string \| null | Session ID de tiep tuc hoi dap |

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

### Chi tiet: Chart object (Plotly config)

Object `chart` tra ve dung **truc tiep** voi [Plotly.js](https://plotly.com/javascript/) de render bieu do phia FE.

| Field | Type | Mo ta |
|-------|------|-------|
| `chart_type` | string | Loai bieu do: `bar`, `line`, `pie`, `scatter`, `histogram` |
| `data` | object[] | Mang Plotly trace objects (`type`, `x`, `y`, `name`, `mode`, `labels`, `values`) |
| `layout` | object | Plotly layout (`title`, `xaxis`, `yaxis`, `template`) |

#### Cach su dung tren FE (React):
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

#### Cach su dung tren FE (Vue):
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

### 6.2 POST /chart

> **Ve bieu do truc tiep tu Gold database**

**Content-Type:** `application/json`

Khac voi `/chat`, API nay **chi tra ve bieu do**, khong tra ve cau tra loi.

#### Request Body:

| Field | Type | Required | Default | Mo ta |
|-------|------|----------|---------|-------|
| `database` | string | **Yes** | - | Ten Gold database |
| `question` | string | **Yes** | - | Mo ta bieu do can ve |
| `server_id` | string | No | null | Server ID |
| `chart_type` | string | No | auto | Ep kieu bieu do: `bar`, `line`, `pie`, `scatter`, `heatmap` (auto = AI tu chon) |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `chart_type` | string | Loai bieu do da chon |
| `chart_config` | object | Plotly config day du (`data` + `layout`) |
| `sql_query` | string | SQL query da dung de lay du lieu |
| `data_summary` | string | Tom tat du lieu (so dong, so cot) |

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

### 6.3 GET /chat/history/{session_id}

> **Lay lich su hoi dap theo session**

#### Path Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `session_id` | string | **Yes** | Session ID tu response cua `/chat` |

#### Response:

| Field | Type | Mo ta |
|-------|------|-------|
| `session_id` | string | Session ID |
| `messages` | object[] | Mang cac message `{question, answer, timestamp}` |

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

## 7. QUAN LY DATABASE

---

### 7.1 GET /databases

> **Danh sach tat ca pipeline databases**

Tra ve danh sach tat ca database Bronze, Silver, Gold da tao cung metadata.

#### Response:

| Field | Type | Mo ta |
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

### 7.2 GET /database/{database_name}

> **Chi tiet bat ky database nao trong pipeline**

#### Path Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `database_name` | string | **Yes** | Ten database (Bronze/Silver/Gold) |

#### Query Parameters:

| Parameter | Type | Required | Mo ta |
|-----------|------|----------|-------|
| `server_id` | string | No | Server ID |

#### Response:
Cung format `DatabaseInfoResponse` nhu [GET /bronze/{database_name}](#23-get-bronzedatabase_name).

---

## 8. STREAMING APIs (SSE)

Tat ca cac API upload/transform deu co phien ban **streaming** tra ve **Server-Sent Events (SSE)** de FE hien thi progress realtime.

### Cach su dung SSE tren FE

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

### 8.1 POST /bronze/upload/stream

> **Upload .bak + import Bronze voi SSE progress**

**Content-Type:** `multipart/form-data`
**Response Content-Type:** `text/event-stream`

**Request:** Giong [POST /bronze/upload](#21-post-bronzeupload)

#### SSE Events:

| Event | Khi nao | Data fields |
|-------|---------|-------------|
| `start` | Bat dau restore | `step`, `message`, `progress: 0` |
| `progress` | Dang restore .bak | `step: "restore"`, `message`, `progress: 10-50` |
| `table_done` | Moi bang doc xong | `table`, `row_count`, `column_count`, `tables_done`, `tables_total`, `progress` |
| `table_error` | Loi doc 1 bang | `table`, `message` |
| `complete` | Hoan tat | `status: "success"`, `bronze_database`, `tables_imported`, `total_rows`, `progress: 100` |
| `error` | Loi nghiem trong | `message` |

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

### 8.2 POST /silver/transform/stream

> **Clean Bronze -> Silver voi SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giong [POST /silver/transform](#31-post-silvertransform)

#### SSE Events:

| Event | Khi nao | Data fields |
|-------|---------|-------------|
| `start` | Bat dau Silver | `step: "silver"`, `message`, `progress: 0` |
| `progress` | Tong quan | `tables_total`, `progress: 5` |
| `table_start` | Bat dau clean 1 bang | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Clean xong 1 bang | `table`, `report` (original_rows, cleaned_rows, duplicates_removed, actions_applied), `progress` |
| `table_error` | Loi clean 1 bang | `table`, `message` |
| `complete` | Hoan tat | `status: "success"`, `silver_database`, `tables_transformed`, `cleaning_report`, `progress: 100` |

---

### 8.3 POST /gold/transform/stream

> **Chuan hoa Silver -> Gold voi SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request Body:** Giong [POST /gold/transform](#41-post-goldtransform)

#### SSE Events:

| Event | Khi nao | Data fields |
|-------|---------|-------------|
| `start` | Bat dau Gold | `step: "gold"`, `message`, `progress: 0` |
| `progress` | Tong quan | `tables_total`, `progress: 5` |
| `table_start` | Bat dau chuan hoa 1 bang | `table`, `tables_done`, `tables_total`, `progress` |
| `table_done` | Chuan hoa xong 1 bang | `table`, `target_table`, `report` (columns_renamed, data_transforms, rows), `progress` |
| `table_error` | Loi chuan hoa 1 bang | `table`, `message` |
| `complete` | Hoan tat | `status: "success"`, `gold_database`, `tables_transformed`, `standardization_report`, `progress: 100` |

---

### 8.4 POST /pipeline/upload/stream

> **Upload .bak + full pipeline Bronze->Silver->Gold voi SSE progress**

**Content-Type:** `multipart/form-data`
**Response Content-Type:** `text/event-stream`

**Request:** Giong [POST /pipeline/upload](#51-post-pipelineupload)

Day la API **quan trong nhat** cho FE - chay toan bo pipeline va stream progress realtime.

#### Overall progress: Bronze 0-33%, Silver 33-66%, Gold 66-100%

Moi event co them 2 field:
- `overall_progress` (0-100): Progress toan bo pipeline
- `pipeline_step` (`"bronze"` | `"silver"` | `"gold"`): Buoc hien tai

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

### 8.5 POST /pipeline/run/stream

> **Full pipeline tu path .bak voi SSE progress**

**Content-Type:** `application/json`
**Response Content-Type:** `text/event-stream`

**Request:** Giong [POST /pipeline/run](#52-post-pipelinerun) (query param `bak_file_path` + JSON body)

**Events:** Giong [POST /pipeline/upload/stream](#84-post-pipelineuploadstream)

---

## 9. ERROR HANDLING

Tat ca API tra ve HTTP status code chuan va error detail:

| HTTP Code | Y nghia | Khi nao xay ra |
|-----------|---------|----------------|
| **200** | Thanh cong | Request xu ly thanh cong |
| **400** | Bad Request | File khong phai .bak, du lieu khong hop le, khong the ve bieu do |
| **404** | Not Found | File .bak khong ton tai tren server |
| **422** | Validation Error | Thieu field bat buoc hoac sai kieu du lieu |
| **500** | Server Error | Loi SQL Server, loi AI, loi he thong |

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

## 10. FLOW DIAGRAM & GOI Y TRIEN KHAI FE

### A. Full Pipeline Flow

```
[Upload .bak file]
       |
       v
+------------------+
|   BRONZE LAYER   |  POST /bronze/upload
|  (Du lieu tho)   |  Restore .bak -> SQL Server DB
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
|  (Chuan hoa)     |  Rename, normalize, format
+------------------+
       |
       v
+------------------+
|  CHATBOT & CHART |  POST /chat, POST /chart
|  Hoi dap + Bieu  |  Text2SQL + Plotly charts
|  do tu Gold DB   |
+------------------+
```

### B. Chat Flow

```
[Nguoi dung hoi: "Thong ke doanh thu theo thang"]
       |
       v
[AI phan tich cau hoi]
       |
       v
[Sinh SQL: SELECT Month, SUM(Revenue) ... GROUP BY Month]
       |
       v
[Thuc thi SQL tren Gold DB]
       |
       v
[AI sinh cau tra loi tieng Viet]
       |
       v
[Detect yeu cau bieu do? -> Sinh Plotly config]
       |
       v
[Tra ve: answer + data + chart (Plotly JSON)]
```

### C. Goi y trien khai FE

| Trang | Mo ta | API su dung |
|-------|-------|-------------|
| **Upload** | Form upload file .bak, hien progress | `POST /pipeline/upload` hoac `POST /bronze/upload` |
| **Quan ly DB** | Hien danh sach Bronze/Silver/Gold, click xem chi tiet | `GET /databases`, `GET /database/{name}` |
| **Transform** | Cho phep cau hinh Silver rules va Gold mappings, chay tung buoc | `POST /silver/transform`, `POST /gold/transform` |
| **Chatbot** | Giao dien chat, hien answer + data table + chart | `POST /chat`, `GET /chat/history/{session_id}` |
| **Bieu do** | Giao dien ve bieu do rieng, chon kieu chart | `POST /chart` |

### D. FE Libraries goi y

| Thu vien | Muc dich |
|----------|----------|
| `react-plotly.js` / `vue-plotly` | Render bieu do tu Plotly config |
| `axios` / `fetch` | Goi API |
| `ant-design` / `shadcn` | UI components (table, form, upload) |
| `react-markdown` | Render markdown trong cau tra loi chatbot |
