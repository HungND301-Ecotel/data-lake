package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @DeleteMapping("/{order-id}")
    public ResponseEntity<?> deleteOrderById(@PathVariable("order-id") String orderId) {
        return orderService.deleteOrderById(orderId);
    }
}
