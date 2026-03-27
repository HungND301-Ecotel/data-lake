package com.quangnt0000.be_modul.dto.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserRequest {
    private String id;
    private String username;
    private String password;
    private String role;
    private String employeeId;
    private Boolean status;
}
