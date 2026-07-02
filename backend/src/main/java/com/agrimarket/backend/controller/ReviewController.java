package com.agrimarket.backend.controller;

import com.agrimarket.backend.dto.ReviewRequest;
import com.agrimarket.backend.model.Review;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CONSUMER')")
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest request, @AuthenticationPrincipal User user) {
        try {
            Review review = reviewService.createReview(request, user);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId));
    }
}
