package com.quangnt0000.be_modul.repository.Report;

import com.quangnt0000.be_modul.modal.Report.ReportDataQuery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportDataQueryRepository extends JpaRepository<ReportDataQuery, String> {
    List<ReportDataQuery> findAllByOrderByCodeAscVersionNoDesc();

    Optional<ReportDataQuery> findFirstByCodeAndStatusOrderByVersionNoDesc(String code, String status);

    Optional<ReportDataQuery> findFirstByCodeOrderByVersionNoDesc(String code);
}
