package com.z7design.secured_guard.service;

import com.z7design.secured_guard.model.TwoFactorCode;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.repository.TwoFactorCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TwoFactorServiceTest {

    @Mock
    private TwoFactorCodeRepository twoFactorCodeRepository;

    @InjectMocks
    private TwoFactorService twoFactorService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
    }

    @Test
    void testGenerateCode_ShouldReturn6Digits() {
        // When
        String code = twoFactorService.generateCode();

        // Then
        assertNotNull(code);
        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"));
        int codeInt = Integer.parseInt(code);
        assertTrue(codeInt >= 100000 && codeInt <= 999999);
    }

    @Test
    void testCreateCode_Success() {
        // Given
        String destination = "+5511999999999";
        doNothing().when(twoFactorCodeRepository).expireAllUserCodes(testUser.getId());
        when(twoFactorCodeRepository.save(any(TwoFactorCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        TwoFactorCode result = twoFactorService.createCode(testUser, destination);

        // Then
        assertNotNull(result);
        assertEquals(testUser, result.getUser());
        assertEquals(destination, result.getDestination());
        assertEquals(6, result.getCode().length());
        assertFalse(result.getIsUsed());
        assertNotNull(result.getExpiresAt());
        
        verify(twoFactorCodeRepository).expireAllUserCodes(testUser.getId());
        verify(twoFactorCodeRepository).save(any(TwoFactorCode.class));
    }

    @Test
    void testCreateCode_InvalidatesOldCodes() {
        // Given
        String destination = "+5511999999999";
        doNothing().when(twoFactorCodeRepository).expireAllUserCodes(testUser.getId());
        when(twoFactorCodeRepository.save(any(TwoFactorCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        twoFactorService.createCode(testUser, destination);

        // Then
        verify(twoFactorCodeRepository).expireAllUserCodes(testUser.getId());
        verify(twoFactorCodeRepository).save(any(TwoFactorCode.class));
    }

    @Test
    void testValidateCode_ValidCode() {
        // Given
        TwoFactorCode validCode = TwoFactorCode.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .code("123456")
                .destination("+5511999999999")
                .build();

        when(twoFactorCodeRepository.findValidCode(
                eq(testUser.getId()), eq("123456"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validCode));
        when(twoFactorCodeRepository.save(any(TwoFactorCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        boolean result = twoFactorService.validateCode(testUser, "123456");

        // Then
        assertTrue(result);
        verify(twoFactorCodeRepository).save(validCode);
    }

    @Test
    void testValidateCode_InvalidCode() {
        // Given
        when(twoFactorCodeRepository.findValidCode(
                eq(testUser.getId()), eq("wrong-code"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        // When
        boolean result = twoFactorService.validateCode(testUser, "wrong-code");

        // Then
        assertFalse(result);
        verify(twoFactorCodeRepository, never()).save(any());
    }

    @Test
    void testValidateCode_ExpiredCode() {
        // Given - Como o código está expirado, o repository não retorna nada (query filtra por expiresAt)
        when(twoFactorCodeRepository.findValidCode(
                eq(testUser.getId()), eq("123456"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        // When
        boolean result = twoFactorService.validateCode(testUser, "123456");

        // Then
        assertFalse(result);
    }

    @Test
    void testValidateCode_AlreadyUsed() {
        // Given - Como o código está usado, o repository não retorna (query filtra por isUsed)
        when(twoFactorCodeRepository.findValidCode(
                eq(testUser.getId()), eq("123456"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        // When
        boolean result = twoFactorService.validateCode(testUser, "123456");

        // Then
        assertFalse(result);
    }

    @Test
    void testCleanupExpiredCodes() {
        // Given
        doNothing().when(twoFactorCodeRepository).deleteExpiredCodes(any(LocalDateTime.class));

        // When
        twoFactorService.cleanupExpiredCodes();

        // Then
        verify(twoFactorCodeRepository).deleteExpiredCodes(any(LocalDateTime.class));
    }
}

