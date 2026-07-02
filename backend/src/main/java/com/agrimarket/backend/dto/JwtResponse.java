package com.agrimarket.backend.dto;

import com.agrimarket.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class JwtResponse {
    private String token;
    private Long id;
    private String email;
    private String fullName;
    private Role role;
}
