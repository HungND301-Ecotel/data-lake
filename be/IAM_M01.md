# M01 - Identity & Access Management

Triển khai module M01 theo phụ lục G của
`docs/Bo_giai_phap_Lakehouse_AI_OnPremise.docx`, kèm phần danh mục đơn vị và
nhãn mức độ mật ở mục 9.1 mà worker cần để phân quyền dữ liệu.

## Vì sao phải làm

Trước đó toàn bộ phân quyền nằm ở một cột `users.role` kiểu chuỗi. Không có
quyền hạt nhỏ, không có đơn vị sở hữu, không có mức độ mật, không thu hồi được
token đã phát, không MFA và không ghi audit. Worker vì thế phải tự suy quyền từ
tên vai trò và chạy ở chế độ DEV.

Sau lát cắt này, backend là nguồn sự thật về danh tính; worker chỉ xác minh chữ
ký và đọc claim.

## Bộ claim của JWT

```json
{
  "sub": "33e1e2de-…",           "username": "admin",
  "role": "ADMIN",                       // chuỗi cũ, giữ cho giao diện hiện tại
  "roles": ["ADMIN"],                    // mã vai trò
  "perms": ["data.upload", "audit.read", …],
  "org_id": "ORG-ROOT",                  // mã đơn vị
  "clearance_level": 4,                  // mức độ mật hiệu lực
  "attrs": {"project": "DA-01"},         // thuộc tính ABAC
  "typ": "access",                       // access | refresh | mfa
  "tv": 0,                               // phiên bản token, dùng để thu hồi
  "jti": "…", "iat": …, "exp": …
}
```

Worker (`ai_worker_lake_house/app/security/identity.py`) ưu tiên `perms`; nếu
token không có claim này thì mới suy quyền từ `roles`. Nhờ vậy một vai trò tuỳ
biến tạo trên portal cũng có hiệu lực bên worker mà không phải sửa mã worker.

`org_id` mang **mã** đơn vị chứ không phải id nội bộ; worker tra cứu được theo
cả hai nên hai hệ thống chỉ cần thống nhất bộ mã.

## Quy tắc mức độ mật

Mức hiệu lực = `min(mức Security Officer cấp cho người dùng, trần cao nhất của
các vai trò được gán)`. Deny thắng allow: gán clearance 4 cho một người chỉ có
vai trò `ANALYST` (trần 2) thì token vẫn chỉ mang 2, và worker chỉ cho thấy các
nhãn mức ≤ 2.

## Danh mục vai trò nền tảng

Định nghĩa trong `enums/IamCatalog.java`, nạp tự động khi khởi động và **đồng bộ
lại mỗi lần deploy** — thêm quyền vào một vai trò hệ thống chỉ cần sửa file này.

| Vai trò | Trần mật | Chéo đơn vị | Quyền chính |
|---|---|---|---|
| ADMIN | 4 | có | toàn bộ 13 quyền |
| SECURITY_OFFICER | 4 | có | audit.read, iam.manage, admin.manage, approval.decide |
| DATA_OWNER | 3 | không | approval.decide, data.download, report.generate |
| DATA_STEWARD | 3 | không | data.upload, pipeline.execute, data.download |
| DATA_UPLOADER | 2 | không | data.upload, data.read, job.read |
| ANALYST | 2 | không | data.read, search.execute, report.generate |
| AI_USER | 2 | không | ai.chat, search.execute |
| API_DESIGNER | 2 | không | api.design |
| AUDITOR | 4 | có | data.read, audit.read |
| USER | 2 | không | vai trò nghiệp vụ cũ, tương thích dữ liệu hiện có |

Vai trò hệ thống không sửa/xoá được qua API (trả 409); quản trị viên chỉ tạo
thêm vai trò tuỳ biến.

## API

### Xác thực

```
POST /iam/auth/login            đăng nhập; trả mfaToken nếu bật MFA
POST /iam/auth/mfa/verify       đổi mfaToken + mã 6 số lấy token đầy đủ
POST /iam/auth/refresh          làm mới token
POST /iam/auth/mfa/enroll       sinh khoá TOTP cho chính mình
POST /iam/auth/mfa/activate     kích hoạt sau khi nhập đúng một mã
POST /iam/auth/logout-all       vô hiệu mọi phiên của chính mình
POST /iam/auth/users/{id}/mfa/disable    tắt MFA của người khác (iam.manage)
POST /iam/auth/token            client_credentials cho service account
```

`POST /user/login` cũ vẫn hoạt động và nay dùng chung luồng trên, nên client
hiện tại không phải sửa gì. Phản hồi giữ nguyên `token`, `refreshToken`,
`role`, chỉ thêm trường mới.

### Quản trị

```
GET/POST/PUT/DELETE /iam/roles              danh mục vai trò   (iam.manage)
GET                 /iam/permissions        danh mục quyền     (iam.manage)
GET/POST            /iam/organizations      đơn vị (GET: data.read; POST: admin.manage)
GET                 /iam/users              danh sách quyền hiệu lực
GET                 /iam/users/me/access    quyền của chính mình (không cần quyền riêng)
PUT                 /iam/users/{id}/roles          gán vai trò
PUT                 /iam/users/{id}/clearance      đặt mức độ mật (admin.manage)
PUT                 /iam/users/{id}/organization   đổi đơn vị
PUT/DELETE          /iam/users/{id}/attributes     thuộc tính ABAC
POST                /iam/users/{id}/revoke         thu hồi truy cập
POST                /iam/users/{id}/reinstate      khôi phục
GET/POST            /iam/service-accounts          danh tính dịch vụ
POST                /iam/service-accounts/{id}/rotate-secret
POST                /iam/service-accounts/{id}/revoke
GET/POST            /iam/access-reviews            đợt rà soát quyền
GET                 /iam/access-reviews/{id}/items
POST                /iam/access-reviews/items/{id}/decision
POST                /iam/access-reviews/{id}/complete
GET                 /iam/audit                     nhật ký danh tính (audit.read)
```

## Thu hồi có hiệu lực tức thì

Chữ ký hợp lệ không đồng nghĩa còn hiệu lực. Mỗi người dùng có `tokenVersion`;
token mang claim `tv`. `TokenRevocationFilter` đối chiếu hai giá trị trên từng
request và từ chối nếu lệch, hoặc nếu tài khoản đã bị thu hồi/đang khoá.

`tokenVersion` tăng khi: gán lại vai trò, đổi mức độ mật, đổi đơn vị, thay đổi
thuộc tính, thu hồi tài khoản, đổi mật khẩu, hoặc người dùng tự đăng xuất toàn
phiên. Nghĩa là mọi thay đổi quyền có hiệu lực ngay, không phải chờ token hết
hạn.

Token của service account bỏ qua kiểm tra này (không gắn với bảng người dùng);
vòng đời của chúng do cờ `active` và hạn dùng kiểm soát.

## MFA

TOTP theo RFC 6238, cài trực tiếp bằng `HmacSHA1` của JDK để không thêm thư
viện ngoài. Tham số mặc định (30 giây, 6 chữ số, SHA-1) tương thích Google
Authenticator và các ứng dụng OTP phổ biến — `tools/smoke_iam.sh` chứng minh
điều này bằng một cài đặt TOTP độc lập viết bằng Node.

Ghi danh gồm hai bước: `enroll` sinh khoá nhưng chưa bật; chỉ khi người dùng
nhập đúng một mã thì `activate` mới đặt `mfaEnabled = true`. Nhờ vậy không ai
tự khoá mình ra ngoài vì cấu hình sai.

## Chống dò mật khẩu

Sai 5 lần liên tiếp thì khoá tài khoản 15 phút. Mọi trường hợp sai đều trả cùng
một thông báo và cùng mã HTTP 400, để không lộ tài khoản nào tồn tại. Đăng nhập
thành công, thất bại, bị khoá và bị thu hồi đều ghi audit.

## Chạy kiểm thử

```bash
# Cần backend đang chạy và biết mật khẩu tài khoản quản trị.
BASE_URL=http://localhost:8080/api ADMIN_USER=admin ADMIN_PASS='…' \
  bash tools/smoke_iam.sh
```

Script kiểm 44 điểm: bộ claim JWT, mật khẩu sai, danh mục vai trò/quyền/đơn vị,
bảo vệ vai trò hệ thống, trùng mã, quyền không tồn tại, service account và token
máy-máy, phạm vi quyền của service account, rà soát quyền (bắt buộc lý do khi
thu hồi), toàn bộ luồng MFA, ghi audit, và thu hồi token tức thì.

## Bật xác thực thật ở worker

Đặt cùng một giá trị `JWT_SECRET` (base64) cho backend và worker. Khi worker
thấy biến này, nó bắt buộc `Authorization: Bearer` và **từ chối** các header DEV
(`X-User-Id`, `X-Roles`, …). Kiểm tra bằng `GET /health` của worker:
`auth_mode` phải là `jwt`.

## Còn thiếu so với tài liệu

- **SSO/IdP (UC01.01)** — hiện là đăng nhập nội bộ. Ghép OIDC/SAML khi có IdP;
  điểm ghép là `AuthService.login` và bộ claim đã sẵn sàng.
- **Đồng bộ group từ AD/LDAP** — chưa có; vai trò đang gán thủ công.
- **Break-glass (UC13.08)** — thuộc M13, chưa làm.
- **Bảng audit bất biến ở tầng DB** — cần thu hồi quyền UPDATE/DELETE của tài
  khoản ứng dụng trên `iam_auth_audit_event` ở môi trường thật.
- **Migration có version** — dự án đang dùng `ddl-auto: update`. Cần Flyway
  hoặc Liquibase trước khi lên môi trường có dữ liệu thật.
- **Rà soát quyền chỉ chụp vai trò** — chưa chụp thuộc tính ABAC và mức độ mật
  thành mục quyết định riêng.
