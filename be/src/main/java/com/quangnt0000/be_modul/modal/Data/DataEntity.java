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
public class DataEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String mainTable;
    private String description;
    private boolean showIndex;
    private float weightIndex;
    private String fontName;
    private int fontSize;

    private String url;
    private String username;
    private String password;

    @OneToMany(mappedBy = "data", cascade = CascadeType.REMOVE)
    private List<SubEntity> subs;

    @OneToMany(mappedBy = "data", cascade = CascadeType.REMOVE)
    private List<FieldEntity> fields;

    @OneToMany(mappedBy = "data", cascade = CascadeType.REMOVE)
    private List<FilterEntity> filters;

    @OneToMany(mappedBy = "data", cascade = CascadeType.REMOVE)
    private List<OrderEntity> orders;

    private String reportItemId;
}
