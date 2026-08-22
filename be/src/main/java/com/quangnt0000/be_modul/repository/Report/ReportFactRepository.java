package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportFact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportFactRepository extends JpaRepository<ReportFact, String> {
    List<ReportFact> findByRunIdOrderByCodeAsc(String runId);

    List<ReportFact> findBySnapshotId(String snapshotId);
}
