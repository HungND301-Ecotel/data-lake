package com.quangnt0000.be_modul.etl.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quangnt0000.be_modul.etl.entity.DataSourceConnectionEntity;


public interface DataSourceConnectionRepository extends JpaRepository<DataSourceConnectionEntity, Long>{
    
}
