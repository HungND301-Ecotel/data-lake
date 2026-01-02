package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateRequest;
import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateSearch;
import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateResponse;
import com.quangnt0000.be_modul.modal.DataWH.WareCategory;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataWH.WareCategoryRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Service
public class WareTemplateService {
    private final WareTemplateRepository wareTemplateRepository;
    private final WareCategoryRepository wareCategoryRepository;

    @Transactional
    public ResponseEntity<?> add(WareTemplateRequest request) {
        WareCategory wareCategory = wareCategoryRepository.findById(request.getWareCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "category not found"));
        WareTemplate wareTemplate = WareTemplate.builder()
                .code("new")
                .name(request.getName())
                .description(request.getDescription())
                .tableName(request.getTableName())
                .tableCode(request.getTableCode())
                .startRow(request.getStartRow())
                .wareCategory(wareCategory)
                .build();
        wareTemplate = wareTemplateRepository.save(wareTemplate);
        wareTemplate.setCode("W-TMP" + wareTemplate.getId());
        return ResponseEntity.ok(wareTemplate.getId());
    }

    public ResponseEntity<?> delete(Integer templateId) {
        WareCategory wareCategory = wareCategoryRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "category not found"));
        wareTemplateRepository.deleteById(templateId);
        return ResponseEntity.ok("Deleted template");
    }


    public ResponseEntity<?> getAll(WareTemplateSearch request) {
        List<WareTemplate> wareTemplates = wareTemplateRepository.findByWareCategory_Id(request.getWareCategoryId());
        List<WareTemplateResponse> responses = wareTemplates.stream().map(
                wareTemplate -> WareTemplateResponse.builder()
                        .id(wareTemplate.getId())
                        .code(wareTemplate.getCode())
                        .name(wareTemplate.getName())
                        .description(wareTemplate.getDescription())
                        .tableName(wareTemplate.getTableName())
                        .tableCode(wareTemplate.getTableCode())
                        .startRow(wareTemplate.getStartRow())
                        .createdAt(wareTemplate.getCreatedAt())
                        .updatedAt(wareTemplate.getUpdatedAt())
                        .build()
        ).toList();
        return ResponseEntity.ok(responses);
    }

    public ResponseEntity<?> getById(Integer templateId) {
        WareTemplate wareTemplate = wareTemplateRepository.findByIdAndDeletedFalse(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "template not found"));
        WareTemplateResponse wareTemplateResponse = WareTemplateResponse.builder()
                .id(wareTemplate.getId())
                .code(wareTemplate.getCode())
                .name(wareTemplate.getName())
                .description(wareTemplate.getDescription())
                .tableName(wareTemplate.getTableName())
                .tableCode(wareTemplate.getTableCode())
                .startRow(wareTemplate.getStartRow())
                .createdAt(wareTemplate.getCreatedAt())
                .updatedAt(wareTemplate.getUpdatedAt())
                .build();
        return ResponseEntity.ok(wareTemplateResponse);
    }

    public ResponseEntity<?> update(WareTemplateRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "template not found"));
        wareTemplate.setName(request.getName());
        wareTemplate.setDescription(request.getDescription());
        wareTemplate.setTableName(request.getTableName());
        wareTemplate.setTableCode(request.getTableCode());
        wareTemplate.setStartRow(request.getStartRow());
        wareTemplate = wareTemplateRepository.save(wareTemplate);
        return ResponseEntity.ok(wareTemplate.getId());
    }
}
