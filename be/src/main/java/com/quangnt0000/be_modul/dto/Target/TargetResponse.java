package com.quangnt0000.be_modul.dto.Target;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.YearMonth;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class TargetResponse {
    String id;

    String name;
    String code;
    String unit;
    BigDecimal value;
    YearMonth month;

    String departmentId;
    String departmentName;

    String parentId;
}
