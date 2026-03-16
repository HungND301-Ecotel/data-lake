package com.quangnt0000.be_modul.modal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
public class ReportItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String type;
    private int index;

    @ManyToOne
    @JoinColumn(name = "report_id")
    private ReportEntity report;
}
