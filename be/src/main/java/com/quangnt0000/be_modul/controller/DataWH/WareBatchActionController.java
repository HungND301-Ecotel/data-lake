package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareBatchAction.WareBatchActionSearch;
import com.quangnt0000.be_modul.service.DataWH.WareBatchActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ware-batch-action")
@RequiredArgsConstructor
public class WareBatchActionController {
    private final WareBatchActionService wareBatchActionService;

    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute WareBatchActionSearch request) {
        return wareBatchActionService.search(request);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(
            @RequestParam(required = false) String configId) {
        return wareBatchActionService.dashboard(configId);
    }

    @GetMapping("/cnt-time/{time}")
    public ResponseEntity<?> cntTime(
            @PathVariable("time") String time,
            @RequestParam(required = false) String configId) {
        return wareBatchActionService.cntTime(time, configId);
    }

    @GetMapping("/top-table")
    public ResponseEntity<?> topTable(
            @RequestParam(required = false) String configId) {
        return wareBatchActionService.topTable(configId);
    }
}
