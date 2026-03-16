package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableRepository extends JpaRepository<TableEntity, String> {
    TableEntity findByReportItemId(String id);

    void deleteByReportItemId(String id);
}
