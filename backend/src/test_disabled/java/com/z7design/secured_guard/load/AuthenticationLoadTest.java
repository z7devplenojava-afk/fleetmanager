package com.z7design.secured_guard.load;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.LoginRequest;
import com.z7design.secured_guard.dto.RegisterRequest;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.repository.UserRepository;
import com.z7design.secured_guard.model.enums.UserRole;
import com.z7design.secured_guard.model.enums.UserStatus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationLoadTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static final int NUM_CONCURRENT_USERS = 100;
    private static final int NUM_REQUESTS_PER_USER = 10;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // Create test users
        for (int i = 0; i < NUM_CONCURRENT_USERS; i++) {
            User user = User.builder()
                    .username("testuser" + i)
                    .email("test" + i + "@example.com")
                    .password("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG") // "password"
                    .name("Test User " + i)
                    .role(UserRole.VIGILANTE)
                    .status(UserStatus.ACTIVE)
                    .build();

            userRepository.save(user);
        }
    }

    @Test
    void testConcurrentLoginRequests() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_USERS);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        List<Integer> statusCodes = new ArrayList<>();

        for (int i = 0; i < NUM_CONCURRENT_USERS; i++) {
            final int userIndex = i;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    for (int j = 0; j < NUM_REQUESTS_PER_USER; j++) {
                        LoginRequest loginRequest = new LoginRequest(
                                "testuser" + userIndex,
                                "password"
                        );

                        MvcResult result = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn();

                        statusCodes.add(result.getResponse().getStatus());
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, executor);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);

        // Verify all requests were successful
        assertEquals(NUM_CONCURRENT_USERS * NUM_REQUESTS_PER_USER, statusCodes.size());
        statusCodes.forEach(statusCode -> assertEquals(200, statusCode));
    }

    @Test
    void testConcurrentRegisterRequests() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_USERS);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        List<Integer> statusCodes = new ArrayList<>();

        for (int i = 0; i < NUM_CONCURRENT_USERS; i++) {
            final int userIndex = i;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    RegisterRequest registerRequest = new RegisterRequest(
                            "newuser" + userIndex,
                            "new" + userIndex + "@example.com",
                            "password",
                            "New User " + userIndex,
                            UserRole.VIGILANTE
                    );

                    MvcResult result = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                            .andExpect(status().isOk())
                            .andReturn();

                    statusCodes.add(result.getResponse().getStatus());
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, executor);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);

        // Verify all requests were successful
        assertEquals(NUM_CONCURRENT_USERS, statusCodes.size());
        statusCodes.forEach(statusCode -> assertEquals(200, statusCode));
    }
} 