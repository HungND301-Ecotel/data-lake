package com.quangnt0000.be_modul.service.Report;

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
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Thiết kế báo cáo: định nghĩa, phiên bản mẫu, placeholder, ánh xạ và danh mục
 * truy vấn - UC10.01 đến UC10.04.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportDesignService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_RETIRED = "RETIRED";

    private final ReportDefinitionRepository definitionRepository;
    private final ReportTemplateVersionRepository versionRepository;
    private final ReportPlaceholderRepository placeholderRepository;
    private final ReportMappingRepository mappingRepository;
    private final ReportDataQueryRepository dataQueryRepository;
    private final TemplateParserService parserService;
    private final QueryGuard queryGuard;
    private final DataQueryExecutor executor;
    private final S3Service s3Service;
    private final AuthAuditService auditService;

    // ------------------------------------------------------------------
    // Định nghĩa báo cáo
    // ------------------------------------------------------------------

    @Transactional
    public ResponseEntity<?> createDefinition(ReportDtos.DefinitionRequest request, String actor) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu mã báo cáo");
        }
        if (definitionRepository.existsByCode(request.code())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Mã báo cáo đã tồn tại");
        }

        ReportDefinition definition = definitionRepository.save(ReportDefinition.builder()
                .code(request.code())
                .name(request.name() == null ? request.code() : request.name())
                .description(request.description())
                .ownerOrgCode(request.ownerOrgCode())
                .ownerUserId(request.ownerUserId())
                .securityLabelCode(request.securityLabelCode())
                .securityLevel(request.securityLevel() == null ? 0 : request.securityLevel())
                .periodType(request.periodType() == null ? "MONTH" : request.periodType())
                .active(true)
                .createdBy(actor)
                .build());

        auditService.success(actor, "REPORT_DEFINITION_CREATED", "report_definition",
                definition.getId(), Map.of("code", definition.getCode()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(definition));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> listDefinitions() {
        List<ReportDtos.DefinitionResponse> items = definitionRepository
                .findByActiveTrueOrderByCodeAsc().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    // ------------------------------------------------------------------
    // Phiên bản mẫu
    // ------------------------------------------------------------------

    /**
     * Tải lên một phiên bản mẫu mới và quét placeholder ngay.
     *
     * <p>Luôn tạo phiên bản mới thay vì sửa phiên bản cũ, để báo cáo đã phát
     * hành vẫn render lại được đúng như lúc phát hành.
     */
    @Transactional
    public ResponseEntity<?> uploadTemplateVersion(String definitionCode, MultipartFile file,
                                                   String changeNote, String actor) {
        ReportDefinition definition = definitionRepository.findByCode(definitionCode).orElse(null);
        if (definition == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Chưa chọn tệp mẫu");
        }

        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("template");
        String format = name.toLowerCase(Locale.ROOT).endsWith(".xlsx") ? "XLSX" : "DOCX";

        byte[] content;
        List<TemplateParserService.ParsedPlaceholder> parsed;
        try {
            content = file.getBytes();
            parsed = parserService.parse(content, format);
        } catch (Exception e) {
            log.error("Không đọc được tệp mẫu {}", name, e);
            return ResponseEntity.badRequest()
                    .body("Không đọc được tệp mẫu, chỉ hỗ trợ DOCX và XLSX");
        }
        if (parsed.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Không tìm thấy placeholder nào trong mẫu");
        }

        FileResponse stored = s3Service.uploadFile("report-templates", file);

        int nextVersion = versionRepository
                .findFirstByDefinitionIdOrderByVersionNoDesc(definition.getId())
                .map(v -> v.getVersionNo() + 1)
                .orElse(1);

        ReportTemplateVersion version = versionRepository.save(ReportTemplateVersion.builder()
                .definitionId(definition.getId())
                .versionNo(nextVersion)
                .fileKey(stored.getKey())
                .originalName(name)
                .sha256(sha256(content))
                .sizeBytes((long) content.length)
                .status(STATUS_DRAFT)
                .changeNote(changeNote)
                .createdBy(actor)
                .build());

        parsed.forEach(item ->
                placeholderRepository.save(parserService.toEntity(version.getId(), item)));

        definition.setTemplateFormat(format);
        definitionRepository.save(definition);

        auditService.success(actor, "REPORT_TEMPLATE_UPLOADED", "report_template_version",
                version.getId(), Map.of("definition", definition.getCode(),
                        "version", nextVersion, "placeholders", parsed.size()));

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(version, true));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> listVersions(String definitionCode) {
        ReportDefinition definition = definitionRepository.findByCode(definitionCode).orElse(null);
        if (definition == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy báo cáo");
        }
        List<ReportDtos.TemplateVersionResponse> items = versionRepository
                .findByDefinitionIdOrderByVersionNoDesc(definition.getId()).stream()
                .map(version -> toResponse(version, false))
                .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getVersion(String versionId) {
        ReportTemplateVersion version = versionRepository.findById(versionId).orElse(null);
        if (version == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phiên bản mẫu");
        }
        return ResponseEntity.ok(toResponse(version, true));
    }

    // ------------------------------------------------------------------
    // Ánh xạ
    // ------------------------------------------------------------------

    @Transactional
    public ResponseEntity<?> upsertMapping(ReportDtos.MappingRequest request, String actor) {
        ReportPlaceholder placeholder = placeholderRepository
                .findById(request.placeholderId()).orElse(null);
        if (placeholder == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy placeholder");
        }

        ReportTemplateVersion version = versionRepository
                .findById(placeholder.getTemplateVersionId()).orElse(null);
        if (version == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phiên bản mẫu");
        }
        // Mẫu đã duyệt là bất biến; sửa ánh xạ phải làm trên phiên bản nháp mới.
        if (!STATUS_DRAFT.equals(version.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Phiên bản mẫu đã duyệt, hãy tạo phiên bản mới để sửa ánh xạ");
        }

        boolean isAiSection = TemplateParserService.TYPE_AI.equals(placeholder.getType());
        ReportDataQuery query = null;

        if (!isAiSection) {
            if (request.dataQueryCode() == null || request.dataQueryCode().isBlank()) {
                return ResponseEntity.badRequest().body("Placeholder số liệu phải chọn truy vấn");
            }
            query = dataQueryRepository
                    .findFirstByCodeAndStatusOrderByVersionNoDesc(request.dataQueryCode(),
                            STATUS_APPROVED)
                    .orElse(null);
            if (query == null) {
                return ResponseEntity.badRequest()
                        .body("Truy vấn chưa được duyệt hoặc không tồn tại: "
                                + request.dataQueryCode());
            }
        } else if (request.aiInstruction() == null || request.aiInstruction().isBlank()) {
            return ResponseEntity.badRequest().body("Mục AI phải có lời dẫn");
        }

        ReportMapping mapping = mappingRepository.findByPlaceholderId(placeholder.getId())
                .orElseGet(() -> ReportMapping.builder()
                        .placeholderId(placeholder.getId())
                        .templateVersionId(placeholder.getTemplateVersionId())
                        .createdBy(actor)
                        .build());

        mapping.setDataQueryId(query == null ? null : query.getId());
        mapping.setOutputColumn(request.outputColumn());
        mapping.setRowIndex(request.rowIndex() == null ? 0 : request.rowIndex());
        mapping.setFormat(request.format() == null ? "TEXT" : request.format());
        mapping.setUnit(request.unit());
        mapping.setAiInstruction(request.aiInstruction());
        mapping.setAiFactCodes(request.aiFactCodes() == null || request.aiFactCodes().isEmpty()
                ? null : String.join(",", request.aiFactCodes()));
        mapping.setUpdatedAt(LocalDateTime.now());
        mappingRepository.save(mapping);

        auditService.success(actor, "REPORT_MAPPING_SET", "report_placeholder",
                placeholder.getId(), Map.of("token", placeholder.getToken(),
                        "dataQuery", request.dataQueryCode() == null ? "" : request.dataQueryCode()));

        return ResponseEntity.ok(toResponse(mapping, query));
    }

    /**
     * UC10.04 - kiểm tra trước khi cho phép sinh báo cáo.
     *
     * <p>Điều kiện cứng: không còn placeholder nào chưa map. Đây là tiêu chí
     * nghiệm thu của M10, nên nó chặn chứ không chỉ cảnh báo.
     */
    @Transactional(readOnly = true)
    public ReportDtos.ValidationResponse validate(String templateVersionId) {
        List<ReportPlaceholder> placeholders =
                placeholderRepository.findByTemplateVersionIdOrderByTypeAscNameAsc(templateVersionId);
        Map<String, ReportMapping> mappings = new HashMap<>();
        mappingRepository.findByTemplateVersionId(templateVersionId)
                .forEach(mapping -> mappings.put(mapping.getPlaceholderId(), mapping));

        List<String> unmapped = new ArrayList<>();
        List<String> problems = new ArrayList<>();

        for (ReportPlaceholder placeholder : placeholders) {
            ReportMapping mapping = mappings.get(placeholder.getId());
            if (mapping == null) {
                unmapped.add(placeholder.getToken());
                continue;
            }
            boolean isAiSection = TemplateParserService.TYPE_AI.equals(placeholder.getType());
            if (isAiSection) {
                if (mapping.getAiInstruction() == null || mapping.getAiInstruction().isBlank()) {
                    problems.add("Mục AI thiếu lời dẫn: " + placeholder.getToken());
                }
                continue;
            }
            if (mapping.getDataQueryId() == null) {
                unmapped.add(placeholder.getToken());
                continue;
            }
            ReportDataQuery query = dataQueryRepository.findById(mapping.getDataQueryId())
                    .orElse(null);
            if (query == null) {
                problems.add("Truy vấn không còn tồn tại: " + placeholder.getToken());
            } else if (!STATUS_APPROVED.equals(query.getStatus())) {
                problems.add("Truy vấn chưa được duyệt: " + query.getCode());
            }
        }

        return new ReportDtos.ValidationResponse(
                unmapped.isEmpty() && problems.isEmpty(), unmapped, problems);
    }

    @Transactional
    public ResponseEntity<?> approveTemplateVersion(String versionId, String actor) {
        ReportTemplateVersion version = versionRepository.findById(versionId).orElse(null);
        if (version == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phiên bản mẫu");
        }
        if (STATUS_APPROVED.equals(version.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Phiên bản đã được duyệt");
        }

        ReportDtos.ValidationResponse validation = validate(versionId);
        if (!validation.valid()) {
            return ResponseEntity.badRequest().body(validation);
        }
        // Người tạo mẫu không tự duyệt mẫu của mình (four-eyes, mục 5.4/M07).
        if (actor.equals(version.getCreatedBy())) {
            auditService.denied(actor, "REPORT_TEMPLATE_APPROVED", "report_template_version",
                    versionId, "self_approval");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Người tạo mẫu không được tự phê duyệt");
        }

        // Chỉ một phiên bản được APPROVED tại một thời điểm.
        versionRepository.findByDefinitionIdOrderByVersionNoDesc(version.getDefinitionId())
                .stream()
                .filter(other -> STATUS_APPROVED.equals(other.getStatus()))
                .forEach(other -> {
                    other.setStatus(STATUS_RETIRED);
                    other.setRetiredAt(LocalDateTime.now());
                    versionRepository.save(other);
                });

        version.setStatus(STATUS_APPROVED);
        version.setApprovedBy(actor);
        version.setApprovedAt(LocalDateTime.now());
        versionRepository.save(version);

        auditService.success(actor, "REPORT_TEMPLATE_APPROVED", "report_template_version",
                versionId, Map.of("versionNo", version.getVersionNo()));
        return ResponseEntity.ok(toResponse(version, true));
    }

    // ------------------------------------------------------------------
    // Danh mục truy vấn
    // ------------------------------------------------------------------

    @Transactional
    public ResponseEntity<?> createDataQuery(ReportDtos.DataQueryRequest request, String actor) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu mã truy vấn");
        }

        String statement;
        try {
            statement = queryGuard.validate(request.statement());
        } catch (QueryGuard.Violation violation) {
            auditService.denied(actor, "REPORT_QUERY_CREATED", "report_data_query",
                    request.code(), violation.getMessage());
            return ResponseEntity.badRequest().body(violation.getMessage());
        }

        int nextVersion = dataQueryRepository.findFirstByCodeOrderByVersionNoDesc(request.code())
                .map(existing -> existing.getVersionNo() + 1)
                .orElse(1);

        ReportDataQuery query = dataQueryRepository.save(ReportDataQuery.builder()
                .code(request.code())
                .versionNo(nextVersion)
                .name(request.name() == null ? request.code() : request.name())
                .description(request.description())
                .statement(statement)
                .outputColumns(request.outputColumns())
                .securityLabelCode(request.securityLabelCode())
                .securityLevel(request.securityLevel() == null ? 0 : request.securityLevel())
                .maxRows(request.maxRows() == null ? 5000 : request.maxRows())
                .status(STATUS_DRAFT)
                .createdBy(actor)
                .build());

        auditService.success(actor, "REPORT_QUERY_CREATED", "report_data_query",
                query.getId(), Map.of("code", query.getCode(), "version", nextVersion));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(query));
    }

    @Transactional
    public ResponseEntity<?> approveDataQuery(String queryId, String actor) {
        ReportDataQuery query = dataQueryRepository.findById(queryId).orElse(null);
        if (query == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy truy vấn");
        }
        if (actor.equals(query.getCreatedBy())) {
            auditService.denied(actor, "REPORT_QUERY_APPROVED", "report_data_query",
                    queryId, "self_approval");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Người tạo truy vấn không được tự phê duyệt");
        }

        query.setStatus(STATUS_APPROVED);
        query.setApprovedBy(actor);
        query.setApprovedAt(LocalDateTime.now());
        dataQueryRepository.save(query);

        auditService.success(actor, "REPORT_QUERY_APPROVED", "report_data_query",
                queryId, Map.of("code", query.getCode(), "version", query.getVersionNo()));
        return ResponseEntity.ok(toResponse(query));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> listDataQueries() {
        List<ReportDtos.DataQueryResponse> items = dataQueryRepository
                .findAllByOrderByCodeAscVersionNoDesc().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(Map.of("total", items.size(), "items", items));
    }

    /** Chạy thử một truy vấn để người thiết kế biết cột nào có sẵn. */
    @Transactional(readOnly = true)
    public ResponseEntity<?> previewDataQuery(String queryId,
                                              ReportDtos.DataQueryPreviewRequest request) {
        ReportDataQuery query = dataQueryRepository.findById(queryId).orElse(null);
        if (query == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy truy vấn");
        }
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("period_start", request == null ? null : request.periodStart());
        parameters.put("period_end", request == null ? null : request.periodEnd());

        try {
            DataQueryExecutor.QueryResult result = executor.execute(query, parameters);
            List<Map<String, Object>> preview = result.rows.size() > 20
                    ? result.rows.subList(0, 20) : result.rows;
            return ResponseEntity.ok(new ReportDtos.DataQueryPreviewResponse(
                    result.columns, preview, result.rowCount()));
        } catch (Exception e) {
            log.error("Chạy thử truy vấn {} lỗi", query.getCode(), e);
            return ResponseEntity.badRequest()
                    .body("Truy vấn lỗi: " + e.getClass().getSimpleName());
        }
    }

    // ------------------------------------------------------------------
    // Chuyển đổi
    // ------------------------------------------------------------------

    ReportDtos.DefinitionResponse toResponse(ReportDefinition definition) {
        List<ReportTemplateVersion> versions =
                versionRepository.findByDefinitionIdOrderByVersionNoDesc(definition.getId());
        Integer approved = versions.stream()
                .filter(v -> STATUS_APPROVED.equals(v.getStatus()))
                .map(ReportTemplateVersion::getVersionNo)
                .findFirst()
                .orElse(null);

        return new ReportDtos.DefinitionResponse(
                definition.getId(), definition.getCode(), definition.getName(),
                definition.getDescription(), definition.getOwnerOrgCode(),
                definition.getOwnerUserId(), definition.getSecurityLabelCode(),
                definition.getSecurityLevel(), definition.getTemplateFormat(),
                definition.getPeriodType(), definition.getActive(), definition.getCreatedBy(),
                definition.getCreatedAt(), versions.size(), approved);
    }

    ReportDtos.TemplateVersionResponse toResponse(ReportTemplateVersion version,
                                                  boolean withPlaceholders) {
        List<ReportDtos.PlaceholderResponse> placeholders = List.of();
        if (withPlaceholders) {
            Map<String, ReportMapping> mappings = new HashMap<>();
            mappingRepository.findByTemplateVersionId(version.getId())
                    .forEach(mapping -> mappings.put(mapping.getPlaceholderId(), mapping));

            placeholders = placeholderRepository
                    .findByTemplateVersionIdOrderByTypeAscNameAsc(version.getId()).stream()
                    .map(placeholder -> {
                        ReportMapping mapping = mappings.get(placeholder.getId());
                        ReportDataQuery query = mapping == null || mapping.getDataQueryId() == null
                                ? null
                                : dataQueryRepository.findById(mapping.getDataQueryId()).orElse(null);
                        return new ReportDtos.PlaceholderResponse(
                                placeholder.getId(), placeholder.getToken(), placeholder.getType(),
                                placeholder.getName(), placeholder.getLocator(),
                                placeholder.getOccurrences(),
                                mapping == null ? null : toResponse(mapping, query));
                    })
                    .toList();
        }

        return new ReportDtos.TemplateVersionResponse(
                version.getId(), version.getDefinitionId(), version.getVersionNo(),
                version.getFileKey(), version.getOriginalName(), version.getSha256(),
                version.getSizeBytes(), version.getStatus(), version.getChangeNote(),
                version.getCreatedBy(), version.getCreatedAt(), version.getApprovedBy(),
                version.getApprovedAt(), placeholders);
    }

    ReportDtos.MappingResponse toResponse(ReportMapping mapping, ReportDataQuery query) {
        return new ReportDtos.MappingResponse(
                mapping.getId(), mapping.getPlaceholderId(), mapping.getDataQueryId(),
                query == null ? null : query.getCode(),
                query == null ? null : query.getVersionNo(),
                mapping.getOutputColumn(), mapping.getRowIndex(), mapping.getFormat(),
                mapping.getUnit(), mapping.getAiInstruction(), mapping.getAiFactCodes());
    }

    ReportDtos.DataQueryResponse toResponse(ReportDataQuery query) {
        return new ReportDtos.DataQueryResponse(
                query.getId(), query.getCode(), query.getVersionNo(), query.getName(),
                query.getDescription(), query.getStatement(), query.getOutputColumns(),
                query.getSecurityLabelCode(), query.getSecurityLevel(), query.getMaxRows(),
                query.getStatus(), query.getCreatedBy(), query.getCreatedAt(),
                query.getApprovedBy(), query.getApprovedAt());
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
            throw new IllegalStateException("Không tính được checksum tệp mẫu", e);
        }
    }

    /** Dùng chung cho service khác khi cần chuỗi UTF-8 ổn định. */
    static byte[] utf8(String value) {
        return value == null ? new byte[0] : value.getBytes(StandardCharsets.UTF_8);
    }
}
