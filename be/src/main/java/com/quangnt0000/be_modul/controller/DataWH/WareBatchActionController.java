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
    public ResponseEntity<?> dashboard(){
        return wareBatchActionService.dashboard();
    }

    @GetMapping("/cnt-time/{time}")
    public ResponseEntity<?> cntTime(@PathVariable ("time") String time){
        return wareBatchActionService.cntTime(time);
    }

    @GetMapping("/top-table")
    public ResponseEntity<?> topTable(){
        return wareBatchActionService.topTable();
    }
}
