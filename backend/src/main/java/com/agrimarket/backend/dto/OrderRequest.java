package com.agrimarket.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderRequest {
    @NotNull
    private Long productId;

    @NotNull
    @Positive
    private Integer quantity;
}
