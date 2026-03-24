package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.UserRole;
import com.z7design.secured_guard.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setPassword("hashedpassword"); // Password should be hashed in a real scenario
        user.setRole(UserRole.VIGILANTE);
    }

    @Test
    @DisplayName("Should return all users")
    void shouldFindAllUsers() throws Exception {
        when(userService.findAll()).thenReturn(Collections.singletonList(user));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(userId.toString()))
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    @DisplayName("Should find user by ID successfully")
    void shouldFindUserByIdSuccessfully() throws Exception {
        when(userService.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()));
    }

    @Test
    @DisplayName("Should return 404 when user by ID not found")
    void shouldReturnNotFoundWhenUserByIdNotFound() throws Exception {
        when(userService.findById(any(UUID.class))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should create a new user successfully")
    void shouldCreateUserSuccessfully() throws Exception {
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setEmail("new@example.com");
        newUser.setFullName("New User");
        newUser.setPassword("newhashedpass");
        newUser.setRole(UserRole.GESTOR);

        when(userService.create(any(User.class))).thenReturn(newUser);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    @DisplayName("Should return 400 for invalid create user argument")
    void shouldReturnBadRequestForInvalidCreateUserArgument() throws Exception {
        when(userService.create(any(User.class)))
                .thenThrow(new IllegalArgumentException("Email already registered"));

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email already registered"));
    }

    @Test
    @DisplayName("Should return 500 for generic error on create user")
    void shouldReturnInternalServerErrorForGenericCreateUserError() throws Exception {
        when(userService.create(any(User.class)))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("An error occurred: Database error"));
    }

    @Test
    @DisplayName("Should update an existing user successfully")
    void shouldUpdateUserSuccessfully() throws Exception {
        User updatedUser = new User();
        updatedUser.setId(userId);
        updatedUser.setUsername("updateduser");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setFullName("Updated User");
        updatedUser.setPassword("newhashedpass");
        updatedUser.setRole(UserRole.SUPERVISOR);

        when(userService.update(eq(userId), any(User.class))).thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("updateduser"));
    }

    @Test
    @DisplayName("Should return 400 for invalid update user argument")
    void shouldReturnBadRequestForInvalidUpdateUserArgument() throws Exception {
        when(userService.update(eq(userId), any(User.class)))
                .thenThrow(new IllegalArgumentException("Email already registered"));

        mockMvc.perform(put("/api/users/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email already registered"));
    }

    @Test
    @DisplayName("Should return 404 when user to update not found")
    void shouldReturnNotFoundWhenUserToUpdateNotFound() throws Exception {
        when(userService.update(any(UUID.class), any(User.class)))
                .thenThrow(new RuntimeException("User not found"));

        mockMvc.perform(put("/api/users/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 500 for generic error on update user")
    void shouldReturnInternalServerErrorForGenericUpdateUserError() throws Exception {
        when(userService.update(eq(userId), any(User.class)))
                .thenThrow(new Exception("Service error"));

        mockMvc.perform(put("/api/users/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("An error occurred: Service error"));
    }

    @Test
    @DisplayName("Should delete a user successfully")
    void shouldDeleteUserSuccessfully() throws Exception {
        doNothing().when(userService).delete(userId);

        mockMvc.perform(delete("/api/users/{id}", userId))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should return 404 when user to delete not found")
    void shouldReturnNotFoundWhenUserToDeleteNotFound() throws Exception {
        doThrow(new RuntimeException("User not found")).when(userService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/users/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }
} 