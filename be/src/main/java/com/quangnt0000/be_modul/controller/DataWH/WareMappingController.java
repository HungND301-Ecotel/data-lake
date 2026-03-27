package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareMapping.WareMappingRequest;
import com.quangnt0000.be_modul.dto.WareMapping.WareMappingSearch;
import com.quangnt0000.be_modul.service.DataWH.WareMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-mapping")
@RequiredArgsConstructor
public class WareMappingController {
    private final WareMappingService wareMappingService;

    @PostMapping
    public ResponseEntity<?> add(@RequestBody WareMappingRequest request) {
        return  wareMappingService.add(request);
    }

    @DeleteMapping("/{mapping-id}")
    public ResponseEntity<?> delete(@PathVariable ("mapping-id") Integer mappingId) {
        return wareMappingService.delete(mappingId);
    }

    @GetMapping
    private ResponseEntity<?> get(@ModelAttribute WareMappingSearch request) {
        return wareMappingService.get(request);

    }

    @GetMapping("/batch/{batch-id}")
    private ResponseEntity<?> getByBatch(@PathVariable ("batch-id") Integer batchId) {
        return ResponseEntity.ok(wareMappingService.getByBatch(batchId).getBody());

    }

    @PutMapping
    private ResponseEntity<?> update(@RequestBody WareMappingRequest request) {
        return wareMappingService.update(request);
    }
}
