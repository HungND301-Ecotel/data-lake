#!/bin/sh
# Database thứ hai cho worker. Chỉ chạy lần đầu, khi volume dữ liệu còn rỗng.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    CREATE DATABASE lakehouse;
    GRANT ALL PRIVILEGES ON DATABASE lakehouse TO $POSTGRES_USER;
SQL
