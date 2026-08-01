package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.config.JwtConfig;
import com.z7design.fleet_manager.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtTenantFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtConfig jwtConfig;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private JwtTenantFilter jwtTenantFilter;

    private MockedStatic<TenantContext> tenantContextMock;
    private MockedStatic<SecurityContextHolder> securityContextHolderMock;

    @BeforeEach
    void setUp() {
        // Mock static SecurityContextHolder
        securityContextHolderMock = mockStatic(SecurityContextHolder.class);
        securityContextHolderMock.when(SecurityContextHolder::getContext).thenReturn(securityContext);

        // Setup TenantContext clearing logic manually or rely on its thread-local
        // nature?
        // Since TenantContext is static utility around ThreadLocal, we should verify
        // calls to it.
        // However, TenantContext methods are static. We need to mock static to verify
        // calls.
        tenantContextMock = mockStatic(TenantContext.class);
    }

    @AfterEach
    void tearDown() {
        securityContextHolderMock.close();
        tenantContextMock.close();
    }

    @Test
    void testDoFilterInternal_NormalUser_ExtractsFromToken() throws Exception {
        // Arrange
        String token = "valid.jwt.token";
        UUID companyId = UUID.randomUUID();

        when(jwtConfig.getHeader()).thenReturn("Authorization");
        when(jwtConfig.getPrefix()).thenReturn("Bearer");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractEmpresaId(token)).thenReturn(companyId);

        // Security Context (Normal User)
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .when(authentication).getAuthorities();

        // Act
        jwtTenantFilter.doFilterInternal(request, response, filterChain);

        // Assert
        tenantContextMock.verify(() -> TenantContext.set(companyId));
        tenantContextMock.verify(TenantContext::clear); // verify it clears finally
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_SuperAdmin_WithHeader_OverridesContext() throws Exception {
        // Arrange
        String token = "admin.jwt.token";
        UUID tokenCompanyId = UUID.randomUUID();
        UUID targetCompanyId = UUID.randomUUID();

        when(jwtConfig.getHeader()).thenReturn("Authorization");
        when(jwtConfig.getPrefix()).thenReturn("Bearer");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        // Token has original company
        when(jwtService.extractEmpresaId(token)).thenReturn(tokenCompanyId);

        // Header has target company
        when(request.getHeader("X-Target-Company-ID")).thenReturn(targetCompanyId.toString());

        // Security Context (Super Admin)
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")))
                .when(authentication).getAuthorities();

        // Act
        jwtTenantFilter.doFilterInternal(request, response, filterChain);

        // Assert
        // Should set targetCompanyId, NOT tokenCompanyId
        tenantContextMock.verify(() -> TenantContext.set(targetCompanyId));
        tenantContextMock.verify(() -> TenantContext.set(tokenCompanyId), never());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_SuperAdmin_NoHeader_UsesToken() throws Exception {
        // Arrange
        String token = "admin.jwt.token";
        UUID tokenCompanyId = UUID.randomUUID();

        when(jwtConfig.getHeader()).thenReturn("Authorization");
        when(jwtConfig.getPrefix()).thenReturn("Bearer");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        when(jwtService.extractEmpresaId(token)).thenReturn(tokenCompanyId);

        // Header is missing
        when(request.getHeader("X-Target-Company-ID")).thenReturn(null);

        // Security Context (Super Admin)
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")))
                .when(authentication).getAuthorities();

        // Act
        jwtTenantFilter.doFilterInternal(request, response, filterChain);

        // Assert
        tenantContextMock.verify(() -> TenantContext.set(tokenCompanyId));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_NormalUser_WithHeader_IgnoresHeader() throws Exception {
        // Arrange
        String token = "user.jwt.token";
        UUID tokenCompanyId = UUID.randomUUID();
        UUID targetCompanyId = UUID.randomUUID();

        when(jwtConfig.getHeader()).thenReturn("Authorization");
        when(jwtConfig.getPrefix()).thenReturn("Bearer");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        when(jwtService.extractEmpresaId(token)).thenReturn(tokenCompanyId);

        // Header attempts override
        when(request.getHeader("X-Target-Company-ID")).thenReturn(targetCompanyId.toString());

        // Security Context (Normal User)
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .when(authentication).getAuthorities();

        // Act
        jwtTenantFilter.doFilterInternal(request, response, filterChain);

        // Assert
        // Should set tokenCompanyId, ignoring targetCompanyId
        tenantContextMock.verify(() -> TenantContext.set(tokenCompanyId));
        tenantContextMock.verify(() -> TenantContext.set(targetCompanyId), never());
        verify(filterChain).doFilter(request, response);
    }
}
