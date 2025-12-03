package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.TextEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TextRepository extends JpaRepository<TextEntity, String> {
    TextEntity findByReportItemId(String reportItemId);

    void deleteByReportItemId(String id);
}
