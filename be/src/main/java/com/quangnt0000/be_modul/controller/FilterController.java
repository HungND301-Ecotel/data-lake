package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.FilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/filter")
@RequiredArgsConstructor
public class FilterController {
    private final FilterService filterService;

    @DeleteMapping("/{filter-id}")
    public ResponseEntity<?> deleteFilterById(@PathVariable ("filter-id") String filterId) {
        return filterService.deleteFilterById(filterId);
    }
}
