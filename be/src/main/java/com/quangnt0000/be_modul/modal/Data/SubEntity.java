package com.quangnt0000.be_modul.modal.Data;

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
public class SubEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String tableName;
    private String joinType;
    private String joinOn;

    @ManyToOne
    @JoinColumn(name = "data_id")
    private DataEntity data;
}
