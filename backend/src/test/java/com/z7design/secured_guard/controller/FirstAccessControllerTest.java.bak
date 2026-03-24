package com.z7design.secured_guard.controller;

import com.z7design.secured_guard.dto.*;
import com.z7design.secured_guard.model.TwoFactorCode;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.UserStatus;
import com.z7design.secured_guard.repository.UserRepository;
import com.z7design.secured_guard.service.LogService;
import com.z7design.secured_guard.service.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FirstAccessController.class)
@AutoConfigureMockMvc(addFilters = false) // Desabilitar filtros de segurança para testes
class FirstAccessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private TwoFactorService twoFactorService;

    @MockBean
    private LogService logService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .password("encodedPassword")
                .whatsapp("5511999999999")
                .roles(new HashSet<>())
                .permissions(new HashSet<>())
                .groups(new HashSet<>())
                .status(UserStatus.ACTIVE)
                .active(true)
                .firstAccess(true)
                .twoFactorEnabled(false)
                .build();
    }

    @Test
    void testGetStatus_FirstAccess() throws Exception {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When & Then
        mockMvc.perform(get("/api/first-access/status")
                .principal(() -> "testuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstAccess").value(true))
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.whatsappNumber").value("5511999999999"));
    }

    @Test
    void testChangePassword_Success() throws Exception {
        // Given
        testUser.setPassword("$2a$10$encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123!", testUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("NewPass123!")).thenReturn("$2a$10$encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When & Then
        mockMvc.perform(post("/api/first-access/change-password")
                .principal(() -> "testuser")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "currentPassword": "OldPass123!",
                        "newPassword": "NewPass123!",
                        "confirmPassword": "NewPass123!"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());

        verify(userRepository).save(any(User.class));
        verify(logService).logUserActivity(anyString(), eq("FIRST_ACCESS_PASSWORD_CHANGE"), anyString());
    }

    @Test
    void testChangePassword_WrongCurrentPassword() throws Exception {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPassword", testUser.getPassword())).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/first-access/change-password")
                .principal(() -> "testuser")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "currentPassword": "WrongPassword",
                        "newPassword": "NewPass123!",
                        "confirmPassword": "NewPass123!"
                    }
                    """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Senha atual incorreta"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void testChangePassword_PasswordsDoNotMatch() throws Exception {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123!", testUser.getPassword())).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/first-access/change-password")
                .principal(() -> "testuser")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "currentPassword": "OldPass123!",
                        "newPassword": "NewPass123!",
                        "confirmPassword": "DifferentPass123!"
                    }
                    """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("As senhas não coincidem"));
    }

    @Test
    void testRequestTwoFactorCode_Success() throws Exception {
        // Given
        TwoFactorCode code = TwoFactorCode.builder()
                .code("123456")
                .user(testUser)
                .purpose("ACTIVATION")
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(twoFactorService.createCode(testUser, "ACTIVATION")).thenReturn(code);

        // When & Then
        mockMvc.perform(post("/api/first-access/request-2fa-code")
                .principal(() -> "testuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());

        verify(twoFactorService).createCode(testUser, "ACTIVATION");
    }

    @Test
    void testRequestTwoFactorCode_NoWhatsApp() throws Exception {
        // Given
        testUser.setWhatsapp(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When & Then
        mockMvc.perform(post("/api/first-access/request-2fa-code")
                .principal(() -> "testuser"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("WhatsApp não cadastrado. Entre em contato com o administrador."));

        verify(twoFactorService, never()).createCode(any(), anyString());
    }

    @Test
    void testActivateTwoFactor_Success() throws Exception {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(twoFactorService.validateCode(testUser, "123456", "ACTIVATION")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When & Then
        mockMvc.perform(post("/api/first-access/activate-2fa")
                .principal(() -> "testuser")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "code": "123456"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Autenticação de dois fatores ativada com sucesso!"));

        verify(userRepository).save(any(User.class));
        verify(logService).logUserActivity(anyString(), eq("TWO_FACTOR_ACTIVATED"), anyString());
    }

    @Test
    void testActivateTwoFactor_InvalidCode() throws Exception {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(twoFactorService.validateCode(testUser, "wrong-code", "ACTIVATION")).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/first-access/activate-2fa")
                .principal(() -> "testuser")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "code": "wrong-code"
                    }
                    """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Código inválido ou expirado"));

        verify(userRepository, never()).save(any());
    }
}

