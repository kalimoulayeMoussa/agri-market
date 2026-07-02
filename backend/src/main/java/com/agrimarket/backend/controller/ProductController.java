package com.agrimarket.backend.controller;

import com.agrimarket.backend.dto.ProductRequest;
import com.agrimarket.backend.model.Product;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest request, @AuthenticationPrincipal User user) {
        try {
            Product product = productService.createProduct(request, user);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal User user) {
        try {
            Product product = productService.updateProduct(id, request, user.getId());
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            productService.deleteProduct(id, user.getId());
            return ResponseEntity.ok("Produit supprimé avec succès !");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/public")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/public/category")
    public ResponseEntity<List<Product>> getProductsByCategory(@RequestParam String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    @GetMapping("/public/nearby")
    public ResponseEntity<List<Product>> getNearbyProducts(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "50") double maxDistance) {
        return ResponseEntity.ok(productService.getNearbyProducts(latitude, longitude, maxDistance));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<List<Product>> getMyProducts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(productService.getProductsByFarmer(user.getId()));
    }
}
