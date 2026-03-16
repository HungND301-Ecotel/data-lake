package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.ReportCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface ReportCategoryRepository extends JpaRepository<ReportCategory, String> {
    @Query("SELECT r FROM ReportCategory r " +
            "WHERE r.deleted = false " +
            "AND (:departmentId is null OR r.department.id = :departmentId) " +
            "AND (LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(r.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<ReportCategory> search(
            @Param("keyword") String keyword,
            @Param("departmentId") String departmentId,
            Pageable pageable);



    Optional<ReportCategory> findByIdAndDeletedFalse(String reportTemplateId);
}
