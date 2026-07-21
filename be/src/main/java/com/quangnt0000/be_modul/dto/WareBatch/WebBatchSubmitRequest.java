package com.quangnt0000.be_modul.dto.WareBatch;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebBatchSubmitRequest {
    @NotNull(message = "templateId không được để trống")
    private Integer wareTemplateId;

    private String name;
    private String description;
    private Integer reportYear;
    private Integer reportMonth;
    private Integer reportDay;

    // Map chứa dữ liệu của các ô CELL cố định (Key: fieldName hoặc cellAddress, Value: giá trị)
    private Map<String, Object> cellData;

    // Danh sách các dòng dữ liệu ROW động
    private List<WebDataRowDto> rows;
}
