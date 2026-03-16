package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.modal.ReportItemEntity;
import com.quangnt0000.be_modul.repository.DataRepository;
import com.quangnt0000.be_modul.repository.ReportItemRepository;
import com.quangnt0000.be_modul.repository.TableRepository;
import com.quangnt0000.be_modul.repository.TextRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReportItemService {
    private final ReportItemRepository reportItemRepository;
    private final DataRepository dataRepository;
    private final TextRepository textRepository;
    private final TableRepository tableRepository;
    @Transactional
    public ResponseEntity<?> deleteItemById(String reportItemId) {
        ReportItemEntity reportItemEntity = reportItemRepository.findById(reportItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));

        if (reportItemEntity.getType().equals("text")) {
            textRepository.deleteByReportItemId(reportItemEntity.getId());
        }
        if (reportItemEntity.getType().equals("table")) {
            tableRepository.deleteByReportItemId(reportItemEntity.getId());
        }
        if (reportItemEntity.getType().equals("data")) {
            dataRepository.deleteByReportItemId(reportItemEntity.getId());
        }
        reportItemRepository.delete(reportItemEntity);
        return ResponseEntity.ok("Delete success");
    }
}
