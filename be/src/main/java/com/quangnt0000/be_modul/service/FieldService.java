package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FieldService {
    private final FieldRepository fieldRepository;

    public ResponseEntity<?> deleteFieldById(String filedId) {
        fieldRepository.deleteById(filedId);
        return ResponseEntity.ok("Deleted Field");
    }
}
