package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.dto.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExcelService {
    private final DataService dataService;

    public ResponseEntity<?> exportExcel(ReportDTO request) {
        try (Workbook workbook = new XSSFWorkbook()) {

            Sheet sheet = workbook.createSheet("Report");
            sheet.setDefaultColumnWidth(15);

            int rowIndex = 0;

            List<ReportItemDTO> items = request.getItems()
                    .stream()
                    .sorted(Comparator.comparing(ReportItemDTO::getIndex))
                    .toList();

            for (ReportItemDTO item : items) {
                if (item.getType().equals("text")) {
                    rowIndex = buildText(sheet, rowIndex, item);
                }
                if (item.getType().equals("data")) {
                    rowIndex = buildDataTable(sheet, rowIndex, item, request);
                }
                if (item.getType().equals("table")) {
                    rowIndex = buildCustomTable(sheet, rowIndex, item);
                }
                rowIndex++; // space after each section
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + Normalizer.normalize(request.getName(), Normalizer.Form.NFD)
                                    .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")  // Bo dau tieng Viet
                                    .replaceAll("[^a-zA-Z0-9._-]", "_") + ".xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(out.toByteArray());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Export Excel lỗi: " + e.getMessage());
        }
    }

    private int buildText(Sheet sheet, int rowIndex, ReportItemDTO item) {
        Row row = sheet.createRow(rowIndex);

        TextDTO dto = new ObjectMapper().convertValue(item.getObject(), TextDTO.class);

        Cell cell = row.createCell(0);
        cell.setCellValue(dto.getContent());

        CellStyle style = sheet.getWorkbook().createCellStyle();
        Font font = sheet.getWorkbook().createFont();
        font.setFontHeightInPoints((short) dto.getFontSize());
        font.setBold(dto.getFontStyle().contains("bold"));
        font.setItalic(dto.getFontStyle().contains("italic"));
        style.setFont(font);

        switch (dto.getAlign().toUpperCase()) {
            case "CENTER" -> style.setAlignment(HorizontalAlignment.CENTER);
            case "RIGHT" -> style.setAlignment(HorizontalAlignment.RIGHT);
            default -> style.setAlignment(HorizontalAlignment.LEFT);
        }

        cell.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, 10));

        return rowIndex + 1;
    }


    private int buildDataTable(Sheet sheet, int rowIndex, ReportItemDTO item, ReportDTO report) throws Exception {
        DataDTO dto = new ObjectMapper().convertValue(item.getObject(), DataDTO.class);
        List<Map<String, Object>> data = dataService.getReport(dto);

        List<FieldDTO> fields = new ArrayList<>(dto.getFields());

        // Thêm STT nếu cần
        if (dto.isShowIndex()) {
            for (int i = 0; i < data.size(); i++) data.get(i).put("STT", i + 1);
            fields.add(FieldDTO.builder()
                    .index(-1)
                    .alias("STT")
                    .visible(true)
                    .groupName("")
                    .weight(dto.getWeightIndex())
                    .dataType("Number")
                    .build());
        }

        List<FieldDTO> sortedFields = fields.stream()
                .filter(FieldDTO::isVisible)
                .sorted(Comparator.comparing(FieldDTO::getIndex))
                .toList();

        boolean allGroupEmpty = sortedFields.stream()
                .allMatch(f -> f.getGroupName() == null || f.getGroupName().isEmpty());

        Workbook wb = sheet.getWorkbook();

        // ===== Styles =====
        CellStyle headerStyle = wb.createCellStyle();
        Font bold = wb.createFont();
        bold.setBold(true);
        headerStyle.setFont(bold);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);

        CellStyle dataStyle = wb.createCellStyle();
        dataStyle.setAlignment(HorizontalAlignment.CENTER);
        dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);

        int startRow = rowIndex;

        // ===== Group Header =====
        if (!allGroupEmpty) {
            Row groupRow = sheet.createRow(rowIndex++);
            String current = "";
            int start = 0;

            for (int i = 0; i < sortedFields.size(); i++) {
                FieldDTO f = sortedFields.get(i);

                if (f.getGroupName() == null || f.getGroupName().isEmpty()) {
                    // Merge vertically: rowspan = 2
                    Cell cell = groupRow.createCell(i);
                    cell.setCellValue(f.getAlias());
                    setBordersForMergedRegion(sheet, new CellRangeAddress(startRow, startRow + 1, i, i), headerStyle);
                    continue;
                }

                if (current.isEmpty()) {
                    current = f.getGroupName();
                    start = i;
                }

                boolean lastGroup = i == sortedFields.size() - 1 || !current.equals(sortedFields.get(i + 1).getGroupName());

                if (lastGroup) {
                    Cell cell = groupRow.createCell(start);
                    cell.setCellValue(current);
                    setBordersForMergedRegion(sheet, new CellRangeAddress(startRow, startRow, start, i), headerStyle);
                    current = "";
                }
            }
        }

        // ===== Header Row =====
        Row header = sheet.createRow(rowIndex++);
        for (int i = 0; i < sortedFields.size(); i++) {
            FieldDTO f = sortedFields.get(i);
            if (!allGroupEmpty && (f.getGroupName() == null || f.getGroupName().isEmpty())) continue;

            Cell cell = header.createCell(i);
            cell.setCellValue(f.getAlias());
            cell.setCellStyle(headerStyle);

            sheet.setColumnWidth(i, (int) (f.getWeight() * 256));
        }

        // ===== Data Rows =====
        for (Map<String, Object> rowData : data) {
            Row row = sheet.createRow(rowIndex++);
            int col = 0;
            for (FieldDTO f : sortedFields) {
                Object v = rowData.get(f.getAlias());
                Cell cell = row.createCell(col++);
                cell.setCellValue(v == null ? "" : v.toString());
                cell.setCellStyle(dataStyle);
            }
        }

        return rowIndex;
    }

    private void setBordersForMergedRegion(Sheet sheet, CellRangeAddress region, CellStyle baseStyle) {
        Workbook wb = sheet.getWorkbook();

        for (int r = region.getFirstRow(); r <= region.getLastRow(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) row = sheet.createRow(r);

            for (int c = region.getFirstColumn(); c <= region.getLastColumn(); c++) {
                Cell cell = row.getCell(c);
                if (cell == null) cell = row.createCell(c);

                CellStyle style = wb.createCellStyle();
                style.cloneStyleFrom(baseStyle);

                // full border
                style.setBorderTop(BorderStyle.THIN);
                style.setBorderBottom(BorderStyle.THIN);
                style.setBorderLeft(BorderStyle.THIN);
                style.setBorderRight(BorderStyle.THIN);

                style.setAlignment(HorizontalAlignment.CENTER);
                style.setVerticalAlignment(VerticalAlignment.CENTER);

                cell.setCellStyle(style);
            }
        }

        // Merge vùng
        if (region.getFirstRow() != region.getLastRow() || region.getFirstColumn() != region.getLastColumn()) {
            sheet.addMergedRegion(region);
        }
    }



    private int buildCustomTable(Sheet sheet, int rowIndex, ReportItemDTO item) {

        // Convert object sang TableDTO an toàn
        TableDTO dto = new ObjectMapper().convertValue(item.getObject(), TableDTO.class);

        List<TableItemDTO> cells = dto.getColumns();
        if (cells == null || cells.isEmpty()) {
            return rowIndex + 1; // Không có gì để vẽ
        }

        int maxRow = cells.stream().mapToInt(TableItemDTO::getRow).max().orElse(0);
        int maxCol = cells.stream().mapToInt(TableItemDTO::getCol).max().orElse(0);

        Workbook wb = sheet.getWorkbook();

        for (TableItemDTO t : cells) {

            // Tạo row
            int excelRow = rowIndex + t.getRow();
            Row row = sheet.getRow(excelRow);
            if (row == null) row = sheet.createRow(excelRow);

            // Tạo cell
            Cell cell = row.createCell(t.getCol());
            cell.setCellValue(t.getText());

            // Style
            CellStyle style = wb.createCellStyle();
            Font font = wb.createFont();
            font.setFontHeightInPoints((short) t.getFontSize());

            if (t.getFontStyle() != null) {
                font.setBold(t.getFontStyle().contains("bold"));
                font.setItalic(t.getFontStyle().contains("italic"));
            }

            style.setFont(font);

            if (t.getAlign() != null) {
                switch (t.getAlign().toLowerCase()) {
                    case "center" -> style.setAlignment(HorizontalAlignment.CENTER);
                    case "right" -> style.setAlignment(HorizontalAlignment.RIGHT);
                    default -> style.setAlignment(HorizontalAlignment.LEFT);
                }
            }

            cell.setCellStyle(style);

            // =====================
            //   MERGE COLUMNS
            // =====================
            if (t.getColSpan() != null && !t.getColSpan().isEmpty()) {
                int colSpan = Integer.parseInt(t.getColSpan());

                if (colSpan > 1) { // chỉ merge nếu > 1
                    int firstRow = excelRow;
                    int lastRow = excelRow;
                    int firstCol = t.getCol();
                    int lastCol = t.getCol() + colSpan - 1;

                    // Kiểm tra valid
                    if (lastCol > firstCol && lastRow >= firstRow) {
                        sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, firstCol, lastCol));
                    }
                }
            }

            // =====================
            //   MERGE ROWS
            // =====================
            if (t.getRowSpan() != null && !t.getRowSpan().isEmpty()) {
                int rowSpan = Integer.parseInt(t.getRowSpan());

                if (rowSpan > 1) {
                    int firstRow = excelRow;
                    int lastRow = excelRow + rowSpan - 1;
                    int firstCol = t.getCol();
                    int lastCol = t.getCol();

                    // check valid
                    if (lastRow > firstRow) {
                        sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, firstCol, lastCol));
                    }
                }
            }
        }

        return rowIndex + maxRow + 2;
    }



}
