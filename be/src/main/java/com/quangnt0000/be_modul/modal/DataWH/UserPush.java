package com.quangnt0000.be_modul.modal.DataWH;

import com.quangnt0000.be_modul.modal.DataLake.Employee;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_push")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPush {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;
    @Column(name = "bukrs")
    private String bukrs;
}
