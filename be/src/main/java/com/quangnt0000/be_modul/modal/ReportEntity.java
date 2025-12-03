package com.quangnt0000.be_modul.modal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
public class ReportEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String pageType;
    private float marginTop;
    private float marginBottom;
    private float marginLeft;
    private float marginRight;

    @OneToMany(mappedBy = "report", cascade = CascadeType.REMOVE)
    private List<ReportItemEntity> items;
}
