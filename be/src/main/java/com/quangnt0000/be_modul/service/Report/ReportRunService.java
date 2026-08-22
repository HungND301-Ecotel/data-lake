package com.quangnt0000.be_modul.service.Report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quangnt0000.be_modul.dto.FileResponse;
import com.quangnt0000.be_modul.dto.Report.ReportDtos;
import com.quangnt0000.be_modul.modal.Report.*;
import com.quangnt0000.be_modul.repository.Report.*;
import com.quangnt0000.be_modul.service.Iam.AuthAuditService;
import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Vòng đời một lần sinh báo cáo - UC10.05 đến UC10.08.
 *
 * <p>Thứ tự cố định và không thể đảo: chốt số liệu trước, gọi AI sau. Mô hình
 * chỉ nhìn thấy các fact đã khoá, nên không có đường nào để nó tự tạo ra số
 * liệu mới (mục 5.3).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportRunService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String DOCX_MIME =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private static final String XLSX_MIME =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PENDING = "PENDING_APPROVAL";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_EXPORTED = "EXPORTED";

    private final ReportDefinitionRepository definitionRepository;
    private final ReportTemplateVersionRepository versionRepository;
    private final ReportPlaceholderRepository placeholderRepository;
    private final ReportMappingRepository mappingRepository;
    private final ReportRunRepository runRepository;
    private final ReportFactRepository factRepository;
    private final ReportNarrativeRepository narrativeRepository;
    private final FactSnapshotService snapshotService;
    private final ReportRenderService renderService;
    private final ReportDesignService designService;
    private final NarrativeClient narrativeClient;
    private final S3Service s3Service;
    private final AuthAuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * UC10.05 - tạo lần sinh báo cáo: khoá số liệu rồi mới sinh nhận xét.
     *
     * @param bearerToken token của người dùng, chuyển tiếp sang worker để phần
     *                    AI chịu đúng clearance của họ.
     */
    @Transactional
    public ResponseEntity<?> createRun(ReportDtos.RunRequest request, String actor,
                                       String bearerToken) {
        if (request.periodStart() == null || request.periodEnd() == null) {
            return ResponseEntity.badRequest().body("Thiếu kỳ báo cáo");
        }
        if (request.periodEnd().isBefore(request.periodStart())) {
            return ResponseEntity.badRequest().body("Kỳ báo cáo không hợp lệ");
        }

        ReportDefinition definition = definitionRepository
                .findByCode(request.definitionCode()).orElse(null);
        if (definition == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }

        ReportTemplateVersion version = versionRepository
                .findFirstByDefinitionIdAndStatusOrderByVersionNoDesc(definition.getId(), "APPROVED")
                .orElse(null);
        if (version == null) {
            return ResponseEntity.badRequest()
                    .body("Báo cáo chưa có phiên bản mẫu được phê duyệt");
        }

        // Không cho sinh báo cáo khi mẫu còn chỗ trống chưa map (tiêu chí M10).
        ReportDtos.ValidationResponse validation = designService.validate(version.getId());
        if (!validation.valid()) {
            return ResponseEntity.badRequest().body(validation);
        }

        ReportRun run = runRepository.save(ReportRun.builder()
                .definitionId(definition.getId())
                .templateVersionId(version.getId())
                .title(request.title() == null
                        ? "%s kỳ %s - %s".formatted(definition.getName(),
                        request.periodStart().format(DATE), request.periodEnd().format(DATE))
                        : request.title())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .status(STATUS_DRAFT)
                .snapshotId(UUID.randomUUID().toString())
                .securityLabelCode(definition.getSecurityLabelCode())
                .securityLevel(definition.getSecurityLevel() == null
                        ? 0 : definition.getSecurityLevel())
                .createdBy(actor)
                .build());

        // Bước 1: chốt số liệu.
        FactSnapshotService.SnapshotResult snapshot = snapshotService.capture(
                run, version.getId(), request.periodStart(), request.periodEnd());

        run.setSnapshotId(snapshot.snapshotId);
        run.setSnapshotChecksum(snapshot.checksum);
        run.setSnapshotAt(LocalDateTime.now());
        // Mức độ mật hiệu lực là mức cao nhất giữa báo cáo và dữ liệu lấy về.
        run.setSecurityLevel(Math.max(run.getSecurityLevel(), snapshot.maxSecurityLevel));

        List<String> warnings = new ArrayList<>(snapshot.warnings);

        // Bước 2: sinh nhận xét, chỉ từ fact đã khoá.
        if (Boolean.TRUE.equals(request.skipNarrative())) {
            // Bỏ qua AI không có nghĩa là mục đó biến mất: tạo bản rỗng ở trạng
            // thái bị chặn để người dùng buộc phải tự viết trước khi trình duyệt.
            warnings.addAll(createEmptyNarratives(run, version.getId()));
        } else {
            warnings.addAll(generateNarratives(run, version.getId(), snapshot.facts, bearerToken));
        }

        run.setWarnings(toJson(warnings));
        runRepository.save(run);

        auditService.success(actor, "REPORT_RUN_CREATED", "report_run", run.getId(),
                Map.of("definition", definition.getCode(),
                        "facts", snapshot.facts.size(),
                        "checksum", snapshot.checksum.substring(0, 12),
                        "securityLevel", run.getSecurityLevel()));

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(run));
    }

    /** Tạo chỗ trống cho từng mục AI khi người dùng chọn không gọi mô hình. */
    private List<String> createEmptyNarratives(ReportRun run, String templateVersionId) {
        List<String> warnings = new ArrayList<>();
        for (ReportPlaceholder section : aiSections(templateVersionId)) {
            narrativeRepository.save(ReportNarrative.builder()
                    .runId(run.getId())
                    .placeholderName(section.getName())
                    .generatedText("")
                    .finalText("")
                    .blocked(true)
                    .warnings(toJson(List.of("Chưa sinh nhận xét, cần nhập tay")))
                    .build());
            warnings.add("Mục AI %s chưa có nội dung".formatted(section.getName()));
        }
        return warnings;
    }

    private List<ReportPlaceholder> aiSections(String templateVersionId) {
        return placeholderRepository
                .findByTemplateVersionIdOrderByTypeAscNameAsc(templateVersionId).stream()
                .filter(placeholder -> TemplateParserService.TYPE_AI.equals(placeholder.getType()))
                .toList();
    }

    /**
     * UC10.06 - AI soạn nhận xét. Mỗi mục AI chỉ nhận đúng những fact được khai
     * báo trong ánh xạ; worker chặn nếu mô hình sinh ra số liệu ngoài danh sách.
     */
    private List<String> generateNarratives(ReportRun run, String templateVersionId,
                                            List<ReportFact> facts, String bearerToken) {
        List<String> warnings = new ArrayList<>();

        Map<String, ReportMapping> mappings = new HashMap<>();
        mappingRepository.findByTemplateVersionId(templateVersionId)
                .forEach(mapping -> mappings.put(mapping.getPlaceholderId(), mapping));

        for (ReportPlaceholder section : aiSections(templateVersionId)) {
            ReportMapping mapping = mappings.get(section.getId());
            if (mapping == null) {
                continue;
            }

            List<ReportFact> allowed = facts;
            if (mapping.getAiFactCodes() != null && !mapping.getAiFactCodes().isBlank()) {
                Set<String> codes = new HashSet<>(
                        Arrays.asList(mapping.getAiFactCodes().split("\\s*,\\s*")));
                allowed = facts.stream().filter(fact -> codes.contains(fact.getCode())).toList();
            }
            if (allowed.isEmpty()) {
                warnings.add("Mục AI %s không có số liệu nào để nhận xét".formatted(section.getName()));
                continue;
            }

            try {
                NarrativeClient.NarrativeResponse response = narrativeClient.generate(
                        allowed, mapping.getAiInstruction(), run.getSecurityLevel(), bearerToken);

                narrativeRepository.save(ReportNarrative.builder()
                        .runId(run.getId())
                        .placeholderName(section.getName())
                        .generatedText(response.narrative)
                        .finalText(response.blocked ? "" : response.narrative)
                        .factCodes(String.join(",", response.factsUsed))
                        .modelId(response.modelId)
                        .modelVersion(response.modelVersion)
                        .promptCode("REPORT_NARRATIVE_VI")
                        .blocked(response.blocked)
                        .warnings(toJson(response.warnings))
                        .build());

                if (response.blocked) {
                    warnings.add("Mục AI %s bị chặn: %s".formatted(section.getName(),
                            response.reason == null ? "vi phạm chính sách" : response.reason));
                } else {
                    run.setAiModelId(response.modelId);
                    run.setAiModelVersion(response.modelVersion);
                    run.setAiPromptVersion("REPORT_NARRATIVE_VI");
                }
                warnings.addAll(response.warnings);
            } catch (Exception e) {
                log.error("Không sinh được nhận xét cho mục {}", section.getName(), e);
                warnings.add("Không gọi được dịch vụ AI cho mục " + section.getName());
                narrativeRepository.save(ReportNarrative.builder()
                        .runId(run.getId())
                        .placeholderName(section.getName())
                        .generatedText("")
                        .finalText("")
                        .blocked(true)
                        .warnings(toJson(List.of("Không gọi được dịch vụ AI")))
                        .build());
            }
        }
        return warnings;
    }

    /** Cho phép người dùng sửa lại nhận xét trước khi phê duyệt - UC10.06. */
    @Transactional
    public ResponseEntity<?> editNarrative(String narrativeId,
                                           ReportDtos.NarrativeEditRequest request, String actor) {
        ReportNarrative narrative = narrativeRepository.findById(narrativeId).orElse(null);
        if (narrative == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy mục nhận xét");
        }
        ReportRun run = runRepository.findById(narrative.getRunId()).orElse(null);
        if (run == null || !STATUS_DRAFT.equals(run.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Chỉ sửa được nhận xét khi báo cáo còn ở trạng thái nháp");
        }

        // Bản do mô hình sinh ra được giữ nguyên để đối chiếu về sau.
        narrative.setFinalText(request.finalText());
        narrative.setEditedBy(actor);
        narrative.setEditedAt(LocalDateTime.now());
        narrativeRepository.save(narrative);

        auditService.success(actor, "REPORT_NARRATIVE_EDITED", "report_narrative",
                narrativeId, Map.of("section", narrative.getPlaceholderName()));
        return ResponseEntity.ok(toResponse(narrative));
    }

    /** UC10.05 - xem trước, render từ snapshot chứ không chạy lại truy vấn. */
    @Transactional(readOnly = true)
    public ResponseEntity<?> preview(String runId, String actor) {
        return renderRun(runId, actor, false);
    }

    @Transactional
    public ResponseEntity<?> submitForApproval(String runId, String actor) {
        ReportRun run = runRepository.findById(runId).orElse(null);
        if (run == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        if (!STATUS_DRAFT.equals(run.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Báo cáo không ở trạng thái nháp");
        }

        // Một mục nhận xét bị chặn nghĩa là mô hình đã bịa số liệu hoặc vi phạm
        // chính sách; không được để lọt vào quy trình phê duyệt.
        List<ReportNarrative> blocked = narrativeRepository.findByRunId(runId).stream()
                .filter(narrative -> Boolean.TRUE.equals(narrative.getBlocked())
                        && (narrative.getFinalText() == null || narrative.getFinalText().isBlank()))
                .toList();
        if (!blocked.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    "Còn %d mục AI bị chặn, cần sửa tay trước khi trình duyệt".formatted(blocked.size()));
        }

        run.setStatus(STATUS_PENDING);
        run.setSubmittedBy(actor);
        run.setSubmittedAt(LocalDateTime.now());
        runRepository.save(run);

        auditService.success(actor, "REPORT_RUN_SUBMITTED", "report_run", runId, null);
        return ResponseEntity.ok(toResponse(run));
    }

    /** UC10.07 - phê duyệt bốn mắt: người trình không được tự duyệt. */
    @Transactional
    public ResponseEntity<?> decide(String runId, ReportDtos.DecisionRequest request, String actor) {
        ReportRun run = runRepository.findById(runId).orElse(null);
        if (run == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        if (!STATUS_PENDING.equals(run.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Báo cáo không ở trạng thái chờ duyệt");
        }

        String decision = request.decision() == null ? "" : request.decision().toUpperCase(Locale.ROOT);
        if (!"APPROVE".equals(decision) && !"REJECT".equals(decision)) {
            return ResponseEntity.badRequest().body("Quyết định phải là APPROVE hoặc REJECT");
        }
        if (actor.equals(run.getSubmittedBy()) || actor.equals(run.getCreatedBy())) {
            auditService.denied(actor, "REPORT_RUN_DECIDED", "report_run", runId, "self_approval");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Người tạo hoặc người trình không được tự phê duyệt");
        }
        if ("REJECT".equals(decision) && (request.note() == null || request.note().isBlank())) {
            return ResponseEntity.badRequest().body("Từ chối phải kèm lý do");
        }

        // Snapshot phải còn nguyên vẹn so với lúc trình duyệt (AC-05).
        String current = snapshotService.checksum(factRepository.findByRunIdOrderByCodeAsc(runId));
        if (!current.equals(run.getSnapshotChecksum())) {
            auditService.failure(actor, "REPORT_RUN_DECIDED", "report_run", runId,
                    "snapshot_checksum_mismatch");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Số liệu đã thay đổi so với bản trình duyệt, cần tạo lại báo cáo");
        }

        run.setStatus("APPROVE".equals(decision) ? STATUS_APPROVED : STATUS_REJECTED);
        run.setApprovedBy(actor);
        run.setApprovedAt(LocalDateTime.now());
        run.setDecisionNote(request.note());
        runRepository.save(run);

        auditService.record(actor, run.getSecurityLabelCode(), "REPORT_RUN_DECIDED",
                "report_run", runId, AuthAuditService.SUCCESS, decision,
                Map.of("checksum", run.getSnapshotChecksum().substring(0, 12),
                        "note", request.note() == null ? "" : request.note()));

        return ResponseEntity.ok(toResponse(run));
    }

    /** UC10.08 - xuất bản. Chỉ báo cáo đã duyệt mới được xuất. */
    @Transactional
    public ResponseEntity<?> export(String runId, String actor) {
        return renderRun(runId, actor, true);
    }

    private ResponseEntity<?> renderRun(String runId, String actor, boolean publish) {
        ReportRun run = runRepository.findById(runId).orElse(null);
        if (run == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        if (publish && !STATUS_APPROVED.equals(run.getStatus())
                && !STATUS_EXPORTED.equals(run.getStatus())) {
            auditService.denied(actor, "REPORT_RUN_EXPORTED", "report_run", runId,
                    "not_approved");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Chỉ xuất bản được báo cáo đã phê duyệt");
        }

        ReportDefinition definition = definitionRepository.findById(run.getDefinitionId())
                .orElse(null);
        ReportTemplateVersion version = versionRepository.findById(run.getTemplateVersionId())
                .orElse(null);
        if (definition == null || version == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Thiếu định nghĩa hoặc mẫu");
        }

        List<ReportFact> facts = factRepository.findByRunIdOrderByCodeAsc(runId);
        List<ReportNarrative> narratives = narrativeRepository.findByRunId(runId);

        Map<String, String> extras = new LinkedHashMap<>();
        extras.put("report.title", run.getTitle());
        extras.put("report.period_start", run.getPeriodStart().format(DATE));
        extras.put("report.period_end", run.getPeriodEnd().format(DATE));
        extras.put("report.generated_at", LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        extras.put("report.snapshot_checksum", run.getSnapshotChecksum());

        String format = definition.getTemplateFormat() == null
                ? "DOCX" : definition.getTemplateFormat();
        String watermark = renderService.watermarkFor(run.getSecurityLabelCode(),
                run.getSecurityLevel());

        byte[] rendered;
        List<String> unresolved;
        try {
            byte[] template = s3Service.readBytes(version.getFileKey());
            rendered = renderService.render(template, format, facts, narratives, extras, watermark);
            unresolved = renderService.findUnresolved(rendered, format);
        } catch (Exception e) {
            log.error("Render báo cáo {} lỗi", runId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Không dựng được tệp báo cáo");
        }

        if (!unresolved.isEmpty()) {
            // Tài liệu phát hành không được còn chỗ trống chưa thay.
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Còn placeholder chưa được thay thế",
                    "placeholders", unresolved));
        }

        String fileName = "%s-%s.%s".formatted(definition.getCode(),
                run.getPeriodEnd(), "XLSX".equalsIgnoreCase(format) ? "xlsx" : "docx");
        String mime = "XLSX".equalsIgnoreCase(format) ? XLSX_MIME : DOCX_MIME;

        if (!publish) {
            auditService.success(actor, "REPORT_RUN_PREVIEWED", "report_run", runId, null);
            return ResponseEntity.ok()
                    .header("Content-Type", mime)
                    .header("Content-Disposition", "inline; filename=\"preview-" + fileName + "\"")
                    .body(rendered);
        }

        FileResponse stored = s3Service.uploadBytes("report-artifacts", rendered, mime, fileName);
        run.setArtifactFileKey(stored.getKey());
        run.setArtifactSha256(sha256(rendered));
        run.setExportedAt(LocalDateTime.now());
        run.setStatus(STATUS_EXPORTED);
        runRepository.save(run);

        auditService.record(actor, run.getSecurityLabelCode(), "REPORT_RUN_EXPORTED",
                "report_run", runId, AuthAuditService.SUCCESS, null,
                Map.of("fileKey", stored.getKey(),
                        "watermark", watermark == null ? "none" : watermark,
                        "sha256", run.getArtifactSha256().substring(0, 12)));

        return ResponseEntity.ok(toResponse(run));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getRun(String runId) {
        ReportRun run = runRepository.findById(runId).orElse(null);
        if (run == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        return ResponseEntity.ok(toResponse(run));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> listRuns(String status) {
        List<ReportRun> rows = status == null || status.isBlank()
                ? runRepository.findTop100ByOrderByCreatedAtDesc()
                : runRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(Locale.ROOT));
        List<ReportDtos.RunResponse> items = rows.stream().map(this::toSummary).toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    // ------------------------------------------------------------------

    ReportDtos.RunResponse toResponse(ReportRun run) {
        List<ReportDtos.FactResponse> facts = factRepository.findByRunIdOrderByCodeAsc(run.getId())
                .stream().map(this::toResponse).toList();
        List<ReportDtos.NarrativeResponse> narratives = narrativeRepository
                .findByRunId(run.getId()).stream().map(this::toResponse).toList();
        return build(run, facts, narratives);
    }

    private ReportDtos.RunResponse toSummary(ReportRun run) {
        return build(run, List.of(), List.of());
    }

    private ReportDtos.RunResponse build(ReportRun run, List<ReportDtos.FactResponse> facts,
                                         List<ReportDtos.NarrativeResponse> narratives) {
        ReportDefinition definition = definitionRepository.findById(run.getDefinitionId())
                .orElse(null);
        ReportTemplateVersion version = versionRepository.findById(run.getTemplateVersionId())
                .orElse(null);

        return new ReportDtos.RunResponse(
                run.getId(), run.getDefinitionId(),
                definition == null ? null : definition.getCode(),
                run.getTemplateVersionId(),
                version == null ? null : version.getVersionNo(),
                run.getTitle(), run.getPeriodStart(), run.getPeriodEnd(), run.getStatus(),
                run.getSnapshotId(), run.getSnapshotChecksum(), run.getSnapshotAt(),
                run.getSecurityLabelCode(), run.getSecurityLevel(),
                run.getAiModelId(), run.getAiModelVersion(), run.getAiPromptVersion(),
                fromJson(run.getWarnings()), run.getCreatedBy(), run.getCreatedAt(),
                run.getSubmittedBy(), run.getSubmittedAt(), run.getApprovedBy(),
                run.getApprovedAt(), run.getDecisionNote(), run.getArtifactFileKey(),
                run.getExportedAt(), facts, narratives);
    }

    private ReportDtos.FactResponse toResponse(ReportFact fact) {
        return new ReportDtos.FactResponse(
                fact.getCode(), fact.getPlaceholderName(), fact.getLabel(), fact.getFactType(),
                fact.getValue(), fact.getRawValue(), fact.getUnit(), fact.getDataQueryCode(),
                fact.getDataQueryVersion(), fact.getSourceColumn(), fact.getSourceRowIndex(),
                fact.getSourceRowCount(), fact.getExecutedAt());
    }

    private ReportDtos.NarrativeResponse toResponse(ReportNarrative narrative) {
        return new ReportDtos.NarrativeResponse(
                narrative.getId(), narrative.getPlaceholderName(), narrative.getGeneratedText(),
                narrative.getFinalText(), narrative.getFactCodes(), narrative.getModelId(),
                narrative.getModelVersion(), narrative.getPromptCode(), narrative.getBlocked(),
                narrative.getWarnings(), narrative.getEditedBy(), narrative.getEditedAt());
    }

    private String toJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception e) {
            return "[]";
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    private String sha256(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không tính được checksum tệp", e);
        }
    }

    /** Giữ để các lớp khác dùng cùng bảng mã khi băm nội dung văn bản. */
    static byte[] utf8(String value) {
        return value == null ? new byte[0] : value.getBytes(StandardCharsets.UTF_8);
    }
}
