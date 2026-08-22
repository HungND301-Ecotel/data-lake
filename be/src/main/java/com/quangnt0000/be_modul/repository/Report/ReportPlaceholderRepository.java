package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportPlaceholder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportPlaceholderRepository extends JpaRepository<ReportPlaceholder, String> {
    List<ReportPlaceholder> findByTemplateVersionIdOrderByTypeAscNameAsc(String templateVersionId);

    void deleteByTemplateVersionId(String templateVersionId);
}
