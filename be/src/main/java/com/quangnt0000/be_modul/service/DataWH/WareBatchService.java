package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.repository.DataWH.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional
    public ResponseEntity<?> addWareBatch(WareBatchRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getWareTemplateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "template not found"));
        String employeeId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "user not found"));
        List<WareMapping> wareMappings = wareTemplate.getWareMappings();

        try {
            Workbook workbook = WorkbookFactory.create(request.getFile().getInputStream());
            Sheet sheet = workbook.getSheetAt(0);

            List<Map<String, Object>> rows = new ArrayList<>();

            for (int i = wareTemplate.getStartRow() - 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) break;

                if (isRowEmpty(row, wareMappings)) {
                    break;
                }

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
                            value = mapping.getCellAddress();
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
                    .employee(user.getEmployee())
                    .wareTemplate(wareTemplate)
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

//    private boolean isRowEmpty(Row row, List<WareMapping> mappings) {
//        for (WareMapping mapping : mappings) {
//            if ("ROW".equals(mapping.getFieldType())) {
//                try {
//                    int colIndex = Integer.parseInt(mapping.getCellAddress()) - 1;
//                    Cell cell = row.getCell(colIndex);
//
//                    if (cell != null && cell.getCellType() != CellType.BLANK) {
//                        if (cell.getCellType() == CellType.FORMULA) {
//                            if (!cell.getStringCellValue().trim().isEmpty()) {
//                                return false;
//                            }
//                        } else {
//                            return false;
//                        }
//                    }
//                } catch (Exception e) {
//                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
//                }
//            }
//        }
//        return true;
//    }

    private boolean isRowEmpty(Row row, List<WareMapping> mappings) {
        for (WareMapping mapping : mappings) {
            if (!"ROW".equals(mapping.getFieldType())) continue;

            try {
                int colIndex = Integer.parseInt(mapping.getCellAddress()) - 1;
                Cell cell = row.getCell(colIndex);

                if (cell == null) continue;

                CellType type = cell.getCellType();
                if (type == CellType.FORMULA) {
                    type = cell.getCachedFormulaResultType();
                }

                switch (type) {
                    case STRING:
                        if (!cell.getStringCellValue().trim().isEmpty()) {
                            return false;
                        }
                        break;
                    case NUMERIC:
                    case BOOLEAN:
                        return false;
                    default:
                        break;
                }
            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Error checking empty row: " + e.getMessage()
                );
            }
        }
        return true;
    }




    private Object parseCell(Cell cell, String fieldType) {
        if (cell == null) return null;

        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }

        switch (fieldType) {
            case "STRING": {
                String value;
                if (type == CellType.NUMERIC) {
                    value = String.valueOf(cell.getNumericCellValue());
                } else {
                    value = cell.getStringCellValue();
                }
                if (value == null || value.trim().isEmpty()) {
                    return null;
                }
                return value;
            }
            case "NUMBER":
                return cell.getNumericCellValue();
            case "BOOLEAN":
                return cell.getBooleanCellValue();
            case "INTEGER": {
                if (type == CellType.NUMERIC) {
                    return (int) cell.getNumericCellValue();
                } else if (type == CellType.STRING) {
                    try {
                        return Integer.parseInt(cell.getStringCellValue().trim());
                    } catch (NumberFormatException e) {
                        return null; // hoặc ném exception nếu muốn báo lỗi
                    }
                }
                return null;
            }
            default:
                return null;
        }
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
                                .employeeName(item.getEmployee() != null ? item.getEmployee().getName() : null)
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
            return wareApiService.push(body, wareBatch, request).block();
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    public ResponseEntity<?> update(WareBatchRequest request) {
        WareBatch wareBatch = wareBatchRepository.findById(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "batch not found"));
        wareBatch.setName(request.getName());
        wareBatch.setDescription(request.getDescription());
        wareBatch = wareBatchRepository.save(wareBatch);
        return ResponseEntity.ok(wareBatch.getId());
    }

    public ResponseEntity<?> delete(Integer wareBatchId) {
        WareBatch wareBatch = wareBatchRepository.findById(wareBatchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "batch not found"));
        wareBatch.setDeleted(true);
        wareBatchRepository.save(wareBatch);
        return ResponseEntity.ok("deleted");
    }

    public ResponseEntity<?> getMasterData(Integer batchId, GetRequest request) {
        WareBatch wareBatch = wareBatchRepository.findById(batchId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.BAD_REQUEST, "batch not found")
                );

        List<String> mapFilters = wareBatch.getWareTemplate()
                .getWareMappings()
                .stream()
                .filter(WareMapping::getIsScopFilter)
                .map(WareMapping::getFieldName) // <-- List<String>
                .toList();

        Map<String, Object> data =
                wareBatch.getWareDataRows().get(0).getData();

        Map<String, Object> filters = new HashMap<>();

        for (String fieldName : mapFilters) {
            if (data.containsKey(fieldName)) {
                Object value = data.get(fieldName);
                if (value != null) {
                    filters.put(fieldName, value);
                }
            }
        }
        request.setFilters(filters);
        return wareApiService.getMasterData(request).block();
    }
}
