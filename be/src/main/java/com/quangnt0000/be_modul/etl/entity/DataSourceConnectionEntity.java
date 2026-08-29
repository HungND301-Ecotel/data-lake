package com.quangnt0000.be_modul.etl.entity;

import java.util.List;

import com.quangnt0000.be_modul.enums.DatabaseType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "data_source")
@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DataSourceConnectionEntity {
    @Id
    @Column(name = "id")
    private Long id;
    
    @Column(name = "database_name", nullable = false)
    private String databaseName;

    @Column(name = "host", nullable = false)
    private String host;

    @Column(name = "port", nullable = false)
    private Integer port;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "timeout_seconds")
    private Integer timeoutSeconds;

    @Column(name = "active")
    private Boolean active;

    @Enumerated(EnumType.STRING)
    @Column(name = "database_type")
    private DatabaseType databaseType;

    @OneToMany(mappedBy = "dataSource")
    private List<PipelineTaskConfigEntity> tasks;
}
