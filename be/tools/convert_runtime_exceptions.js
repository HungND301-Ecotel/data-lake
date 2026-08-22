/**
 * Đổi các `new RuntimeException("...")` do mã nghiệp vụ tự ném thành
 * `BusinessException`, để thông điệp của chúng vẫn ra tới người dùng sau khi
 * handler catch-all ngừng lộ `getMessage()` của ngoại lệ hạ tầng.
 *
 *   node tools/convert_runtime_exceptions.js
 *
 * Chỉ đụng tới lời gọi có chuỗi ký tự; `new RuntimeException(e)` bọc ngoại lệ
 * khác được giữ nguyên vì đó là lỗi hạ tầng thật.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "main", "java");
const IMPORT_LINE = "import com.quangnt0000.be_modul.config.BusinessException;";

const NOT_FOUND = /new RuntimeException\("([^"]*(?:not found|Not found|không tìm thấy)[^"]*)"\)/g;
const WITH_MESSAGE = /new RuntimeException\("([^"]*)"\)/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".java")) files.push(full);
  }
  return files;
}

let changedFiles = 0;
let changedCalls = 0;

for (const file of walk(ROOT)) {
  let source = fs.readFileSync(file, "utf8");
  const before = (source.match(WITH_MESSAGE) || []).length;
  if (!before) continue;

  source = source.replace(NOT_FOUND, (_m, message) => `BusinessException.notFound("${message}")`);
  source = source.replace(WITH_MESSAGE, (_m, message) => `new BusinessException("${message}")`);

  const inConfigPackage = file.includes(`${path.sep}config${path.sep}`);
  if (!inConfigPackage && !source.includes(IMPORT_LINE)) {
    source = source.replace(/^(package [^\n]+\n)/, `$1\n${IMPORT_LINE}\n`);
  }

  fs.writeFileSync(file, source);
  changedFiles += 1;
  changedCalls += before;
  console.log(`${path.relative(ROOT, file)}: ${before}`);
}

console.log(`\nĐã đổi ${changedCalls} lời gọi trong ${changedFiles} file.`);
