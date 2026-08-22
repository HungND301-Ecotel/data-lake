package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.Target;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface TargetRepository extends JpaRepository<Target, String> {
    Optional<Target> findByIdAndDeletedFalse(String id);

    List<Target> findAllByIdInAndDeletedFalse(Set<String> strings);

    List<Target> findByDeletedFalseAndMonthAndDepartment_IdIn(YearMonth month, Set<String> departmentIdScope);

    @Query("SELECT t FROM Target t WHERE t.deleted = false " +
            "AND (:departmentId IS NULL OR t.department.id = :departmentId) " +
            "AND (:month IS NULL OR t.month = :month)")
    List<Target> findAllByFilters(@Param("departmentId") String departmentId,
                                  @Param("month") YearMonth month);
}
