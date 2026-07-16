package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.Data.SyncConnectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SyncConnectionConfigRepository extends JpaRepository<SyncConnectionConfig, String>, JpaSpecificationExecutor<SyncConnectionConfig> {

    boolean existsByHostAndPortAndDatabaseName(
            String host,
            Integer port,
            String databaseName
    );

    @Query("SELECT COUNT(s) > 0 FROM SyncConnectionConfig s " +
           "WHERE s.host = :host AND s.port = :port AND s.databaseName = :databaseName " +
           "AND (s.isDeleted IS NULL OR s.isDeleted <> 1)")
    boolean existsActiveConnection(
            @Param("host") String host,
            @Param("port") Integer port,
            @Param("databaseName") String databaseName
    );

    @Query("SELECT COUNT(s) > 0 FROM SyncConnectionConfig s " +
           "WHERE s.host = :host AND s.port = :port AND s.databaseName = :databaseName " +
           "AND s.id <> :id AND (s.isDeleted IS NULL OR s.isDeleted <> 1)")
    boolean existsActiveConnectionExcludingId(
            @Param("host") String host,
            @Param("port") Integer port,
            @Param("databaseName") String databaseName,
            @Param("id") String id
    );
}
