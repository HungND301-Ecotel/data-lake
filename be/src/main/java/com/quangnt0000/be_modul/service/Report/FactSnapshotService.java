package com.quangnt0000.be_modul.service.Report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quangnt0000.be_modul.modal.Report.*;
import com.quangnt0000.be_modul.repository.Report.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Chốt số liệu cho một lần sinh báo cáo - tài liệu mục 5.3 và AC-05.
 *
 * <p>Đây là trung tâm của M10. Mỗi truy vấn chỉ chạy đúng một lần cho một run;
 * kết quả được ghi thành {@link ReportFact} kèm nguồn gốc đầy đủ. Từ đó về sau,
 * bản xem trước, bản phê duyệt và bản xuất ra đều đọc từ snapshot, nên ba bản
 * không thể lệch nhau, và số liệu vẫn tái lập được kể cả khi dữ liệu nguồn đã
 * thay đổi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FactSnapshotService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReportPlaceholderRepository placeholderRepository;
    private final ReportMappingRepository mappingRepository;
    private final ReportDataQueryRepository dataQueryRepository;
    private final ReportFactRepository factRepository;
    private final DataQueryExecutor executor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class SnapshotResult {
        public String snapshotId;
        public String checksum;
        public List<ReportFact> facts = new ArrayList<>();
        public List<String> warnings = new ArrayList<>();
        public int maxSecurityLevel;
    }

    /**
     * Chạy toàn bộ truy vấn của một phiên bản mẫu và ghi lại kết quả.
     *
     * <p>Một truy vấn dùng cho nhiều placeholder chỉ chạy một lần, nên hai
     * placeholder cùng nguồn không thể ra hai con số khác nhau vì chạy lệch thời
     * điểm.
     */
    public SnapshotResult capture(ReportRun run, String templateVersionId,
                                  LocalDate periodStart, LocalDate periodEnd) {
        SnapshotResult result = new SnapshotResult();
        result.snapshotId = UUID.randomUUID().toString();

        List<ReportPlaceholder> placeholders =
                placeholderRepository.findByTemplateVersionIdOrderByTypeAscNameAsc(templateVersionId);
        Map<String, ReportMapping> mappings = new HashMap<>();
        mappingRepository.findByTemplateVersionId(templateVersionId)
                .forEach(mapping -> mappings.put(mapping.getPlaceholderId(), mapping));

        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("period_start", periodStart);
        parameters.put("period_end", periodEnd);

        // Cache theo id truy vấn: một truy vấn chỉ chạy một lần cho cả run.
        Map<String, DataQueryExecutor.QueryResult> executed = new HashMap<>();
        Map<String, ReportDataQuery> queries = new HashMap<>();
        LocalDateTime executedAt = LocalDateTime.now();

        int factNumber = 0;
        for (ReportPlaceholder placeholder : placeholders) {
            if (TemplateParserService.TYPE_AI.equals(placeholder.getType())) {
                continue; // mục AI không sinh số liệu
            }

            ReportMapping mapping = mappings.get(placeholder.getId());
            if (mapping == null || mapping.getDataQueryId() == null) {
                result.warnings.add("Placeholder chưa map: " + placeholder.getToken());
                continue;
            }

            ReportDataQuery query = queries.computeIfAbsent(mapping.getDataQueryId(),
                    id -> dataQueryRepository.findById(id).orElse(null));
            if (query == null) {
                result.warnings.add("Không tìm thấy truy vấn cho " + placeholder.getToken());
                continue;
            }

            DataQueryExecutor.QueryResult data;
            try {
                data = executed.computeIfAbsent(query.getId(),
                        id -> executor.execute(query, parameters));
            } catch (Exception e) {
                log.error("Truy vấn {} lỗi", query.getCode(), e);
                result.warnings.add("Truy vấn %s lỗi: %s".formatted(query.getCode(),
                        e.getClass().getSimpleName()));
                continue;
            }

            result.maxSecurityLevel = Math.max(result.maxSecurityLevel,
                    query.getSecurityLevel() == null ? 0 : query.getSecurityLevel());

            factNumber++;
            ReportFact fact = buildFact(run, result.snapshotId, "F" + factNumber,
                    placeholder, mapping, query, data, executedAt);
            if (fact == null) {
                result.warnings.add("Không lấy được giá trị cho " + placeholder.getToken());
                factNumber--;
                continue;
            }
            result.facts.add(factRepository.save(fact));
        }

        result.checksum = checksum(result.facts);
        log.info("chốt {} fact cho run {} (checksum {})", result.facts.size(), run.getId(),
                result.checksum.substring(0, 12));
        return result;
    }

    private ReportFact buildFact(ReportRun run, String snapshotId, String code,
                                 ReportPlaceholder placeholder, ReportMapping mapping,
                                 ReportDataQuery query, DataQueryExecutor.QueryResult data,
                                 LocalDateTime executedAt) {
        ReportFact.ReportFactBuilder builder = ReportFact.builder()
                .snapshotId(snapshotId)
                .runId(run.getId())
                .code(code)
                .placeholderName(placeholder.getName())
                .label(placeholder.getName())
                .unit(mapping.getUnit())
                .dataQueryId(query.getId())
                .dataQueryCode(query.getCode())
                .dataQueryVersion(query.getVersionNo())
                .executedAt(executedAt)
                .sourceRowCount(data.rowCount());

        boolean tabular = TemplateParserService.TYPE_TABLE.equals(placeholder.getType())
                || TemplateParserService.TYPE_CHART.equals(placeholder.getType());

        if (tabular) {
            try {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("columns", data.columns);
                payload.put("rows", data.rows);
                return builder
                        .factType("TABLE")
                        .value("[bảng %d dòng]".formatted(data.rowCount()))
                        .rawValue(objectMapper.writeValueAsString(payload))
                        .build();
            } catch (Exception e) {
                log.error("Không tuần tự hoá được bảng cho {}", placeholder.getToken(), e);
                return null;
            }
        }

        String column = mapping.getOutputColumn();
        if (column == null || column.isBlank()) {
            column = data.columns.isEmpty() ? null : data.columns.get(0);
        }
        if (column == null) {
            return null;
        }

        int rowIndex = mapping.getRowIndex() == null ? 0 : mapping.getRowIndex();
        Object raw = data.valueAt(rowIndex, column);

        return builder
                .factType("SCALAR")
                .sourceColumn(column)
                .sourceRowIndex(rowIndex)
                .rawValue(raw == null ? null : String.valueOf(raw))
                .value(format(raw, mapping.getFormat()))
                .build();
    }

    /** Định dạng số theo quy ước Việt Nam: dấu chấm ngăn nghìn, phẩy thập phân. */
    public String format(Object raw, String format) {
        if (raw == null) {
            return "";
        }
        String type = format == null ? "TEXT" : format.toUpperCase(Locale.ROOT);

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ROOT);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');

        try {
            switch (type) {
                case "NUMBER_0":
                    return new DecimalFormat("#,##0", symbols).format(toDecimal(raw));
                case "NUMBER":
                    return new DecimalFormat("#,##0.##", symbols).format(toDecimal(raw));
                case "PERCENT":
                    return new DecimalFormat("#,##0.##", symbols)
                            .format(toDecimal(raw).multiply(BigDecimal.valueOf(100))
                                    .setScale(2, RoundingMode.HALF_UP)) + "%";
                case "DATE":
                    if (raw instanceof java.sql.Date sqlDate) {
                        return sqlDate.toLocalDate().format(DATE);
                    }
                    if (raw instanceof LocalDate localDate) {
                        return localDate.format(DATE);
                    }
                    return String.valueOf(raw);
                default:
                    return String.valueOf(raw);
            }
        } catch (NumberFormatException e) {
            // Định dạng sai kiểu không được làm hỏng cả báo cáo; giữ giá trị thô.
            return String.valueOf(raw);
        }
    }

    private BigDecimal toDecimal(Object raw) {
        if (raw instanceof BigDecimal decimal) {
            return decimal;
        }
        if (raw instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(String.valueOf(raw).trim());
    }

    /**
     * Vân tay của toàn bộ snapshot. Dùng để chứng minh bản xuất ra dựa trên đúng
     * bộ số liệu đã được phê duyệt.
     */
    public String checksum(List<ReportFact> facts) {
        StringBuilder builder = new StringBuilder();
        facts.stream()
                .sorted(Comparator.comparing(ReportFact::getCode))
                .forEach(fact -> builder
                        .append(fact.getCode()).append('|')
                        .append(fact.getPlaceholderName()).append('|')
                        .append(fact.getRawValue()).append('|')
                        .append(fact.getDataQueryCode()).append('v')
                        .append(fact.getDataQueryVersion()).append('\n'));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(builder.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không tính được checksum snapshot", e);
        }
    }
}
