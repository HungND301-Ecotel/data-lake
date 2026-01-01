package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateRequest;
import com.quangnt0000.be_modul.dto.WareTemplate.WareTemplateSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.service.DataWH.WareTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-template")
@RequiredArgsConstructor
public class WareTemplateController {
    private final WareTemplateService wareTemplateService;

    @PostMapping
    public ResponseEntity<?> add(@RequestBody WareTemplateRequest request) {
        return wareTemplateService.add(request);
    }

    @DeleteMapping("/{template-id}")
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

}
