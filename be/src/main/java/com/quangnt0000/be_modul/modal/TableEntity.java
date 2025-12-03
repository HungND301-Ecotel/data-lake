package com.quangnt0000.be_modul.modal;

import com.quangnt0000.be_modul.dto.TableItemDTO;
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
public class TableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;
    private String width;

    @OneToMany(mappedBy = "table", cascade = CascadeType.REMOVE)
    private List<TableItemEntity> columns;

    private String reportItemId;
}
