package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.WareDataRow.WareDataRowSearch;
import com.quangnt0000.be_modul.service.DataWH.WareDataRowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-data-row")
@RequiredArgsConstructor
public class WareDataRowController {
    private final WareDataRowService wareDataRowService;

//    @PostMapping
//    public ResponseEntity<?> insert(@RequestBody WareDataRow wareDataRow) {
//
//    }

    @GetMapping("/all")
    public ResponseEntity<?> get(@RequestBody WareDataRowSearch request) {
        return wareDataRowService.get(request);
    }
    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute WareDataRowSearch request) {
        return wareDataRowService.search(request);
    }
}
