package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.FieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/field")
@RequiredArgsConstructor
public class FieldController {
    private final FieldService fieldService;

    @DeleteMapping("/{filed-id}")
    public ResponseEntity<?> deleteFieldById(@PathVariable ("filed-id") String filedId) {
        return fieldService.deleteFieldById(filedId);
    }
}
