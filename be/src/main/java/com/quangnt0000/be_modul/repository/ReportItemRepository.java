package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.ReportItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportItemRepository extends JpaRepository<ReportItemEntity, String> {
    List<ReportItemEntity> findByReport_Id(String reportId);
}
