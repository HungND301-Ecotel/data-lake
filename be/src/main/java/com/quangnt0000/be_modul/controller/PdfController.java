package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.ReportDTO;
import com.quangnt0000.be_modul.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pdf")
@RequiredArgsConstructor
public class PdfController {
    private final PdfService pdfService;

    @PostMapping
    private ResponseEntity<?> exportPdf(@RequestBody ReportDTO report) {
        return pdfService.exportPdf(report);
    }
}
