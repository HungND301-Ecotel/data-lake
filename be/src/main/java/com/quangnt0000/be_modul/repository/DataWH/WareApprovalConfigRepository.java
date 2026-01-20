package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareTemplateApprovalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WareApprovalConfigRepository extends JpaRepository<WareTemplateApprovalConfig, Integer> {
    
    /**
     * Lấy tất cả approval configs của 1 WareTemplate
     * Bao gồm cả active và inactive
     * Sắp xếp theo approvalOrder tăng dần
     */
    @Query("SELECT w FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "ORDER BY w.approvalOrder ASC")
    List<WareTemplateApprovalConfig> findByWareTemplateIdOrderByApprovalOrder(@Param("wareTemplateId") Integer wareTemplateId);

    /**
     * Lấy tất cả approval configs ACTIVE của 1 WareTemplate
     */
    @Query("SELECT w FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.isActive = true " +
           "ORDER BY w.approvalOrder ASC")
    List<WareTemplateApprovalConfig> findActiveConfigsByWareTemplateId(@Param("wareTemplateId") Integer wareTemplateId);
}
