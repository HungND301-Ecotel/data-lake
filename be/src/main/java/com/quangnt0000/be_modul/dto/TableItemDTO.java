package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class TableItemDTO {
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
}
