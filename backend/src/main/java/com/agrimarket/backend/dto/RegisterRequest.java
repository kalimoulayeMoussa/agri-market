package com.agrimarket.backend.dto;

import com.agrimarket.backend.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String fullName;

    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;

    @NotNull
    private Role role;
}
