package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.TargetReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface TargetReportRepository extends JpaRepository<TargetReport, String> {
    List<TargetReport> findAllByIdInAndDeletedFalse(Set<String> strings);

    List<TargetReport> findByDeletedFalseAndTarget_IdInAndDateBetween(List<String> targetIds, LocalDate localDate, LocalDate localDate1);

    Optional<TargetReport> findByIdAndDeletedFalse(String id);

    @Query("SELECT tr FROM TargetReport tr WHERE tr.deleted = false " +
            "AND (:departmentId IS NULL OR tr.target.department.id = :departmentId) " +
            "AND (:date IS NULL OR tr.date = :date)")
    List<TargetReport> findAllByFilters(@Param("departmentId") String departmentId,
                                        @Param("date") LocalDate date);
}
