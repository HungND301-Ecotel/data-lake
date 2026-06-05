package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AggregationEngine {
    private static final String ROLE_DIMENSION = "DIMENSION";
    private static final String AGGREGATE_SUM = "SUM";
    private static final String AGGREGATE_LAST = "LAST";
    private static final String AGGREGATE_FIRST = "FIRST";
    private static final String AGGREGATE_MAX = "MAX";
    private static final String AGGREGATE_MIN = "MIN";
    private static final String AGGREGATE_NONE = "NONE";

    private static final Map<String, List<String>> TIME_FIELD_ALIASES = Map.of(
            "YEAR", List.of("YEAR"),
            "MONTH", List.of("MONTH", "PERIOD"),
            "DAY", List.of("DAY", "NGAY")
    );

    public List<Map<String, Object>> aggregate(
            List<Map<String, Object>> rows,
            List<WareMapping> mappings,
            String reportType
    ) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyList();
        }
        if (mappings == null || mappings.isEmpty()) {
            return rows;
        }

        List<Map<String, Object>> sortedRows = rows.stream()
                .sorted(timeComparator())
                .toList();

        List<GroupField> groupByFields = resolveGroupByFields(sortedRows, mappings, reportType);
        Map<List<Object>, List<Map<String, Object>>> groupedRows = sortedRows.stream()
                .collect(Collectors.groupingBy(
                        row -> buildGroupKey(row, groupByFields),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return groupedRows.values().stream()
                .map(group -> aggregateGroup(group, mappings, groupByFields))
                .toList();
    }

    private List<GroupField> resolveGroupByFields(
            List<Map<String, Object>> rows,
            List<WareMapping> mappings,
            String reportType
    ) {
        Map<String, String> fieldLookup = buildFieldLookup(rows);
        LinkedHashMap<String, GroupField> groupFields = new LinkedHashMap<>();

        mappings.stream()
                .filter(mapping -> ROLE_DIMENSION.equals(normalize(mapping.getRole())))
                .map(WareMapping::getFieldName)
                .filter(Objects::nonNull)
                .forEach(fieldName -> addGroupField(groupFields, fieldName, resolveFieldName(fieldLookup, fieldName)));

        for (String timeField : timeFieldsFor(reportType)) {
            String actualFieldName = resolveTimeFieldName(fieldLookup, timeField);
            if (actualFieldName != null) {
                addGroupField(groupFields, timeField, actualFieldName);
            }
        }

        return new ArrayList<>(groupFields.values());
    }

    private Map<String, Object> aggregateGroup(
            List<Map<String, Object>> groupRows,
            List<WareMapping> mappings,
            List<GroupField> groupByFields
    ) {
        Map<String, Object> result = new LinkedHashMap<>();

        for (GroupField groupField : groupByFields) {
            Object value = findValueIgnoreCase(groupRows.get(0), groupField.actualFieldName());
            result.put(groupField.actualFieldName(), value);
        }

        for (WareMapping mapping : mappings) {
            String fieldName = mapping.getFieldName();
            if (fieldName == null || result.containsKey(fieldName)) {
                continue;
            }
            if (groupRows.stream().noneMatch(row -> containsKeyIgnoreCase(row, fieldName))) {
                continue;
            }

            String aggregateType = aggregateTypeOf(mapping);
            Object value = switch (aggregateType) {
                case AGGREGATE_SUM -> sum(groupRows, fieldName);
                case AGGREGATE_LAST -> findValueIgnoreCase(groupRows.get(groupRows.size() - 1), fieldName);
                case AGGREGATE_FIRST, AGGREGATE_NONE -> findValueIgnoreCase(groupRows.get(0), fieldName);
                case AGGREGATE_MAX -> max(groupRows, fieldName);
                case AGGREGATE_MIN -> min(groupRows, fieldName);
                default -> findValueIgnoreCase(groupRows.get(0), fieldName);
            };

            if (value != null) {
                result.put(fieldName, value);
            }
        }

        return result;
    }

    private void addGroupField(LinkedHashMap<String, GroupField> groupFields, String configuredName, String actualName) {
        if (actualName == null) {
            return;
        }
        String key = actualName.toLowerCase(Locale.ROOT);
        groupFields.putIfAbsent(key, new GroupField(configuredName, actualName));
    }

    private List<Object> buildGroupKey(Map<String, Object> row, List<GroupField> groupByFields) {
        return groupByFields.stream()
                .map(groupField -> findValueIgnoreCase(row, groupField.actualFieldName()))
                .toList();
    }

    private Comparator<Map<String, Object>> timeComparator() {
        return Comparator
                .comparing((Map<String, Object> row) -> comparableTimeValue(row, "YEAR"), Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(row -> comparableTimeValue(row, "MONTH"), Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(row -> comparableTimeValue(row, "DAY"), Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private BigDecimal comparableTimeValue(Map<String, Object> row, String canonicalFieldName) {
        return TIME_FIELD_ALIASES.getOrDefault(canonicalFieldName, List.of(canonicalFieldName)).stream()
                .map(alias -> findValueIgnoreCase(row, alias))
                .map(this::toBigDecimal)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private List<String> timeFieldsFor(String reportType) {
        String normalizedReportType = normalize(reportType);
        if (normalizedReportType == null) {
            return List.of();
        }

        return switch (normalizedReportType) {
            case "YEAR" -> List.of("YEAR");
            case "MONTH" -> List.of("YEAR", "MONTH");
            case "DAY" -> List.of("YEAR", "MONTH", "DAY");
            default -> List.of();
        };
    }

    private String resolveTimeFieldName(Map<String, String> fieldLookup, String canonicalFieldName) {
        for (String alias : TIME_FIELD_ALIASES.getOrDefault(canonicalFieldName, List.of(canonicalFieldName))) {
            String resolved = resolveFieldName(fieldLookup, alias);
            if (resolved != null) {
                return resolved;
            }
        }
        return null;
    }

    private String resolveFieldName(Map<String, String> fieldLookup, String fieldName) {
        if (fieldName == null) {
            return null;
        }
        return fieldLookup.get(fieldName.toLowerCase(Locale.ROOT));
    }

    private Map<String, String> buildFieldLookup(List<Map<String, Object>> rows) {
        LinkedHashMap<String, String> fieldLookup = new LinkedHashMap<>();
        rows.stream()
                .filter(Objects::nonNull)
                .flatMap(row -> row.keySet().stream())
                .filter(Objects::nonNull)
                .forEach(fieldName -> fieldLookup.putIfAbsent(fieldName.toLowerCase(Locale.ROOT), fieldName));
        return fieldLookup;
    }

    private String aggregateTypeOf(WareMapping mapping) {
        String aggregateType = normalize(mapping.getAggregateType());
        if (aggregateType == null && Boolean.TRUE.equals(mapping.getIsSummable())) {
            return AGGREGATE_SUM;
        }
        if (aggregateType == null || aggregateType.isBlank()) {
            return AGGREGATE_NONE;
        }
        Set<String> supportedTypes = new HashSet<>(Arrays.asList(
                AGGREGATE_SUM,
                AGGREGATE_LAST,
                AGGREGATE_FIRST,
                AGGREGATE_MAX,
                AGGREGATE_MIN,
                AGGREGATE_NONE
        ));
        return supportedTypes.contains(aggregateType) ? aggregateType : AGGREGATE_NONE;
    }

    private BigDecimal sum(List<Map<String, Object>> rows, String fieldName) {
        return rows.stream()
                .map(row -> findValueIgnoreCase(row, fieldName))
                .map(this::toBigDecimal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .stripTrailingZeros();
    }

    private Object max(List<Map<String, Object>> rows, String fieldName) {
        return numericAggregate(rows, fieldName, values -> values.stream().max(Comparator.naturalOrder()));
    }

    private Object min(List<Map<String, Object>> rows, String fieldName) {
        return numericAggregate(rows, fieldName, values -> values.stream().min(Comparator.naturalOrder()));
    }

    private Object numericAggregate(
            List<Map<String, Object>> rows,
            String fieldName,
            Function<List<BigDecimal>, Optional<BigDecimal>> aggregator
    ) {
        List<BigDecimal> values = rows.stream()
                .map(row -> findValueIgnoreCase(row, fieldName))
                .map(this::toBigDecimal)
                .filter(Objects::nonNull)
                .toList();

        return aggregator.apply(values)
                .map(BigDecimal::stripTrailingZeros)
                .orElse(null);
    }

    private Object findValueIgnoreCase(Map<String, Object> row, String fieldName) {
        if (row == null || fieldName == null) {
            return null;
        }

        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(fieldName)) {
                return entry.getValue();
            }
        }

        return null;
    }

    private boolean containsKeyIgnoreCase(Map<String, Object> row, String fieldName) {
        if (row == null || fieldName == null) {
            return false;
        }
        return row.keySet().stream().anyMatch(key -> key.equalsIgnoreCase(fieldName));
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return new BigDecimal(number.toString());
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return new BigDecimal(text.replace(",", "").trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private record GroupField(String configuredFieldName, String actualFieldName) {
    }
}
