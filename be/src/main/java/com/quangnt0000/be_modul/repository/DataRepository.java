package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.Data.DataEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataRepository extends JpaRepository<DataEntity, String > {
    DataEntity findByReportItemId(String id);

    void deleteByReportItemId(String id);
}
