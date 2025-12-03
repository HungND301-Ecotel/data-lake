package com.quangnt0000.be_modul.repository;

import com.quangnt0000.be_modul.modal.Data.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
}
