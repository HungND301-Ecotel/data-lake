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
public class TextDTO {
    private String id;
    private String content;
    private int fontSize;
    private String fontName;
    private List<String> fontStyle;   // b-u-i
    private String align;   // right-center-left
}
