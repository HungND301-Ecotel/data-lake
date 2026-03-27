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
import java.util.*;

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
                    rowIndex = buildText(sheet, rowIndex, item, calculateMaxColumns(request));
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

    private int buildText(Sheet sheet, int rowIndex, ReportItemDTO item, int totalCols) {

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

        // align
        switch (dto.getAlign().toUpperCase()) {
            case "CENTER" -> style.setAlignment(HorizontalAlignment.CENTER);
            case "RIGHT" -> style.setAlignment(HorizontalAlignment.RIGHT);
            default -> style.setAlignment(HorizontalAlignment.LEFT);
        }

        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true); // ⭐ QUAN TRỌNG

        cell.setCellStyle(style);

        // merge theo số cột
        if (totalCols > 1) {
            sheet.addMergedRegion(
                    new CellRangeAddress(rowIndex, rowIndex, 0, totalCols - 1)
            );
        }

        // ⭐ tăng chiều cao theo số dòng
        int lineCount = dto.getContent().split("\n").length;
        row.setHeightInPoints(lineCount * (dto.getFontSize() + 4));

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

        Workbook wb = sheet.getWorkbook();

        // ===== Styles =====
        CellStyle descStyle = wb.createCellStyle();
        Font descFont = wb.createFont();
        descFont.setBold(true);
        descFont.setFontHeightInPoints((short) 12);
        descStyle.setFont(descFont);
        descStyle.setAlignment(HorizontalAlignment.LEFT);
        descStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // ===== Insert description row =====
//        if (dto.getDescription() != null && !dto.getDescription().isEmpty()) {
//            Row descRow = sheet.createRow(rowIndex++);
//            Cell descCell = descRow.createCell(0);
//            descCell.setCellValue(dto.getDescription());
//
//            // Style riêng cho description
//            CellStyle descriptionCellStyle = sheet.getWorkbook().createCellStyle();
//            Font descriptionFont = sheet.getWorkbook().createFont(); // đổi tên
//            descriptionFont.setBold(true);                   // In đậm
//            descriptionFont.setFontHeightInPoints((short) 12);
//            descriptionCellStyle.setFont(descriptionFont);
//            descriptionCellStyle.setAlignment(HorizontalAlignment.CENTER);  // Căn giữa ngang
//            descriptionCellStyle.setVerticalAlignment(VerticalAlignment.CENTER); // Căn giữa dọc
//            descCell.setCellStyle(descriptionCellStyle);
//
//            // Merge toàn bộ cột (bao gồm STT nếu có)
//            int totalCols = sortedFields.size();
//            if (totalCols > 1) {
//                sheet.addMergedRegion(new CellRangeAddress(
//                        descRow.getRowNum(),
//                        descRow.getRowNum(),
//                        0,
//                        totalCols - 1
//                ));
//            }
//
//            // Thêm 1 dòng trống
//            rowIndex++;
//        }




        // ===== Styles cho bảng =====
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
        headerStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle dataStyle = wb.createCellStyle();
        dataStyle.setAlignment(HorizontalAlignment.CENTER);
        dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);


        CellStyle groupStyle = wb.createCellStyle();
        Font groupFont = wb.createFont();
        groupFont.setBold(true);
        groupStyle.setFont(groupFont);
        groupStyle.setAlignment(HorizontalAlignment.LEFT);
        groupStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        groupFont.setColor(IndexedColors.BLUE.getIndex());
        groupStyle.setBorderTop(BorderStyle.THIN);
        groupStyle.setBorderBottom(BorderStyle.THIN);
        groupStyle.setBorderLeft(BorderStyle.THIN);
        groupStyle.setBorderRight(BorderStyle.THIN);

        int startRow = rowIndex;

        // ===== Group Header và Header Row =====
        boolean allGroupEmpty = sortedFields.stream()
                .allMatch(f -> f.getGroupName() == null || f.getGroupName().isEmpty());

        if (!allGroupEmpty) {
            Row groupRow = sheet.createRow(rowIndex++);
            String current = "";
            int start = 0;

            for (int i = 0; i < sortedFields.size(); i++) {
                FieldDTO f = sortedFields.get(i);

                if (f.getGroupName() == null || f.getGroupName().isEmpty()) {
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

        // Header row
        Row header = sheet.createRow(rowIndex++);
        for (int i = 0; i < sortedFields.size(); i++) {
            FieldDTO f = sortedFields.get(i);
            if (!allGroupEmpty && (f.getGroupName() == null || f.getGroupName().isEmpty())) continue;

            Cell cell = header.createCell(i);
            cell.setCellValue(f.getAlias());
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, (int) (f.getWeight() * 256));
        }

        //group
        List<GroupDTO> groups = dto.getGroups().stream()
                .filter(g -> Boolean.TRUE.equals(g.getVisible()))
                .sorted(Comparator.comparingInt(GroupDTO::getIndex))
                .toList();

        int groupLevelCount = groups.size();
        List<Object> prevGroupValues = new ArrayList<>(Collections.nCopies(groupLevelCount, null));
        int[] groupIndexes = new int[groupLevelCount];

        // data róws
        for (Map<String, Object> rowData : data) {
            // -group
            for (int level = 0; level < groups.size(); level++) {
                GroupDTO g = groups.get(level);

                String alias = "group_" + g.getIndex();
                String totalAlias = alias + "_total";

                Object current = rowData.get(alias);
                Object previous = prevGroupValues.get(level);

                if (!Objects.equals(current, previous)) {

                    // reset level dưới
                    for (int i = level + 1; i < groupLevelCount; i++) {
                        groupIndexes[i] = 0;
                        prevGroupValues.set(i, null);
                    }

                    groupIndexes[level]++;
                    prevGroupValues.set(level, current);


                    // build prefix: 1.2.3
                    StringBuilder prefix = new StringBuilder();
                    for (int i = 0; i <= level; i++) {
                        prefix.append(groupIndexes[i]).append(".");
                    }

                    Row groupRow = sheet.createRow(rowIndex++);

                    // CHỈ GHI Ở CỘT THỨ 2 index = 1
                    Cell cell = groupRow.createCell(1);

//                    sheet.addMergedRegion(new CellRangeAddress(
//                            rowIndex-1,
//                            rowIndex-1,
//                            1,
//                            sortedFields.size() - 1
//                    ));
                    Row groupRow2 = sheet.getRow(rowIndex - 1);
                    if (groupRow2 == null) {
                        groupRow2 = sheet.createRow(rowIndex - 1);
                    }

                    Cell cell0 = groupRow2.getCell(0);
                    if (cell0 == null) {
                        cell0 = groupRow2.createCell(0);
                    }

                    cell0.setCellStyle(dataStyle);


                    setBordersForMergedRegion(sheet, new CellRangeAddress(rowIndex-1, rowIndex-1 , 1, sortedFields.size() - 1), dataStyle);

                    StringBuilder indent = new StringBuilder();
                    for (int i = 0; i < level * 3; i++) {
                        indent.append(" ");
                    }
                    Object total = rowData.get(totalAlias);
                    cell.setCellValue(
                            indent.toString() + prefix + " " + current +
                                    (total != null ? " (" + total + ")" : "")
                    );
                    cell.setCellStyle(groupStyle);
                }
            }

            Row row = sheet.createRow(rowIndex++);
            int col = 0;
            for (FieldDTO f : sortedFields) {
                Object v = rowData.get(f.getAlias());
                Cell cell = row.createCell(col++);
                cell.setCellValue(v == null ? "" : v.toString());

                CellStyle cellStyle = wb.createCellStyle();
                cellStyle.cloneStyleFrom(dataStyle);
                if (f.getAlignment() == null){
                    cellStyle.setAlignment(HorizontalAlignment.CENTER);
                }else if (f.getAlignment() == 0){
                    cellStyle.setAlignment(HorizontalAlignment.LEFT);
                }else if (f.getAlignment() == 2){
                    cellStyle.setAlignment(HorizontalAlignment.RIGHT);
                }else {
                    cellStyle.setAlignment(HorizontalAlignment.CENTER);
                }
                cell.setCellStyle(cellStyle);
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
            if (t.getType().equals("query")){
                t.setText(dataService.queryJdbcSingleValue(t.getQuerySyntax()));
            }
            cell.setCellValue(t.getText());
            String [] border = t.getBorder().split(" ");



            // Style
            CellStyle style = wb.createCellStyle();
            Font font = wb.createFont();
            font.setFontHeightInPoints((short) t.getFontSize());

            if ("1".equals(border[0])) style.setBorderTop(BorderStyle.THIN);
            if ("1".equals(border[0])) style.setBorderBottom(BorderStyle.THIN);
            if ("1".equals(border[0])) style.setBorderLeft(BorderStyle.THIN);
            if ("1".equals(border[0])) style.setBorderRight(BorderStyle.THIN);

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

            //merge cột
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

    private int calculateMaxColumns(ReportDTO report) {

        int max = 1;
        ObjectMapper mapper = new ObjectMapper();

        for (ReportItemDTO item : report.getItems()) {

            // dât table
            if ("data".equals(item.getType())) {
                DataDTO dto = mapper.convertValue(item.getObject(), DataDTO.class);

                int colCount = (int) dto.getFields().stream()
                        .filter(FieldDTO::isVisible)
                        .count();

                if (dto.isShowIndex()) colCount++;

                max = Math.max(max, colCount);
            }

            // cus table
            if ("table".equals(item.getType())) {
                TableDTO dto = mapper.convertValue(item.getObject(), TableDTO.class);

                if (dto.getColumns() != null) {
                    int maxCol = dto.getColumns().stream()
                            .mapToInt(c -> c.getCol() + (
                                    c.getColSpan() != null
                                            ? Integer.parseInt(c.getColSpan()) - 1
                                            : 0
                            ))
                            .max()
                            .orElse(0);

                    max = Math.max(max, maxCol + 1);
                }
            }
        }

        return max;
    }




}
