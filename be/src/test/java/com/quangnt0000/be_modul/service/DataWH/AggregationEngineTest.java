package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AggregationEngineTest {
    private final AggregationEngine aggregationEngine = new AggregationEngine();

    @Test
    void aggregateSumsConfiguredMeasureFields() {
        List<Map<String, Object>> rows = List.of(
                Map.of("YEAR", 2026, "PRODUCT", "A", "AMOUNT", "10.5"),
                Map.of("YEAR", 2026, "PRODUCT", "A", "AMOUNT", 4.5)
        );

        List<Map<String, Object>> result = aggregationEngine.aggregate(
                rows,
                List.of(
                        mapping("PRODUCT", "DIMENSION", "NONE"),
                        mapping("AMOUNT", "MEASURE", "SUM")
                ),
                "YEAR"
        );

        assertThat(result).hasSize(1);
        assertThat((BigDecimal) result.get(0).get("AMOUNT")).isEqualByComparingTo("15");
    }

    @Test
    void aggregateLastUsesLatestRowAfterTimeSort() {
        List<Map<String, Object>> rows = List.of(
                Map.of("YEAR", 2026, "PERIOD", 2, "PRODUCT", "A", "STATUS", "new"),
                Map.of("YEAR", 2026, "PERIOD", 1, "PRODUCT", "A", "STATUS", "old")
        );

        List<Map<String, Object>> result = aggregationEngine.aggregate(
                rows,
                List.of(
                        mapping("PRODUCT", "DIMENSION", "NONE"),
                        mapping("STATUS", "MEASURE", "LAST")
                ),
                "YEAR"
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("STATUS", "new");
    }

    @Test
    void aggregateGroupsByConfiguredDimensionsAndReportTimeFields() {
        List<Map<String, Object>> rows = List.of(
                Map.of("YEAR", 2026, "PERIOD", 1, "PRODUCT", "A", "AMOUNT", 10),
                Map.of("YEAR", 2026, "PERIOD", 1, "PRODUCT", "B", "AMOUNT", 20),
                Map.of("YEAR", 2026, "PERIOD", 1, "PRODUCT", "A", "AMOUNT", 5)
        );

        List<Map<String, Object>> result = aggregationEngine.aggregate(
                rows,
                List.of(
                        mapping("PRODUCT", "DIMENSION", "NONE"),
                        mapping("AMOUNT", "MEASURE", "SUM")
                ),
                "MONTH"
        );

        assertThat(result).hasSize(2);
        assertThat(result)
                .anySatisfy(row -> {
                    assertThat(row).containsEntry("PRODUCT", "A");
                    assertThat((BigDecimal) row.get("AMOUNT")).isEqualByComparingTo("15");
                })
                .anySatisfy(row -> {
                    assertThat(row).containsEntry("PRODUCT", "B");
                    assertThat((BigDecimal) row.get("AMOUNT")).isEqualByComparingTo("20");
                });
    }

    private WareMapping mapping(String fieldName, String role, String aggregateType) {
        return WareMapping.builder()
                .fieldName(fieldName)
                .role(role)
                .aggregateType(aggregateType)
                .build();
    }
}
