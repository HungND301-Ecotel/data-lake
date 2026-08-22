/**
 * Dọn kết quả pg_dump --schema-only thành một migration Flyway dùng được.
 *
 *   node tools/clean_baseline.js <đầu vào> <đầu ra>
 *
 * Bỏ các chỉ thị chỉ có ý nghĩa với psql (SET, \connect, set_config) và các
 * dòng bình luận, giữ nguyên phần DDL.
 */

const fs = require("fs");

const input = process.argv[2];
const output = process.argv[3];

const source = fs.readFileSync(input, "utf8").replace(/^﻿/, "");
const kept = [];

for (const line of source.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith("SET ")) continue;
  if (trimmed.startsWith("SELECT pg_catalog.set_config")) continue;
  if (trimmed.startsWith("\\")) continue;
  if (trimmed.startsWith("--")) continue;
  kept.push(line);
}

const body = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();

const header = `-- Baseline schema, sinh từ pg_dump của cơ sở dữ liệu do Hibernate tạo ra.
--
-- Đây là mốc khởi đầu của lịch sử migration. Cơ sở dữ liệu đang chạy sẵn được
-- baseline sang phiên bản 1 mà không chạy lại file này (flyway.baseline-on-migrate),
-- còn môi trường mới sẽ dựng schema từ đây.
--
-- Từ phiên bản 2 trở đi, mọi thay đổi lược đồ phải viết thành migration mới;
-- Hibernate chạy ở chế độ validate nên sẽ báo lỗi nếu entity và schema lệch nhau.

`;

fs.writeFileSync(output, header + body + "\n");

console.log(`Đã ghi ${output}`);
console.log("  CREATE TABLE:", (body.match(/CREATE TABLE/g) || []).length);
console.log("  ALTER TABLE :", (body.match(/ALTER TABLE/g) || []).length);
console.log("  CREATE INDEX:", (body.match(/CREATE INDEX/g) || []).length);
