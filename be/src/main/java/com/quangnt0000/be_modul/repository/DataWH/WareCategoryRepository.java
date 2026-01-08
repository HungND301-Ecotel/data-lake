package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WareCategoryRepository extends JpaRepository<WareCategory, Integer> {
    Optional<WareCategory> findByIdAndDeletedFalse(Integer id);
}
