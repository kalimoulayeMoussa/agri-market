package com.agrimarket.backend.service;

import com.agrimarket.backend.dto.OrderRequest;
import com.agrimarket.backend.model.*;
import com.agrimarket.backend.repository.OrderRepository;
import com.agrimarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Order createOrder(OrderRequest request, User consumer) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (product.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Quantité insuffisante en stock ! En stock : " + product.getQuantity());
        }

        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        Order order = Order.builder()
                .consumer(consumer)
                .product(product)
                .quantity(request.getQuantity())
                .totalPrice(total)
                .status("PENDING")
                .build();

        return orderRepository.save(order);
    }

    @Transactional
    public Order processPayment(Long orderId, String cardNumber, User consumer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (!order.getConsumer().getId().equals(consumer.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette commande");
        }

        if (!order.getStatus().equals("PENDING")) {
            throw new RuntimeException("Cette commande a déjà été traitée (Statut : " + order.getStatus() + ")");
        }

        // Simulation de paiement sécurisé (accepte cartes et mobile money)
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            throw new RuntimeException("Informations de paiement invalides. Le paiement a échoué.");
        }

        // Mise à jour du stock du produit
        Product product = order.getProduct();
        if (product.getQuantity() < order.getQuantity()) {
            throw new RuntimeException("Désolé, le stock est épuisé entre-temps !");
        }
        product.setQuantity(product.getQuantity() - order.getQuantity());
        productRepository.save(product);

        // Enregistrer la transaction fictive
        order.setStatus("PAID");
        order.setPaymentIntentId("mock_pay_" + UUID.randomUUID().toString().substring(0, 8));

        return orderRepository.save(order);
    }

    public List<Order> getConsumerOrders(Long consumerId) {
        return orderRepository.findByConsumerId(consumerId);
    }

    public List<Order> getFarmerOrders(Long farmerId) {
        return orderRepository.findByProductFarmerId(farmerId);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String status, Long farmerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if (!order.getProduct().getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier le statut de cette commande");
        }

        order.setStatus(status);
        return orderRepository.save(order);
    }
}
