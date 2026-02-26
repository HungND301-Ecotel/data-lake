package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.dto.WareTemplate.TableOption;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WareTemplateRepository extends JpaRepository<WareTemplate, Integer> {
    List<WareTemplate> findByWareCategory_IdOrderByNameAsc(Integer wareCategoryId);

    Optional<WareTemplate> findByIdAndDeletedFalse(Integer templateId);

    @Query("""
    SELECT new com.quangnt0000.be_modul.dto.WareTemplate.TableOption(
            wt.id,
            wt.tableName,
            wt.tableCode
        )
        FROM WareTemplate wt
        WHERE wt.deleted = false
          AND wt.tableCode IS NOT NULL
          AND wt.tableCode <> ''
          AND wt.tableName LIKE CONCAT('%', :keyword, '%')
        ORDER BY wt.tableName
    """)
    List<TableOption> getTableOption(@Param("keyword") String keyword);

    Optional<WareTemplate> findFirstByTableCodeOrderByCreatedAtDesc(String tableCode);
}
