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
public class FieldEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String alias;
    private String fieldKey;
    private String dataType;
    private float weight;
    private boolean visible;
    private int index;
    private String groupName;

    private Integer alignment; //1,2,3

    @ManyToOne
    @JoinColumn(name = "data_id")
    private DataEntity data;
}
