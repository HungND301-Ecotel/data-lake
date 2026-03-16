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
public class TableItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int row;
    private int col;
    private String text;
    private int fontSize;
    private String fontName;
    private List<String> fontStyle;
    private String align;
    private String type;
    private String querySyntax;
    private String colSpan;
    private String rowSpan;
    private String border;

    @ManyToOne
    @JoinColumn(name = "table_id")
    private TableEntity table;
}
