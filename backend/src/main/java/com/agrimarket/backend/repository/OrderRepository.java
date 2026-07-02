package com.agrimarket.backend.repository;

import com.agrimarket.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByConsumerId(Long consumerId);
    List<Order> findByProductFarmerId(Long farmerId);
}
