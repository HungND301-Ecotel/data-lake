package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.ReportEntity;
import com.quangnt0000.be_modul.modal.ReportItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<ReportEntity, String> {
}
