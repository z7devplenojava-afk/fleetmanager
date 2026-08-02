package com.z7design.secured_guard.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RoleFunctionalityServiceTest {

    private RoleFunctionalityService service;

    @BeforeEach
    void setUp() {
        service = new RoleFunctionalityService();
    }

    @Test
    void testGetFunctionalitiesByRole_SuperAdmin() {
        // Given
        List<String> roles = Arrays.asList("SUPER_ADMIN");

        // When
        Map<String, List<RoleFunctionalityService.Functionality>> result = service.getFunctionalitiesByRole(roles);

        // Then
        assertNotNull(result);
        assertTrue(result.containsKey("SUPER_ADMIN"));
        assertEquals(25, result.get("SUPER_ADMIN").size()); // SUPER_ADMIN tem 25 funcionalidades
    }

    @Test
    void testGetFunctionalitiesByRole_Admin() {
        // Given
        List<String> roles = Arrays.asList("ADMIN");

        // When
        Map<String, List<RoleFunctionalityService.Functionality>> result = service.getFunctionalitiesByRole(roles);

        // Then
        assertNotNull(result);
        assertTrue(result.containsKey("ADMIN"));
        assertEquals(14, result.get("ADMIN").size()); // ADMIN tem 14 funcionalidades
    }

    @Test
    void testGetFunctionalitiesByRole_Colaborador() {
        // Given
        List<String> roles = Arrays.asList("COLABORADOR");

        // When
        Map<String, List<RoleFunctionalityService.Functionality>> result = service.getFunctionalitiesByRole(roles);

        // Then
        assertNotNull(result);
        assertTrue(result.containsKey("COLABORADOR"));
        assertEquals(6, result.get("COLABORADOR").size()); // COLABORADOR tem 6 funcionalidades
    }

    @Test
    void testGetAllUserFunctionalities_SingleRole() {
        // Given
        List<String> roles = Arrays.asList("RH");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        assertNotNull(result);
        assertEquals(7, result.size()); // RH tem 7 funcionalidades
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("dashboard")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("employees")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("sst")));
    }

    @Test
    void testGetAllUserFunctionalities_MultipleRoles() {
        // Given
        List<String> roles = Arrays.asList("ADMIN", "RH");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        assertNotNull(result);
        // Deve ter funcionalidades únicas de ambos os roles (sem duplicatas)
        assertTrue(result.size() >= 14); // Pelo menos as do ADMIN
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("dashboard")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("users")));
    }

    @Test
    void testGetAllUserFunctionalities_UnknownRole() {
        // Given
        List<String> roles = Arrays.asList("UNKNOWN_ROLE");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size()); // Default tem 2 funcionalidades (dashboard + profile)
    }

    @Test
    void testFunctionality_HasRequiredFields() {
        // Given
        List<String> roles = Arrays.asList("SUPER_ADMIN");
        
        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        result.forEach(func -> {
            assertNotNull(func.getId());
            assertNotNull(func.getName());
            assertNotNull(func.getDescription());
            assertNotNull(func.getIcon());
            assertNotNull(func.getRoute());
            assertNotNull(func.getCategory());
            assertTrue(func.getOrder() > 0);
        });
    }

    @Test
    void testFunctionality_OrderIsCorrect() {
        // Given
        List<String> roles = Arrays.asList("SUPERVISOR");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        // Verificar se está ordenado
        for (int i = 1; i < result.size(); i++) {
            assertTrue(result.get(i).getOrder() >= result.get(i - 1).getOrder());
        }
    }

    @Test
    void testSupervisor_HasOnlyOperationalFunctionalities() {
        // Given
        List<String> roles = Arrays.asList("SUPERVISOR");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        assertEquals(7, result.size());
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("work-posts")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("schedules")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("occurrences")));
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("rounds")));
        // Não deve ter acesso a funcionalidades administrativas
        assertFalse(result.stream().anyMatch(f -> f.getId().equals("users")));
        assertFalse(result.stream().anyMatch(f -> f.getId().equals("settings")));
    }

    @Test
    void testColaborador_HasOnlyPersonalFunctionalities() {
        // Given
        List<String> roles = Arrays.asList("COLABORADOR");

        // When
        List<RoleFunctionalityService.Functionality> result = service.getAllUserFunctionalities(roles);

        // Then
        assertEquals(6, result.size());
        assertTrue(result.stream().anyMatch(f -> f.getId().equals("profile")));
        assertTrue(result.stream().anyMatch(f -> f.getCategory().equals("personal") || f.getCategory().equals("communication") || f.getCategory().equals("primary")));
        // Não deve ter acesso a funcionalidades administrativas
        assertFalse(result.stream().anyMatch(f -> f.getId().equals("employees")));
        assertFalse(result.stream().anyMatch(f -> f.getId().equals("users")));
    }
}

