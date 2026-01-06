package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryRequest;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryResponse;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategorySearch;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataWH.WareCategory;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareCategoryJdbc;
import com.quangnt0000.be_modul.repository.DataWH.WareCategoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Service
public class WareCategoryService {
    private final WareCategoryRepository wareCategoryRepository;
    private final WareCategoryJdbc wareCategoryJdbc;
    private final DepartmentRepository departmentRepository;

    @Transactional
    public ResponseEntity<?> addCategory(WareCategoryRequest request) {
        Department department = departmentRepository.findByIdAndDeletedFalse(request.getDepartmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "department not found"));
        WareCategory wareCategory = WareCategory.builder()
                .code("new")
                .name(request.getName())
                .description(request.getDescription())
                .department(department)
                .build();
        wareCategory = wareCategoryRepository.save(wareCategory);
        wareCategory.setCode("WH" + wareCategory.getId().toString());
        return ResponseEntity.ok(wareCategory.getId());
    }

    public ResponseEntity<?> deleteCategory(Integer categoryId) {
        WareCategory wareCategory = wareCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "not found"));
        wareCategoryRepository.delete(wareCategory);
        return ResponseEntity.ok("deleted");
    }

    public ResponseEntity<?> getAllCategory() {
        List<WareCategory> wareCategoryList = wareCategoryRepository.findAll();
        List<WareCategoryRequest> wareCategoryDTOList = wareCategoryList.stream().map(
                wareCategory -> WareCategoryRequest.builder()
                        .id(wareCategory.getId())
                        .code(wareCategory.getCode())
                        .name(wareCategory.getName())
                        .description(wareCategory.getDescription())
                        .build()
        ).toList();
        return ResponseEntity.ok(wareCategoryDTOList);
    }

    public ResponseEntity<?> search(WareCategorySearch request) {
        List<WareCategoryResponse> categoryResponses = wareCategoryJdbc.search(request);
        Integer count = wareCategoryJdbc.count(request);
        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(count)
                .totalPages(count / request.getLimit())
                .content(categoryResponses)
                .build();
        return ResponseEntity.ok(response);
    }
}
