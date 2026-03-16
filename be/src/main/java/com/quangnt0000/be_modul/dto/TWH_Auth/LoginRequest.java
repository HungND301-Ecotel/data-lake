package com.quangnt0000.be_modul.dto.TWH_Auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class LoginRequest {
    @NotBlank(message = "username is required")
    private String username;

    @NotBlank(message = "password is required")
    private String password;

    @JsonProperty("ttl_seconds")
    @Builder.Default
    private Integer ttlSeconds = 3600;
}
