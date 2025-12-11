package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.ReportStorage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportStorageRepository extends JpaRepository<ReportStorage, String> {
    Optional<ReportStorage> findByIdAndDeletedFalse(String reportStorageId);
}
