package com.quangnt0000.be_modul.controller.Report;

import com.quangnt0000.be_modul.dto.Report.ReportDtos;
import com.quangnt0000.be_modul.service.Report.ReportRunService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Sinh, xem trước, phê duyệt và xuất bản báo cáo - M10 UC10.05 đến UC10.08. */
@RestController
@RequestMapping("/report-runs")
@RequiredArgsConstructor
public class ReportRunController {

    private final ReportRunService runService;

    @GetMapping
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> list(@RequestParam(required = false) String status) {
        return runService.listRuns(status);
    }

    @GetMapping("/{runId}")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> get(@PathVariable String runId) {
        return runService.getRun(runId);
    }

    /**
     * Tạo lần sinh báo cáo. Token của người dùng được chuyển tiếp sang worker
     * để phần nhận xét AI chịu đúng clearance của họ, thay vì quyền của backend.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> create(@RequestBody ReportDtos.RunRequest request,
                                    HttpServletRequest httpRequest) {
        return runService.createRun(request, currentUserId(), bearerToken(httpRequest));
    }

    @PutMapping("/narratives/{narrativeId}")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> editNarrative(@PathVariable String narrativeId,
                                           @RequestBody ReportDtos.NarrativeEditRequest request) {
        return runService.editNarrative(narrativeId, request, currentUserId());
    }

    @GetMapping("/{runId}/preview")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> preview(@PathVariable String runId) {
        return runService.preview(runId, currentUserId());
    }

    @PostMapping("/{runId}/submit")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> submit(@PathVariable String runId) {
        return runService.submitForApproval(runId, currentUserId());
    }

    @PostMapping("/{runId}/decision")
    @PreAuthorize("hasAuthority('approval.decide')")
    public ResponseEntity<?> decide(@PathVariable String runId,
                                    @RequestBody ReportDtos.DecisionRequest request) {
        return runService.decide(runId, request, currentUserId());
    }

    @PostMapping("/{runId}/export")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> export(@PathVariable String runId) {
        return runService.export(runId, currentUserId());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private String bearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
    }
}
