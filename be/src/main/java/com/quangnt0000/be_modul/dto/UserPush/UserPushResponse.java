package com.quangnt0000.be_modul.dto.UserPush;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPushResponse {
    private String id;
    private String username;
    private String passname;
}
