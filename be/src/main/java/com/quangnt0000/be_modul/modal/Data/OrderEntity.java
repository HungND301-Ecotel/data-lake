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
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;
    private String fieldKey;
    private String orderType;
    private boolean visible;
    private int index;

    private Boolean groupTotal;

    @ManyToOne
    @JoinColumn(name = "data_id")
    private DataEntity data;
}
