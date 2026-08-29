package com.quangnt0000.be_modul.etl.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.quangnt0000.be_modul.etl.entity.EtlPipelineEntity;

import feign.Param;
import jakarta.persistence.LockModeType;


public interface EtlPipelineRepository extends JpaRepository<EtlPipelineEntity, Long>{

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM EtlPipelineEntity p WHERE p.id = :id")
    Optional<EtlPipelineEntity> findByIdForUpdate(@Param("id") Long id);
} 
