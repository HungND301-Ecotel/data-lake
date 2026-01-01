package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryResponse;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchJdbc;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareDataRowRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareTemplateRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class WareBatchService {
    private final WareBatchRepository wareBatchRepository;
    private final WareTemplateRepository wareTemplateRepository;
    private final WareDataRowRepository wareDataRowRepository;
    private final WareBatchJdbc wareBatchJdbc;
    @Transactional
    public ResponseEntity<?> addWareBatch(WareBatchRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getWareTemplateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "template not found"));
        List<WareMapping> wareMappings = wareTemplate.getWareMappings();
        try {
            Workbook workbook = WorkbookFactory.create(request.getFile().getInputStream());
            Sheet sheet = workbook.getSheetAt(0);

            List<Map<String, Object>> rows = new ArrayList<>();

            for (int i = wareTemplate.getStartRow(); i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, Object> data = new HashMap<>();

                for (WareMapping mapping : wareMappings) {
                    int colIndex = mapping.getExcelColumn() - 1;
                    Cell cell = row.getCell(colIndex);

                    Object value;

                    if (cell == null) {
                        value = mapping.getDefaultValue();
                    } else {
                        value = parseCell(cell, mapping.getFieldType());
                    }

                    data.put(mapping.getFieldName(), value);
                }

                rows.add(data);
            }
            WareBatch batch = wareBatchRepository.save(WareBatch.builder()
                    .code("new")
                    .name(request.getName())
                    .description(request.getDescription())
                    .employee(null)
                            .wareTemplate(wareTemplate)
                    .build());
            batch.setCode("BATCH" + batch.getId().toString());

            List<WareDataRow> wareDataRows = new ArrayList<>();
            for(Map<String, Object> dataRow : rows){
                wareDataRows.add(WareDataRow.builder()
                        .data(dataRow)
                        .wareBatch(batch)
                        .build());
            }
            List<WareDataRow> response = wareDataRowRepository.saveAll(wareDataRows);
            return ResponseEntity.status(HttpStatus.CREATED).body(batch.getId());
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    private Object parseCell(Cell cell, String fieldType) {
        if (cell == null) return null;

        return switch (fieldType) {
            case "STRING" -> getStringValue(cell);
            case "NUMBER" -> getNumberValue(cell);
            case "BOOLEAN" -> getBooleanValue(cell);
            default -> cell.toString();
        };
    }

    private String getStringValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private Double getNumberValue(Cell cell) {
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Double.parseDouble(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private Boolean getBooleanValue(Cell cell) {
        return switch (cell.getCellType()) {
            case BOOLEAN -> cell.getBooleanCellValue();
            case STRING -> Boolean.parseBoolean(cell.getStringCellValue());
            case NUMERIC -> cell.getNumericCellValue() != 0;
            default -> null;
        };
    }


    public ResponseEntity<?> get(WareBatchSearch request) {
        List<WareBatch> wareBatchList = wareBatchRepository.findByWareTemplate_Id(request.getWareTemplateId());
        List<WareBatchResponse> wareBathResponses = wareBatchList.stream()
                .map(
                        item -> WareBatchResponse.builder()
                                .id(item.getId())
                                .code(item.getCode())
                                .name(item.getName())
                                .description(item.getDescription())
                                .createdAt(item.getCreatedAt())
                                .updatedAt(item.getUpdatedAt())
                                .build()
                )
                .toList();
        return ResponseEntity.ok(wareBathResponses);
    }

    public ResponseEntity<?> search(WareBatchSearch request) {
        List<WareBatchResponse> wareBatchResponses = wareBatchJdbc.search(request);
        Integer count = wareBatchJdbc.count(request);
        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(count)
                .totalPages(count / request.getLimit())
                .content(wareBatchResponses)
                .build();
        return ResponseEntity.ok(response);
    }
}
