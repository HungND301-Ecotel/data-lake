package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.modal.DataLake.Target;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface TargetRepository extends JpaRepository<Target, String> {
    List<Target> findAllByDeletedFalse();

    List<Target> findByDepartmentIdAndDeletedFalse(String departmentId);

    Optional<Target> findByIdAndDeletedFalse(String id);

    List<Target> findAllByIdInAndDeletedFalse(Set<String> strings);

    List<Target> findByDeletedFalseAndMonth(YearMonth month);

    List<Target> findByDeletedFalseAndMonthAndDepartment_IdIn(YearMonth month, Set<String> departmentIdScope);
}
