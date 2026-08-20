package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareTemplateApprovalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WareApprovalConfigRepository extends JpaRepository<WareTemplateApprovalConfig, Integer> {
    
    /**
     * Lấy tất cả approval configs của 1 WareTemplate
     * active = true
     * Sắp xếp theo approvalOrder tăng dần
     */
    @Query("SELECT w FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.isActive = true " +
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

    /**
     * Tìm approval config theo khóa nghiệp vụ (wareTemplateId + approverId)
     * Dùng để xác định config đã tồn tại hay chưa khi update
     */
    @Query("SELECT w FROM WareTemplateApprovalConfig w " +
           "WHERE w.wareTemplate.id = :wareTemplateId " +
           "AND w.approver.id = :approverId")
    Optional<WareTemplateApprovalConfig> findByWareTemplateIdAndApproverId(
            @Param("wareTemplateId") Integer wareTemplateId,
            @Param("approverId") String approverId);
}
