package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.DataDTO;
import com.quangnt0000.be_modul.service.DataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/data")
@RequiredArgsConstructor
public class DataController {
    private final DataService dataService;

    @GetMapping
    public List<Map<String, Object>> getReport(@RequestBody DataDTO request) {
        return dataService.getReport(request);
    }

    @GetMapping("/query-map")
    public ResponseEntity<?> getDataByQuery(@RequestParam String query) {
        return dataService.queryList(query);
    }

}
