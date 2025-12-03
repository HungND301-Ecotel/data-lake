package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.repository.FilterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FilterService {
    private final FilterRepository filterRepository;

    public ResponseEntity<?> deleteFilterById(String filterId) {
        filterRepository.deleteById(filterId);
        return ResponseEntity.ok("filter deleted successfully");
    }
}
