package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareBatchApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WareBatchApprovalRepository extends JpaRepository<WareBatchApproval, Integer> {
    
    /**
     * Lấy tất cả approvals của 1 WareBatch
     * Sắp xếp theo approvalOrder
     */
    @Query("SELECT w FROM WareBatchApproval w " +
           "WHERE w.wareBatch.id = :wareBatchId " +
           "ORDER BY w.approvalOrder ASC")
    List<WareBatchApproval> findByWareBatchIdOrderByApprovalOrder(@Param("wareBatchId") Integer wareBatchId);
    
    /**
     * Lấy tất cả WareBatchApproval của một approver (user hiện tại)
     * Sử dụng cho màn hình "Danh sách batch của người duyệt"
     */
    @Query("SELECT w FROM WareBatchApproval w " +
           "WHERE w.approver.id = :approverId " +
           "AND w.wareBatch.deleted = false " +
           "ORDER BY w.wareBatch.createdAt DESC")
    List<WareBatchApproval> findByApproverId(@Param("approverId") String approverId);
}

