# Data Lake - Hệ thống báo cáo

Hệ thống báo cáo đa công ty (multi-tenant) trên **một nhánh git duy nhất**.  
Sự khác nhau giữa các công ty được quản lý hoàn toàn bằng **file cấu hình**, không phải nhánh git.

---

## 📁 Cấu trúc dự án

```
data-lake/
├── be/                              # Backend (Spring Boot)
├── fe-modul-report/                 # Frontend (React + Vite)
│   ├── tenants/                     # ← Config UI per-tenant
│   │   ├── uongbi.env               #   Màu, logo, API URL cho Uông Bí
│   │   ├── deonaicocsau.env         #   Màu, logo, API URL cho Đèo Nai Cọc Sáu
│   │   └── default.env              #   Config dev local
│   └── src/config/tenant.ts         # ← Entry point đọc config tenant
├── deployment/
│   ├── staging/
│   │   └── staging-docker-compose.yaml  # Template compose staging (dùng biến ${TENANT})
│   ├── release/
│   │   └── release-docker-compose.yaml  # Template compose release
│   ├── tenants/                     # ← Config deployment per-tenant
│   │   ├── uongbi/
│   │   │   ├── .env                 #   Ports, volume paths cho Uông Bí
│   │   │   └── start-local.sh       #   Script deploy local (JAR + npm)
│   │   └── deonaicocsau/
│   │       └── .env                 #   Ports, volume paths cho Đèo Nai Cọc Sáu
│   └── scripts/
│       └── deploy.sh                # ← Script deploy chung (nhận --tenant)
├── .github/workflows/
│   └── deploy-staging.yml           # CI/CD GitHub Actions - tenant-aware
├── docker-compose-build.yaml        # Build images (dùng biến ${TENANT})
└── Makefile                         # Shortcuts build/deploy
```

---

## 🏢 Thêm tenant mới (ví dụ: `vietmindo`)

Chỉ cần **3 bước**, không đụng vào code logic:

### Bước 1: Tạo config UI frontend
```bash
# Tạo file: fe-modul-report/tenants/vietmindo.env
VITE_TENANT=vietmindo
VITE_APP_TITLE=Hệ thống báo cáo - Viet Mindo
VITE_PRIMARY_COLOR=#e65100       # Màu chủ đạo navbar
VITE_PRIMARY_DARK=#bf360c        # Màu border navbar (tối hơn 1 tone)
VITE_API=http://<IP_VIETMINDO>:8080/api

# Thông tin trang Login
VITE_COMPANY_NAME=CÔNG TY VIET MINDO
VITE_HOTLINE=0901234567
VITE_EMAIL=info@vietmindo.vn
VITE_COPYRIGHT=© 2024 Viet Mindo. All rights reserved.

# Logo & banner - đặt file ảnh vào src/file/ rồi đăng ký vào LOGO_MAP/BANNER_MAP trong LoginPage.tsx
VITE_LOGO_FILE=logo-vietmindo.png
VITE_BANNER_FILE=banner-vietmindo.jpg
```

### Bước 2: Tạo config deployment
```bash
# Tạo file: deployment/tenants/vietmindo/.env
TENANT=vietmindo
REGISTRY=ecoteldev
VERSION=latest
PROXY_PORT=7070          # Port không được trùng với tenant khác!
BACKEND_PORT=7071
PGADMIN_PORT=7072
POSTGRES_VOLUME_PATH=/mnt/hdd/vietmindo_postgres_data
PGADMIN_VOLUME_PATH=/mnt/hdd/vietmindo_pgadmin_data
```

### Bước 3: Thêm GitHub Secrets (nếu dùng CI/CD)
Vào **Settings → Secrets** của repo, thêm:
- `VITE_API` (hoặc dùng tên riêng per-tenant)
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `STAGING_PORT`

Deploy:
```bash
# Trigger thủ công từ GitHub Actions UI → workflow_dispatch → tenant = vietmindo
# Hoặc chạy local:
make staging TENANT=vietmindo
./deployment/scripts/deploy.sh vietmindo staging
```

---

## 🚀 Deploy

### CI/CD (tự động - GitHub Actions)
- **Push vào `develop`** → tự deploy tenant mặc định (deonaicocsau)
- **Manual trigger** → vào Actions → "Deploy Staging" → chọn tenant muốn deploy

### Deploy thủ công (qua script)
```bash
# Deploy 1 tenant lên staging
./deployment/scripts/deploy.sh deonaicocsau staging

# Deploy tenant khác
./deployment/scripts/deploy.sh vietmindo staging
```

### Deploy local - Uông Bí (JAR + npm)
```bash
# Chạy từ thư mục gốc dự án
chmod +x deployment/tenants/uongbi/start-local.sh
./deployment/tenants/uongbi/start-local.sh
```

### Build image thủ công
```bash
# Build image staging cho tenant cụ thể
make staging TENANT=deonaicocsau

# Build image release
make release TENANT=deonaicocsau
```

---

## 🔧 Dev Local

```bash
# Chạy frontend dev với config mặc định
cd fe-modul-report
npm run dev

# Chạy với config của tenant cụ thể
cp tenants/deonaicocsau.env .env
npm run dev
```

---

## 📋 Danh sách tenants

| Tenant | Màu navbar | Cổng Deploy | Cách deploy |
|--------|-----------|-------------|-------------|
| `uongbi` | `#1a8649` (xanh lá) | Local | JAR + npm (start-local.sh) |
| `deonaicocsau` | `#1976D2` (xanh dương) | Staging server | GitHub Actions CI/CD |

---

## 🌿 Git Branching Model

```
main        ← production-ready, stable
develop     ← staging, CI/CD deploy
feature/*   ← tính năng mới
hotfix/*    ← vá lỗi khẩn cấp
```

> **Không có nhánh per-tenant nữa!**  
> Mọi thay đổi đều vào `develop` → merge vào `main`.  
> Sự khác nhau giữa các công ty ở file `.env`, không phải ở code.
