#!/bin/bash
# ============================================================
# Script deploy local cho Uông Bí
# Chạy BE bằng JAR và FE bằng npm (serve static)
# ============================================================
# Yêu cầu:
#   - Java 17+ đã cài
#   - Node.js 20+ đã cài
#   - npm install -g serve (để serve static FE)
#   - PostgreSQL đang chạy local (port 5432 hoặc 5434)
# ============================================================
# Cách chạy từ thư mục gốc dự án:
#   chmod +x deployment/tenants/uongbi/start-local.sh
#   ./deployment/tenants/uongbi/start-local.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "======================================"
echo "  Deploy Local - Uong Bi"
echo "  Project: $PROJECT_ROOT"
echo "======================================"

# ── Config ──────────────────────────────────────────────────
BE_DIR="$PROJECT_ROOT/be"
FE_DIR="$PROJECT_ROOT/fe-modul-report"
BE_JAR_PATTERN="$BE_DIR/target/*.jar"
FE_PORT=3000
BE_PORT=8080
LOG_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOG_DIR"

# ── Dừng tiến trình cũ nếu đang chạy ────────────────────────
echo ""
echo "[1/4] Dừng các tiến trình cũ..."
pkill -f "report.*\.jar" 2>/dev/null && echo "  ✓ Đã dừng BE cũ" || echo "  → Không có BE đang chạy"
pkill -f "serve.*dist" 2>/dev/null && echo "  ✓ Đã dừng FE cũ" || echo "  → Không có FE đang chạy"
sleep 2

# ── Build Backend ────────────────────────────────────────────
echo ""
echo "[2/4] Build Backend (Maven)..."
cd "$BE_DIR"
./mvnw clean package -DskipTests -q
echo "  ✓ Build BE xong"

# ── Start Backend ────────────────────────────────────────────
echo ""
echo "[3/4] Khởi động Backend (port $BE_PORT)..."
JAR_FILE=$(ls $BE_JAR_PATTERN | head -1)
if [ -z "$JAR_FILE" ]; then
  echo "  ✗ Không tìm thấy file JAR! Kiểm tra lại build."
  exit 1
fi

nohup java -jar "$JAR_FILE" \
  --spring.profiles.active=dev \
  > "$LOG_DIR/backend.log" 2>&1 &
BE_PID=$!
echo "  ✓ Backend đang chạy (PID: $BE_PID) → log: $LOG_DIR/backend.log"

# Chờ BE khởi động
echo "  → Chờ BE sẵn sàng..."
for i in {1..30}; do
  if curl -sf "http://localhost:$BE_PORT/api/actuator/health" > /dev/null 2>&1; then
    echo "  ✓ Backend ready!"
    break
  fi
  sleep 2
done

# ── Build & Serve Frontend ───────────────────────────────────
echo ""
echo "[4/4] Build và serve Frontend (port $FE_PORT)..."
cd "$FE_DIR"

# Copy tenant env
cp tenants/uongbi.env .env
echo "  ✓ Đã load config tenant uongbi"

npm run build
echo "  ✓ Build FE xong"

# Serve static files
if command -v serve &> /dev/null; then
  nohup serve -s dist -l $FE_PORT > "$LOG_DIR/frontend.log" 2>&1 &
  FE_PID=$!
  echo "  ✓ Frontend đang chạy (PID: $FE_PID) → log: $LOG_DIR/frontend.log"
else
  echo "  ⚠ 'serve' chưa cài. Chạy: npm install -g serve"
  echo "  Hoặc dùng: cd $FE_DIR && npx serve -s dist -l $FE_PORT"
fi

echo ""
echo "======================================"
echo "  ✅ Deploy thành công!"
echo "  Frontend: http://localhost:$FE_PORT"
echo "  Backend:  http://localhost:$BE_PORT/api"
echo "  Logs:     $LOG_DIR/"
echo "======================================"
