package com.quangnt0000.be_modul.service.dashboard;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.dto.dashboard.WorkforceResponse;
import com.quangnt0000.be_modul.repository.dashboard.WorkForceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkforceService {
    private final WorkForceRepository workForceRepository;

    public List<WorkforceResponse> getWorkForce(LocalDate date) {
        return workForceRepository.getWorkForce(date);
    }
}
