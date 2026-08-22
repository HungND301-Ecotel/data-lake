package com.quangnt0000.be_modul.service.Report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quangnt0000.be_modul.modal.Report.ReportFact;
import com.quangnt0000.be_modul.modal.Report.ReportNarrative;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.model.XWPFHeaderFooterPolicy;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thay placeholder bằng số liệu đã chốt và xuất tệp kết quả - UC10.05/UC10.08.
 *
 * <p>Bản render **chỉ đọc từ snapshot**, không chạy lại truy vấn nào. Nhờ vậy
 * bản xem trước và bản xuất chính thức luôn khớp nhau, đúng tiêu chí AC-05.
 *
 * <p>Việc thay chuỗi được làm ở mức run của Word chứ không ở mức đoạn văn, để
 * giữ nguyên định dạng gốc của mẫu. Một placeholder bị Word cắt thành nhiều run
 * sẽ được ghép lại trước khi thay.
 */
@Slf4j
@Service
public class ReportRenderService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Nhãn đóng dấu lên tài liệu theo mức độ mật - mục 5.3 và 9.1. */
    public String watermarkFor(String securityLabelCode, int securityLevel) {
        if (securityLevel >= 4) {
            return "TỐI MẬT";
        }
        if (securityLevel >= 3) {
            return "MẬT";
        }
        if (securityLevel >= 2) {
            return "HẠN CHẾ";
        }
        return null; // công khai và nội bộ không cần đóng dấu
    }

    public byte[] render(byte[] template, String format, List<ReportFact> facts,
                         List<ReportNarrative> narratives, Map<String, String> extras,
                         String watermark) throws IOException {
        Map<String, String> values = buildValueMap(facts, narratives, extras);
        if ("XLSX".equalsIgnoreCase(format)) {
            return renderXlsx(template, values, watermark);
        }
        return renderDocx(template, values, facts, watermark);
    }

    private Map<String, String> buildValueMap(List<ReportFact> facts,
                                              List<ReportNarrative> narratives,
                                              Map<String, String> extras) {
        Map<String, String> values = new LinkedHashMap<>();
        if (extras != null) {
            extras.forEach((key, value) -> values.put("{{" + key + "}}", value));
        }
        for (ReportFact fact : facts) {
            if ("TABLE".equals(fact.getFactType())) {
                values.put("{{table." + fact.getPlaceholderName() + "}}", fact.getValue());
                values.put("{{chart." + fact.getPlaceholderName() + "}}", fact.getValue());
            } else {
                values.put("{{" + fact.getPlaceholderName() + "}}", fact.getValue());
            }
        }
        for (ReportNarrative narrative : narratives) {
            String text = narrative.getFinalText() == null
                    ? narrative.getGeneratedText()
                    : narrative.getFinalText();
            values.put("{{ai." + narrative.getPlaceholderName() + "}}",
                    text == null ? "" : text);
        }
        return values;
    }

    // ------------------------------------------------------------------
    // DOCX
    // ------------------------------------------------------------------

    private byte[] renderDocx(byte[] template, Map<String, String> values,
                              List<ReportFact> facts, String watermark) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(template));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            document.getParagraphs().forEach(p -> replaceInParagraph(p, values));

            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        cell.getParagraphs().forEach(p -> replaceInParagraph(p, values));
                    }
                }
            }
            document.getHeaderList().forEach(header ->
                    header.getParagraphs().forEach(p -> replaceInParagraph(p, values)));
            document.getFooterList().forEach(footer ->
                    footer.getParagraphs().forEach(p -> replaceInParagraph(p, values)));

            appendTables(document, facts);

            if (watermark != null) {
                stampWatermark(document, watermark);
            }

            document.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Ghép toàn bộ run của một đoạn, thay chuỗi, rồi ghi lại vào run đầu tiên.
     * Cách này giữ được kiểu chữ của run đầu và xử lý được placeholder bị Word
     * chia nhỏ - trường hợp rất hay gặp khi người dùng gõ lại một phần token.
     */
    private void replaceInParagraph(XWPFParagraph paragraph, Map<String, String> values) {
        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) {
            return;
        }

        StringBuilder joined = new StringBuilder();
        for (XWPFRun run : runs) {
            String text = run.getText(0);
            joined.append(text == null ? "" : text);
        }
        String original = joined.toString();
        if (!original.contains("{{")) {
            return;
        }

        String replaced = original;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            if (replaced.contains(entry.getKey())) {
                replaced = replaced.replace(entry.getKey(),
                        entry.getValue() == null ? "" : entry.getValue());
            }
        }
        if (replaced.equals(original)) {
            return;
        }

        runs.get(0).setText(replaced, 0);
        for (int i = runs.size() - 1; i >= 1; i--) {
            paragraph.removeRun(i);
        }
    }

    /** Bảng số liệu được thêm vào cuối tài liệu, ngay dưới đoạn đánh dấu. */
    private void appendTables(XWPFDocument document, List<ReportFact> facts) {
        for (ReportFact fact : facts) {
            if (!"TABLE".equals(fact.getFactType()) || fact.getRawValue() == null) {
                continue;
            }
            try {
                Map<?, ?> payload = objectMapper.readValue(fact.getRawValue(), Map.class);
                List<?> columns = (List<?>) payload.get("columns");
                List<?> rows = (List<?>) payload.get("rows");
                if (columns == null || columns.isEmpty()) {
                    continue;
                }

                XWPFParagraph caption = document.createParagraph();
                XWPFRun captionRun = caption.createRun();
                captionRun.setBold(true);
                captionRun.setText("Bảng: " + fact.getPlaceholderName());

                XWPFTable table = document.createTable(1, columns.size());
                for (int c = 0; c < columns.size(); c++) {
                    table.getRow(0).getCell(c).setText(String.valueOf(columns.get(c)));
                }
                for (Object rowObject : rows == null ? List.of() : rows) {
                    Map<?, ?> rowMap = (Map<?, ?>) rowObject;
                    XWPFTableRow row = table.createRow();
                    for (int c = 0; c < columns.size(); c++) {
                        Object value = rowMap.get(columns.get(c));
                        row.getCell(c).setText(value == null ? "" : String.valueOf(value));
                    }
                }
            } catch (Exception e) {
                log.error("Không dựng được bảng cho {}", fact.getPlaceholderName(), e);
            }
        }
    }

    /**
     * Đóng dấu độ mật vào header của mọi section. Đây là dấu hiệu nhìn thấy
     * được; kiểm soát thật vẫn nằm ở phân quyền tải xuống.
     */
    private void stampWatermark(XWPFDocument document, String watermark) {
        XWPFHeaderFooterPolicy policy = document.getHeaderFooterPolicy();
        if (policy == null) {
            policy = document.createHeaderFooterPolicy();
        }
        XWPFHeader header = policy.getDefaultHeader();
        if (header == null) {
            header = policy.createHeader(XWPFHeaderFooterPolicy.DEFAULT);
        }
        XWPFParagraph paragraph = header.createParagraph();
        paragraph.setAlignment(ParagraphAlignment.RIGHT);
        XWPFRun run = paragraph.createRun();
        run.setBold(true);
        run.setColor("C00000");
        run.setFontSize(14);
        run.setText(watermark);
    }

    // ------------------------------------------------------------------
    // XLSX
    // ------------------------------------------------------------------

    private byte[] renderXlsx(byte[] template, Map<String, String> values, String watermark)
            throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(template));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        if (cell.getCellType() != CellType.STRING) {
                            continue;
                        }
                        String text = cell.getStringCellValue();
                        if (text == null || !text.contains("{{")) {
                            continue;
                        }
                        String replaced = text;
                        for (Map.Entry<String, String> entry : values.entrySet()) {
                            replaced = replaced.replace(entry.getKey(),
                                    entry.getValue() == null ? "" : entry.getValue());
                        }
                        cell.setCellValue(replaced);
                    }
                }
                if (watermark != null) {
                    sheet.getHeader().setRight(watermark);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /** Placeholder còn sót lại sau khi render, dùng cho bước kiểm tra. */
    public List<String> findUnresolved(byte[] rendered, String format) throws IOException {
        List<String> remaining = new ArrayList<>();
        StringBuilder text = new StringBuilder();

        if ("XLSX".equalsIgnoreCase(format)) {
            try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(rendered))) {
                for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                    for (Row row : workbook.getSheetAt(s)) {
                        for (Cell cell : row) {
                            if (cell.getCellType() == CellType.STRING) {
                                text.append(cell.getStringCellValue()).append('\n');
                            }
                        }
                    }
                }
            }
        } else {
            try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(rendered))) {
                document.getParagraphs().forEach(p -> text.append(p.getText()).append('\n'));
                document.getTables().forEach(table -> table.getRows().forEach(row ->
                        row.getTableCells().forEach(cell ->
                                text.append(cell.getText()).append('\n'))));
            }
        }

        java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile("\\{\\{[^}]+}}").matcher(text);
        while (matcher.find()) {
            if (!remaining.contains(matcher.group())) {
                remaining.add(matcher.group());
            }
        }
        return remaining;
    }
}
