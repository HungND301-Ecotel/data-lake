package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WareDataRowRepository extends JpaRepository<WareDataRow, Integer> {
    List<WareDataRow> findByWareBatch_Id(Integer wareBatchId);

    @Query("SELECT wdr FROM WareDataRow wdr " +
            "WHERE wdr.deleted = false " +
            "AND CAST(wdr.id AS string) LIKE CONCAT('%', :keyword, '%')" + 
            "AND wdr.wareBatch.id = :wareBatchId"
    )
    Page<WareDataRow> search(@Param("keyword") String keyword,
                             @Param("wareBatchId") Integer wareBatchId,
                             Pageable pageable);

}
