package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.TargetReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface TargetReportRepository extends JpaRepository<TargetReport, String> {
    List<TargetReport> findAllByIdInAndDeletedFalse(Set<String> strings);

    List<TargetReport> findByDeletedFalseAndTarget_IdInAndDateBetween(List<String> targetIds, LocalDate localDate, LocalDate localDate1);
}
