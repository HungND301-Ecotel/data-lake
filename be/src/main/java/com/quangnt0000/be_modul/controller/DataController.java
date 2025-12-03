package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.DataDTO;
import com.quangnt0000.be_modul.service.DataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
