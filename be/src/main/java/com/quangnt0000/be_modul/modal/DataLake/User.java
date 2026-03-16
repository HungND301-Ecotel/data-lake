package com.quangnt0000.be_modul.modal.DataLake;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;
    private String role;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employeeId", nullable = false, unique = true)
    private Employee employee;

    @Builder.Default
    private Boolean status = true;
}
