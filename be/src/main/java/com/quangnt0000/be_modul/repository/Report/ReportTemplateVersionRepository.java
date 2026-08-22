package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportTemplateVersionRepository extends JpaRepository<ReportTemplateVersion, String> {
    List<ReportTemplateVersion> findByDefinitionIdOrderByVersionNoDesc(String definitionId);

    Optional<ReportTemplateVersion> findFirstByDefinitionIdAndStatusOrderByVersionNoDesc(
            String definitionId, String status);

    Optional<ReportTemplateVersion> findFirstByDefinitionIdOrderByVersionNoDesc(String definitionId);
}
