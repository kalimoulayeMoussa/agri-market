package com.agrimarket.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    @Positive
    private BigDecimal price;

    @NotBlank
    private String unit;

    @NotNull
    @Min(0)
    private Integer quantity;

    private String imageUrl;
    private String category;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;
}
