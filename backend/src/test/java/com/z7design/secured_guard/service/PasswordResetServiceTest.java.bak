package com.z7design.secured_guard.service;

import com.z7design.secured_guard.model.PasswordResetToken;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.repository.PasswordResetTokenRepository;
import com.z7design.secured_guard.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;
    private PasswordResetToken testToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setPassword("encodedPassword");

        testToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .token("test-token-123")
                .user(testUser)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
    }

    @Test
    void testCreatePasswordResetToken_Success() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        // When
        boolean result = passwordResetService.createPasswordResetToken("test@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).findByEmail("test@example.com");
        verify(tokenRepository).deleteByUserId(testUser.getId());
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testCreatePasswordResetToken_UserNotFound() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        boolean result = passwordResetService.createPasswordResetToken("nonexistent@example.com");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testResetPassword_Success() {
        // Given
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        boolean result = passwordResetService.resetPassword("test-token-123", "NewPassword123!");

        // Then
        assertTrue(result);
        verify(tokenRepository).findByToken("test-token-123");
        verify(passwordEncoder).encode("NewPassword123!");
        verify(userRepository).save(testUser);
        verify(tokenRepository).save(testToken);
        assertTrue(testToken.isUsed());
    }

    @Test
    void testResetPassword_TokenExpired() {
        // Given
        testToken.setExpiryDate(LocalDateTime.now().minusHours(1)); // Token expirado
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // When
        boolean result = passwordResetService.resetPassword("test-token-123", "NewPassword123!");

        // Then
        assertFalse(result);
        verify(tokenRepository).findByToken("test-token-123");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testResetPassword_TokenAlreadyUsed() {
        // Given
        testToken.setUsed(true);
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // When
        boolean result = passwordResetService.resetPassword("test-token-123", "NewPassword123!");

        // Then
        assertFalse(result);
        verify(tokenRepository).findByToken("test-token-123");
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void testResetPassword_TokenNotFound() {
        // Given
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        // When
        boolean result = passwordResetService.resetPassword("invalid-token", "NewPassword123!");

        // Then
        assertFalse(result);
        verify(tokenRepository).findByToken("invalid-token");
        verify(userRepository, never()).save(any());
    }

    @Test
    void testValidateToken_Valid() {
        // Given
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // When
        boolean result = passwordResetService.validateToken("test-token-123");

        // Then
        assertTrue(result);
        assertFalse(testToken.isUsed());
        assertFalse(testToken.isExpired());
    }

    @Test
    void testValidateToken_Expired() {
        // Given
        testToken.setExpiryDate(LocalDateTime.now().minusHours(1));
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // When
        boolean result = passwordResetService.validateToken("test-token-123");

        // Then
        assertFalse(result);
        assertTrue(testToken.isExpired());
    }

    @Test
    void testValidateToken_Used() {
        // Given
        testToken.setUsed(true);
        when(tokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // When
        boolean result = passwordResetService.validateToken("test-token-123");

        // Then
        assertFalse(result);
        assertTrue(testToken.isUsed());
    }
}

