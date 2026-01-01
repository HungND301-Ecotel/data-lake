package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WareBatchRepository extends JpaRepository<WareBatch, Integer> {
    List<WareBatch> findByWareTemplate_Id(Integer wareTemplateId);
}
