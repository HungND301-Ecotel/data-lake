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
public class DataDTO {
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
    private List<SubDTO> subs;
    private List<FieldDTO> fields;
    private List<FilterDTO> filters;
    private List<OrderDTO> orders;
    private List<GroupDTO> groups;
    private String groupAdvance;
    private String selectAdvance;
}