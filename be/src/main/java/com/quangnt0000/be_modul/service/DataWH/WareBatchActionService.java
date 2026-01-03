package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.repository.DataWH.WareBatchActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WareBatchActionService  {
    private final WareBatchActionRepository wareBatchActionRepository;
}
