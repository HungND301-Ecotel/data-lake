package com.quangnt0000.be_modul.dto.SyncConnectionConfig;

import com.quangnt0000.be_modul.enums.DatabaseType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SyncConnectionConfigRequest {

    @NotEmpty
    private String host;

    @NotEmpty
    private String databaseName;

    @NotNull
    @Positive
    private Integer port;

    @NotEmpty
    private String username;

    @NotEmpty
    private String password;

    @NotNull
    @Positive
    private Integer timeoutSeconds;

    @NotEmpty
    private DatabaseType databaseType;
}
