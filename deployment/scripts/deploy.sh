#!/bin/bash
# ============================================================
# Script deploy chung - dùng cho CI/CD và deploy thủ công
# ============================================================
# Usage:
#   ./deployment/scripts/deploy.sh <tenant> [environment]
#
# Examples:
#   ./deployment/scripts/deploy.sh deonaicocsau staging
#   ./deployment/scripts/deploy.sh uongbi staging
#
# environment: staging (default) | release
# ============================================================

set -e

TENANT="${1:-}"
ENVIRONMENT="${2:-staging}"

if [ -z "$TENANT" ]; then
  echo "❌ Thiếu tham số TENANT!"
  echo "   Usage: $0 <tenant> [staging|release]"
  echo "   Ví dụ: $0 deonaicocsau staging"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANT_ENV_FILE="$PROJECT_ROOT/deployment/tenants/${TENANT}/.env"
COMPOSE_FILE="$PROJECT_ROOT/deployment/${ENVIRONMENT}/${ENVIRONMENT}-docker-compose.yaml"

# Kiểm tra file config tenant tồn tại
if [ ! -f "$TENANT_ENV_FILE" ]; then
  echo "❌ Không tìm thấy config cho tenant '$TENANT'!"
  echo "   Tạo file: $TENANT_ENV_FILE"
  echo "   Tham khảo: $PROJECT_ROOT/deployment/tenants/deonaicocsau/.env"
  exit 1
fi

echo "======================================"
echo "  Deploy: $TENANT → $ENVIRONMENT"
echo "  Config: $TENANT_ENV_FILE"
echo "======================================"

cd "$PROJECT_ROOT/deployment/${ENVIRONMENT}"

# Copy backend env nếu có
if [ -f "$TENANT_ENV_FILE" ]; then
  cp "$TENANT_ENV_FILE" .env_tenant
fi

echo "[1/3] Dừng containers cũ..."
docker compose --env-file "$TENANT_ENV_FILE" \
  -f "$COMPOSE_FILE" down

echo "[2/3] Pull images mới..."
docker compose --env-file "$TENANT_ENV_FILE" \
  -f "$COMPOSE_FILE" pull

echo "[3/3] Khởi động containers..."
docker compose --env-file "$TENANT_ENV_FILE" \
  -f "$COMPOSE_FILE" up -d

docker image prune -f
docker images | grep "$TENANT"

echo ""
echo "✅ Deploy $TENANT ($ENVIRONMENT) thành công!"
