#!/usr/bin/env bash
# Kiểm thử đầu-cuối module M01 (Identity & Access Management).
#
# Yêu cầu: backend đang chạy, tài khoản quản trị đã biết mật khẩu, và `curl`
# cùng `node` có sẵn. Script chỉ đọc/ghi qua API công khai, không đụng thẳng DB.
#
#   BASE_URL=http://localhost:8080/api ADMIN_USER=admin ADMIN_PASS=... \
#     bash tools/smoke_iam.sh

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-Admin@12345}"
WORK="$(mktemp -d)"
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

# jq không chắc có trên máy dev nên dùng node để bóc JSON.
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

echo "== Đăng nhập =="
STATUS=$(api POST /iam/auth/login "" "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
cp "$WORK/body" "$WORK/login.json"
TOKEN=$(jget "$WORK/login.json" token)
REFRESH=$(jget "$WORK/login.json" refreshToken)
check "đăng nhập thành công" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"
check "token mang mã đơn vị" "$([ -n "$(jget "$WORK/login.json" orgCode)" ] && echo true || echo false)" \
  "$(jget "$WORK/login.json" orgCode)"
check "token mang mức độ mật" "$([ -n "$(jget "$WORK/login.json" clearanceLevel)" ] && echo true || echo false)" \
  "clearance=$(jget "$WORK/login.json" clearanceLevel)"
check "giữ trường role cũ" "$([ -n "$(jget "$WORK/login.json" role)" ] && echo true || echo false)" \
  "$(jget "$WORK/login.json" role)"

echo "== Claim trong JWT =="
node -e "
  const payload = JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64url').toString());
  require('fs').writeFileSync(process.argv[2], JSON.stringify(payload));
" "$TOKEN" "$WORK/claims.json"
for claim in sub username role roles perms org_id clearance_level tv; do
  check "claim $claim có mặt" \
    "$([ -n "$(jget "$WORK/claims.json" "$claim")" ] && echo true || echo false)"
done

echo "== Sai mật khẩu =="
STATUS=$(api POST /iam/auth/login "" "{\"username\":\"$ADMIN_USER\",\"password\":\"sai-mat-khau\"}")
check "mật khẩu sai bị từ chối" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Danh mục vai trò và quyền =="
STATUS=$(api GET /iam/roles "$TOKEN")
ROLE_TOTAL=$(jget "$WORK/body" total)
check "liệt kê được vai trò" "$([ "$STATUS" = 200 ] && [ "${ROLE_TOTAL:-0}" -ge 10 ] && echo true || echo false)" \
  "$ROLE_TOTAL vai trò"
STATUS=$(api GET /iam/permissions "$TOKEN")
PERM_TOTAL=$(jget "$WORK/body" total)
check "liệt kê được quyền" "$([ "$STATUS" = 200 ] && [ "${PERM_TOTAL:-0}" -ge 13 ] && echo true || echo false)" \
  "$PERM_TOTAL quyền"
STATUS=$(api GET /iam/organizations "$TOKEN")
check "liệt kê được đơn vị" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Quyền hiệu lực của chính mình =="
STATUS=$(api GET /iam/users/me/access "$TOKEN")
cp "$WORK/body" "$WORK/me.json"
USER_ID=$(jget "$WORK/me.json" userId)
check "xem được quyền của mình" "$([ "$STATUS" = 200 ] && echo true || echo false)" \
  "clearance hiệu lực=$(jget "$WORK/me.json" effectiveClearanceLevel)"

echo "== Vai trò hệ thống được bảo vệ =="
ADMIN_ROLE_ID=$(node -e "
  const roles = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).items || [];
  const found = roles.find(r => r.code === 'ADMIN');
  process.stdout.write(found ? found.id : '');
" <(api GET /iam/roles "$TOKEN" >/dev/null; cat "$WORK/body") 2>/dev/null || true)
if [ -z "$ADMIN_ROLE_ID" ]; then
  api GET /iam/roles "$TOKEN" >/dev/null
  ADMIN_ROLE_ID=$(node -e "
    const roles = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).items || [];
    const found = roles.find(r => r.code === 'ADMIN');
    process.stdout.write(found ? found.id : '');
  " "$WORK/body")
fi
STATUS=$(api PUT "/iam/roles/$ADMIN_ROLE_ID" "$TOKEN" '{"name":"Doi ten trai phep"}')
check "không sửa được vai trò hệ thống" "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Vai trò tự tạo =="
CUSTOM="SMOKE_$(date +%s)"
STATUS=$(api POST /iam/roles "$TOKEN" \
  "{\"code\":\"$CUSTOM\",\"name\":\"Vai tro kiem thu\",\"maxClearanceLevel\":1,\"permissions\":[\"data.read\"]}")
CUSTOM_ID=$(jget "$WORK/body" id)
check "tạo được vai trò mới" "$([ "$STATUS" = 201 ] && echo true || echo false)" "HTTP $STATUS"
STATUS=$(api POST /iam/roles "$TOKEN" \
  "{\"code\":\"$CUSTOM\",\"name\":\"Trung ma\",\"permissions\":[\"data.read\"]}")
check "trùng mã vai trò bị chặn" "$([ "$STATUS" = 409 ] && echo true || echo false)" "HTTP $STATUS"
STATUS=$(api POST /iam/roles "$TOKEN" \
  "{\"code\":\"${CUSTOM}_X\",\"name\":\"Quyen sai\",\"permissions\":[\"khong.ton.tai\"]}")
check "quyền không tồn tại bị chặn" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Service account và token máy-máy =="
CLIENT_ID="smoke-worker-$(date +%s)"
STATUS=$(api POST /iam/service-accounts "$TOKEN" \
  "{\"clientId\":\"$CLIENT_ID\",\"name\":\"Worker kiem thu\",\"orgCode\":\"ORG-ROOT\",\"clearanceLevel\":2,\"roleCodes\":[\"DATA_STEWARD\"]}")
CLIENT_SECRET=$(jget "$WORK/body" clientSecret)
check "tạo được service account" "$([ "$STATUS" = 201 ] && [ -n "$CLIENT_SECRET" ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /iam/auth/token "" "{\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"$CLIENT_SECRET\"}")
SERVICE_TOKEN=$(jget "$WORK/body" accessToken)
check "cấp được token máy-máy" "$([ "$STATUS" = 200 ] && [ -n "$SERVICE_TOKEN" ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /iam/auth/token "" "{\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"sai-secret\"}")
check "secret sai bị từ chối" "$([ "$STATUS" = 401 ] && echo true || echo false)" "HTTP $STATUS"

if [ -n "$SERVICE_TOKEN" ]; then
  node -e "
    const payload = JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64url').toString());
    require('fs').writeFileSync(process.argv[2], JSON.stringify(payload));
  " "$SERVICE_TOKEN" "$WORK/svc.json"
  check "token dịch vụ mang đúng đơn vị" \
    "$([ "$(jget "$WORK/svc.json" org_id)" = "ORG-ROOT" ] && echo true || echo false)" \
    "$(jget "$WORK/svc.json" org_id)"
  check "token dịch vụ được đánh dấu là service account" \
    "$([ "$(jget "$WORK/svc.json" actor_type)" = "service_account" ] && echo true || echo false)"
  # DATA_STEWARD không có audit.read nên phải bị từ chối.
  STATUS=$(api GET /iam/audit "$SERVICE_TOKEN")
  check "service account bị chặn ngoài phạm vi quyền" \
    "$([ "$STATUS" = 403 ] && echo true || echo false)" "HTTP $STATUS"
fi

echo "== Rà soát quyền =="
STATUS=$(api POST /iam/access-reviews "$TOKEN" \
  "{\"name\":\"Ra soat kiem thu $(date +%s)\"}")
REVIEW_ID=$(jget "$WORK/body" id)
REVIEW_ITEMS=$(jget "$WORK/body" totalItems)
check "mở được đợt rà soát" "$([ "$STATUS" = 201 ] && echo true || echo false)" "$REVIEW_ITEMS mục"
STATUS=$(api GET "/iam/access-reviews/$REVIEW_ID/items" "$TOKEN")
ITEM_ID=$(node -e "
  const items = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).items || [];
  process.stdout.write(items.length ? items[0].id : '');
" "$WORK/body")
check "liệt kê được mục rà soát" "$([ "$STATUS" = 200 ] && [ -n "$ITEM_ID" ] && echo true || echo false)"
STATUS=$(api POST "/iam/access-reviews/items/$ITEM_ID/decision" "$TOKEN" '{"decision":"REVOKE"}')
check "thu hồi không lý do bị chặn" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"
STATUS=$(api POST "/iam/access-reviews/items/$ITEM_ID/decision" "$TOKEN" '{"decision":"KEEP","reason":"Van con nhu cau"}')
check "ghi nhận quyết định GIỮ" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== MFA (TOTP) =="
# Sinh mã TOTP bằng cài đặt độc lập (RFC 6238) để chứng minh khoá do server
# phát ra tương thích với ứng dụng xác thực chuẩn, không phải tự khớp với nhau.
totp() {
  node -e "
    const crypto = require('crypto');
    const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secret = process.argv[1].replace(/=/g, '').toUpperCase();
    let bits = '';
    for (const ch of secret) bits += BASE32.indexOf(ch).toString(2).padStart(5, '0');
    const bytes = Buffer.from((bits.match(/.{8}/g) || []).map(b => parseInt(b, 2)));
    const counter = Math.floor(Date.now() / 1000 / 30);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const hash = crypto.createHmac('sha1', bytes).update(buf).digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const code = ((hash[offset] & 0x7f) << 24 | hash[offset + 1] << 16
      | hash[offset + 2] << 8 | hash[offset + 3]) % 1000000;
    process.stdout.write(String(code).padStart(6, '0'));
  " "$1"
}

STATUS=$(api POST /iam/auth/mfa/enroll "$TOKEN")
MFA_SECRET=$(jget "$WORK/body" secret)
OTP_URI=$(jget "$WORK/body" otpAuthUri)
check "ghi danh MFA trả về khoá" "$([ "$STATUS" = 200 ] && [ -n "$MFA_SECRET" ] && echo true || echo false)" \
  "khoá dài ${#MFA_SECRET} ký tự"
check "có URI otpauth cho mã QR" \
  "$(case "$OTP_URI" in otpauth://totp/*) echo true;; *) echo false;; esac)"

STATUS=$(api POST /iam/auth/mfa/activate "$TOKEN" "{\"code\":\"000000\"}")
check "mã sai không kích hoạt được MFA" "$([ "$STATUS" = 400 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /iam/auth/mfa/activate "$TOKEN" "{\"code\":\"$(totp "$MFA_SECRET")\"}")
check "kích hoạt MFA bằng mã TOTP độc lập" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /iam/auth/login "" "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")
MFA_TOKEN=$(jget "$WORK/body" mfaToken)
check "đăng nhập chuyển sang bước MFA" \
  "$([ "$(jget "$WORK/body" mfaRequired)" = "true" ] && [ -z "$(jget "$WORK/body" token)" ] && echo true || echo false)" \
  "mfaRequired=$(jget "$WORK/body" mfaRequired)"

STATUS=$(api GET /iam/roles "$MFA_TOKEN")
check "token MFA tạm không dùng được cho API khác" \
  "$([ "$STATUS" = 401 ] || [ "$STATUS" = 403 ] && echo true || echo false)" "HTTP $STATUS"

STATUS=$(api POST /iam/auth/mfa/verify "" "{\"mfaToken\":\"$MFA_TOKEN\",\"code\":\"$(totp "$MFA_SECRET")\"}")
TOKEN=$(jget "$WORK/body" token)
REFRESH=$(jget "$WORK/body" refreshToken)
check "xác minh MFA trả về token đầy đủ" \
  "$([ "$STATUS" = 200 ] && [ -n "$TOKEN" ] && echo true || echo false)" "HTTP $STATUS"

# Trả tài khoản về trạng thái ban đầu để lần chạy sau không bị vướng MFA.
STATUS=$(api POST "/iam/auth/users/$USER_ID/mfa/disable" "$TOKEN" '{"reason":"ket thuc kiem thu"}')
check "tắt được MFA (hành động giảm bảo vệ, có ghi audit)" \
  "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"

echo "== Nhật ký kiểm toán =="
STATUS=$(api GET "/iam/audit?action=LOGIN&size=5" "$TOKEN")
AUDIT_TOTAL=$(jget "$WORK/body" total)
check "audit ghi lại lần đăng nhập" \
  "$([ "$STATUS" = 200 ] && [ "${AUDIT_TOTAL:-0}" -ge 1 ] && echo true || echo false)" "$AUDIT_TOTAL bản ghi"
STATUS=$(api GET "/iam/audit?result=FAILURE&size=5" "$TOKEN")
FAIL_TOTAL=$(jget "$WORK/body" total)
check "audit ghi lại lần đăng nhập hỏng" \
  "$([ "${FAIL_TOTAL:-0}" -ge 1 ] && echo true || echo false)" "$FAIL_TOTAL bản ghi"

echo "== Thu hồi token =="
STATUS=$(api POST /iam/auth/logout-all "$TOKEN")
check "đăng xuất toàn phiên" "$([ "$STATUS" = 200 ] && echo true || echo false)" "HTTP $STATUS"
STATUS=$(api GET /iam/users/me/access "$TOKEN")
check "token cũ bị từ chối ngay" "$([ "$STATUS" = 401 ] && echo true || echo false)" "HTTP $STATUS"
STATUS=$(api POST /iam/auth/refresh "" "{\"refreshToken\":\"$REFRESH\"}")
check "refresh token cũ cũng bị từ chối" "$([ "$STATUS" = 401 ] && echo true || echo false)" "HTTP $STATUS"

echo
echo "Tổng kết: $PASSED đạt, $FAILED không đạt"
[ "$FAILED" -eq 0 ]
