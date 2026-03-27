package com.quangnt0000.be_modul.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.quangnt0000.be_modul.dto.*;
import com.quangnt0000.be_modul.utils.FontUtils;
import com.quangnt0000.be_modul.utils.PageNumberEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.text.Normalizer;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PdfService {
    private final DataService dataService;
    private final FontUtils fontUtils;
    private final PageNumberEvent pageNumberEvent;
    public ResponseEntity<?> exportPdf(ReportDTO report) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(report.getPageType().equals("LANDSCAPE") ? PageSize.A4.rotate() : PageSize.A4 ,
                    report.getMarginLeft(), report.getMarginRight(), report.getMarginTop(), report.getMarginBottom());
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PageNumberEvent());

            document.open();

            List<ReportItemDTO> items = report.getItems().stream()
                    .sorted(Comparator.comparing(ReportItemDTO::getIndex))
                    .toList();

            for (ReportItemDTO item : items) {
                if (item.getType().equals("data")){
                    ObjectMapper objectMapper = new ObjectMapper();
                    DataDTO data = objectMapper.convertValue(
                            item.getObject(),
                            new TypeReference<DataDTO>() {}
                    );
                    document.add(createData(data));
                }
                if (item.getType().equals("text")){
                    ObjectMapper objectMapper = new ObjectMapper();
                    TextDTO textDTO = objectMapper.convertValue(
                            item.getObject(),
                            new TypeReference<TextDTO>() {}
                    );
                    document.add(createText(textDTO));
                }
                if (item.getType().equals("table")){
                    ObjectMapper objectMapper = new ObjectMapper();
                    TableDTO tableDTO = objectMapper.convertValue(
                            item.getObject(),
                            new TypeReference<TableDTO>() {}
                    );
                    document.add(createTable(tableDTO));
                }
            }

            document.close();

            byte[] bytes = out.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename="
                            + Normalizer.normalize(report.getName(), Normalizer.Form.NFD)
                                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")  // Bo dau tieng Viet
                                .replaceAll("[^a-zA-Z0-9._-]", "_")
                            + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(bytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi khi xuất PDF: " + e.getMessage());
        }


    }

    private Element createData(DataDTO request) {
        try {
            BaseFont baseFont = BaseFont.createFont(
                    "fonts/times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED
            );

            int commonFontSize = request.getFontSize();
            Font normalFont = new Font(baseFont, commonFontSize, Font.NORMAL);
            Font boldFont = new Font(baseFont, commonFontSize, Font.BOLD);
            Font italicFont = new Font(baseFont, commonFontSize, Font.ITALIC);

            // 1. query lấy dữ liẹu
            List<Map<String, Object>> data = dataService.getReport(request);

            // Copy field list sang list mới
            List<FieldDTO> fieldDTOs = new ArrayList<>(request.getFields());

            // 2. show index
            if (request.isShowIndex()) {
                for (int i = 0; i < data.size(); i++) {
                    data.get(i).put("STT", i + 1);
                }

                fieldDTOs.add(
                        FieldDTO.builder()
                                .index(-1)
                                .alias("STT")
                                .visible(true)
                                .groupName("")
                                .weight(request.getWeightIndex())
                                .dataType("Number")
                                .build()
                );
            }

            // 3. lọc + sắp xếp cột
            List<FieldDTO> sortedFields = fieldDTOs.stream()
                    .filter(f -> f.getWeight() > 0)
                    .filter(FieldDTO::isVisible)
                    .sorted(Comparator.comparing(FieldDTO::getIndex))
                    .toList();

            int totalCols = sortedFields.size();
            PdfPTable table = new PdfPTable(totalCols);
            table.setWidthPercentage(100);

            float[] widths = new float[totalCols];
            for (int i = 0; i < sortedFields.size(); i++) {
                widths[i] = sortedFields.get(i).getWeight();
            }
            table.setWidths(widths);

            // 4. kiểm tra nhóm tiêu đề có trống kh
            boolean allGroupEmpty = sortedFields.stream()
                    .allMatch(f -> f.getGroupName() == null || f.getGroupName().isEmpty());

            // 5. nếu kh rỗng tạo dòng header
            if (!allGroupEmpty) {
                String currentGroup = "";
                int groupStart = 0;

                for (int i = 0; i < sortedFields.size(); i++) {
                    FieldDTO f = sortedFields.get(i);
                    String group = f.getGroupName();

                    // 🔥 Nếu group rỗng → không merge ngang → colspan = 1 + rowspan = 2
                    if (group == null || group.isEmpty()) {
                        PdfPCell verticalMerge = new PdfPCell(new Phrase(sortedFields.get(i).getAlias(), boldFont));
                        verticalMerge.setRowspan(2);
                        verticalMerge.setHorizontalAlignment(Element.ALIGN_CENTER);
                        verticalMerge.setVerticalAlignment(Element.ALIGN_MIDDLE);
                        verticalMerge.setBackgroundColor(BaseColor.LIGHT_GRAY);
                        table.addCell(verticalMerge);
                        continue;
                    }

                    // Group có giá trị → tiến hành gom nhóm
                    if (currentGroup.isEmpty()) {
                        currentGroup = group;
                        groupStart = i;
                    }

                    boolean isLast = i == sortedFields.size() - 1;
                    boolean groupBreak =
                            isLast
                                    || !currentGroup.equals(sortedFields.get(i + 1).getGroupName())
                                    || sortedFields.get(i + 1).getGroupName() == null
                                    || sortedFields.get(i + 1).getGroupName().isEmpty();

                    if (groupBreak) {
                        PdfPCell groupCell = new PdfPCell(new Phrase(currentGroup, boldFont));
                        groupCell.setColspan(i - groupStart + 1);
                        groupCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                        groupCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                        groupCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                        table.addCell(groupCell);

                        currentGroup = isLast ? "" : sortedFields.get(i + 1).getGroupName();
                        groupStart = i + 1;
                    }
                }
            }

            // 6. header tên cột
            for (FieldDTO f : sortedFields) {

                // 🔥 Nếu không phải allEmpty → groupName rỗng đã merge dọc → bỏ qua
                if (!allGroupEmpty && (f.getGroupName() == null || f.getGroupName().isEmpty())) {
                    continue;
                }

                String colName = f.getAlias() != null ? f.getAlias() : f.getId();
                PdfPCell cell = new PdfPCell(new Phrase(colName, boldFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                table.addCell(cell);
            }

            // Nếu tất cả groupName rỗng → chỉ có 1 dòng header
            table.setHeaderRows(allGroupEmpty ? 1 : 2);
            // nhóm
            List<GroupDTO> groups = request.getGroups().stream()
                    .filter(g -> Boolean.TRUE.equals(g.getVisible()))
                    .sorted(Comparator.comparingInt(GroupDTO::getIndex))
                    .toList();
            int groupLevelCount = groups.size();

            List<Object> prevGroupValues =
                    new ArrayList<>(Collections.nCopies(groupLevelCount, null));

            int[] groupIndexes = new int[groupLevelCount];

            FieldDTO firstField = sortedFields.get(0);
            // gen dữ liệu
            for (Map<String, Object> row : data) {
                for (int level = 0; level < groups.size(); level++) {
                    GroupDTO g = groups.get(level);

                    String alias = "group_" + g.getIndex();
                    String totalAlias = alias + "_total";

                    Object current = row.get(alias);
                    Object previous = prevGroupValues.get(level);

                    // chỉ render khi group thay đổi
                    if (!Objects.equals(current, previous)) {

                        // reset các level dưới
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

                        table.addCell(new PdfPCell(new Phrase("")));

                        Object total = row.get(totalAlias);

                        // ===== cell group ở CỘT ĐẦU =====

                        PdfPCell groupCell = new PdfPCell(
                                new Phrase(
                                        prefix + " " + current +
                                                (total != null ? " (" + total + ")" : ""),
                                        boldFont
                                )
                        );
                        groupCell.setColspan(totalCols);          // MERGE 2 CỘT ĐẦU
//                        groupCell.setPaddingLeft(level * 15);      // thụt theo level
                        groupCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                        groupCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
//                        groupCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
//                        groupCell.

                        table.addCell(groupCell);

                        // ===== các cột còn lại để trống =====
//                        for (int i = 1; i < totalCols-(mergedCols); i++) {
//                            table.addCell(new PdfPCell(new Phrase("")));
//                        }
                    }
                }
                //data
                for (FieldDTO f : sortedFields) {
                    String key = f.getAlias() != null ? f.getAlias() : f.getId();
                    Object val = row.get(key);

                    PdfPCell cell = new PdfPCell(new Phrase(
                            val == null ? "" : val.toString(),
                            normalFont
                    ));
                    cell.setHorizontalAlignment(f.getAlignment() != null ? f.getAlignment() : Element.ALIGN_CENTER);
                    table.addCell(cell);
                }
            }

            // tên bảng
            if (request.getDescription() != null && !request.getDescription().isEmpty()) {
                PdfPCell foot = new PdfPCell(new Phrase(request.getDescription(), italicFont));
                foot.setColspan(totalCols);
                foot.setBorder(PdfPCell.TOP);
                foot.setHorizontalAlignment(Element.ALIGN_CENTER);
                foot.setPaddingTop(6f);
                foot.setPaddingBottom(6f);
                table.addCell(foot);
            }

            return table;

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private Element createText(TextDTO request) {
        String fontStyle = request.getFontStyle().stream()
                .map(String::trim)
                .collect(Collectors.joining(","));
        Font font = fontUtils.getFont(request.getFontName(), fontStyle, request.getFontSize());

        Paragraph paragraph = new Paragraph(request.getContent(), font);

        switch (request.getAlign() != null ? request.getAlign().toUpperCase() : "LEFT") {
            case "CENTER" -> paragraph.setAlignment(Element.ALIGN_CENTER);
            case "RIGHT" -> paragraph.setAlignment(Element.ALIGN_RIGHT);
            case "JUSTIFY" -> paragraph.setAlignment(Element.ALIGN_JUSTIFIED);
            default -> paragraph.setAlignment(Element.ALIGN_LEFT);
        }
        paragraph.setSpacingBefore(10f);
        paragraph.setSpacingAfter(5f);

        return paragraph;
    }

    public PdfPTable createTable(TableDTO request) throws DocumentException {
        List<TableItemDTO> cells = request.getColumns();
        if (cells == null || cells.isEmpty()) return new PdfPTable(1);

        int numCols = cells.stream().mapToInt(TableItemDTO::getCol).max().orElse(1) + 1;
        int numRows = cells.stream().mapToInt(TableItemDTO::getRow).max().orElse(0) + 1;

        PdfPTable table = new PdfPTable(numCols);
        table.setWidthPercentage(100);

        // Xử lý width theo request.width "12,12"
        if (request.getWidth() != null) {
            String[] widths = request.getWidth().split(",");
            float[] colWidths = new float[widths.length];
            for (int i = 0; i < widths.length; i++) {
                colWidths[i] = Float.parseFloat(widths[i]);
            }
            table.setWidths(colWidths);
        }

        // Tạo ma trận cell
        TableItemDTO[][] matrix = new TableItemDTO[numRows][numCols];
        for (TableItemDTO cell : cells) {
            matrix[cell.getRow()][cell.getCol()] = cell;
        }

        for (int r = 0; r < numRows; r++) {
            for (int c = 0; c < numCols; c++) {
                TableItemDTO cellData = matrix[r][c];
                PdfPCell pdfCell;
                if (cellData != null) {
                    // Font
                    String fontStyle = String.join(",", cellData.getFontStyle());
                    Font font = fontUtils.getFont(cellData.getFontName(), fontStyle, cellData.getFontSize());
                    if (cellData.getType().equals("query")){
                        cellData.setText(dataService.queryJdbcSingleValue(cellData.getQuerySyntax()));
                    }
                    pdfCell = new PdfPCell(new Phrase(cellData.getText(), font));

                    // Align
                    if ("center".equalsIgnoreCase(cellData.getAlign())) pdfCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    else if ("right".equalsIgnoreCase(cellData.getAlign())) pdfCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    else pdfCell.setHorizontalAlignment(Element.ALIGN_LEFT);

                    // ColSpan / RowSpan
                    if (cellData.getColSpan() != null && !cellData.getColSpan().isEmpty())
                        pdfCell.setColspan(Integer.parseInt(cellData.getColSpan()));
                    if (cellData.getRowSpan() != null && !cellData.getRowSpan().isEmpty())
                        pdfCell.setRowspan(Integer.parseInt(cellData.getRowSpan()));

                    // Border: chỉ vẽ Top/Left, Right nếu cuối hàng, Bottom nếu cuối cột
                    pdfCell.setBorder(Rectangle.NO_BORDER);
                    if (cellData.getBorder() != null) {
                        String[] b = cellData.getBorder().split(" ");
                        if ("1".equals(b[0])) pdfCell.setBorderWidthTop(1f);
                        if ("1".equals(b[2])) pdfCell.setBorderWidthLeft(1f);
                        // Right: chỉ ô cuối hàng
                        if ("1".equals(b[3]) && (c == numCols - 1)) pdfCell.setBorderWidthRight(1f);
                        // Bottom: chỉ ô cuối cột
                        if ("1".equals(b[1]) && (r == numRows - 1)) pdfCell.setBorderWidthBottom(1f);
                    }

                } else {
                    pdfCell = new PdfPCell(new Phrase(""));
                }

                table.addCell(pdfCell);
            }
        }

        return table;
    }
}
