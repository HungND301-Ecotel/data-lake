package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportMappingRepository extends JpaRepository<ReportMapping, String> {
    List<ReportMapping> findByTemplateVersionId(String templateVersionId);

    Optional<ReportMapping> findByPlaceholderId(String placeholderId);
}
