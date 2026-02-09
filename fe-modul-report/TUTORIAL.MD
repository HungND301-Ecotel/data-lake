# Hướng dẫn Deploy Frontend Module Report

## 1. Kết nối SSH vào Server

```bash
ssh ecotel-admin@1.52.29.243 -p 2222
```

**Password:** `Ecotel@2025`

---

## 2. Cài đặt các phần mềm cần thiết

```bash
sudo apt update
sudo apt install -y nodejs npm nginx
```

---

## 3. Build Frontend

```bash
# Di chuyển vào thư mục project
cd /home/ecotel-admin/datalake/data-lake/fe-modul-report

# Cài đặt dependencies
npm install
npm install -D typescript

# Build production
npm run build
```

---

## 4. Cấu hình Nginx

### 4.1. Tạo file cấu hình

```bash
sudo nano /etc/nginx/sites-available/fe-modul-report
```

### 4.2. Thêm nội dung sau vào file

```nginx
server {
    listen 6228;
    server_name _;

    root /home/ecotel-admin/datalake/data-lake/fe-modul-report/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Lưu file: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 5. Kích hoạt cấu hình Nginx

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/fe-modul-report /etc/nginx/sites-enabled/

# Xóa cấu hình default (nếu cần)
sudo rm /etc/nginx/sites-enabled/default

# Cấp quyền cho thư mục dist
sudo chown -R www-data:www-data /home/ecotel-admin/datalake/data-lake/fe-modul-report/dist
```

---

## 6. Khởi động lại Nginx

```bash
# Kiểm tra cấu hình
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 7. Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://1.52.29.243:6228`

---

## Lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `sudo systemctl status nginx` | Kiểm tra trạng thái Nginx |
| `sudo systemctl restart nginx` | Restart Nginx |
| `sudo tail -f /var/log/nginx/error.log` | Xem log lỗi Nginx |
| `npm run build` | Build lại frontend |

---

## Re-deploy (Cập nhật code mới)

```bash
cd /home/ecotel-admin/datalake/data-lake/fe-modul-report
git pull
npm install
npm run build
sudo chown -R www-data:www-data dist
sudo systemctl restart nginx
```
Ecotel@2025