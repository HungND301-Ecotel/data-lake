#!/bin/bash
# ============================================================
# Start app - Release environment - Tenant aware
# ============================================================
# Được gọi bởi CI/CD sau khi SCP deployment files lên server.
# Đọc cấu hình từ .env_tenant (ports, volumes, tenant name...).
# ============================================================

COMPOSE_FILE="release-docker-compose.yaml"
ENV_FILE=".env_tenant"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Không tìm thấy $ENV_FILE. CI/CD có copy file này chưa?"
  exit 1
fi

TENANT=$(grep "^TENANT=" "$ENV_FILE" | cut -d= -f2)
PROJECT_NAME="${TENANT:-tenant}_release"
echo "🚀 Deploying tenant: ${TENANT} (release)"

docker compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
docker compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
nohup docker compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d > deploy.log 2>&1 &
docker image prune -f
docker images | grep "$TENANT"
echo "✅ Deploy ${TENANT} (release) hoàn tất!"