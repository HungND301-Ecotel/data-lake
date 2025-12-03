package com.quangnt0000.be_modul.modal.Data;

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
public class FilterEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String alias;
    private String fieldKey;
    private String operatorList;
    private String valueType;
    private String defaultValue;
    private String defaultOperator;

    @ManyToOne
    @JoinColumn(name = "data_id")
    private DataEntity data;
}
