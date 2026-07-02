package com.agrimarket.backend.controller;

import com.agrimarket.backend.dto.OrderRequest;
import com.agrimarket.backend.model.Order;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest request, @AuthenticationPrincipal User user) {
        try {
            Order order = orderService.createOrder(request, user);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> payOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        try {
            String cardNumber = body.get("cardNumber");
            Order order = orderService.processPayment(id, cardNumber, user);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/consumer")
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<List<Order>> getConsumerOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getConsumerOrders(user.getId()));
    }

    @GetMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<List<Order>> getFarmerOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getFarmerOrders(user.getId()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal User user) {
        try {
            Order order = orderService.updateOrderStatus(id, status, user.getId());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
