/**
 * Sinh một tệp mẫu DOCX tối thiểu có đủ bốn loại placeholder của mục 5.3,
 * dùng cho kiểm thử M10.
 *
 *   node tools/make_sample_template.js <đường dẫn đầu ra>
 *
 * Viết ZIP thủ công ở chế độ "stored" (không nén) để không phải thêm thư viện.
 * Word và Apache POI đều đọc được ZIP không nén.
 */

const fs = require("fs");
const zlib = require("zlib");

const OUT = process.argv[2] || "sample-template.docx";

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

/** Mỗi đoạn văn là một run duy nhất để placeholder không bị Word cắt nhỏ. */
const paragraphs = [
  "BÁO CÁO SẢN LƯỢNG",
  "Kỳ: {{report.period_start}} đến {{report.period_end}}",
  "",
  "1. Số liệu tổng hợp",
  "Tổng sản lượng: {{tong_san_luong}} tấn",
  "Số ca sản xuất: {{so_ca}}",
  "",
  "2. Chi tiết theo phân xưởng",
  "{{table.chi_tiet_phan_xuong}}",
  "",
  "3. Nhận xét",
  "{{ai.nhan_xet}}",
  "",
  "Mã kiểm chứng số liệu: {{report.snapshot_checksum}}",
];

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${paragraphs
  .map(
    (text) =>
      `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  )
  .join("\n")}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
</w:body>
</w:document>`;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- ZIP tối thiểu, chế độ stored -----------------------------------------

function dosTime() {
  // Thời gian cố định để tệp sinh ra có nội dung ổn định giữa các lần chạy.
  return { time: 0, date: 0x21 };
}

function buildZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const { time, date } = dosTime();

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.content, "utf8");
    const crc = zlib.crc32
      ? zlib.crc32(data)
      : crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // method: stored
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuffer, data);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0); // central directory header
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);

    central.push(header, nameBuffer);
    offset += local.length + nameBuffer.length + data.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuffer, end]);
}

/** CRC-32 cho các bản Node chưa có zlib.crc32. */
function crc32(buffer) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let value = i;
      for (let bit = 0; bit < 8; bit++) {
        value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
      }
      table[i] = value;
    }
  }
  let crc = -1;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

fs.writeFileSync(
  OUT,
  buildZip([
    { name: "[Content_Types].xml", content: CONTENT_TYPES },
    { name: "_rels/.rels", content: RELS },
    { name: "word/document.xml", content: DOCUMENT },
  ])
);

console.log(`Đã tạo ${OUT}`);
