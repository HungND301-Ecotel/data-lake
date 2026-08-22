package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportNarrative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportNarrativeRepository extends JpaRepository<ReportNarrative, String> {
    List<ReportNarrative> findByRunId(String runId);

    Optional<ReportNarrative> findByRunIdAndPlaceholderName(String runId, String placeholderName);
}
