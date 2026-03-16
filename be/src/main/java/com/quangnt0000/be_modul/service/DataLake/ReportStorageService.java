package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.FileResponse;
import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageRequest;
import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageResponse;
import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageSearch;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.ReportCategory;
import com.quangnt0000.be_modul.modal.DataLake.ReportStorage;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.ReportCategoryRepository;
import com.quangnt0000.be_modul.repository.DataLake.ReportStorageJdbc;
import com.quangnt0000.be_modul.repository.DataLake.ReportStorageRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportStorageService {
    private final ReportStorageRepository reportStorageRepository;
    private final ReportCategoryRepository reportCategoryRepository;
    private final UserRepository userRepository;
    private final ReportStorageJdbc reportStorageJdbc;
    private final S3Service s3Service;
    public ResponseEntity<?> saveReportStorage(ReportStorageRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user =  userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found"));
        Employee employee = user.getEmployee();
        ReportCategory reportCategory = reportCategoryRepository.findById(request.getReportCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report Category Not Found"));
        ReportStorage reportStorage = ReportStorage.builder()
                .name(request.getName())
                .description(request.getDescription())
                .note(request.getNote())
                .employee(employee)
                .reportCategory(reportCategory)
                .status("PENDING")
                .build();
        if(request.getFile() != null){
            FileResponse fileResponse = s3Service.uploadFile("storage", request.getFile());
            reportStorage.setFileKey(fileResponse.getKey());
            reportStorage.setFileType(fileResponse.getType());
        }
        reportStorage = reportStorageRepository.save(reportStorage);
        return ResponseEntity.ok(reportStorage.getId());
    }


    public ResponseEntity<?> deleteReportStorage(String reportStorageId) {
        ReportStorage reportStorage = reportStorageRepository.findByIdAndDeletedFalse(reportStorageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report Storage Not Found"));
        reportStorage.setDeleted(true);
        reportStorageRepository.save(reportStorage);
        return ResponseEntity.ok("Report Storage Deleted");
    }

    public ResponseEntity<?> getByCategory(ReportStorageSearch request) {
        List<ReportStorageResponse> reportStorageResponses = reportStorageJdbc.search(request);
        PageResponse pageResponse = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(reportStorageResponses.size())
                .totalPages(reportStorageJdbc.count(request) / request.getLimit())
                .content(reportStorageResponses)
                .build();
        return ResponseEntity.ok(pageResponse);
    }


    public ResponseEntity<?> getCountStatusByDepartment(String departmentId) {
        Map<String, Integer> map = reportStorageJdbc.getCountStatusByDepartment(departmentId);
        return ResponseEntity.ok(map);
    }
}
