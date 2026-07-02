package com.agrimarket.backend.service;

import com.agrimarket.backend.dto.ReviewRequest;
import com.agrimarket.backend.model.Product;
import com.agrimarket.backend.model.Review;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.repository.ProductRepository;
import com.agrimarket.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    public Review createReview(ReviewRequest request, User reviewer) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        Review review = Review.builder()
                .product(product)
                .reviewer(reviewer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByProduct(Long productId) {
        return reviewRepository.findByProductId(productId);
    }
}
