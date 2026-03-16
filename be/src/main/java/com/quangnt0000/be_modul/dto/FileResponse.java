package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@NoArgsConstructor
@Builder
public class FileResponse {
    private String key;
    private String fileUrl;
    private String type;
}
