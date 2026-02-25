package com.quangnt0000.be_modul.dto.DataLake;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataLakeInsertRequest {
    private List<Map<String, Object>> data;
    private String source;
}
