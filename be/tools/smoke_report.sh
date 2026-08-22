#!/usr/bin/env bash
# Kiểm thử đầu-cuối module M10 (Report Template & Generation).
#
# Yêu cầu: backend đang chạy, object storage sẵn sàng, và worker đang chạy nếu
# muốn kiểm cả phần nhận xét AI. Cần hai tài khoản để kiểm phê duyệt bốn mắt.
#
#   BASE_URL=http://localhost:8080/api \
#   ADMIN_USER=admin ADMIN_PASS=... \
#   APPROVER_USER=approver APPROVER_PASS=... \
#     bash tools/smoke_report.sh

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-Admin@12345}"
APPROVER_USER="${APPROVER_USER:-approver}"
APPROVER_PASS="${APPROVER_PASS:-Admin@12345}"
# Thư mục tạm nằm cạnh script, không dùng mktemp: trên Windows, curl.exe không
# đọc được đường dẫn /tmp do Git Bash cấp cho tham số -F.
WORK="${WORK_DIR:-./.smoke-report}"
rm -rf "$WORK"
mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

PASSED=0
FAILED=0

check() {
  local label="$1" condition="$2" detail="${3:-}"
  if [ "$condition" = "true" ]; then
    echo "[PASS] $label${detail:+ - $detail}"
    PASSED=$((PASSED + 1))
  else
    echo "[FAIL] $label${detail:+ - $detail}"
    FAILED=$((FAILED + 1))
  fi
}

jget() {
  node -e "
    const fs = require('fs');
    let data;
    try { data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); }
    catch (e) { process.stdout.write(''); process.exit(0); }
    const value = process.argv[2].split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), data);
    process.stdout.write(value === undefined || value === null ? '' : String(value));
  " "$1" "$2"
}

api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-s -o "$WORK/body" -w '%{http_code}' -X "$method" "$BASE_URL$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  curl "${args[@]}"
}

login() {
  curl -s -X POST "$BASE_URL/iam/auth/login" -H "Content-Type: application/json" \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}" > "$WORK/login.json"
  jget "$WORK/login.json" token
}

echo "== Đăng nhập =="
TOKEN=$(login "$ADMIN_USER" "$ADMIN_PASS")
APPROVER=$(login "$APPROVER_USER" "$APPROVER_PASS")
check "đăng nhập người thiết kế" "$([ -n "$TOKEN" ] && echo true || echo false)"
check "đăng nhập người phê duyệt" "$([ -n "$APPROVER" ] && echo true || echo false)"
[ -z "$TOKEN" ] && { echo "Không đăng nhập được, dừng"; exit 1; }

SUFFIX="$(date +%s)"

echo "== Danh mục truy vấn =="
STATUS=$(api POST /report-templates/data-queries "$TOKEN" "{
  \"code\": \"Q_SANLUONG_$SUFFIX\",
  \"name\": \"San luong theo ky\",
  \"statement\": \"select 152340 as tong_san_luong, 87 as so_ca\",
  \"outputColumns\": \"tong_san_luong,so_ca\",
  \"securityLabelCode\": \"INTERNAL\", \"securityLevel\": 1
}")
QUERY_ID=$(jget "$WORK/body" id)
check "tạo được truy vấn" "$([ "$STATUS" = 201 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /report-templates/data-queries "$TOKEN" "{
  \"code\": \"Q_XOA_$SUFFIX\", \"name\": \"Xoa du lieu\",
  \"statement\": \"delete from users\"
}")
check "câu lệnh ghi bị chặn" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /report-templates/data-queries "$TOKEN" "{
  \"code\": \"Q_MULTI_$SUFFIX\", \"name\": \"Hai cau lenh\",
  \"statement\": \"select 1; drop table users\"
}")
check "nhiều câu lệnh bị chặn" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-templates/data-queries/$QUERY_ID/approve" "$TOKEN" '{}')
check "người tạo không tự duyệt được truy vấn" \
  "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-templates/data-queries/$QUERY_ID/approve" "$APPROVER" '{}')
check "người khác duyệt được truy vấn" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Tạo bảng chi tiết =="
STATUS=$(api POST /report-templates/data-queries "$TOKEN" "{
  \"code\": \"Q_CHITIET_$SUFFIX\", \"name\": \"Chi tiet phan xuong\",
  \"statement\": \"select 'PX1' as phan_xuong, 90000 as san_luong union all select 'PX2', 62340\",
  \"securityLabelCode\": \"INTERNAL\", \"securityLevel\": 1
}")
DETAIL_ID=$(jget "$WORK/body" id)
api POST "/report-templates/data-queries/$DETAIL_ID/approve" "$APPROVER" '{}' > /dev/null
check "duyệt truy vấn chi tiết" "$([ -n "$DETAIL_ID" ] && echo true || echo false)"

echo "== Định nghĩa báo cáo và tệp mẫu =="
CODE="RPT_SL_$SUFFIX"
STATUS=$(api POST /report-templates "$TOKEN" "{
  \"code\": \"$CODE\", \"name\": \"Bao cao san luong\",
  \"ownerOrgCode\": \"ORG-ROOT\", \"securityLabelCode\": \"INTERNAL\",
  \"securityLevel\": 1, \"periodType\": \"MONTH\"
}")
check "tạo được định nghĩa báo cáo" "$([ "$STATUS" = 201 ] && echo true || echo false)" "HTTP $STATUS"

node "$(dirname "$0")/make_sample_template.js" "$WORK/template.docx" > /dev/null
STATUS=$(curl -s -o "$WORK/body" -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$WORK/template.docx;filename=mau-bao-cao.docx" \
  -F "changeNote=ban dau" \
  "$BASE_URL/report-templates/$CODE/versions")
VERSION_ID=$(jget "$WORK/body" id)
check "tải lên và quét được placeholder" \
  "$([ "$STATUS" = 201 ] && [ -n "$VERSION_ID" ] && echo true || echo false)" "HTTP $STATUS"

cp "$WORK/body" "$WORK/version.json"
PLACEHOLDER_COUNT=$(node -e "
  const v = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  process.stdout.write(String((v.placeholders || []).length));
" "$WORK/version.json")
TYPES=$(node -e "
  const v = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  process.stdout.write([...new Set((v.placeholders || []).map(p => p.type))].sort().join(','));
" "$WORK/version.json")
check "nhận diện đủ bốn loại placeholder" \
  "$([ "$TYPES" = "AI_SECTION,FIELD,TABLE" ] && echo true || echo false)" "$TYPES ($PLACEHOLDER_COUNT mục)"

echo "== Kiểm tra trước khi map =="
STATUS=$(api GET "/report-templates/versions/$VERSION_ID/validate" "$TOKEN")
VALID=$(jget "$WORK/body" valid)
check "mẫu chưa map thì không hợp lệ" "$([ "$VALID" = "false" ] && echo true || echo false)"

STATUS=$(api POST "/report-templates/versions/$VERSION_ID/approve" "$APPROVER" '{}')
check "không duyệt được mẫu còn placeholder chưa map" \
  "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Ánh xạ =="
map_placeholder() {
  local name="$1" payload="$2"
  local id
  id=$(node -e "
    const v = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    const found = (v.placeholders || []).find(p => p.name === process.argv[2]);
    process.stdout.write(found ? found.id : '');
  " "$WORK/version.json" "$name")
  if [ -z "$id" ]; then
    echo "  (không tìm thấy placeholder $name)"
    return 1
  fi
  api PUT /report-templates/mappings "$TOKEN" "{\"placeholderId\":\"$id\",$payload}"
}

STATUS=$(map_placeholder "tong_san_luong" \
  "\"dataQueryCode\":\"Q_SANLUONG_$SUFFIX\",\"outputColumn\":\"tong_san_luong\",\"format\":\"NUMBER_0\",\"unit\":\"tấn\"")
check "map được placeholder số liệu" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(map_placeholder "so_ca" \
  "\"dataQueryCode\":\"Q_SANLUONG_$SUFFIX\",\"outputColumn\":\"so_ca\",\"format\":\"NUMBER_0\"")
check "map được placeholder thứ hai" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(map_placeholder "chi_tiet_phan_xuong" "\"dataQueryCode\":\"Q_CHITIET_$SUFFIX\"")
check "map được placeholder bảng" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(map_placeholder "nhan_xet" \
  "\"aiInstruction\":\"Nhan xet ngan ve san luong ky nay\"")
check "map được mục AI" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

# report.* là placeholder hệ thống, được điền tự động khi render.
for name in "report.period_start" "report.period_end" "report.snapshot_checksum"; do
  map_placeholder "$name" "\"dataQueryCode\":\"Q_SANLUONG_$SUFFIX\",\"outputColumn\":\"so_ca\"" > /dev/null
done

STATUS=$(api GET "/report-templates/versions/$VERSION_ID/validate" "$TOKEN")
VALID=$(jget "$WORK/body" valid)
check "map đủ thì mẫu hợp lệ" "$([ "$VALID" = "true" ] && echo true || echo false)"

echo "== Phê duyệt mẫu =="
STATUS=$(api POST "/report-templates/versions/$VERSION_ID/approve" "$TOKEN" '{}')
check "người tạo mẫu không tự duyệt" "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-templates/versions/$VERSION_ID/approve" "$APPROVER" '{}')
check "người khác duyệt được mẫu" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(map_placeholder "so_ca" \
  "\"dataQueryCode\":\"Q_SANLUONG_$SUFFIX\",\"outputColumn\":\"so_ca\"")
check "mẫu đã duyệt thì khoá ánh xạ" "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Sinh báo cáo và chốt số liệu =="
STATUS=$(api POST /report-runs "$TOKEN" "{
  \"definitionCode\": \"$CODE\", \"periodStart\": \"2026-07-01\",
  \"periodEnd\": \"2026-07-31\", \"skipNarrative\": true
}")
cp "$WORK/body" "$WORK/run.json"
RUN_ID=$(jget "$WORK/run.json" id)
CHECKSUM=$(jget "$WORK/run.json" snapshotChecksum)
check "tạo được lần sinh báo cáo" "$([ "$STATUS" = 201 ] && echo true || echo false)" "HTTP $STATUS"
check "có checksum snapshot" "$([ ${#CHECKSUM} -eq 64 ] && echo true || echo false)" "${CHECKSUM:0:12}"

FACT_INFO=$(node -e "
  const r = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  const facts = r.facts || [];
  const scalar = facts.find(f => f.placeholderName === 'tong_san_luong');
  const table = facts.find(f => f.factType === 'TABLE');
  process.stdout.write(JSON.stringify({
    count: facts.length,
    value: scalar ? scalar.value : null,
    query: scalar ? scalar.dataQueryCode + ' v' + scalar.dataQueryVersion : null,
    column: scalar ? scalar.sourceColumn : null,
    hasTable: Boolean(table),
  }));
" "$WORK/run.json")
echo "$FACT_INFO" > "$WORK/facts.json"
check "số liệu được định dạng theo quy ước VN" \
  "$([ "$(jget "$WORK/facts.json" value)" = "152.340" ] && echo true || echo false)" \
  "$(jget "$WORK/facts.json" value)"
check "fact ghi lại nguồn gốc" \
  "$([ -n "$(jget "$WORK/facts.json" query)" ] && [ -n "$(jget "$WORK/facts.json" column)" ] && echo true || echo false)" \
  "$(jget "$WORK/facts.json" query) cột $(jget "$WORK/facts.json" column)"
check "bảng được chốt thành fact" \
  "$([ "$(jget "$WORK/facts.json" hasTable)" = "true" ] && echo true || echo false)"

echo "== Mục AI chưa có nội dung =="
# Xem trước bản nháp vẫn được phép để người dùng nhìn thấy chỗ còn trống; cổng
# chặn nằm ở bước trình duyệt.
STATUS=$(curl -s -o "$WORK/preview.docx" -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/report-runs/$RUN_ID/preview")
check "vẫn xem trước được bản nháp còn mục trống" \
  "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-runs/$RUN_ID/submit" "$TOKEN" '{}')
check "chưa điền mục AI thì không trình duyệt được" \
  "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

NARRATIVE_ID=$(node -e "
  const r = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  const n = (r.narratives || [])[0];
  process.stdout.write(n ? n.id : '');
" "$WORK/run.json")
STATUS=$(api PUT "/report-runs/narratives/$NARRATIVE_ID" "$TOKEN" \
  '{"finalText":"San luong ky nay dat muc ke hoach."}')
check "sửa tay được mục nhận xét" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Xem trước =="
STATUS=$(curl -s -o "$WORK/preview.docx" -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/report-runs/$RUN_ID/preview")
SIZE=$(wc -c < "$WORK/preview.docx")
check "xem trước trả về tệp" \
  "$([ "$STATUS" = 200 ] && [ "$SIZE" -gt 1000 ] && echo true || echo false)" "HTTP $STATUS, $SIZE byte"

echo "== Phê duyệt bốn mắt =="
STATUS=$(api POST "/report-runs/$RUN_ID/export" "$TOKEN" '{}')
check "chưa duyệt thì không xuất bản được" \
  "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-runs/$RUN_ID/submit" "$TOKEN" '{}')
check "trình duyệt được sau khi điền đủ" \
  "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-runs/$RUN_ID/decision" "$TOKEN" '{"decision":"APPROVE"}')
check "người trình không tự duyệt được" "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-runs/$RUN_ID/decision" "$APPROVER" '{"decision":"REJECT"}')
check "từ chối không lý do bị chặn" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST "/report-runs/$RUN_ID/decision" "$APPROVER" '{"decision":"APPROVE","note":"Dat yeu cau"}')
check "người khác duyệt được" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Xuất bản =="
STATUS=$(api POST "/report-runs/$RUN_ID/export" "$TOKEN" '{}')
cp "$WORK/body" "$WORK/exported.json"
check "xuất bản được sau khi duyệt" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"
check "có khoá tệp kết quả" \
  "$([ -n "$(jget "$WORK/exported.json" artifactFileKey)" ] && echo true || echo false)" \
  "$(jget "$WORK/exported.json" artifactFileKey)"
check "checksum snapshot không đổi sau khi duyệt và xuất" \
  "$([ "$(jget "$WORK/exported.json" snapshotChecksum)" = "$CHECKSUM" ] && echo true || echo false)"

echo "== Nhật ký kiểm toán =="
STATUS=$(api GET "/iam/audit?action=REPORT_RUN_EXPORTED&size=5" "$TOKEN")
TOTAL=$(jget "$WORK/body" total)
check "audit ghi lại lần xuất bản" \
  "$([ "${TOTAL:-0}" -ge 1 ] && echo true || echo false)" "$TOTAL bản ghi"

STATUS=$(api GET "/iam/audit?action=REPORT_RUN_DECIDED&size=5" "$TOKEN")
TOTAL=$(jget "$WORK/body" total)
check "audit ghi lại quyết định phê duyệt" \
  "$([ "${TOTAL:-0}" -ge 1 ] && echo true || echo false)" "$TOTAL bản ghi"

echo
echo "Tổng kết: $PASSED đạt, $FAILED không đạt"
[ "$FAILED" -eq 0 ]
