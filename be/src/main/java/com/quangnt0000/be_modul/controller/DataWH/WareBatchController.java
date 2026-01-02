package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.service.DataWH.WareBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-batch")
@RequiredArgsConstructor
public class WareBatchController {
    private final WareBatchService wareBatchService;

    @PostMapping
    public ResponseEntity<?> addWareBatch(@ModelAttribute WareBatchRequest request) {
        return wareBatchService.addWareBatch(request);
    }

    @GetMapping("/all")
    public ResponseEntity<?> get(@RequestBody WareBatchSearch request) {
        return wareBatchService.get(request);
    }

    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute WareBatchSearch request) {
        return wareBatchService.search(request);
    }

    @PostMapping("/push")
    public ResponseEntity<?> push(@RequestBody  WareBatchPush request) {
        return wareBatchService.push(request);
    }

    @PutMapping()
    public ResponseEntity<?> update(@RequestBody WareBatchRequest request) {
        return wareBatchService.update(request);
    }


}
