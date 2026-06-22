### Build Front-End
### E.g.: $ docker build -t ecotel_frontend_img:latest .
# $ docker run -d -p 3000:80 ecotel_frontend_img:latest

## Create an image based on the official Node image from dockerhub
FROM node:20 AS development

WORKDIR /usr/src/app

# copy đúng file lock
COPY package.json package-lock.json ./

# ❗ FIX: dùng npm ci + clean đúng cách
RUN rm -rf node_modules \
 && npm ci --include=optional

# copy source sau khi install
COPY . .

# build
RUN npm run build


# ===== NGINX STAGE =====
FROM nginx:alpine

COPY .nginx/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=development /usr/src/app/dist .

ENTRYPOINT ["nginx", "-g", "daemon off;"]