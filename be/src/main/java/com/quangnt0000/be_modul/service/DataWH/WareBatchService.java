package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryResponse;
import com.quangnt0000.be_modul.dto.WareDataRow.WareDataRowSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataWH.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RequiredArgsConstructor
@Service
public class WareBatchService {
    private final WareBatchRepository wareBatchRepository;
    private final WareTemplateRepository wareTemplateRepository;
    private final WareDataRowRepository wareDataRowRepository;
    private final WareBatchJdbc wareBatchJdbc;
    private final WareApiService wareApiService;
    private final WareDataRowService wareDataRowService;
    private final WareMappingRepository wareMappingRepository;
    @Transactional
    public ResponseEntity<?> addWareBatch(WareBatchRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getWareTemplateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "template not found"));

        List<WareMapping> wareMappings = wareTemplate.getWareMappings();

        try {
            Workbook workbook = WorkbookFactory.create(request.getFile().getInputStream());
            Sheet sheet = workbook.getSheetAt(0);

            List<Map<String, Object>> rows = new ArrayList<>();

            for (int i = wareTemplate.getStartRow() - 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) break;

                Map<String, Object> data = new HashMap<>();

                for (WareMapping mapping : wareMappings) {
                    Object value;

                    switch (mapping.getFieldType()) {
                        case "ROW":
                            int colIndex;
                            try {
                                colIndex = Integer.parseInt(mapping.getCellAddress()) - 1;
                            } catch (NumberFormatException e) {
                                colIndex = 0;
                            }
                            Cell cellRow = row.getCell(colIndex);
                            value = (cellRow != null) ? parseCell(cellRow, mapping.getFieldValue()) : mapping.getFieldValue();
                            break;

                        case "CELL":
                            String[] parts = mapping.getCellAddress().split("-");
                            if (parts.length == 2) {
                                int targetRowNum = Integer.parseInt(parts[0]) - 1;
                                int targetColNum = Integer.parseInt(parts[1]) - 1;
                                Row targetRow = sheet.getRow(targetRowNum);
                                if (targetRow != null) {
                                    Cell targetCell = targetRow.getCell(targetColNum);
                                    value = (targetCell != null) ? parseCell(targetCell, mapping.getFieldValue()) : mapping.getFieldValue();
                                } else {
                                    value = mapping.getFieldValue();
                                }
                            } else {
                                value = mapping.getFieldValue();
                            }
                            break;

                        case "TEXT":
                            value = mapping.getCellAddress(); // giữ literal
                            break;

                        default:
                            value = mapping.getFieldValue();
                    }


                    data.put(mapping.getFieldName(), value);
                }

                rows.add(data);
            }

            // Lưu WareBatch
            WareBatch batch = wareBatchRepository.save(WareBatch.builder()
                    .code("new")
                    .name(request.getName())
                    .description(request.getDescription())
                    .employee(null)
                    .wareTemplate(wareTemplate)
                    .year(request.getYear())
                    .period(request.getPeriod())
                    .build());

            batch.setCode("BATCH" + batch.getId());

            // Lưu các WareDataRow
            List<WareDataRow> wareDataRows = new ArrayList<>();
            for (Map<String, Object> dataRow : rows) {
                wareDataRows.add(WareDataRow.builder()
                        .data(dataRow)
                        .wareBatch(batch)
                        .build());
            }

            wareDataRowRepository.saveAll(wareDataRows);

            return ResponseEntity.status(HttpStatus.CREATED).body(batch.getId());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    private Object parseCell(Cell cell, String fieldType) {
        if (cell == null) return null;

        return switch (fieldType) {
            case "STRING" -> getStringValue(cell);
            case "NUMBER" -> getNumberValue(cell);
            case "BOOLEAN" -> getBooleanValue(cell);
            case "INTEGER" -> getIntegerValue(cell);
            default -> cell.toString();
        };
    }
    private Integer getIntegerValue(Cell cell) {
        Double num = getNumberValue(cell); // lấy giá trị number trước
        if (num == null) return null;
        return num.intValue(); // ép Double -> int (1.0 -> 1)
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
                                .year(item.getYear())
                                .period(item.getPeriod())
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


    public ResponseEntity<?> push(WareBatchPush request) {
        WareBatch wareBatch = wareBatchRepository.findById(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "batch not found"));

        List<WareDataRow> wareDataRows = wareDataRowService.getByBatchId(request.getId());

        List<WareMapping> filters = wareBatch.getWareTemplate().getWareMappings().stream()
                .filter(WareMapping::getIsScopFilter)
                .toList();
        List<String> keyColumns = new ArrayList<>(wareBatch.getWareTemplate().getWareMappings().stream()
                .filter(WareMapping::getIsKeyColumn)
                .map(WareMapping::getFieldName)
                .toList());
        keyColumns.add("ID");
        Map<String, Object> filter = new HashMap<>();
        if (!wareDataRows.isEmpty()) {
            WareDataRow firstRow = wareDataRows.get(0);
            Map<String, Object> rowData = firstRow.getData();

            for (WareMapping m : filters) {
                String key = m.getFieldName();
                Object value = rowData.get(key);
                filter.put(key, value);
            }
        }

        WareTemplate wareTemplate = wareBatch.getWareTemplate();
        PushRequest body = PushRequest.builder()
                .table(wareTemplate.getTableCode())
                .keyColumns(keyColumns)
                .scopeFilter(filter)
                .rows(
                        wareDataRows.stream()
                                .map(row -> {
                                    Map<String, Object> data = new HashMap<>(row.getData());
                                    data.putIfAbsent("ID", row.getId());
                                    return data;
                                })
                                .toList()
                )
                .requestId(UUID.randomUUID().toString())
                .deleteMissing(request.getDeleteMissing())
                .changedBy(UUID.randomUUID().toString())
                .dataUploadId(UUID.randomUUID().toString())
                .build();
        try {
            return wareApiService.push(body).block();
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    public ResponseEntity<?> update(WareBatchRequest request) {
        WareBatch wareBatch = wareBatchRepository.findById(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "batch not found"));
        wareBatch.setName(request.getName());
        wareBatch.setDescription(request.getDescription());
        wareBatch.setYear(request.getYear());
        wareBatch.setPeriod(request.getPeriod());
        wareBatch = wareBatchRepository.save(wareBatch);
        return ResponseEntity.ok(wareBatch.getId());
    }
}
