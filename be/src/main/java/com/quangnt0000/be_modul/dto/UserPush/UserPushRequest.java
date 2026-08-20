package com.quangnt0000.be_modul.dto.UserPush;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPushRequest {
    private String username;
    private String password;
}
