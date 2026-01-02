package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.WareMapping.WareMappingRequest;
import com.quangnt0000.be_modul.dto.WareMapping.WareMappingResponse;
import com.quangnt0000.be_modul.dto.WareMapping.WareMappingSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareMappingRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.endpoints.internal.Template;

import java.util.List;

@RequiredArgsConstructor
@Service
public class WareMappingService {
    private final WareMappingRepository wareMappingRepository;
    private final WareTemplateRepository wareTemplateRepository;
    private final WareBatchRepository wareBatchRepository;
    public ResponseEntity<?> add(WareMappingRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getWareTemplateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ware Template Not Found"));
       WareMapping wareMapping = WareMapping.builder()
               .fieldName(request.getFieldName())
               .fieldValue(request.getFieldValue())
               .fieldType(request.getFieldType())
               .isKeyColumn(request.getIsKeyColumn())
               .isScopFilter(request.getIsScopFilter())
               .cellAddress(request.getCellAddress())
               .wareTemplate(wareTemplate)
               .build();
       wareMapping = wareMappingRepository.save(wareMapping);
       return ResponseEntity.status(HttpStatus.CREATED).body(wareMapping.getId());
    }

    public ResponseEntity<?> delete(Integer mappingId) {
        WareMapping wareMapping = wareMappingRepository.findById(mappingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ware Mapping Not Found"));
        wareMappingRepository.delete(wareMapping);
        return ResponseEntity.ok("delete success");
    }

    public ResponseEntity<?> get(WareMappingSearch request) {
        Sort sort= request.getSort().equals("ASC") ? Sort.by(request.getSortBy()).ascending() : Sort.by(request.getSortBy()).descending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getLimit(), sort);
        Page<WareMapping> wareMappings = wareMappingRepository.search(request.getKeyword(), request.getWareTemplateId(), pageable);
        List<WareMappingResponse> wareMappingResponseList = wareMappings.getContent().stream().map(
                wareMapping -> WareMappingResponse.builder()
                        .id(wareMapping.getId())
                        .fieldName(wareMapping.getFieldName())
                        .fieldValue(wareMapping.getFieldValue())
                        .fieldType(wareMapping.getFieldType())
                        .isKeyColumn(wareMapping.getIsKeyColumn())
                        .isScopFilter(wareMapping.getIsScopFilter())
                        .cellAddress(wareMapping.getCellAddress())
                        .build()
        ).toList();
        return ResponseEntity.ok(wareMappingResponseList);
    }

    public ResponseEntity<?> getByBatch(Integer batchId) {
        WareBatch wareBatch = wareBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ware Batch Not Found"));
        WareTemplate wareTemplate = wareBatch.getWareTemplate();
        WareMappingSearch wareMappingSearch = WareMappingSearch.builder()
                .wareTemplateId(wareTemplate.getId())
                .build();
        return ResponseEntity.ok(get(wareMappingSearch).getBody());
    }

    public ResponseEntity<?> update(WareMappingRequest request) {
        WareMapping wareMapping = wareMappingRepository.findById(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ware Mapping Not Found"));
        wareMapping.setFieldName(request.getFieldName());
        wareMapping.setFieldValue(request.getFieldValue());
        wareMapping.setFieldType(request.getFieldType());
        wareMapping.setIsKeyColumn(request.getIsKeyColumn());
        wareMapping.setIsScopFilter(request.getIsScopFilter());
        wareMapping.setCellAddress(request.getCellAddress());
        wareMapping = wareMappingRepository.save(wareMapping);
        return ResponseEntity.ok(wareMapping.getId());
    }
}
