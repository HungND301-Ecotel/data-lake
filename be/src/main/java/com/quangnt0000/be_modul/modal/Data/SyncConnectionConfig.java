package com.quangnt0000.be_modul.modal.Data;

import com.quangnt0000.be_modul.enums.DatabaseType;
import com.quangnt0000.be_modul.modal.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "sync_connection_configs")
public class SyncConnectionConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    // IP hoặc host: ví dụ 118.70.151.69
    @Column(name = "host", nullable = false)
    private String host;

    // Tên database: ví dụ EFS_2022
    @Column(name = "database_name", nullable = false)
    private String databaseName;

    // Cổng: ví dụ 5000, 1433
    @Column(name = "port", nullable = false)
    private Integer port;

    // User: ví dụ sa
    @Column(name = "username", nullable = false)
    private String username;

    // Password DB ngoài
    @Column(name = "password", nullable = false)
    private String password;

    // Thời gian chờ
    @Column(name = "timeout_seconds")
    private Integer timeoutSeconds;

    // Trạng thái hoạt động
    @Column(name = "active")
    private Boolean active;

    // Loại DB nếu sau này cần: SQLSERVER, MYSQL, POSTGRES
    @Enumerated(EnumType.STRING)
    @Column(name = "database_type")
    private DatabaseType databaseType;
}
