package com.agrimarket.backend.controller;

import com.agrimarket.backend.dto.*;
import com.agrimarket.backend.model.User;
import com.agrimarket.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            return ResponseEntity.ok("Utilisateur enregistré avec succès ! ID: " + user.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest request) {
        try {
            JwtResponse jwtResponse = userService.login(request);
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur de connexion : e-mail ou mot de passe incorrect.");
        }
    }

    @PutMapping("/location")
    public ResponseEntity<?> updateLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @AuthenticationPrincipal User user) {
        try {
            User updatedUser = userService.updateLocation(user.getId(), latitude, longitude);
            return ResponseEntity.ok("Localisation mise à jour avec succès : " + updatedUser.getLatitude() + ", " + updatedUser.getLongitude());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body("Non authentifié");
        }
        return ResponseEntity.ok(user);
    }
}
