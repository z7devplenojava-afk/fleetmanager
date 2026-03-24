package com.z7design.secured_guard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.z7design.secured_guard.dto.AuthenticationRequest;
import com.z7design.secured_guard.dto.AuthenticationResponse;
import com.z7design.secured_guard.dto.RegisterRequest;
import com.z7design.secured_guard.dto.UserResponse;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.repository.UserRepository;
import com.z7design.secured_guard.security.JwtService;
import com.z7design.secured_guard.model.enums.UserRole;
import com.z7design.secured_guard.model.enums.UserStatus;
import com.z7design.secured_guard.service.impl.AuthenticationServiceImpl;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    private User testUser;
    private RegisterRequest registerRequest;
    private AuthenticationRequest authRequest;
    private String testToken;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .name("Test User")
                .role(UserRole.VIGILANTE)
                .status(UserStatus.ACTIVE)
                .build();

        registerRequest = RegisterRequest.builder()
                .username("newuser")
                .email("new@example.com")
                .password("password")
                .fullName("New User")
                .role(UserRole.VIGILANTE)
                .build();

        authRequest = new AuthenticationRequest("testuser", "password");
        testToken = "test.jwt.token";
    }

    @Test
    void whenRegisterWithValidData_thenReturnAuthResponse() {
        // Arrange
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any())).thenReturn(testUser);
        when(jwtService.generateToken(any())).thenReturn(testToken);

        // Act
        AuthenticationResponse response = authenticationService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertEquals(testToken, response.getToken());
        assertNotNull(response.getUser());
        assertEquals(testUser.getUsername(), response.getUser().getUsername());
        assertEquals(testUser.getEmail(), response.getUser().getEmail());
        assertEquals(testUser.getName(), response.getUser().getFullName());
        assertEquals(testUser.getRole(), response.getUser().getRole());
    }

    @Test
    void whenRegisterWithExistingUsername_thenThrowException() {
        // Arrange
        when(userRepository.existsByUsername(any())).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> authenticationService.register(registerRequest));
    }

    @Test
    void whenAuthenticateWithValidCredentials_thenReturnAuthResponse() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenReturn(new UsernamePasswordAuthenticationToken(testUser, null));
        when(userRepository.findByUsername(any())).thenReturn(java.util.Optional.of(testUser));
        when(jwtService.generateToken(any())).thenReturn(testToken);

        // Act
        AuthenticationResponse response = authenticationService.authenticate(authRequest);

        // Assert
        assertNotNull(response);
        assertEquals(testToken, response.getToken());
        assertNotNull(response.getUser());
        assertEquals(testUser.getUsername(), response.getUser().getUsername());
        assertEquals(testUser.getEmail(), response.getUser().getEmail());
        assertEquals(testUser.getName(), response.getUser().getFullName());
        assertEquals(testUser.getRole(), response.getUser().getRole());
    }

    @Test
    void whenAuthenticateWithInvalidCredentials_thenThrowException() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenThrow(new RuntimeException("Invalid credentials"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> authenticationService.authenticate(authRequest));
    }
} 