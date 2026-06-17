package com.quangnt0000.be_modul.dto.TargetReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class TargetReportRequest {
    String id;

    LocalDate date;

    String targetId;

    Integer productionOrderId;
    LocalDate productionDate;

    Integer totalDays;

    BigDecimal targetPerDay;

    Integer shiftDone;
    Integer shiftPlus;
    Integer shiftRemain;

    BigDecimal targetPerDayRemain;
    Integer performDone;

    Integer monthLyCumulative;
    BigDecimal donePercent;
}
