package br.com.fleetmanager.service;

import java.util.UUID;

import org.springframework.security.core.Authentication;

import br.com.fleetmanager.dto.AuthenticationRequest;
import br.com.fleetmanager.dto.AuthenticationResponse;
import br.com.fleetmanager.dto.RegisterRequest;
import br.com.fleetmanager.dto.RefreshTokenRequest;
import br.com.fleetmanager.model.User;

public interface AuthenticationService {
    AuthenticationResponse register(RegisterRequest request);
    AuthenticationResponse authenticate(AuthenticationRequest request);
    AuthenticationResponse refreshToken(RefreshTokenRequest request);
    User getCurrentUser(UUID userId);
    User getCurrentUser(Authentication authentication);
} 