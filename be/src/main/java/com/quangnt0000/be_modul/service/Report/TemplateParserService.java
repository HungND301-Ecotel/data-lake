package com.quangnt0000.be_modul.service.Report;

import com.quangnt0000.be_modul.modal.Report.ReportPlaceholder;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Quét placeholder trong tệp mẫu - UC10.02.
 *
 * <p>Cú pháp theo tài liệu mục 5.3: {@code {{field}}}, {@code {{table.name}}},
 * {@code {{chart.name}}}, {@code {{ai.section_name}}}. Placeholder không có
 * tiền tố được coi là FIELD.
 *
 * <p>Quét bằng máy chứ không để người thiết kế tự khai báo, nên bước kiểm tra
 * "không còn placeholder chưa map" mới có ý nghĩa.
 */
@Slf4j
@Service
public class TemplateParserService {

    /** Cho phép chữ, số, gạch dưới, gạch ngang và dấu chấm trong tên. */
    private static final Pattern TOKEN = Pattern.compile("\\{\\{\\s*([A-Za-z0-9_.\\-]+)\\s*}}");

    public static final String TYPE_FIELD = "FIELD";
    public static final String TYPE_TABLE = "TABLE";
    public static final String TYPE_CHART = "CHART";
    public static final String TYPE_AI = "AI_SECTION";

    public static class ParsedPlaceholder {
        public String token;
        public String type;
        public String name;
        public String locator;
        public int occurrences;
    }

    public List<ParsedPlaceholder> parse(byte[] content, String format) throws IOException {
        if ("XLSX".equalsIgnoreCase(format)) {
            return parseXlsx(content);
        }
        return parseDocx(content);
    }

    // ------------------------------------------------------------------
    // DOCX
    // ------------------------------------------------------------------

    private List<ParsedPlaceholder> parseDocx(byte[] content) throws IOException {
        Map<String, ParsedPlaceholder> found = new LinkedHashMap<>();

        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content))) {
            int index = 0;
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                index++;
                collect(found, paragraph.getText(), "đoạn " + index);
            }

            int tableIndex = 0;
            for (XWPFTable table : document.getTables()) {
                tableIndex++;
                int rowIndex = 0;
                for (XWPFTableRow row : table.getRows()) {
                    rowIndex++;
                    int cellIndex = 0;
                    for (XWPFTableCell cell : row.getTableCells()) {
                        cellIndex++;
                        collect(found, cell.getText(),
                                String.format("bảng %d ô %d.%d", tableIndex, rowIndex, cellIndex));
                    }
                }
            }

            // Header và footer cũng có thể chứa placeholder (kỳ báo cáo, đơn vị).
            document.getHeaderList().forEach(header ->
                    collect(found, header.getText(), "header"));
            document.getFooterList().forEach(footer ->
                    collect(found, footer.getText(), "footer"));
        }
        return new ArrayList<>(found.values());
    }

    // ------------------------------------------------------------------
    // XLSX
    // ------------------------------------------------------------------

    private List<ParsedPlaceholder> parseXlsx(byte[] content) throws IOException {
        Map<String, ParsedPlaceholder> found = new LinkedHashMap<>();

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        if (cell.getCellType() != CellType.STRING) {
                            continue;
                        }
                        String locator = String.format("%s!%s", sheet.getSheetName(),
                                cell.getAddress().formatAsString());
                        collect(found, cell.getStringCellValue(), locator);
                    }
                }
            }
        }
        return new ArrayList<>(found.values());
    }

    // ------------------------------------------------------------------

    private void collect(Map<String, ParsedPlaceholder> found, String text, String locator) {
        if (text == null || text.isEmpty()) {
            return;
        }
        Matcher matcher = TOKEN.matcher(text);
        while (matcher.find()) {
            String raw = matcher.group(1).trim();
            String token = "{{" + raw + "}}";

            ParsedPlaceholder existing = found.get(token);
            if (existing != null) {
                existing.occurrences++;
                continue;
            }

            ParsedPlaceholder placeholder = new ParsedPlaceholder();
            placeholder.token = token;
            placeholder.type = typeOf(raw);
            placeholder.name = nameOf(raw);
            placeholder.locator = locator;
            placeholder.occurrences = 1;
            found.put(token, placeholder);
        }
    }

    private String typeOf(String raw) {
        String lower = raw.toLowerCase();
        if (lower.startsWith("table.")) {
            return TYPE_TABLE;
        }
        if (lower.startsWith("chart.")) {
            return TYPE_CHART;
        }
        if (lower.startsWith("ai.")) {
            return TYPE_AI;
        }
        return TYPE_FIELD;
    }

    private String nameOf(String raw) {
        int dot = raw.indexOf('.');
        if (dot < 0) {
            return raw;
        }
        String prefix = raw.substring(0, dot).toLowerCase();
        if (prefix.equals("table") || prefix.equals("chart") || prefix.equals("ai")) {
            return raw.substring(dot + 1);
        }
        return raw;
    }

    public ReportPlaceholder toEntity(String templateVersionId, ParsedPlaceholder parsed) {
        return ReportPlaceholder.builder()
                .templateVersionId(templateVersionId)
                .token(parsed.token)
                .type(parsed.type)
                .name(parsed.name)
                .locator(parsed.locator)
                .occurrences(parsed.occurrences)
                .build();
    }
}
