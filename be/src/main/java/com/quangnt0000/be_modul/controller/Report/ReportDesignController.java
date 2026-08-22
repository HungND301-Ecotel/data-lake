package com.quangnt0000.be_modul.controller.Report;

import com.quangnt0000.be_modul.dto.Report.ReportDtos;
import com.quangnt0000.be_modul.service.Report.ReportDesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Thiết kế báo cáo có kiểm soát - M10 UC10.01 đến UC10.04.
 *
 * <p>Tách khỏi {@code /reports/template} cũ để luồng báo cáo hiện có không bị
 * ảnh hưởng; đường dẫn mới là {@code /report-templates}.
 */
@RestController
@RequestMapping("/report-templates")
@RequiredArgsConstructor
public class ReportDesignController {

    private final ReportDesignService designService;

    // ---- Định nghĩa báo cáo ---------------------------------------------

    @GetMapping
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> listDefinitions() {
        return designService.listDefinitions();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> createDefinition(@RequestBody ReportDtos.DefinitionRequest request) {
        return designService.createDefinition(request, currentUserId());
    }

    // ---- Phiên bản mẫu ---------------------------------------------------

    @PostMapping("/{code}/versions")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> uploadVersion(@PathVariable String code,
                                           @RequestParam("file") MultipartFile file,
                                           @RequestParam(required = false) String changeNote) {
        return designService.uploadTemplateVersion(code, file, changeNote, currentUserId());
    }

    @GetMapping("/{code}/versions")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> listVersions(@PathVariable String code) {
        return designService.listVersions(code);
    }

    @GetMapping("/versions/{versionId}")
    @PreAuthorize("hasAuthority('report.generate')")
    public ResponseEntity<?> getVersion(@PathVariable String versionId) {
        return designService.getVersion(versionId);
    }

    @GetMapping("/versions/{versionId}/validate")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> validate(@PathVariable String versionId) {
        return ResponseEntity.ok(designService.validate(versionId));
    }

    /** Phê duyệt mẫu; người tạo mẫu không được tự duyệt. */
    @PostMapping("/versions/{versionId}/approve")
    @PreAuthorize("hasAuthority('approval.decide')")
    public ResponseEntity<?> approveVersion(@PathVariable String versionId) {
        return designService.approveTemplateVersion(versionId, currentUserId());
    }

    // ---- Ánh xạ ----------------------------------------------------------

    @PutMapping("/mappings")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> upsertMapping(@RequestBody ReportDtos.MappingRequest request) {
        return designService.upsertMapping(request, currentUserId());
    }

    // ---- Danh mục truy vấn -----------------------------------------------

    @GetMapping("/data-queries")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> listDataQueries() {
        return designService.listDataQueries();
    }

    @PostMapping("/data-queries")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> createDataQuery(@RequestBody ReportDtos.DataQueryRequest request) {
        return designService.createDataQuery(request, currentUserId());
    }

    @PostMapping("/data-queries/{queryId}/approve")
    @PreAuthorize("hasAuthority('approval.decide')")
    public ResponseEntity<?> approveDataQuery(@PathVariable String queryId) {
        return designService.approveDataQuery(queryId, currentUserId());
    }

    @PostMapping("/data-queries/{queryId}/preview")
    @PreAuthorize("hasAuthority('report.design')")
    public ResponseEntity<?> previewDataQuery(
            @PathVariable String queryId,
            @RequestBody(required = false) ReportDtos.DataQueryPreviewRequest request) {
        return designService.previewDataQuery(queryId, request);
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
