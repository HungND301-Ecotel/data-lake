package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.WareMapping.WareMappingRequest;
import com.quangnt0000.be_modul.dto.WareMapping.WareMappingResponse;
import com.quangnt0000.be_modul.dto.WareMapping.WareMappingSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
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

import java.util.List;

@RequiredArgsConstructor
@Service
public class WareMappingService {
    private final WareMappingRepository wareMappingRepository;
    private final WareTemplateRepository wareTemplateRepository;
    public ResponseEntity<?> add(WareMappingRequest request) {
        WareTemplate wareTemplate = wareTemplateRepository.findById(request.getWareTemplateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ware Template Not Found"));
       WareMapping wareMapping = WareMapping.builder()
               .id(request.getId())
               .excelColumn(request.getExcelColumn())
               .fieldName(request.getFieldName())
               .fieldType(request.getFieldType())
               .defaultValue(request.getDefaultValue())
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
                        .excelColumn(wareMapping.getExcelColumn())
                        .fieldName(wareMapping.getFieldName())
                        .fieldType(wareMapping.getFieldType())
                        .defaultValue(wareMapping.getDefaultValue())
                        .build()
        ).toList();
        return ResponseEntity.ok(wareMappingResponseList);
    }
}
