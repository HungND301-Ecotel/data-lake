package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;

    public ResponseEntity<?> deleteOrderById(String orderId) {
        orderRepository.deleteById(orderId);
        return ResponseEntity.ok("Deleted order");
    }
}
