### Build Front-End
### E.g.: $ docker build -t ecotel_frontend_img:latest .
# $ docker run -d -p 3000:6228 ecotel_frontend_img:latest

## Create an image based on the official Node image from dockerhub
FROM node:20 AS development

## Create app directory
WORKDIR /usr/src/app

## A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
## Clean & install app dependencies
RUN npm i

## Bundle app source
## Get all the code needed to run the app
COPY . .

## Vite nướng biến vào bundle lúc build, nên URL của backend/worker phải có
## mặt ở bước này chứ không phải lúc chạy container.
ARG VITE_API
ARG VITE_DATALAKE_API
ARG VITE_INGESTION_API

## `.env.production` nằm trong repo và Vite cho tệp đó thắng biến môi trường,
## nên nếu để nguyên thì bundle triển khai vẫn trỏ về cổng của máy chủ cũ dù
## build-arg đã truyền đúng. Ghi đè bằng chính giá trị lúc triển khai; bỏ trống
## build-arg thì giữ nguyên tệp sẵn có để `docker build` trần vẫn chạy như cũ.
RUN if [ -n "$VITE_API" ]; then \
      { echo "VITE_API=$VITE_API"; \
        echo "VITE_DATALAKE_API=$VITE_DATALAKE_API"; \
        echo "VITE_INGESTION_API=$VITE_INGESTION_API"; } > .env.production; \
    fi \
    && cat .env.production

## React buid for production environment (smaller size)
RUN npm run build

## Create an HTTP web server based on nginx image.
## Cấu hình trong .nginx/nginx.conf cho nginx nghe cổng 6228, không phải 80.
FROM nginx:alpine

### Reference for connecting Frontend to Backend
# 1. https://github.com/kubernetes/website/blob/main/content/en/examples/service/access/Dockerfile
# 2. https://kubernetes.io/docs/tasks/access-application-cluster/connecting-frontend-backend/

COPY .nginx/nginx.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=development /usr/src/app/dist /usr/share/nginx/html
# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
