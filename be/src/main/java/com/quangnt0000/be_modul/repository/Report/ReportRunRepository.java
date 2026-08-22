package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportRunRepository extends JpaRepository<ReportRun, String> {
    List<ReportRun> findByDefinitionIdOrderByCreatedAtDesc(String definitionId);

    List<ReportRun> findByStatusOrderByCreatedAtDesc(String status);

    List<ReportRun> findTop100ByOrderByCreatedAtDesc();
}
