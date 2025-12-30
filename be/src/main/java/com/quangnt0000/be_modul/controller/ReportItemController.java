package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.ReportItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/report-item")
@RequiredArgsConstructor
public class ReportItemController {
    private final ReportItemService reportItemService;

    @DeleteMapping("/{report-item-id}")
    public ResponseEntity<?> deleteItemById(@PathVariable ("report-item-id") String reportItemId){
        return reportItemService.deleteItemById(reportItemId);
    }
}
