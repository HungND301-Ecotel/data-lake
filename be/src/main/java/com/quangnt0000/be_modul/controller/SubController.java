package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.SubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sub")
@RequiredArgsConstructor
public class SubController {
    private final SubService subService;

    @DeleteMapping("/{sub-id}")
    public ResponseEntity<?> deleteSubById(@PathVariable("sub-id") String subId) {
        return subService.deleteSubById(subId);
    }
}
