package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.Data.SyncConnectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SyncConnectionConfigRepository extends JpaRepository<SyncConnectionConfig, String>, JpaSpecificationExecutor<SyncConnectionConfig> {

    boolean existsByHostAndPortAndDatabaseName(
            String host,
            Integer port,
            String databaseName
    );
}
