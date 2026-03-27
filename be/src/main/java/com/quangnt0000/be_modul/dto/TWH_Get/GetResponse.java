package com.quangnt0000.be_modul.dto.TWH_Get;

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
public class GetResponse {
    private Integer total;

    private List<Map<String, Object>> rows;
}
