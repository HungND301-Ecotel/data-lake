package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    @Query("SELECT d FROM Department d " +
            "WHERE d.deleted = false " +
            "AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(d.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Department> search(@Param("keyword") String keyword, Pageable pageable);

    Optional<Department> findByIdAndDeletedFalse(String departmentId);

    Optional<Department> findByCode(String code);
}
