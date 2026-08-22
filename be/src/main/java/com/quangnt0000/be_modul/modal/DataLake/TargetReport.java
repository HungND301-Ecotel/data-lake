package com.quangnt0000.be_modul.modal.DataLake;

import jakarta.persistence.*;
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
@Entity
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class TargetReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    LocalDate date;

    @ManyToOne
    @JoinColumn(name = "target_id")
    private Target target;

    Integer productionOrderId;
    LocalDate productionDate;

    Integer totalDays;

    BigDecimal targetPerDay;

    Integer shiftDone;
    Integer shiftPlus;
    Integer shiftRemain;

    BigDecimal targetPerDayRemain;
    BigDecimal performDone;

    BigDecimal monthLyCumulative;
    BigDecimal donePercent;

    @Builder.Default
    Boolean deleted = false;
}
