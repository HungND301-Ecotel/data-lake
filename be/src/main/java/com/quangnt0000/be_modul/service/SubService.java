package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.repository.SubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SubService {
    private final SubRepository subRepository;
    public ResponseEntity<?> deleteSubById(String subId) {
        subRepository.deleteById(subId);
        return ResponseEntity.ok("Deleted Sub");
    }
}
