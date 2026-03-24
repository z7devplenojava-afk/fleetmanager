package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.AuthenticationRequest;
import com.z7design.secured_guard.dto.AuthenticationResponse;
import com.z7design.secured_guard.dto.RegisterRequest;
import com.z7design.secured_guard.dto.RefreshTokenRequest;
import com.z7design.secured_guard.dto.LoginRequest;
import com.z7design.secured_guard.dto.UserResponse;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.UserRole;
import com.z7design.secured_guard.model.enums.UserStatus;
import com.z7design.secured_guard.service.AuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthenticationController.class)
public class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationService authenticationService;

    @Autowired
    private ObjectMapper objectMapper;

    private AuthenticationRequest authenticationRequest;
    private RegisterRequest registerRequest;
    private RefreshTokenRequest refreshTokenRequest;
    private AuthenticationResponse authenticationResponse;
    private User user;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        authenticationRequest = new AuthenticationRequest("testuser", "Password123!");
        registerRequest = new RegisterRequest("newuser", "new@example.com", "StrongPass1!", "New User", UserRole.VIGILANTE);
        refreshTokenRequest = new RefreshTokenRequest("mockRefreshToken");

        user = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .active(true)
                .build();

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        authenticationResponse = new AuthenticationResponse("mockToken", "mockRefreshToken", user);
    }

    @Test
    @DisplayName("Should authenticate user successfully")
    void shouldAuthenticateUser() throws Exception {
        when(authenticationService.authenticate(any(LoginRequest.class))).thenReturn(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"test@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId().toString()))
                .andExpect(jsonPath("$.username").value(user.getUsername()))
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.name").value(user.getName()))
                .andExpect(jsonPath("$.role").value(user.getRole().toString()));
    }

    @Test
    @DisplayName("Should return error for invalid credentials")
    void shouldReturnErrorForInvalidCredentials() throws Exception {
        when(authenticationService.authenticate(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should successfully register a new user")
    void shouldRegisterUserSuccessfully() throws Exception {
        when(authenticationService.register(any(RegisterRequest.class))).thenReturn(authenticationResponse);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockToken"))
                .andExpect(jsonPath("$.user.username").value("newuser"));
    }

    @Test
    @DisplayName("Should return 400 for invalid registration data")
    void shouldReturnBadRequestForInvalidRegistration() throws Exception {
        when(authenticationService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Invalid registration data."));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should successfully refresh token")
    void shouldRefreshTokenSuccessfully() throws Exception {
        when(authenticationService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(authenticationResponse);

        mockMvc.perform(post("/api/auth/refresh-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshTokenRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockToken"))
                .andExpect(jsonPath("$.refreshToken").value("mockRefreshToken"));
    }

    @Test
    @DisplayName("Should return 401 for invalid refresh token")
    void shouldReturnUnauthorizedForInvalidRefreshToken() throws Exception {
        when(authenticationService.refreshToken(any(RefreshTokenRequest.class)))
                .thenThrow(new RuntimeException("Invalid Refresh Token."));

        mockMvc.perform(post("/api/auth/refresh-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshTokenRequest)))
                .andExpect(status().isUnauthorized());
    }
} 