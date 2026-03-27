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
public class GroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String fieldKey;
    private String title;
    private Integer index;
    private Boolean visible;
    @ManyToOne
    @JoinColumn(name = "data_id")
    private DataEntity data;
}
