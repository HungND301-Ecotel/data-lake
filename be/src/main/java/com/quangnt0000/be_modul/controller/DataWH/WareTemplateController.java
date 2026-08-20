package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateRequest;
import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateSearch;
import com.quangnt0000.be_modul.service.DataWH.WareTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-template")
@RequiredArgsConstructor
public class WareTemplateController {
    private final WareTemplateService wareTemplateService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> add(@ModelAttribute WareTemplateRequest request) {
        return wareTemplateService.add(request);
    }

    @DeleteMapping("/{template-id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable ("template-id") Integer templateId) {
        return wareTemplateService.delete(templateId);
    }

    @GetMapping
    public ResponseEntity<?> getAll(@ModelAttribute WareTemplateSearch request){
        return wareTemplateService.getAll(request);
    }
    @GetMapping("/{template-id}")
    public ResponseEntity<?> getById(@PathVariable ("template-id") Integer templateId) {
        return wareTemplateService.getById(templateId);
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@ModelAttribute WareTemplateRequest request) {
        return wareTemplateService.update(request);
    }

    @GetMapping("/{template-id}/export-excel")
    public ResponseEntity<?> exportExcel(@PathVariable ("template-id") Integer templateId) {
        return wareTemplateService.exportExcel(templateId);
    }

    @GetMapping("/table-option")
    public ResponseEntity<?> getTableOption(@RequestParam(value = "keyword", required = false) String keyword) {
        return wareTemplateService.getTableOption(keyword);
    }
}
