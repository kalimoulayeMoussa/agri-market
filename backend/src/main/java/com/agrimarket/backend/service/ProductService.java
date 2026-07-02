package com.agrimarket.backend.service;

import com.agrimarket.backend.dto.ProductRequest;
import com.agrimarket.backend.model.Product;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public Product createProduct(ProductRequest request, User farmer) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .unit(request.getUnit())
                .quantity(request.getQuantity())
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .farmer(farmer)
                .build();
        return productRepository.save(product);
    }

    public Product updateProduct(Long productId, ProductRequest request, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce produit");
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setUnit(request.getUnit());
        product.setQuantity(request.getQuantity());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());
        product.setLatitude(request.getLatitude());
        product.setLongitude(request.getLongitude());

        return productRepository.save(product);
    }

    public void deleteProduct(Long productId, Long farmerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer ce produit");
        }

        productRepository.delete(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
    }

    public List<Product> getProductsByFarmer(Long farmerId) {
        return productRepository.findByFarmerId(farmerId);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> getNearbyProducts(double userLat, double userLon, double maxDistanceKm) {
        return productRepository.findAll().stream()
                .filter(product -> calculateDistance(userLat, userLon, product.getLatitude(), product.getLongitude()) <= maxDistanceKm)
                .sorted((p1, p2) -> Double.compare(
                        calculateDistance(userLat, userLon, p1.getLatitude(), p1.getLongitude()),
                        calculateDistance(userLat, userLon, p2.getLatitude(), p2.getLongitude())
                ))
                .collect(Collectors.toList());
    }

    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371; // Kilomètres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}
