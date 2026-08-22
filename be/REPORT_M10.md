# M10 - Báo cáo theo mẫu, có fact snapshot

Triển khai module M10 theo mục 5.3 và phụ lục G (UC10.01–UC10.08) của
`docs/Bo_giai_phap_Lakehouse_AI_OnPremise.docx`.

## Nguyên tắc trung tâm

> "Số liệu phải lấy từ query/data product có version; cấm để LLM tự suy đoán số.
> AI chỉ soạn nhận xét từ facts đã khóa." — mục 5.3

Toàn bộ thiết kế xoay quanh câu này. Thứ tự thực hiện là cố định và không đảo
được: **chốt số liệu trước, gọi AI sau**. Mô hình chỉ nhìn thấy các fact đã
khoá, nên không có đường nào để nó tạo ra một con số mới.

## Luồng

```
UC10.01  tải mẫu DOCX/XLSX        → ReportTemplateVersion (DRAFT)
UC10.02  quét placeholder          → ReportPlaceholder  (máy quét, không khai tay)
UC10.03  ánh xạ                    → ReportMapping → ReportDataQuery đã duyệt
UC10.04  kiểm tra                  → chặn nếu còn placeholder chưa map
         phê duyệt mẫu             → bốn mắt: người tạo mẫu không tự duyệt
UC10.05  tạo lần sinh              → CHỐT SỐ LIỆU (ReportFact + checksum)
UC10.06  AI soạn nhận xét          → chỉ từ fact đã khoá; sửa tay được
         xem trước                 → render từ snapshot, không chạy lại truy vấn
UC10.07  trình duyệt → phê duyệt   → bốn mắt; đối chiếu lại checksum
UC10.08  xuất bản                  → watermark theo nhãn bảo mật; lưu artifact
```

## Fact snapshot

Mỗi số liệu được lưu thành một `report_fact` kèm đầy đủ nguồn gốc:

| Trường | Ý nghĩa |
|---|---|
| `code` | Mã fact (`F1`, `F2`…) dùng trong lời dẫn AI |
| `value` / `rawValue` | Giá trị đã định dạng và giá trị thô |
| `dataQueryCode` + `dataQueryVersion` | Truy vấn nào, phiên bản nào |
| `sourceColumn` + `sourceRowIndex` | Cột và dòng cụ thể |
| `sourceRowCount` | Số dòng truy vấn trả về lúc chốt |
| `executedAt` | Thời điểm chạy |

Nhờ vậy có thể trả lời "con số này ở đâu ra" nhiều tháng sau, kể cả khi dữ liệu
nguồn đã đổi.

**Checksum snapshot** là SHA-256 trên toàn bộ fact đã sắp xếp. Nó được đối chiếu
lại ở bước phê duyệt: nếu số liệu đã đổi so với lúc trình duyệt, hệ thống từ
chối phê duyệt và yêu cầu tạo lại báo cáo (AC-05).

Một truy vấn dùng cho nhiều placeholder **chỉ chạy một lần** cho mỗi lần sinh,
nên hai chỗ cùng nguồn không thể ra hai con số khác nhau vì chạy lệch thời điểm.

## Truy vấn số liệu có kiểm soát

Người thiết kế mẫu **không viết SQL tự do**; họ chọn trong danh mục
`report_data_query` đã được người khác phê duyệt.

Ba lớp bảo vệ (mục 6.4):

1. **Lúc khai báo** — `QueryGuard` chặn: câu lệnh không bắt đầu bằng
   `SELECT`/`WITH`, nhiều câu lệnh, bình luận (`--`, `/* */`), và các từ khoá
   `insert/update/delete/drop/alter/create/grant/call/copy/dblink/pg_read_file`…
   Không qua được thì không vào danh mục, nên không có đường nào để chạy.
2. **Lúc chạy** — tham số luôn được bind (`:period_start`, `:period_end`), không
   nối chuỗi; câu lệnh được bọc trong `LIMIT`; có timeout 30 giây.
3. **Lúc dùng** — chỉ truy vấn `APPROVED` mới map được vào placeholder.

## Phần nhận xét AI

Backend **không tự gọi mô hình**. Nó gửi các fact đã khoá sang worker qua
`POST /api/v1/narrative`, kèm token của chính người dùng, để phần AI chịu đúng
clearance của họ. Worker áp dụng model registry, quy tắc AI enclave và bộ kiểm
chứng số liệu của M09 — quy tắc "AI không tự tạo số liệu" chỉ cần thực thi ở một
chỗ.

Worker **chặn** (không phải cảnh báo) khi đoạn văn chứa số không có trong
snapshot. Bản bị chặn được lưu với `blocked = true` và nội dung rỗng; người dùng
phải tự viết trước khi trình duyệt được.

Bản do mô hình sinh ra (`generatedText`) không bao giờ bị ghi đè, kể cả khi người
dùng sửa tay (`finalText`), để đối chiếu về sau.

Mỗi lần sinh lưu lại `aiModelId`, `aiModelVersion`, `aiPromptVersion` cùng
`factCodes` của từng đoạn — đúng yêu cầu "lưu template version, query snapshot,
model version, prompt version và người phê duyệt".

## Phê duyệt bốn mắt

Ba chỗ áp dụng, đều trả HTTP 409 khi vi phạm:

| Hành động | Ai không được duyệt |
|---|---|
| Phê duyệt truy vấn | người tạo truy vấn |
| Phê duyệt phiên bản mẫu | người tạo mẫu |
| Phê duyệt lần sinh báo cáo | người tạo và người trình |

Từ chối bắt buộc kèm lý do.

## Xuất bản

- Chỉ báo cáo `APPROVED` mới xuất được (chưa duyệt → 409).
- Render **chỉ đọc từ snapshot**, không chạy lại truy vấn nào.
- Nếu sau khi render còn placeholder chưa thay, hệ thống **không phát hành** và
  trả về danh sách chỗ còn trống.
- Watermark theo mức độ mật: mức ≥4 "TỐI MẬT", ≥3 "MẬT", ≥2 "HẠN CHẾ"; mức 0–1
  không đóng dấu.
- Artifact lưu vào object storage kèm SHA-256; audit ghi lại khoá tệp, watermark
  và checksum.

## Placeholder

Cú pháp theo mục 5.3, quét bằng POI từ đoạn văn, bảng, header và footer (DOCX)
hoặc ô chuỗi (XLSX):

| Cú pháp | Loại | Nguồn |
|---|---|---|
| `{{ten}}` | FIELD | một ô của truy vấn |
| `{{table.ten}}` | TABLE | cả bảng kết quả |
| `{{chart.ten}}` | CHART | cả bảng, để dựng biểu đồ |
| `{{ai.ten}}` | AI_SECTION | nhận xét do AI soạn |

Hệ thống tự điền thêm: `{{report.title}}`, `{{report.period_start}}`,
`{{report.period_end}}`, `{{report.generated_at}}`,
`{{report.snapshot_checksum}}`.

Khi thay chuỗi trong DOCX, toàn bộ run của một đoạn được ghép lại trước, nên
placeholder bị Word cắt thành nhiều run vẫn được thay đúng và định dạng gốc
được giữ.

## API

```
GET/POST  /report-templates                       định nghĩa báo cáo
POST      /report-templates/{code}/versions       tải mẫu, quét placeholder
GET       /report-templates/{code}/versions
GET       /report-templates/versions/{id}         mẫu + placeholder + ánh xạ
GET       /report-templates/versions/{id}/validate
POST      /report-templates/versions/{id}/approve (approval.decide)
PUT       /report-templates/mappings

GET/POST  /report-templates/data-queries          danh mục truy vấn
POST      /report-templates/data-queries/{id}/approve
POST      /report-templates/data-queries/{id}/preview

GET/POST  /report-runs                            lần sinh báo cáo
GET       /report-runs/{id}
PUT       /report-runs/narratives/{id}            sửa tay nhận xét
GET       /report-runs/{id}/preview               render từ snapshot
POST      /report-runs/{id}/submit
POST      /report-runs/{id}/decision              (approval.decide)
POST      /report-runs/{id}/export
```

Quyền mới: `report.design` (thiết kế mẫu và truy vấn), bên cạnh
`report.generate` đã có.

## Object storage tại chỗ

`S3Config` nay nhận `aws.s3.endpoint` (biến môi trường `AWS_S3_ENDPOINT`). Có
giá trị thì client dùng endpoint đó với path-style addressing, hợp với MinIO và
Ceph RGW — đúng định hướng Object Storage on-premise nói giao thức S3 ở mục 3.1.
Bỏ trống thì vẫn dùng AWS như trước.

## Chạy kiểm thử

```bash
# Cần: backend đang chạy, object storage sẵn sàng, hai tài khoản khác nhau.
BASE_URL=http://localhost:8080/api \
ADMIN_USER=admin ADMIN_PASS='…' \
APPROVER_USER=approver APPROVER_PASS='…' \
  bash tools/smoke_report.sh
```

Kiểm 40 điểm: chặn câu lệnh ghi và nhiều câu lệnh, bốn mắt ở cả ba chỗ, quét đủ
bốn loại placeholder, chặn khi chưa map, khoá ánh xạ sau khi duyệt mẫu, định
dạng số theo quy ước Việt Nam, fact ghi nguồn gốc, chốt bảng, chặn trình duyệt
khi mục AI trống, xem trước, chặn xuất bản khi chưa duyệt, checksum không đổi
qua các bước, và audit.

Hai tiện ích đi kèm:

- `tools/make_sample_template.js` — sinh tệp mẫu DOCX có đủ bốn loại placeholder.
- `tools/stub_llm_server.js` — endpoint OpenAI-compatible giả lập, để kiểm chuỗi
  backend → worker → mô hình mà không cần LLM thật. Đặt `STUB_FABRICATE=1` để
  giả lập mô hình bịa số liệu và kiểm tra bộ chặn.

## Còn thiếu so với tài liệu

- **Biểu đồ thật** — placeholder `{{chart.*}}` hiện được chốt thành bảng số liệu
  và render ra bảng, chưa dựng hình.
- **XLSX chỉ thay ô chuỗi** — chưa chèn bảng nhiều dòng vào sheet như bên DOCX.
- **Nguồn số liệu** — mới lấy từ PostgreSQL của portal. Chưa đấu sang Gold của
  worker hay Trino (mục 4.3 `gold_report`).
- **Retention và tiêu huỷ artifact** — chưa có job dọn theo chính sách lưu giữ.
- **Phân phối sau phát hành** — sự kiện `ReportApproved` ở mục 8.3 chưa được đẩy
  sang kênh phân phối nào.
- **Bảng ánh xạ nhiều dòng** — một placeholder FIELD hiện lấy đúng một ô; chưa
  hỗ trợ lặp đoạn theo danh sách.
