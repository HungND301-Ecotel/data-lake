package com.quangnt0000.be_modul.dto.Report;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Kiểu request/response của module M10. */
public final class ReportDtos {

    private ReportDtos() {
    }

    // ---- Định nghĩa báo cáo ---------------------------------------------

    public record DefinitionRequest(
            String code,
            String name,
            String description,
            String ownerOrgCode,
            String ownerUserId,
            String securityLabelCode,
            Integer securityLevel,
            String periodType
    ) {
    }

    public record DefinitionResponse(
            String id, String code, String name, String description,
            String ownerOrgCode, String ownerUserId, String securityLabelCode,
            Integer securityLevel, String templateFormat, String periodType,
            Boolean active, String createdBy, LocalDateTime createdAt,
            Integer versionCount, Integer approvedVersionNo
    ) {
    }

    // ---- Phiên bản mẫu ---------------------------------------------------

    public record TemplateVersionResponse(
            String id, String definitionId, Integer versionNo, String fileKey,
            String originalName, String sha256, Long sizeBytes, String status,
            String changeNote, String createdBy, LocalDateTime createdAt,
            String approvedBy, LocalDateTime approvedAt,
            List<PlaceholderResponse> placeholders
    ) {
    }

    public record PlaceholderResponse(
            String id, String token, String type, String name, String locator,
            Integer occurrences, MappingResponse mapping
    ) {
    }

    // ---- Ánh xạ ----------------------------------------------------------

    public record MappingRequest(
            String placeholderId,
            String dataQueryCode,
            String outputColumn,
            Integer rowIndex,
            String format,
            String unit,
            String aiInstruction,
            List<String> aiFactCodes
    ) {
    }

    public record MappingResponse(
            String id, String placeholderId, String dataQueryId, String dataQueryCode,
            Integer dataQueryVersion, String outputColumn, Integer rowIndex,
            String format, String unit, String aiInstruction, String aiFactCodes
    ) {
    }

    public record ValidationResponse(
            boolean valid,
            List<String> unmappedPlaceholders,
            List<String> problems
    ) {
    }

    // ---- Truy vấn số liệu -------------------------------------------------

    public record DataQueryRequest(
            String code,
            String name,
            String description,
            String statement,
            String outputColumns,
            String securityLabelCode,
            Integer securityLevel,
            Integer maxRows
    ) {
    }

    public record DataQueryResponse(
            String id, String code, Integer versionNo, String name, String description,
            String statement, String outputColumns, String securityLabelCode,
            Integer securityLevel, Integer maxRows, String status,
            String createdBy, LocalDateTime createdAt, String approvedBy,
            LocalDateTime approvedAt
    ) {
    }

    public record DataQueryPreviewRequest(LocalDate periodStart, LocalDate periodEnd) {
    }

    public record DataQueryPreviewResponse(
            List<String> columns, List<Map<String, Object>> rows, int rowCount
    ) {
    }

    // ---- Lần sinh báo cáo -------------------------------------------------

    public record RunRequest(
            String definitionCode,
            String title,
            LocalDate periodStart,
            LocalDate periodEnd,
            /** true để bỏ qua bước gọi AI, chỉ chốt số liệu. */
            Boolean skipNarrative
    ) {
    }

    public record FactResponse(
            String code, String placeholderName, String label, String factType,
            String value, String rawValue, String unit,
            String dataQueryCode, Integer dataQueryVersion, String sourceColumn,
            Integer sourceRowIndex, Integer sourceRowCount, LocalDateTime executedAt
    ) {
    }

    public record NarrativeResponse(
            String id, String placeholderName, String generatedText, String finalText,
            String factCodes, String modelId, String modelVersion, String promptCode,
            Boolean blocked, String warnings, String editedBy, LocalDateTime editedAt
    ) {
    }

    public record RunResponse(
            String id, String definitionId, String definitionCode, String templateVersionId,
            Integer templateVersionNo, String title, LocalDate periodStart, LocalDate periodEnd,
            String status, String snapshotId, String snapshotChecksum, LocalDateTime snapshotAt,
            String securityLabelCode, Integer securityLevel,
            String aiModelId, String aiModelVersion, String aiPromptVersion,
            List<String> warnings, String createdBy, LocalDateTime createdAt,
            String submittedBy, LocalDateTime submittedAt,
            String approvedBy, LocalDateTime approvedAt, String decisionNote,
            String artifactFileKey, LocalDateTime exportedAt,
            List<FactResponse> facts, List<NarrativeResponse> narratives
    ) {
    }

    public record NarrativeEditRequest(String finalText) {
    }

    public record DecisionRequest(String decision, String note) {
    }
}
