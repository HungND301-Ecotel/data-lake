package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchApproveRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRejectRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchRequest;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import com.quangnt0000.be_modul.service.DataWH.WareBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-batch")
@RequiredArgsConstructor
public class WareBatchController {
    private final WareBatchService wareBatchService;

    @PostMapping
    public ResponseEntity<?> addWareBatch(@ModelAttribute WareBatchRequest request) {
        return wareBatchService.addWareBatch(request);
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

    // @PostMapping("/push")
    // public ResponseEntity<?> push(@RequestBody  WareBatchPush request) {
    //     return wareBatchService.push(request);
    // }

    // endpoint sau khi duyệt nội bộ, không push server tổng
    @PostMapping("/approve-internal")
    public ResponseEntity<?> approveInternal(@RequestBody  WareBatchPush request) {
        return wareBatchService.approveInternal(request);
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
}
