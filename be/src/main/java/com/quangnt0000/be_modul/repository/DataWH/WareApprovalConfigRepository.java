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
     * Kiểm tra xem có approval config nào với approvalOrder cụ thể không
     * Dùng để validate unique approvalOrder
     */
    @Query("SELECT COUNT(w) > 0 FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.approvalOrder = :approvalOrder " +
           "AND (:excludeId IS NULL OR w.id != :excludeId)")
    boolean existsByWareTemplateIdAndApprovalOrder(
        @Param("wareTemplateId") Integer wareTemplateId,
        @Param("approvalOrder") Integer approvalOrder,
        @Param("excludeId") Integer excludeId
    );

    /**
     * Kiểm tra xem có approval config ACTIVE nào với approverId cụ thể không
     * Dùng để validate unique active approverId
     */
    @Query("SELECT COUNT(w) > 0 FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.approver.id = :approverId " +
           "AND w.isActive = true " +
           "AND (:excludeId IS NULL OR w.id != :excludeId)")
    boolean existsActiveConfigByWareTemplateIdAndApproverId(
        @Param("wareTemplateId") Integer wareTemplateId,
        @Param("approverId") String approverId,
        @Param("excludeId") Integer excludeId
    );

    /**
     * Lấy tất cả approval configs ACTIVE của 1 WareTemplate
     */
    @Query("SELECT w FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.isActive = true " +
           "ORDER BY w.approvalOrder ASC")
    List<WareTemplateApprovalConfig> findActiveConfigsByWareTemplateId(@Param("wareTemplateId") Integer wareTemplateId);
}
