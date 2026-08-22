# Tình trạng triển khai

Bảng theo dõi tiến độ hiện thực hoá `docs/Bo_giai_phap_Lakehouse_AI_OnPremise.docx`
(14 module M01–M14) trên ba thành phần của hệ thống.

**Cập nhật lần cuối:** 22/08/2026

| Thành phần | Thư mục | Công nghệ |
|---|---|---|
| Backend / Portal | `be/` | Spring Boot 4, Java 21, PostgreSQL |
| Worker xử lý dữ liệu | `ai_worker_lake_house/` | Flask, SQLAlchemy, ChromaDB |
| Frontend | `fe-modul-report/` | React 19, Vite, Ant Design |

Ký hiệu: ✅ xong trong phạm vi đã chốt · 🟡 mới có một phần · ⬜ chưa làm

---

## 1. Tổng quan theo module

| Mã | Module | Trạng thái | Nằm ở đâu | Ghi chú ngắn |
|---|---|---|---|---|
| M01 | Identity & Access | ✅ | `be` + `fe` | RBAC+ABAC, MFA, service account, rà soát quyền, thu hồi tức thì. Thiếu SSO/IdP |
| M02 | Data Source Management | ✅ | `worker` + `fe` | Connector allowlist, credential chỉ là tham chiếu Vault (kể cả trong thông điệp lỗi), cấu hình có phiên bản, watermark chỉ tiến khi thành công, resync trùng bị chặn, schema drift phá vỡ đưa nguồn vào cách ly. Chưa có driver thật và scheduler |
| M03 | Upload & Ingestion | ✅ | `worker` + `fe` | Multipart, SHA-256, AV scan, quarantine, immutable version, job bất đồng bộ |
| M04 | Data Catalog | ✅ | `worker` + `fe` | Dataset có cổng công bố, schema tự phân loại breaking/additive, kế thừa tag PII, lineage tự ghi, impact analysis, glossary. Chưa tự sinh dataset từ pipeline |
| M05 | Pipeline Management | ✅ | `worker` + `fe` | DAG có phiên bản và checksum, bắt buộc ghim worker image, chạy idempotent hai mức, checkpoint là chỗ huỷ có hiệu lực, không ghi đè output, backfill vượt quota qua phê duyệt M07, SLA chỉ cảnh báo. Chưa có scheduler và chưa gộp với lớp job cũ |
| M06 | Data Quality | ✅ | `worker` + `fe` | 8 loại rule phủ 6 chiều chất lượng, ngưỡng duyệt bốn mắt, profiling đề xuất rule, điểm tái lập từ evidence, waiver có hạn, issue tự đóng, chặn công bố Gold khi CRITICAL hỏng. Chưa có thông báo thật và chạy theo lịch |
| M07 | Approval & Governance | ✅ | `worker` + `be` + `fe` | Ma trận phê duyệt cấu hình được, khoá ảnh chụp bằng chứng (đổi tài nguyên là mất hiệu lực), bốn mắt đủ hai vế, hạ mức mật cần an toàn thông tin, legal hold thắng retention, thu hồi cắt tới BI/API/AI. Ba chỗ bốn mắt cũ chưa gộp vào engine chung |
| M08 | Search & Discovery | ✅ | `worker` + `fe` | BM25 tự cài + vector + graph, hợp nhất bằng RRF, một truy vấn xếp hạng chung 4 loại tài nguyên, facet/gợi ý chỉ tính trên phần được phép đọc, preview trả 404 chứ không 403, truy vấn đã lưu. Chưa có reranker bằng mô hình |
| M09 | AI Chat | ✅ | `worker` + `fe` | Model registry, router, retrieval hybrid đủ 5 công cụ (vector, full-text, metadata, graph, SQL qua tầng ngữ nghĩa), permission trimming, verifier, chống injection, DLP, audit. Chưa có bộ đánh giá mô hình |
| M10 | Report Template | ✅ | `be` + `fe` | Fact snapshot có checksum, truy vấn có version và duyệt, bốn mắt, AI chỉ viết từ số liệu đã chốt, watermark khi xuất. Chưa dựng biểu đồ thật |
| M11 | Dynamic API | ✅ | `worker` + `fe` | API dựng từ metadata gold_api, che trường nhạy cảm, security review bốn mắt, OAuth2 client credentials, rate limit, kill switch. Chưa có mTLS thật và gateway DMZ |
| M12 | BI / Tableau | ✅ | `worker` + `fe` | View trên gold_bi, row-level security bắt buộc, kiểm thử persona, extract có trần và giữ bản trước khi lỗi, export nhạy cảm cần phê duyệt, kill switch. Chưa nối Tableau Server thật |
| M13 | Administration & Policy | ✅ | `be` + `worker` | Chính sách là bundle có phiên bản, publish nguyên khối và áp thẳng vào bảng đang chạy, rollback tạo phiên bản mới, dry-run báo tác động, giảm bảo vệ tự phát hiện và cần an toàn thông tin duyệt, break-glass tự hết hạn và bắt buộc rà soát. Chưa có màn hình quản trị |
| M14 | Observability & Audit | ✅ | `be` + `worker` | Metric, log che trước khi lưu (khoá riêng thì cách ly), trace dựng lại cả request, cảnh báo bắt buộc owner+runbook và gộp bão mà không mất bằng chứng, sự cố phải nêu nguyên nhân gốc, SLO, bằng chứng có hash. Audit vẫn chỉ ghi thêm. Chưa có màn hình và chưa đẩy SIEM ngoài |

**Lộ trình đã thống nhất:** nền tảng metadata + M03 → M01 → M09 → M10. Cả bốn
đã xong. Lược đồ của cả hai hệ nay do migration có phiên bản quản lý — xem
[MIGRATIONS.md](MIGRATIONS.md).

---

## 2. Chi tiết phần đã làm

### 2.1 Nền tảng metadata + M03 Ingestion — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/INGESTION_M03.md`](ai_worker_lake_house/INGESTION_M03.md)

Trước đó worker không có cơ sở dữ liệu, toàn bộ trạng thái nằm ở filesystem, nên
không module nào từ M04 trở lên có chỗ gắn metadata, lineage, nhãn bảo mật hay
audit. Lát cắt này dựng lớp đó.

**Đã có**

- 14 bảng metadata theo mục 7.1/7.2: `bronze_object`, `object_version`,
  `upload_session`/`upload_part`, `processing_job`, `dlq_item`, `artifact`,
  `malware_scan`, `security_label`, `retention_policy`, `organization`,
  `data_source`, `audit_event`, `domain_event`.
- Vòng đời đối tượng đúng mục 4.1.2:
  `UPLOADING → UPLOADED → QUARANTINED → ACCEPTED → PROCESSING → PROCESSED`.
- Upload nhiều part, resume được, đối chiếu SHA-256 đầu-cuối, phát hiện MIME
  theo magic bytes chứ không theo đuôi file.
- Quét mã độc (ClamAV hoặc EICAR cho DEV); scanner hỏng thì giữ QUARANTINED.
- Lưu trữ content-addressed bất biến, chính sách trùng lặp
  `REJECT` / `LINK_EXISTING` / `NEW_VERSION`.
- Job chạy nền có lease, retry backoff, DLQ và replay — **OCR không còn chạy
  trong request upload** như tài liệu yêu cầu.
- Audit chỉ ghi thêm + outbox sự kiện theo mục 8.3.
- 22 endpoint mới, khung lỗi thống nhất theo mục 8.2.
- Giao diện: [`fe-modul-report/src/features/ingestion/`](fe-modul-report/src/features/ingestion/)
  — tải lên có tính checksum ở trình duyệt, bảng đối tượng, drawer chi tiết,
  trang Job & DLQ, trang audit.

**Kiểm chứng:** `tools/smoke_ingestion.py` — 27/27 điểm đạt.

### 2.2 M01 Identity & Access Management — ✅

Tài liệu chi tiết: [`be/IAM_M01.md`](be/IAM_M01.md)

**Đã có**

- 8 bảng IAM; `User` bổ sung vai trò, đơn vị, mức độ mật, MFA, `tokenVersion`,
  khoá tài khoản.
- 13 quyền hạt nhỏ và 10 vai trò nền tảng, nạp tự động và đồng bộ mỗi lần deploy.
- JWT mang `roles`, `perms`, `org_id`, `clearance_level`, `attrs`, `tv`.
- Mức độ mật hiệu lực = min(mức được cấp, trần của vai trò) — deny thắng allow.
- MFA TOTP theo RFC 6238, ghi danh hai bước.
- Service account + luồng client_credentials, secret chỉ hiện một lần.
- Rà soát quyền định kỳ; quyết định thu hồi áp dụng ngay và bắt buộc có lý do.
- Thu hồi có hiệu lực tức thì qua `tokenVersion` (đổi quyền, đổi mật khẩu,
  thu hồi tài khoản đều làm token cũ mất hiệu lực).
- Giao diện: [`fe-modul-report/src/features/auth/pages/IamAdminPage.tsx`](fe-modul-report/src/features/auth/pages/IamAdminPage.tsx),
  đăng nhập có bước nhập mã MFA.

**Kiểm chứng:** `be/tools/smoke_iam.sh` — 44/44 điểm đạt, chạy trên
Spring Boot + PostgreSQL thật.

### 2.3 M09 AI Chat có kiểm soát — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/AI_CHAT_M09.md`](ai_worker_lake_house/AI_CHAT_M09.md)

**Đã có**

- Model registry theo mục 6.2: mức độ mật tối đa, cờ enclave, trạng thái phê
  duyệt, hạn mức, bộ đánh giá. Mô hình ngoài enclave **không thể** được cấp mức
  miền C; không phê duyệt được mô hình chưa có bộ đánh giá.
- Job `AI_INDEX` chạy sau Bronze; mỗi chunk kế thừa nhãn bảo mật và đơn vị sở
  hữu của đối tượng nguồn.
- Permission trimming hai lớp: điều kiện lọc nằm trong truy vấn vector, và mọi
  kết quả còn được đối chiếu lại với metadata trước khi vào ngữ cảnh.
- Router phân loại VECTOR / FULLTEXT / METADATA / GRAPH / SQL, và cả năm nay
  đều có bộ thực thi (xem mục 2.10, 2.11, 2.12).
- Chống prompt injection: loại ký tự ẩn, vô hiệu hoá câu mệnh lệnh trong tài
  liệu, chặn tài liệu đóng hàng rào ngữ cảnh.
- DLP trên cả câu hỏi, ngữ cảnh và câu trả lời.
- Verifier: không trích dẫn thì chặn; số liệu không có trong tài liệu nguồn thì
  cảnh báo và hạ độ tin cậy.
- Từ chối khi không đủ bằng chứng hoặc không có mô hình đủ thẩm quyền, thay vì
  suy đoán hoặc hạ cấp âm thầm.
- Audit ghi quyết định chứ không ghi nội dung hỏi/đáp.
- Giao diện: [`GovernedChatPage.tsx`](fe-modul-report/src/features/ingestion/pages/GovernedChatPage.tsx)
  hiển thị nguồn, cảnh báo, độ tin cậy, công cụ đã chạy và số kết quả bị lọc;
  [`ModelRegistryPage.tsx`](fe-modul-report/src/features/ingestion/pages/ModelRegistryPage.tsx)
  để phê duyệt/đình chỉ mô hình.

**Đã sửa một lỗi thật:** nhánh sinh biểu đồ của RAG cũ tạo dữ liệu giả
(`Item 0..4`) rồi trả về như số liệu thật — vi phạm nguyên tắc "AI không phải
nguồn sự thật" ở mục 2 và 5.3.

**Kiểm chứng:** `tools/smoke_ai_chat.py` — 37/37 điểm đạt.

### 2.4 M10 Báo cáo theo mẫu, có fact snapshot — ✅

Tài liệu chi tiết: [`be/REPORT_M10.md`](be/REPORT_M10.md)

**Đã có**

- Định nghĩa báo cáo, phiên bản mẫu DRAFT → APPROVED → RETIRED, chỉ một phiên
  bản được duyệt tại một thời điểm.
- Quét placeholder bằng POI từ DOCX (đoạn, bảng, header, footer) và XLSX; nhận
  diện `{{field}}`, `{{table.*}}`, `{{chart.*}}`, `{{ai.*}}`.
- Danh mục truy vấn có phiên bản và phải được người khác phê duyệt; `QueryGuard`
  chặn câu lệnh ghi, nhiều câu lệnh và bình luận ngay từ lúc khai báo.
- **Fact snapshot**: mỗi số liệu lưu kèm truy vấn, phiên bản, cột, dòng và thời
  điểm chạy; checksum SHA-256 được đối chiếu lại ở bước phê duyệt.
- Một truy vấn chỉ chạy một lần cho mỗi lần sinh, nên hai placeholder cùng nguồn
  không thể lệch số.
- AI viết nhận xét qua worker (M09), chỉ từ fact đã khoá; số liệu bịa **bị chặn**
  chứ không chỉ cảnh báo. Bản gốc của mô hình được giữ song song bản sửa tay.
- Phê duyệt bốn mắt ở ba chỗ: truy vấn, mẫu, và lần sinh báo cáo.
- Xuất bản chỉ sau khi duyệt; render đọc từ snapshot; watermark theo mức độ mật;
  từ chối phát hành nếu còn placeholder chưa thay.
- `S3Config` nhận `AWS_S3_ENDPOINT` để dùng object storage tại chỗ (MinIO,
  Ceph RGW) đúng định hướng mục 3.1.
- Giao diện: [`GovernedReportPage.tsx`](fe-modul-report/src/features/report-governed/pages/GovernedReportPage.tsx)
  cùng modal quản lý mẫu/ánh xạ và drawer chi tiết hiển thị nguồn gốc từng con số.

**Kiểm chứng:** `be/tools/smoke_report.sh` — 40/40 điểm đạt, chạy trên
Spring Boot + PostgreSQL + MinIO thật.

Chuỗi ba dịch vụ đã kiểm trực tiếp: backend → worker → mô hình. Với
`STUB_FABRICATE=1`, mô hình thêm con số không có trong snapshot; worker chặn với
lý do `fabricated_numbers`, backend lưu mục nhận xét ở trạng thái bị chặn, và
bước trình duyệt trả về `400 Còn 1 mục AI bị chặn`.

### 2.5 Nền tảng: migration có phiên bản — ✅

Tài liệu chi tiết: [`MIGRATIONS.md`](MIGRATIONS.md)

Trước đó backend dùng `ddl-auto: update` và worker dùng `create_all`: schema tự
đổi theo entity, không có đường lùi, không kiểm soát được thay đổi phá vỡ. Đây
là nợ chặn việc lên môi trường có dữ liệu thật.

**Đã có**

- **Flyway** cho `be`: `V1__baseline_schema.sql` chụp lại 46 bảng hiện có,
  `V2__audit_append_only.sql` gắn trigger chặn UPDATE/DELETE trên
  `iam_auth_audit_event`. Hibernate chuyển sang `ddl-auto: validate` — không sửa
  schema nữa, chỉ báo lỗi lúc khởi động nếu entity và bảng lệch nhau.
  `baseline-on-migrate` cho phép database đang chạy được đánh mốc mà không chạy
  lại baseline.
- **Alembic** cho worker: `init_db()` chạy `alembic upgrade head` khi khởi động;
  `env.py` lấy URL và metadata từ chính ứng dụng nên không thể trỏ nhầm cơ sở dữ
  liệu; `render_as_batch` cho SQLite để cùng một migration chạy được trên cả
  SQLite lẫn PostgreSQL.
- `BusinessException` tách lỗi nghiệp vụ khỏi lỗi hạ tầng: thông điệp cố ý vẫn
  ra tới người dùng (và nay trả đúng 404 thay vì 500), còn lỗi ngoài dự kiến chỉ
  trả thông điệp chung kèm `correlationId`.

**Kiểm chứng:** `ai_worker_lake_house/tools/check_migrations.py` — 4/4 điểm đạt
(22 bảng, chạy lại không đổi phiên bản). Backend khởi động trên database rỗng:
Flyway áp đủ 2 migration rồi Hibernate `validate` mới qua. Trigger audit đã thử
thực tế: `UPDATE` và `DELETE` đều bị chặn.

**Một cái bẫy đã gặp:** `spring.jpa.defer-datasource-initialization: true` khiến
Boot bắt Flyway chờ EntityManagerFactory — đúng khi Hibernate tạo schema, sai
hoàn toàn khi Flyway mới là bên tạo, và sinh ra phụ thuộc vòng. Đã đặt về `false`.

### 2.6 M04 Data Catalog — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/CATALOG_M04.md`](ai_worker_lake_house/CATALOG_M04.md)

**Đã có**

- Dataset theo namespace của mục 4.3 (`bronze`, `silver`, `gold_report`,
  `gold_bi`, `gold_api`, `gold_ai`, `gold_approved_kg`, `gold_public`).
- **Cổng công bố**: thiếu chủ sở hữu, nhãn bảo mật, schema hoặc SLA thì không
  công bố được, và API trả về đúng danh sách còn thiếu.
- **Phân loại thay đổi schema do máy tính**, không do người khai: bỏ cột, đổi
  kiểu, siết NOT NULL hoặc thêm cột bắt buộc đều là BREAKING và tăng major;
  thêm cột nullable là ADDITIVE và tăng minor. `change_detail` ghi rõ cột nào vỡ.
- **Kế thừa tag PII/MẬT** xuống dataset dẫn xuất, kể cả khi người khai bỏ trống.
- **Lineage tự ghi khi dữ liệu di chuyển**: object → version → artifact → chunk,
  cộng thêm cạnh tới job và tới consumer. Truy ngược từ một chunk về đối tượng
  nguồn đã kiểm thực tế.
- Phân tích ảnh hưởng và ngừng sử dụng có thời gian chuyển đổi bắt buộc khi còn
  consumer.
- Glossary, tìm kiếm có lọc theo clearance và đơn vị, sự kiện `DatasetPublished`
  / `DatasetDeprecated` / `SchemaChanged`.
- Quyền mới `catalog.manage` ở cả portal lẫn worker.
- Giao diện: [`CatalogPage.tsx`](fe-modul-report/src/features/ingestion/pages/CatalogPage.tsx)
  — danh sách, schema có nhãn PII, lịch sử phiên bản, cảnh báo thay đổi phá vỡ,
  bảng ảnh hưởng và bảng nguồn gốc.

**Kiểm chứng:** `tools/smoke_catalog.py` — 32/32 điểm đạt.

### 2.7 M11 Dynamic API — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/DYNAMIC_API_M11.md`](ai_worker_lake_house/DYNAMIC_API_M11.md)

**Đã có**

- API product chỉ dựng được từ dataset thuộc `gold_api`; dataset khác trả 403.
- **Bảng `dataset_row` và job `GOLD_MATERIALIZE`** — Gold nay có dữ liệu thật,
  chiếu lên đúng schema đã công bố nên API không trả cột ngoài hợp đồng.
- Trường gắn PII không lộ nguyên bản được; trường MẬT chỉ lộ dưới dạng băm.
  Dịch vụ **từ chối cấu hình** chứ không tin người thiết kế nhớ.
- OpenAPI 3.x sinh từ chính bảng exposure mà runtime đọc, nên tài liệu và dịch
  vụ không thể lệch nhau.
- Security review bốn mắt trước khi publish; người thiết kế không tự duyệt được.
- OAuth2 client credentials, secret chỉ lưu bản băm; subscription bắt buộc;
  client thiếu clearance không được cấp quyền.
- Lọc dòng theo clearance và đơn vị của client; lọc/sắp xếp chỉ trên trường đã
  khai báo; trần page size; rate limit trả 429.
- Kill switch: bản thu hồi trả **410**, không im lặng trả rỗng.
- Nhật ký sử dụng ghi cả lần thành công lẫn lần bị chặn, **không chứa dữ liệu**.
- Giao diện: [`DynamicApiPage.tsx`](fe-modul-report/src/features/ingestion/pages/DynamicApiPage.tsx)
  — vòng đời, bảng trường lộ ra kèm cách che, OpenAPI, nhật ký sử dụng.

**Kiểm chứng:** `tools/smoke_dynamic_api.py` — 38/38 điểm đạt.

### 2.8 M12 Tích hợp BI / Tableau — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/BI_M12.md`](ai_worker_lake_house/BI_M12.md)

**Đã có**

- View BI chỉ dựng được trên dataset **`gold_bi` đã công bố**; dataset Silver
  hay Bronze trả 403 — lớp lõi không có đường lộ ra Tableau.
- **Row-level security là điều kiện để view sống**: tắt RLS hoặc chưa ánh xạ ai
  thì `apply` trả 403. Không có trạng thái "view đã sống nhưng chưa phân quyền".
- DDL sinh ra (view + `CREATE POLICY`) lưu nguyên văn; trên SQLite `apply_error`
  ghi rõ chính sách **chưa** có hiệu lực, để không ai nhầm.
- **Kiểm thử persona** chạy đúng luật mà chính sách mã hoá, nhưng bằng Python —
  chứng minh được "đơn vị này không đọc được dữ liệu đơn vị khác" trước khi đấu
  nối BI. Người chưa được ánh xạ thấy **0 dòng**, không phải thấy tất cả.
- Không cấp được mức mật vượt clearance của chính người thao tác.
- **Cấu hình data source từ chối payload có credential** (`password`, `secret`,
  `token`, `mat_khau`…) và chỉ nhận `service_account_ref` kiểu `vault://…`.
- Làm mới extract lỗi thì **giữ nguyên bản trước** (`kept_previous`), phát sự
  kiện `RefreshFailed`; vượt trần `max_extract_rows` thì **chặn**, không âm thầm
  cắt bớt.
- Xuất dữ liệu mức ≥ 2 cần phê duyệt, người xuất không tự duyệt được, và cả lần
  bị chặn lẫn lần thành công đều vào `bi_export_event` — bản ghi từ chối viết
  trên giao dịch riêng nên không bị rollback cuốn đi.
- Thu hồi bắt buộc có lý do, phát `BiAccessRevoked`, cắt cả refresh lẫn export.
- Quyền mới `bi.manage` và vai trò `BI_ADMIN` đồng bộ hai phía worker/portal.
- Giao diện: [`BiIntegrationPage.tsx`](fe-modul-report/src/features/ingestion/pages/BiIntegrationPage.tsx)
  — danh sách view và data source, ngăn kéo ánh xạ RLS + kiểm thử persona + DDL,
  nhật ký làm mới có cờ "giữ bản trước" và nhật ký xuất dữ liệu.

**Kiểm chứng:** `tools/smoke_bi.py` — 35/35 điểm đạt.

### 2.9 M06 Data Quality — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/QUALITY_M06.md`](ai_worker_lake_house/QUALITY_M06.md)

Đây là mảnh nối M04 với thực tế: danh mục đã khai SLA và schema, nhưng trước
lát cắt này không có gì đo dữ liệu thật sự chảy qua.

**Đã có**

- **8 loại rule khai báo phủ đủ 6 chiều** của mục 4.2: `NOT_NULL`, `UNIQUE`,
  `RANGE`, `ENUM`, `REGEX`, `COMPARE`, `FRESHNESS`, `REFERENCE`. Không có biểu
  thức tự do — một danh mục rule nhận SQL thì thực chất là giao diện truy vấn.
- Cấu hình rule được kiểm **lúc khai báo**: cột phải có trong schema, pattern
  phải biên dịch được, ngưỡng phải trong 0..1.
- **Ngưỡng do chủ sở hữu duyệt, bốn mắt.** Rule mới ở `DRAFT` và không tính vào
  bất cứ điều gì, nên profiling đề xuất thoải mái mà không siết được cổng công
  bố sau lưng chủ sở hữu.
- **Profiling đọc dữ liệu thật rồi đề xuất rule** từ những gì quan sát được;
  dưới 30 dòng thì gắn cờ `low_confidence`.
- **UNKNOWN không phải PASS.** Rule chạy lỗi thành UNKNOWN và chặn y như FAIL —
  chỗ nguy hiểm nhất, vì một rule chắn cửa mà im lặng hỏng sẽ thành "không có
  gì chắn".
- **Điểm tái lập từ evidence.** Mỗi kết quả lưu số dòng đã xét, số vi phạm,
  ngưỡng và mẫu giá trị sai; API trả cả `score` đã lưu lẫn `score_recomputed`,
  lệch nhau là dấu hiệu dữ liệu chấm điểm bị sửa ngoài luồng.
- **Cổng công bố Gold**: chưa có rule / chưa chạy / còn CRITICAL hỏng đều trả
  422 `DATA_QUALITY_FAILED` kèm đúng rule nào chắn đường. Bronze và Silver
  không qua cổng này vì không có `dataset_row` để đo.
- **Waiver hết hạn là hết hiệu lực**, không cần ai thu hồi; và waiver không làm
  rule thành PASS — chỉ cổng công bố bỏ qua, thất bại vẫn hiện nguyên.
- Issue một-rule-một-issue, tự đóng khi rule đạt lại và phát `QualityRecovered`;
  `DataQualityFailed` mang theo chủ sở hữu cần được báo.
- Quyền mới `quality.manage` và vai trò `QUALITY_REVIEWER` ở cả hai phía. Nhân
  tiện bù hai vai trò worker còn thiếu so với portal (`DATA_OWNER`, `USER`).
- Giao diện: [`DataQualityPage.tsx`](fe-modul-report/src/features/ingestion/pages/DataQualityPage.tsx)
  — phán quyết cổng, điểm, rule, evidence mở rộng được, issue, diễn biến điểm,
  profiling kèm nút thêm rule từ đề xuất.

**Ảnh hưởng tới các lát cắt trước:** ba bộ smoke test M04/M11/M12 nay phải đi
qua cổng chất lượng trước khi công bố Gold, dùng chung
[`tools/dq_helper.py`](ai_worker_lake_house/tools/dq_helper.py). Đó là hành vi
mới đúng, không phải chỗ nới lỏng để test chạy được.

**Kiểm chứng:** `tools/smoke_quality.py` — 58/58 điểm đạt; toàn bộ hồi quy
232/232.

### 2.10 M08 Search & Discovery — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/SEARCH_M08.md`](ai_worker_lake_house/SEARCH_M08.md)

**Đã có**

- **BM25 tự cài trong chính cơ sở dữ liệu metadata** (`search_document` +
  `search_term`). Không dùng engine ngoài để posting và nhãn bảo mật ghi trong
  cùng một giao dịch — một index có thể lệch pha với luật truy cập còn tệ hơn
  không có index.
- **Lọc quyền chạy trước khi chấm điểm**, đúng thứ tự luồng chính của M08. Toàn
  bộ thống kê BM25 (N, độ dài trung bình, document frequency) tính trên tập tài
  liệu người dùng được đọc, nên hai mức mật khác nhau cho thứ hạng khác nhau một
  cách đúng đắn.
- **Facet và gợi ý cũng chỉ đếm trên tập đó.** Đây là chỗ rò rỉ kinh điển: chặn
  tài liệu MẬT khỏi danh sách nhưng facet vẫn ghi "MẬT (12)". Endpoint
  `/suggest` cũng join với tập nhìn thấy được, vì ô gợi ý dựng trên toàn bộ từ
  điển chính là rò rỉ tiêu đề với giao diện thân thiện.
- **`/search/preview` trả 404 chứ không 403** cho tài liệu ngoài thẩm quyền —
  403 là một lời xác nhận rằng tài liệu tồn tại.
- **Hybrid thật**: full-text bắt chuỗi chính xác (`145/BC-KTh`), vector bắt ý
  gần nghĩa; hợp nhất bằng **Reciprocal Rank Fusion** trên *thứ hạng* chứ không
  trên điểm gốc, vì điểm BM25 và cosine không cùng đơn vị. Mỗi kết quả nêu rõ
  công cụ nào tìm ra và ở hạng mấy.
- **Một truy vấn xếp hạng chung bốn loại** — nội dung tài liệu, tệp, dataset,
  thuật ngữ — thay vì trả bốn danh sách rời.
- Tokeniser **giữ nguyên dấu tiếng Việt**; bỏ dấu là đánh mất phân biệt "má" và
  "ma".
- Bảng ngoại lệ đã xử lý đủ: độ tươi index báo trong mỗi phản hồi, truy vấn toàn
  stopword trả 400 yêu cầu thu hẹp, thu hồi được kiểm hai lớp (đánh dấu trong
  index + đối chiếu nguồn thật mỗi lần trả kết quả).
- **Nối vào M09**: router định tuyến câu hỏi cần chuỗi chính xác sang
  `FULLTEXT`, orchestrator chạy cả hai nửa rồi `retriever.fuse` — đúng câu mục
  6.1 "hợp nhất bằng chứng, loại trùng và xếp hạng trước khi gọi model". Đường
  full-text dùng lại `search_service` nên tìm kiếm và hỏi đáp không thể bất đồng
  về việc ai được đọc gì.
- Sự kiện `IndexBuilt` và `SearchExecuted`; payload `SearchExecuted` **không
  chứa nội dung truy vấn**, chỉ đủ số liệu để tính P95.
- Giao diện: [`DiscoveryPage.tsx`](fe-modul-report/src/features/ingestion/pages/DiscoveryPage.tsx)
  — gợi ý theo tiền tố, bật/tắt nửa ngữ nghĩa, lọc theo loại, tô đậm chỗ khớp,
  ngăn kéo xem trước, facet kèm câu giải thích rằng con số chỉ đếm phần mình
  được đọc. Chỗ khớp được đánh dấu bằng `[[...]]` chứ không phải HTML, giao diện
  tự dựng thẻ — nội dung tài liệu không bao giờ được diễn giải như thẻ.

**Đã sửa một lỗi thật:** `rebuild()` lập chỉ mục lại chunk mà không tra số phiên
bản, nên sau mỗi lần dựng lại index toàn bộ kết quả mất `source_version` — vi
phạm thẳng tiêu chí "result có source/version" và làm trích dẫn không nêu được
phiên bản nào.

**Kiểm chứng:** `tools/smoke_search.py` — 44/44 điểm đạt; toàn bộ hồi quy
276/276.

### 2.11 Đồ thị tri thức (mục 6.3) + công cụ GRAPH — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/KNOWLEDGE_GRAPH.md`](ai_worker_lake_house/KNOWLEDGE_GRAPH.md)

Mục 6.3 vạch một ranh giới rất rõ: Graphify chỉ là **extractor**, và không được
dùng `graph.json` làm cơ sở tri thức. Lát cắt này dựng phần còn lại — Graph
Store có ontology, provenance và phân quyền.

**Đã có**

- **Có ontology mới vào được.** Node hoặc edge mang nhãn chưa khai báo bị từ
  chối kèm lý do, không im lặng biến mất. Predicate còn ràng buộc kiểu hai đầu.
  Đây là cách biến câu "node/edge cần được map vào ontology" thành thứ thi hành
  được: extractor không tự nới rộng lược đồ được.
- **Có nguồn gốc mới vào được.** `source_object_id`, `source_location`,
  `extractor_version`, `created_at` đều NOT NULL — một quan hệ không ai chỉ được
  nó đến từ đâu là tin đồn, và tin đồn không được đi vào báo cáo. Mỗi lần nạp
  ghi thêm checksum của output gốc.
- **Khoá xác định trước, tương đồng chỉ để đề xuất.** Trùng khoá thì là một;
  tên gần giống tạo hai thực thể riêng cộng một đề xuất hợp nhất kèm điểm tin
  cậy. Không ngưỡng nào tự hợp nhất.
- **Duyệt rồi mới tính.** Quan hệ mới ở `CANDIDATE`; chỉ `APPROVED` mới tới được
  công cụ GRAPH, nên một suy đoán chưa ai đọc lại không thể lọt vào câu trả lời
  của trợ lý AI. Bốn mắt; predicate nhạy cảm (`REPORTS_FIGURE`) bắt buộc kèm ghi
  chú khi duyệt.
- **Bức tường trong traversal.** Nếu A—X—B mà X là mật thì trả lời "A liên quan
  B" chính là làm lộ liên hệ đó, nên đường đi **không đi vòng qua** nút bị chặn
  mà dừng lại. Mở thẳng thực thể ngoài thẩm quyền trả 404 chứ không 403.
- **Job `GRAPH_EXTRACT`** chạy sau Bronze với bộ trích xuất rule-based — cố ý
  không dùng mô hình, vì khẳng định do mô hình bịa ra chính là thứ mục 6.3 giữ
  lại sau vòng duyệt.
- **Nối vào M09**: router nay có đủ VECTOR / METADATA / FULLTEXT / GRAPH, chỉ
  còn SQL chưa có bộ thực thi. Khẳng định lấy từ đồ thị vào ngữ cảnh kèm nguồn
  gốc, và mức mật của quan hệ được gộp vào mức mật yêu cầu khi chọn mô hình —
  không có đường vòng để dữ liệu mật tới mô hình ngoài enclave.
- Giao diện: [`KnowledgeGraphPage.tsx`](fe-modul-report/src/features/ingestion/pages/KnowledgeGraphPage.tsx)
  — hàng đợi duyệt nêu rõ nguồn gốc từng cạnh, đề xuất hợp nhất, đi theo quan
  hệ, danh sách thực thể, và ontology.

**Đã sửa một lỗi thật:** bản đầu lấy mức mật của thực thể là `max` các tài liệu
chứa nó. Nghe an toàn hơn nhưng sai: tên một tổ chức chỉ cần xuất hiện một lần
trong hồ sơ mật là trở thành mật, và sau đủ nhiều tài liệu thì mọi thực thể phổ
biến đều tối mật. Bí mật chưa bao giờ là "tổ chức này tồn tại" mà là **quan hệ
được khẳng định về nó** — nên thực thể lấy `min`, còn cạnh lấy `max`.

**Kiểm chứng:** `tools/smoke_graph.py` — 47/47 điểm đạt; toàn bộ hồi quy 323/323.

### 2.12 Tầng ngữ nghĩa + SQL guard — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/SEMANTIC_LAYER.md`](ai_worker_lake_house/SEMANTIC_LAYER.md)

Công cụ cuối cùng của mục 6.1. Bảng rủi ro mục 11 nêu thẳng cả vấn đề lẫn cách
chữa: "Cho AI truy cập DB tự do → Rò rỉ/sai số liệu → Tool allowlist, semantic
layer, SQL guard, read-only".

**Đã có**

- **Không có câu lệnh nào được sinh ra**, kể cả loại có tham số. Mô hình chọn
  một chỉ tiêu người khác đã định nghĩa và duyệt, rồi điền tham số lấy từ chính
  danh sách chỉ tiêu đó khai báo; lọc và tổng hợp chạy bằng Python trên
  `dataset_row`. Một bộ guard soi SQL sinh ra thì có thể bị qua mặt — một thiết
  kế không sinh SQL thì không.
- **Mọi ô nhập là danh sách đóng**: phép tổng hợp, cột, chiều, trường lọc, toán
  tử. Giá trị lọc chỉ nhận số/chuỗi/danh sách. Chuỗi kiểu `PX1' OR '1'='1` chỉ
  là một giá trị đem so sánh bằng và không khớp dòng nào.
- **Trường PII/MẬT không làm measure hay dimension được** — không phải che đi mà
  là không có mặt; che thuộc về M11 khi cần lộ ra ngoài.
- **Vượt trần thì từ chối, không cắt bớt.** Cắt bớt rồi vẫn trả một con số nghe
  hợp lý chính là "sai số liệu" mà bảng rủi ro cảnh báo.
- **Con số đã cắt theo quyền thì nói ra.** Tổng của một người là tổng phần họ
  đọc được, không phải tổng toàn đơn vị, nên kết quả mang cờ `partial`. Cờ là
  **boolean chứ không phải số dòng bị loại** — một con số đếm sẽ tiết lộ có bao
  nhiêu dữ liệu trên mức mật của người hỏi, đúng cái tiêu chí M08 cấm.
- **Bốn mắt**: chỉ tiêu mới ở DRAFT và không chạy được; người định nghĩa không
  tự duyệt. Chỉ dataset Gold đã công bố mới định nghĩa chỉ tiêu được.
- **Planner cố tình bảo thủ**: không khớp rõ thì không trả chỉ tiêu nào và trợ
  lý nói không trả lời được — một con số sai tự tin đi xa hơn một câu "không
  biết" rất nhiều.
- `metric_run` ghi tham số, số dòng, cờ partial và checksum kết quả — **không
  ghi dữ liệu** — đủ để chấm "SQL accuracy" mà mục 10 yêu cầu.
- Giao diện: [`SemanticLayerPage.tsx`](fe-modul-report/src/features/ingestion/pages/SemanticLayerPage.tsx)
  — form khai báo chỉ liệt kê cột dùng được, chạy thử theo từng chiều đã khai,
  và kết quả `partial` hiện cảnh báo "đừng dùng con số này như tổng toàn đơn vị".

**Kiểm chứng:** `tools/smoke_semantic.py` — 40/40 điểm đạt; toàn bộ hồi quy
363/363.

### 2.13 M07 Approval & Governance — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/APPROVAL_M07.md`](ai_worker_lake_house/APPROVAL_M07.md)

**Đã có**

- **Khoá ảnh chụp bằng chứng** — bước hay bị bỏ nhất của M07 và là bước làm cho
  bốn mắt có nghĩa. Một phê duyệt là lời khẳng định về *một trạng thái cụ thể*;
  nếu tài nguyên còn sửa được sau khi duyệt thì bốn mắt chỉ còn là thủ tục: xin
  duyệt bản vô hại rồi tráo bản khác. Bằng chứng của dataset gồm cả schema và
  kết quả chất lượng, nên thêm một cột sau khi duyệt là đủ để phê duyệt chuyển
  `STALE`.
- **Một phê duyệt dùng đúng một lần** (`consumed_at`) — một chữ ký không che
  được hai lần sửa.
- **Bốn mắt đủ hai vế**: người xin không tự duyệt, *và* một người không duyệt
  hai lần cho cùng yêu cầu — thiếu vế sau thì "cần hai người" thành "cần một
  người bấm hai lần".
- **Ma trận phê duyệt là cấu hình** (`approval_workflow`), không phải `if` giữa
  service. Thao tác chưa cấu hình thì bị từ chối chứ không chạy theo mặc định
  ngầm nào.
- **Hạ mức mật đi đường khác**: vai trò được duyệt thu về an toàn thông tin, và
  mức mật của yêu cầu lấy theo nhãn *cao hơn*, nên người chỉ đủ thẩm quyền cho
  mức mới không duyệt được việc hạ xuống đó.
- **Legal hold thắng retention.** Sweep không tự huỷ gì: hold thì bỏ qua, không
  hold thì vẫn cần yêu cầu huỷ đã được **hai người** duyệt. Người đặt hold không
  tự gỡ.
- **Thu hồi chạm tới BI, API và AI** trong cùng một giao dịch — API product và
  các phiên bản, BI view và data source, cộng gỡ khỏi index tìm kiếm. Thiếu bất
  kỳ vế nào thì extract Tableau vẫn làm mới và API vẫn trả dòng.
- **SLA chỉ leo thang, không tự duyệt** — một hệ tự duyệt khi quá hạn thì hạn
  SLA trở thành đường đi vòng qua kiểm soát.
- Quyền mới `approval.decide` và vai trò `RECORDS_MANAGER` ở cả hai phía. Xin
  duyệt là `catalog.manage`, quyết định là `approval.decide` — hai việc khác
  nhau nên hai quyền khác nhau.
- Giao diện: [`ApprovalPage.tsx`](fe-modul-report/src/features/ingestion/pages/ApprovalPage.tsx)
  — hàng đợi, legal hold, rà soát retention tách nút chạy thử khỏi nút thực thi,
  ma trận, và ngăn kéo hiện nguyên văn bằng chứng đã khoá kèm mã băm từng quyết
  định.

**Ba cổng chồng lên nhau khi công bố Gold**, theo đúng thứ tự: M04 hợp đồng dữ
liệu → M06 chất lượng → M07 phê duyệt. Chất lượng là thứ chủ sở hữu tự sửa được
nên báo trước; phê duyệt cần người thứ hai nên hỏi sau cùng.

**Đã sửa một lỗi thật:** việc đánh dấu `STALE` nằm chung giao dịch với lỗi ném
ra, mà lỗi làm `session_scope` rollback — nên yêu cầu vẫn ở `APPROVED` và lần
thử sau lại vấp đúng phê duyệt chết đó.

**Kiểm chứng:** `tools/smoke_approval.py` — 52/52 điểm đạt; toàn bộ hồi quy
416/416.

### 2.14 M02 Data Source Management — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/DATA_SOURCE_M02.md`](ai_worker_lake_house/DATA_SOURCE_M02.md)

Tiêu chí nghiệm thu M02 là bốn câu ngắn, và mỗi câu là một luật ở đây.

**Đã có**

- **Không lưu secret rõ.** Credential là tham chiếu `vault://…`, và có hai lớp
  chặn: payload chứa trường mật khẩu bị từ chối, chuỗi không đúng dạng tham
  chiếu cũng bị từ chối — thiếu vế sau thì người ta dán thẳng mật khẩu vào ô
  "reference" và luật thành hình thức. Chỗ rò rỉ thứ ba là **thông điệp lỗi**:
  driver hay trả nguyên DSN kèm mật khẩu, nên nó được làm sạch trước khi rời
  máy chủ.
- **Pause ngăn run mới** — `start_sync` từ chối mọi trạng thái khác ACTIVE và
  nêu luôn lý do tạm dừng.
- **Resync không trùng.** Mỗi lần chạy ghi lại cửa sổ watermark nó tiêu thụ;
  chạy lại cửa sổ cũ bị chặn trừ khi khai rõ resnapshot kèm lý do. Và
  **watermark chỉ tiến khi thành công** — một lần chạy hỏng mà vẫn đẩy con trỏ
  là cách bỏ sót dữ liệu vĩnh viễn mà không ai biết.
- **Cấu hình có phiên bản**, và phiên bản mới kế thừa watermark: đánh mất nó ở
  đây sẽ âm thầm biến lần chạy tăng dần kế tiếp thành chạy toàn bộ.
- **Schema drift phá vỡ đưa nguồn vào cách ly.** Mất cột hoặc đổi kiểu thì dừng
  hẳn, chỉ gỡ được khi có người xem và ghi chú đã xử lý thế nào — tiếp tục kéo
  dữ liệu từ hình dạng chưa ai nhìn là cách dữ liệu sai đi vào lặng lẽ.
- Ba tiền điều kiện của tài liệu đều được kiểm: connector trong allowlist,
  đường mạng đã duyệt, secret ở kho. Credential hết hạn thì **chặn** đồng bộ chứ
  không chỉ cảnh báo.
- Giao diện: [`DataSourcePage.tsx`](fe-modul-report/src/features/ingestion/pages/DataSourcePage.tsx)
  — danh sách kèm cảnh báo credential, hộp thoại khai credential nói thẳng "chỉ
  nhập đường dẫn", ngăn kéo năm tab: cấu hình theo phiên bản, schema, drift,
  lịch sử đồng bộ, lịch sử credential.

**Kiểm chứng:** `tools/smoke_source.py` — 51/51 điểm đạt; toàn bộ hồi quy
467/467.

### 2.15 M05 Pipeline Management — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/PIPELINE_M05.md`](ai_worker_lake_house/PIPELINE_M05.md)

Lớp job của M03 (lease, retry backoff, DLQ, replay) đã có; lát cắt này bổ sung
phần còn thiếu của M05.

**Đã có**

- **DAG có phiên bản, được kiểm trước khi ai kịp lên lịch**: chu trình, phụ
  thuộc treo, trùng tên, DAG rỗng đều bị chặn lúc khai báo.
- **Không công bố được phiên bản nếu chưa ghim worker image bằng digest** —
  chạy một tag di động làm toàn bộ dấu vết code trở nên vô nghĩa.
- **Retry không trùng ở hai mức.** Lần chạy có khoá idempotency nên gọi lại cùng
  đầu vào trả về đúng lần chạy cũ; task đã thành công không bao giờ phát lại nên
  retry là *tiếp tục* chứ không phải *làm lại*. Reprocess cố ý dùng khoá mới —
  "chạy lại vì muốn thế" và "trigger bắn hai lần" là hai việc khác nhau.
- **Truy vết code/input**: mỗi lần chạy **sao chép** checksum DAG và image
  digest, không chỉ trỏ tới phiên bản — phiên bản có thể bị thay hoặc retire về
  sau.
- **Huỷ chỉ có hiệu lực ở checkpoint.** Task đã commit giữ nguyên output, task
  đang dở bị bỏ hẳn. Cắt được giữa lúc ghi thì thứ để lại chính là output nửa
  vời mà tiêu chí cấm.
- **Không ghi đè output** của lần chạy khác — ghi đè lặng lẽ là cách một backfill
  xoá mất kết quả gốc.
- **Backfill vượt quota đi qua engine phê duyệt M07** thay vì dựng cơ chế riêng,
  nên thừa hưởng bốn mắt, khoá ảnh chụp và audit.
- **SLA chỉ cảnh báo**, không tự huỷ hay tự chạy lại.

**Một lỗi thật đã sửa — và nó nằm ở M07, không ở M05.**
`governance_service.current_snapshot` trả `{}` cho mọi loại tài nguyên nó không
biết, nghĩa là **bất kỳ yêu cầu phê duyệt nào của module khác** cũng bị coi là
"bằng chứng nay rỗng" và chuyển STALE ngay khi có người bấm duyệt. Trả rỗng là
một lời khẳng định sai; điều đúng phải nói là "không dựng lại được". Đã thay
bằng sổ đăng ký: mỗi module tự đăng ký cách dựng lại bằng chứng của mình, loại
chưa đăng ký trả `None` kèm log. Nếu M05 không nối vào engine, lỗi này sẽ nằm im
tới khi module tiếp theo dùng tới.

**Kiểm chứng:** `tools/smoke_pipeline.py` — 50/50 điểm đạt; toàn bộ hồi quy
517/517.

### 2.16 M13 Administration & Policy + M14 Observability — ✅

Tài liệu chi tiết: [`ai_worker_lake_house/ADMIN_OBSERVABILITY.md`](ai_worker_lake_house/ADMIN_OBSERVABILITY.md)

**M13 — đơn vị thay đổi là một bundle, không phải một dòng.** Nếu taxonomy,
nhãn, retention, cờ và hạn mức sửa độc lập thì không có *một thứ* để phê duyệt,
và cũng không có trạng thái "trước đó" mạch lạc để quay về. Nên:

- Chính sách là tài liệu có phiên bản; publish đổi trạng thái **và áp thẳng vào
  bảng đang chạy** — một bundle được lưu mà không được áp là tài liệu, không
  phải chính sách.
- **Giảm bảo vệ được phát hiện từ chênh lệch, không phải được khai.** Người hạ
  một nhãn xuống một mức hiếm khi nghĩ đó là "giảm bảo vệ" — đó chính là lý do
  việc kiểm tra không nên phụ thuộc vào lời khai của họ. Có điểm giảm thì chỉ an
  toàn thông tin duyệt được.
- **Rollback tạo phiên bản mới** mang nội dung cũ, không kích hoạt lại dòng cũ —
  lịch sử giữ cả lỗi lẫn phần sửa.
- Chính sách tự mâu thuẫn bị từ chối, gồm cả trường hợp riêng: nhãn mức ≥3 mà
  mở cho AI ngoài enclave là mâu thuẫn với mục 6.4/9.1, không phải một lựa chọn.
- **Break-glass kiểm hạn mỗi lần được dùng tới**, không đợi sweep. Trần 8 giờ,
  bốn mắt, và không đóng được nếu chưa có ghi chú rà soát.

**M14 — log không bao giờ giữ bí mật.** Nội dung thô không phải thứ được lưu: nó
được che ngay lúc nhận và **không có cột nào giữ bản gốc**. Dòng vẫn còn dấu
hiệu nguy hiểm sau khi che thì bị **cách ly** cho đội an toàn, không đi vào
luồng thường.

- Lệch đồng hồ được **ghi nhận chứ không sửa** — viết lại mốc thời gian phá hỏng
  đúng cái thứ tự mà điều tra dựa vào.
- Trace dựng lại cả request qua `parent_span_id`; span mồ côi được báo riêng chứ
  không giấu.
- Cảnh báo bắt buộc có owner và runbook; bão cảnh báo **gộp lại nhưng giữ đủ
  từng lần xuất hiện**.
- Sự cố không đóng được nếu chưa nêu nguyên nhân gốc.
- Bằng chứng xuất ra có hash, và sửa một dòng là hash không khớp nữa.

**Kiểm chứng:** `tools/smoke_admin.py` — 68/68 điểm đạt; toàn bộ hồi quy
585/585.

**Một điều chỉnh ở phía test chứ không phải sản phẩm:** hai phép thử "tự duyệt"
và "tự rà soát" ban đầu dùng tài khoản ANALYST nên dừng ở 403 vì thiếu quyền, và
chưa chạm tới luật bốn mắt. Đã đổi chủ thể sang `RECORDS_MANAGER` — vai trò vốn
có cả `approval.decide` lẫn `audit.read`.

### 2.17 Liên thông backend ↔ worker — ✅

Đặt cùng `JWT_SECRET` (base64) cho hai bên. Khi có biến này, worker bắt buộc
`Authorization: Bearer` và **từ chối** các header DEV.

Đã kiểm thực tế:

| Kịch bản | Kết quả |
|---|---|
| Worker nhận token do backend cấp | 200 |
| Header DEV khi đã bật JWT | 401 |
| Analyst (clearance 1) xem nhãn bảo mật | thấy 2/5 nhãn |
| Analyst gọi `POST /uploads` (không có `data.upload`) | 403 `POLICY_DENIED` |
| Cấp clearance 4 cho người chỉ có vai trò ANALYST (trần 2) | token mang 2 |

Worker ưu tiên claim `perms`; vai trò tuỳ biến tạo trên portal có hiệu lực ngay
bên worker mà không phải sửa mã worker.

---

## 3. Cách chạy kiểm thử

Máy phát triển hiện **không có Python và JDK**, nên dùng Docker.

```bash
# Worker — M03
cd ai_worker_lake_house
docker build -t lakehouse-smoke -f tools/Dockerfile.smoke .
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_ingestion.py

# Worker — M09
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_ai_chat.py

# Worker — M04
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_catalog.py

# Worker — M11
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_dynamic_api.py

# Worker — M13 + M14 Quản trị chính sách & quan sát
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_admin.py

# Worker — M05 Pipeline
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_pipeline.py

# Worker — M02 Nguồn dữ liệu
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_source.py

# Worker — M07 Phê duyệt & vòng đời
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_approval.py

# Worker — Tầng ngữ nghĩa
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_semantic.py

# Worker — Đồ thị tri thức
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_graph.py

# Worker — M08
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_search.py

# Worker — M06
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_quality.py

# Worker — M12
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/smoke_bi.py

# Worker — migration
docker run --rm -v "$PWD:/app" -w /app lakehouse-smoke python tools/check_migrations.py

# Backend — biên dịch
cd be
docker run --rm -v "$PWD:/app" -v "$HOME/.m2:/root/.m2" -w /app \
  maven:3.9-eclipse-temurin-21 mvn -B clean compile

# Backend — M01 (cần backend đang chạy)
BASE_URL=http://localhost:8080/api ADMIN_USER=admin ADMIN_PASS='…' \
  bash tools/smoke_iam.sh

# Backend — M10 (cần thêm object storage và hai tài khoản khác nhau)
BASE_URL=http://localhost:8080/api ADMIN_USER=admin ADMIN_PASS='…' \
APPROVER_USER=approver APPROVER_PASS='…' \
  bash tools/smoke_report.sh

# Frontend
cd fe-modul-report && npm run build
```

---

## 4. Nợ kỹ thuật và rủi ro

| # | Vấn đề | Mức độ | Ghi chú |
|---|---|---|---|
| 1 | ~~Khoá OpenAI thật trong git history của `ai_worker_lake_house`~~ | Đã xử lý | Khoá đã được thu hồi ngày 20/08/2026 nên không còn dùng được. Bản hardcode đã gỡ khỏi `app/config.py`, `.gitignore` đã thêm. Chuỗi khoá cũ vẫn nằm trong history nhưng đã vô hiệu; chỉ dọn history nếu cần cho yêu cầu tuân thủ |
| 2 | ~~Chưa có migration có version~~ | Đã xử lý | Flyway cho `be` (baseline 46 bảng, Hibernate chuyển sang `validate`) và Alembic cho worker. Xem [MIGRATIONS.md](MIGRATIONS.md) |
| 3 | ~~`GlobalExceptionHandler` trả nguyên `ex.getMessage()`~~ | Đã xử lý | Thêm `BusinessException` cho thông điệp cố ý; lỗi ngoài dự kiến chỉ trả thông điệp chung kèm `correlationId`, chi tiết vào log |
| 4 | Bảng audit bất biến — một phần | Thấp | `iam_auth_audit_event` đã có trigger chặn UPDATE/DELETE (migration V2). Bảng `audit_event` của worker chưa có; và nên tách vai trò DB riêng cho ứng dụng ở môi trường thật |
| 5 | Event backbone mới là outbox trong DB | Trung bình | Chưa đẩy sang broker thật (mục 8.3) |
| 6 | Chưa có AI enclave nội bộ đang chạy | **Cao nếu có dữ liệu miền C** | Model registry đã chặn: dữ liệu mức ≥3 chỉ đi tới mô hình có `is_internal = true`. Nhưng chưa có triển khai nội bộ nào, nên câu hỏi chạm dữ liệu miền C sẽ bị **từ chối**. Cần dựng vLLM/Ollama rồi đăng ký qua `POST /api/v1/models` |
| 7 | Chưa có hạn mức theo người dùng/đơn vị | Thấp | Mới giới hạn kích thước file |
| 8 | Chế độ DEV của worker (`DEV_AUTH_ENABLED`) tin header | Thấp nếu quản lý đúng | Phải đặt `false` ở SIT/UAT/PROD |

---

## 5. Việc tiếp theo

**Cả 14 module M01–M14 đã hoàn tất trong phạm vi đã chốt.** Phần còn lại là
hoàn thiện chất lượng và hai việc hạ tầng:

**Ưu tiên 1 — nền tảng còn nợ**

- Dựng AI enclave nội bộ (nợ số 6). Đây là nợ **Cao** duy nhất còn lại, và là
  việc hạ tầng chứ không phải viết mã.
- Event backbone thật thay cho outbox trong DB (nợ số 5).

**Ưu tiên 2 — hoàn thiện M09**

Cả năm công cụ của mục 6.1 nay đều có bộ thực thi. Phần còn lại là chất lượng:

- Bộ đánh giá mô hình: groundedness, citation, refusal rate, SQL accuracy, rò rỉ
  dữ liệu. `metric_run` đã có sẵn dữ liệu cho tiêu chí SQL accuracy.
- Reranker bằng mô hình; model registry đã có capability `reranking`.
- Publish quan hệ đã duyệt sang `gold_approved_kg` thành dataset thật.
- Gộp đường tính số của M10 và tầng ngữ nghĩa, để một con số chỉ có một định
  nghĩa.

**Ưu tiên 3 — hoàn thiện phần còn lại**

- Hai màn hình quản trị còn thiếu: chính sách (M13) và quan sát/cảnh báo (M14).
  API đã đủ.
- Gộp ba chỗ bốn mắt cũ (truy vấn báo cáo M10, security review API M11, export
  BI M12) vào engine phê duyệt chung của M07.
- Nối break-glass vào `resolve_principal` để phiên thật sự nới quyền lúc chạy.
- Gộp DAG của M05 với bốn job handler cũ của M03; hiện hai lớp chạy song song.
- Scheduler cho M02/M05: hiện `schedule` mới ghi lại ý định.

---

## 6. Cách cập nhật file này

Sau mỗi lát cắt, sửa ba chỗ: bảng ở mục 1, thêm phần mô tả ở mục 2 kèm liên kết
tới tài liệu riêng của module, và cập nhật mục 4 nếu phát sinh hoặc xử lý xong nợ
kỹ thuật. Chỉ đánh ✅ khi đã có kiểm thử chạy được và ghi rõ số điểm đạt.
