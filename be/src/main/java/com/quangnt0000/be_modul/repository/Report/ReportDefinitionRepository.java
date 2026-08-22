package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportDefinitionRepository extends JpaRepository<ReportDefinition, String> {
    Optional<ReportDefinition> findByCode(String code);

    boolean existsByCode(String code);

    List<ReportDefinition> findByActiveTrueOrderByCodeAsc();
}
