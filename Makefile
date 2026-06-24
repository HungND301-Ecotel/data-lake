#### Build Docker images - Multi-Tenant Support

# ============================================================
# Usage:
#   make up                           # local dev (docker compose up --build)
#   make staging TENANT=deonaicocsau  # build & push image staging
#   make staging TENANT=uongbi        # build & push image staging cho Uong Bi
#   make release TENANT=deonaicocsau  # build & push image release
#   make clean                        # docker compose down
#
# Thêm tenant mới:
#   1. Tạo fe-modul-report/tenants/{tenant}.env
#   2. Tạo deployment/tenants/{tenant}/.env
#   3. Chạy: make staging TENANT={tenant}
# ============================================================

# Docker registry
REGISTRY=ecoteldev
RELEASE_VERSION=release
STAGING_VERSION=staging
TAG_VERSION=$(shell git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")

# Tenant (bắt buộc khi dùng staging/release - truyền qua: make staging TENANT=xxx)
TENANT?=default

# Git info
current_branch := $(shell git branch --show-current)
commit_id      := $(shell git rev-parse --short=7 HEAD)


# ── Local Dev ─────────────────────────────────────────────────────
up: clean build

build:
	@echo "<-----Branch info------>" >> .branch_info
	@echo "#Current Branch: ${current_branch}\r\n#Current Commit ID: ${commit_id}" >> .branch_info
	@echo "#Build at time: $(shell date +'%Y-%m-%d %H:%M:%S')" >> .branch_info
	docker compose up --build


# ── Staging: build & push per-tenant ──────────────────────────────
staging:
	@if [ "$(TENANT)" = "default" ]; then \
		echo "❌ Thiếu TENANT! Ví dụ: make staging TENANT=deonaicocsau"; \
		exit 1; \
	fi
	@echo "🚀 Building staging image for tenant: $(TENANT)"
	@echo "REGISTRY=${REGISTRY}\nVERSION=${STAGING_VERSION}-${TAG_VERSION}-${commit_id}\nTENANT=$(TENANT)" > .env
	@echo "Docker compose build..."
	docker compose -f docker-compose-build.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_staging.conf
	@echo "Docker login..."
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Pushing images for tenant $(TENANT)..."
	docker compose -f docker-compose-build.yaml push
	@echo "✅ Done: $(TENANT) staging images pushed"


# ── Release: build & push per-tenant ──────────────────────────────
release:
	@if [ "$(TENANT)" = "default" ]; then \
		echo "❌ Thiếu TENANT! Ví dụ: make release TENANT=deonaicocsau"; \
		exit 1; \
	fi
	@echo "🚀 Building release image for tenant: $(TENANT)"
	@echo "REGISTRY=${REGISTRY}\nVERSION=${RELEASE_VERSION}-${TAG_VERSION}-${commit_id}\nTENANT=$(TENANT)" > .env
	@echo "Docker compose build..."
	docker compose -f docker-compose-build.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_release.conf
	@echo "Docker login..."
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Pushing images for tenant $(TENANT)..."
	docker compose -f docker-compose-build.yaml push
	@echo "✅ Done: $(TENANT) release images pushed"


# ── Cleanup ───────────────────────────────────────────────────────
clean:
	@echo "Docker compose down"
	docker compose down

.PHONY: clean up release staging build