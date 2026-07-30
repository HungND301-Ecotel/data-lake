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

    @Query("SELECT DISTINCT tr.date FROM TargetReport tr WHERE tr.deleted = false " +
            "AND tr.date BETWEEN :start AND :end " +
            "AND tr.date <= :today " +
            "AND (:departmentId IS NULL OR tr.target.department.id = :departmentId) " +
            "ORDER BY tr.date")
    List<LocalDate> findDistinctPastDatesInMonth(@Param("start") LocalDate start,
                                                 @Param("end") LocalDate end,
                                                 @Param("today") LocalDate today,
                                                 @Param("departmentId") String departmentId);
}
