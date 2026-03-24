package com.z7design.fleet_manager.service;

import java.util.UUID;

import org.springframework.security.core.Authentication;

import com.z7design.fleet_manager.dto.AuthenticationRequest;
import com.z7design.fleet_manager.dto.AuthenticationResponse;
import com.z7design.fleet_manager.dto.RegisterRequest;
import com.z7design.fleet_manager.dto.RefreshTokenRequest;
import com.z7design.fleet_manager.model.User;

public interface AuthenticationService {
    AuthenticationResponse register(RegisterRequest request);
    AuthenticationResponse authenticate(AuthenticationRequest request);
    AuthenticationResponse refreshToken(RefreshTokenRequest request);
    User getCurrentUser(UUID userId);
    User getCurrentUser(Authentication authentication);
} 
