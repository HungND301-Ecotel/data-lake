### Build Front-End with Tenant Config
### Usage:
###   docker build --build-arg TENANT=uongbi -t frontend_img:latest .
###   docker build --build-arg TENANT=deonaicocsau -t frontend_img:latest .
### Available tenants: xem fe-modul-report/tenants/

## Build stage
FROM node:20 AS development

WORKDIR /usr/src/app

# Nhận tenant từ build arg (mặc định là default nếu không truyền)
ARG TENANT=default

COPY package.json package-lock.json ./

# Clean install dependencies
RUN rm -rf node_modules \
    && npm ci --include=optional

# Copy toàn bộ source
COPY . .

# Copy tenant env file thành .env để Vite đọc khi build
RUN cp tenants/${TENANT}.env .env

# Build production bundle với config của tenant
RUN npm run build


# ===== NGINX STAGE =====
FROM nginx:alpine

COPY .nginx/nginx_docker.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=development /usr/src/app/dist .

ENTRYPOINT ["nginx", "-g", "daemon off;"]