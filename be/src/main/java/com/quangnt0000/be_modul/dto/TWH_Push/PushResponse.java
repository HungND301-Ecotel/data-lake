package com.quangnt0000.be_modul.dto.TWH_Push;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushResponse {
    private Integer inserted;

    private Integer updated;

    @JsonProperty("deleted_logged")
    private Integer deletedLogged;

    @JsonProperty("deleted_removed")
    private Integer deletedRemoved;
}
