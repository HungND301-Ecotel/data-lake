package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchApproveRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRejectRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.dto.WareBatch.WebBatchSubmitRequest;
import com.quangnt0000.be_modul.dto.dashboard.DashboardRequest;
import com.quangnt0000.be_modul.service.DataWH.WareBatchExcelService;
import com.quangnt0000.be_modul.service.DataWH.WareBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-batch")
@RequiredArgsConstructor
public class WareBatchController {
    private final WareBatchService wareBatchService;
    private final WareBatchExcelService wareBatchExcelService;

    @PostMapping
    public ResponseEntity<?> addWareBatch(@ModelAttribute WareBatchRequest request) {
        return wareBatchService.addWareBatch(request);
    }

    @PostMapping("/web-submit")
    public ResponseEntity<?> addWebBatch(@Valid @RequestBody WebBatchSubmitRequest request) {
        return wareBatchService.addWebBatch(request);
    }

    @GetMapping("/all")
    public ResponseEntity<?> get(@RequestBody WareBatchSearch request) {
        return wareBatchService.get(request);
    }

    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute WareBatchSearch request) {
        return wareBatchService.search(request);
    }

    @GetMapping("/{ware-batch-id}")
    public ResponseEntity<?> getDetail(@PathVariable("ware-batch-id") Integer wareBatchId) {
        return wareBatchService.getWareBatchDetail(wareBatchId);
    }

    @GetMapping("/{ware-batch-id}/web-data")
    public ResponseEntity<?> getWebBatchData(@PathVariable("ware-batch-id") Integer wareBatchId) {
        return wareBatchService.getWebBatchData(wareBatchId);
    }

    @PostMapping("/push")
    public ResponseEntity<?> push(@RequestBody  WareBatchPush request) {
        return wareBatchService.push(request);
    }

    @PutMapping()
    public ResponseEntity<?> update(@RequestBody WareBatchRequest request) {
        return wareBatchService.update(request);
    }

    @DeleteMapping("/{ware-batch-id}")
    public ResponseEntity<?> delete(@PathVariable ("ware-batch-id") Integer wareBatchId) {
        return wareBatchService.delete(wareBatchId);
    }

    @PutMapping("/reject")
    public ResponseEntity<?> rejectApproval(@RequestBody WareBatchRejectRequest request) {
        return wareBatchService.rejectApproval(request);
    }

    @PutMapping("/approve")
    public ResponseEntity<?> approve(@RequestBody WareBatchApproveRequest request) {
        return wareBatchService.approve(request);
    }

    @GetMapping("/master-data/{batch-id}")
    public ResponseEntity<?> getMasterData(@PathVariable ("batch-id") Integer batchId, @ModelAttribute GetRequest request) {
        return wareBatchService.getMasterData(batchId, request);
    }

    @GetMapping("/my-approvals")
    public ResponseEntity<?> getMyApprovalBatches(@RequestParam(required = false) String departmentId) {
        return wareBatchService.getMyApprovalBatches(departmentId);
    }

    /**
     * Xuất file Excel từ dữ liệu đã lưu (WareDataRow + WareMapping).
     * Không cần đọc file gốc từ S3.
     * GET /wh-batch/{id}/export
     */
    @GetMapping("/{ware-batch-id}/export")
    public ResponseEntity<byte[]> exportExcel(@PathVariable("ware-batch-id") Integer wareBatchId) {
        return wareBatchExcelService.exportExcel(wareBatchId);
    }
}
