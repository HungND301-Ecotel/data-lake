package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.Department.DepartmentResponse;
import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.ReportCategory.ReportCategoryRequest;
import com.quangnt0000.be_modul.dto.ReportCategory.ReportCategoryResponse;
import com.quangnt0000.be_modul.dto.ReportCategory.ReportCategorySearch;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataLake.ReportCategory;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataLake.ReportCategoryJdbc;
import com.quangnt0000.be_modul.repository.DataLake.ReportCategoryRepository;
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
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportCategoryService {
    private final ReportCategoryRepository reportCategoryRepository;
    private final DepartmentRepository departmentRepository;
    private final ReportCategoryJdbc reportCategoryJdbc;

    public ResponseEntity<?> save(ReportCategoryRequest request) {
        ReportCategory reportCategory;
        if(request.getId() != null) {
            reportCategory = reportCategoryRepository.findById(request.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
        }else {
            reportCategory = new ReportCategory();
        }

        reportCategory.setCode(request.getCode());
        reportCategory.setName(request.getName());
        reportCategory.setDescription(request.getDescription());

        if (request.getDepartmentId() != null && (reportCategory.getId() == null || !request.getDepartmentId().equals(reportCategory.getDepartment().getId()))) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "department not found"));
            reportCategory.setDepartment(department);
        }

        reportCategory = reportCategoryRepository.save(reportCategory);
        return ResponseEntity.ok(reportCategory.getId());
    }

    public ResponseEntity<?> delete(String reportTemplateId) {
        ReportCategory reportCategory = reportCategoryRepository.findById(reportTemplateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));
        reportCategory.setDeleted(true);
        reportCategoryRepository.save(reportCategory);
        return ResponseEntity.ok("success");
    }

    public ResponseEntity<?> findById(String reportTemplateId) {
        ReportCategory reportCategory = reportCategoryRepository.findByIdAndDeletedFalse(reportTemplateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));
        ReportCategoryResponse response = ReportCategoryResponse.builder()
                .id(reportCategory.getId())
                .code(reportCategory.getCode())
                .name(reportCategory.getName())
                .description(reportCategory.getDescription())
                .departmentId(reportCategory.getDepartment().getId())
                .departmentName(reportCategory.getDepartment().getName())
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> search(ReportCategorySearch request) {
        Sort sort = request.getSort().equals("ASC") ? Sort.by(Sort.Direction.ASC, request.getSortBy()) : Sort.by(Sort.Direction.DESC, request.getSort());
        Pageable pageable = PageRequest.of(request.getPage(), request.getLimit(), sort);
        Page<ReportCategory> reportCategories = reportCategoryRepository.search(request.getKeyword(), request.getDepartmentId(), pageable);
        List<ReportCategoryResponse> reportCategoryResponse = reportCategories.getContent().stream().map(
                reportCategory -> ReportCategoryResponse.builder()
                        .id(reportCategory.getId())
                        .code(reportCategory.getCode())
                        .name(reportCategory.getName())
                        .description(reportCategory.getDescription())
                        .departmentName(reportCategory.getDepartment().getName())
                        .departmentId(reportCategory.getDepartment().getId())
                        .build()
        ).toList();

        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(reportCategories.getSize())
                .totalPages((int) reportCategories.getTotalElements())
                .content(reportCategoryResponse)
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> countByDepartmentId(String departmentId) {
        Map<String, Integer> result = reportCategoryJdbc.count(departmentId);
        return ResponseEntity.ok(result);
    }
}
