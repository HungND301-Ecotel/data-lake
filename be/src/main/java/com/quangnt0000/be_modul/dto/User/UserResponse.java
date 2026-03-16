package com.quangnt0000.be_modul.dto.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String role;
    private Boolean status;
}
