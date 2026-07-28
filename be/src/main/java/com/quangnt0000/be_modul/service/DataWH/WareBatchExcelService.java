package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareDataRowRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class WareBatchExcelService {

    private static final String FONT_NAME = "Times New Roman";

    private final WareBatchRepository wareBatchRepository;
    private final WareDataRowRepository wareDataRowRepository;

    public ResponseEntity<byte[]> exportExcel(Integer batchId) {

        WareBatch batch = wareBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch khong ton tai"));

        if (Boolean.TRUE.equals(batch.getDeleted())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch da bi xoa");
        }

        Integer startRow = batch.getWareTemplate().getStartRow();
        if (startRow == null || startRow < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template chua cau hinh startRow hop le");
        }

        List<WareMapping> allMappings = batch.getWareTemplate().getWareMappings()
                .stream()
                .filter(m -> !Boolean.TRUE.equals(m.getDeleted()))
                .toList();

        List<WareMapping> rowMappings = allMappings.stream()
                .filter(m -> "ROW".equals(m.getFieldType()))
                .sorted(Comparator.comparingInt(m -> parseColIndex(m.getCellAddress())))
                .toList();

        List<WareDataRow> dataRows = wareDataRowRepository.findByWareBatch_Id(batchId);

        Map<String, Object> firstRowData = dataRows.isEmpty()
                ? Collections.emptyMap()
                : (dataRows.get(0).getData() != null ? dataRows.get(0).getData() : Collections.emptyMap());

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Data");

            CellStyle headerStyle    = buildHeaderStyle(wb);
            CellStyle dataStyle      = buildDataStyle(wb);
            CellStyle numberStyle    = buildNumberStyle(wb);
            CellStyle cellStyle      = buildCellMappingStyle(wb);
            CellStyle titleStyle     = buildTitleStyle(wb);
            CellStyle cellLabelStyle = buildCellLabelStyle(wb);
            CellStyle noteStyle      = buildNoteStyle(wb); // cho TEXT type (in nghiêng, canh phải)

            // Tính so cot lon nhat de merge title + auto-size
            int maxColIdx = 0;
            for (WareMapping m : rowMappings) {
                maxColIdx = Math.max(maxColIdx, parseColIndex(m.getCellAddress()) - 1);
            }
            for (WareMapping m : allMappings) {
                if ("CELL".equals(m.getFieldType())) {
                    String[] parts = m.getCellAddress().split("-");
                    if (parts.length == 2) {
                        try {
                            maxColIdx = Math.max(maxColIdx, Integer.parseInt(parts[1].trim()) - 1);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            // Title: ten bao cao cua template (khong viet hoa, merge het chieu rong bang)
            String reportTitle = batch.getWareTemplate().getName();
            if (reportTitle != null && !reportTitle.isBlank()) {
                Row titleRow = getOrCreateRow(sheet, 0);
                Cell titleCell = getOrCreateCell(titleRow, 0);
                titleCell.setCellValue(reportTitle);
                titleCell.setCellStyle(titleStyle);
                if (maxColIdx > 0) {
                    sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, maxColIdx));
                }
            }

            // A) CELL type + TEXT type
            for (WareMapping mapping : allMappings) {
                String type = mapping.getFieldType();
                if (!"CELL".equals(type) && !"TEXT".equals(type)) continue;

                String[] parts = mapping.getCellAddress() != null ? mapping.getCellAddress().split("-") : null;
                if (parts == null || parts.length != 2) continue;

                try {
                    int rowIdx = Integer.parseInt(parts[0].trim()) - 1;
                    int colIdx = Integer.parseInt(parts[1].trim()) - 1;
                    Row row = getOrCreateRow(sheet, rowIdx);

                    if ("CELL".equals(type)) {
                        String label = (mapping.getFieldTitle() != null && !mapping.getFieldTitle().isBlank())
                                ? mapping.getFieldTitle()
                                : mapping.getFieldName();
                        if (colIdx > 0) {
                            Cell labelCell = getOrCreateCell(row, colIdx - 1);
                            labelCell.setCellValue(label + ":");
                            labelCell.setCellStyle(cellLabelStyle);
                        }
                        Cell cell = getOrCreateCell(row, colIdx);
                        Object value = firstRowData.get(mapping.getFieldName());
                        if (value == null) value = mapping.getFieldValue();
                        writeCellValue(cell, value, mapping.getFieldValue(), cellStyle, numberStyle);
                    } else { // TEXT: gia tri co dinh, vi du "Don vi tinh: Trieu dong"
                        Cell cell = getOrCreateCell(row, colIdx);
                        String text = (mapping.getFieldValue() != null && !mapping.getFieldValue().isBlank())
                                ? mapping.getFieldValue()
                                : mapping.getFieldTitle();
                        cell.setCellValue(text);
                        cell.setCellStyle(noteStyle);
                        if (maxColIdx > colIdx) {
                            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, colIdx, maxColIdx));
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }

            // B) ROW type
            if (!rowMappings.isEmpty()) {
                int headerRowIdx = startRow - 2;
                Row headerRow = getOrCreateRow(sheet, headerRowIdx);

                for (WareMapping mapping : rowMappings) {
                    int colIdx = parseColIndex(mapping.getCellAddress()) - 1;
                    Cell cell = getOrCreateCell(headerRow, colIdx);
                    String title = (mapping.getFieldTitle() != null && !mapping.getFieldTitle().isBlank())
                            ? mapping.getFieldTitle()
                            : mapping.getFieldName();
                    cell.setCellValue(title);
                    cell.setCellStyle(headerStyle);
                }
                headerRow.setHeightInPoints(30f);

                for (int r = 0; r < dataRows.size(); r++) {
                    int rowIdx = (startRow - 1) + r;
                    Row row = getOrCreateRow(sheet, rowIdx);
                    Map<String, Object> data = dataRows.get(r).getData();
                    if (data == null) data = Collections.emptyMap();

                    for (WareMapping mapping : rowMappings) {
                        int colIdx = parseColIndex(mapping.getCellAddress()) - 1;
                        Cell cell = getOrCreateCell(row, colIdx);
                        Object value = data.get(mapping.getFieldName());
                        writeCellValue(cell, value, mapping.getFieldValue(), dataStyle, numberStyle);
                    }
                }
            }

            // C) Auto-size cot (rong hon mau cu, gioi han min/max)
            for (int c = 0; c <= maxColIdx; c++) {
                sheet.autoSizeColumn(c);
                int w = sheet.getColumnWidth(c);
                if (w < 4500) sheet.setColumnWidth(c, 4500);
                if (w > 18000) sheet.setColumnWidth(c, 18000);
            }

            wb.write(out);
            byte[] bytes = out.toByteArray();

            String encodedFileName = URLEncoder.encode(buildFileName(batch), StandardCharsets.UTF_8)
                    .replace("+", "%20");

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName);
            httpHeaders.setContentLength(bytes.length);

            return new ResponseEntity<>(bytes, httpHeaders, HttpStatus.OK);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Loi khi xuat file Excel: " + e.getMessage());
        }
    }

    private Row getOrCreateRow(Sheet sheet, int rowIdx) {
        Row row = sheet.getRow(rowIdx);
        return (row != null) ? row : sheet.createRow(rowIdx);
    }

    private Cell getOrCreateCell(Row row, int colIdx) {
        Cell cell = row.getCell(colIdx);
        return (cell != null) ? cell : row.createCell(colIdx);
    }

    private int parseColIndex(String cellAddress) {
        try {
            return Integer.parseInt(cellAddress.trim());
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private void writeCellValue(Cell cell, Object value, String fieldValue,
                                CellStyle textStyle, CellStyle numStyle) {
        if (value == null) {
            cell.setCellStyle(textStyle);
            return;
        }
        if (value instanceof Number num) {
            cell.setCellValue(num.doubleValue());
            cell.setCellStyle(numStyle);
            return;
        }
        if (value instanceof Boolean bool) {
            cell.setCellValue(bool ? "TRUE" : "FALSE");
            cell.setCellStyle(textStyle);
            return;
        }
        String strVal = value.toString().trim();
        if ("NUMBER".equals(fieldValue) || "INTEGER".equals(fieldValue)) {
            try {
                double d = Double.parseDouble(strVal.replace(",", ""));
                cell.setCellValue(d);
                cell.setCellStyle(numStyle);
                return;
            } catch (NumberFormatException ignored) {}
        }
        cell.setCellValue(strVal);
        cell.setCellStyle(textStyle);
    }

    private String buildFileName(WareBatch batch) {
        String name = batch.getWareTemplate().getName()
                .replaceAll("[\\\\/:*?\"<>|]", "").trim();
        StringBuilder sb = new StringBuilder(name).append("_").append(batch.getCode());
        if (batch.getReportYear() != null) {
            sb.append("_").append(batch.getReportYear());
            if (batch.getReportMonth() != null) {
                sb.append("-").append(String.format("%02d", batch.getReportMonth()));
                if (batch.getReportDay() != null) {
                    sb.append("-").append(String.format("%02d", batch.getReportDay()));
                }
            }
        }
        return sb.append(".xlsx").toString();
    }

    // ===================== STYLES =====================

    private CellStyle buildHeaderStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        // KHONG to nen mau, chi in dam + vien, giong file mau
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        applyThinBorder(style);
        return style;
    }

    private CellStyle buildDataStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);
        return style;
    }

    private CellStyle buildNumberStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0.##"));
        return style;
    }

    private CellStyle buildCellMappingStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle buildTitleStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle buildCellLabelStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle buildNoteStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setFontName(FONT_NAME);
        font.setItalic(true);
        font.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private void applyThinBorder(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }
}