package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WareTemplateRepository extends JpaRepository<WareTemplate, Integer> {
    List<WareTemplate> findByWareCategory_Id(Integer wareCategoryId);

    Optional<WareTemplate> findByIdAndDeletedFalse(Integer templateId);
}
