package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.model.WorkJourneyConfig;
import com.z7design.fleet_manager.service.CompanyService;
import com.z7design.fleet_manager.service.WorkJourneyConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkJourneyConfigControllerTest {

    @Mock
    private WorkJourneyConfigService configService;

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private WorkJourneyConfigController controller;

    private UUID companyId;
    private UUID configId;
    private WorkJourneyConfig sampleConfig;
    private CompanyDTO sampleCompany;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        configId = UUID.randomUUID();

        sampleConfig = WorkJourneyConfig.builder()
                .id(configId)
                .companyId(companyId)
                .cargaHorariaDiaria(new BigDecimal("8.00"))
                .toleranciaAtrasoMin(10)
                .intervaloMin(60)
                .build();

        sampleCompany = new CompanyDTO();
        sampleCompany.setId(companyId);
        sampleCompany.setName("Empresa Teste");
        sampleCompany.setSigla("ET");
        sampleCompany.setCnpj("11.222.333/0001-44");
    }

    // ════════════════════════════════════════════
    // GET /api/work-journey-configs — findAll
    // ════════════════════════════════════════════

    @Test
    void testFindAll_ShouldReturnList() {
        when(configService.findAll()).thenReturn(List.of(sampleConfig));

        ResponseEntity<?> response = controller.findAll();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        List<?> data = (List<?>) body.get("data");
        assertEquals(1, data.size());
    }

    @Test
    void testFindAll_ShouldReturnEmptyList() {
        when(configService.findAll()).thenReturn(List.of());

        ResponseEntity<?> response = controller.findAll();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        List<?> data = (List<?>) body.get("data");
        assertTrue(data.isEmpty());
    }

    @Test
    void testFindAll_ShouldHandleError() {
        when(configService.findAll()).thenThrow(new RuntimeException("DB error"));

        ResponseEntity<?> response = controller.findAll();

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertFalse((Boolean) body.get("success"));
        assertEquals("DB error", body.get("error"));
    }

    // ════════════════════════════════════════════
    // GET /api/work-journey-configs/company/{companyId}
    // ════════════════════════════════════════════

    @Test
    void testFindByCompanyId_ShouldReturnConfig() {
        when(configService.findByCompanyId(companyId)).thenReturn(sampleConfig);

        ResponseEntity<?> response = controller.findByCompanyId(companyId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
    }

    @Test
    void testFindByCompanyId_ShouldCreateDefault_WhenNotExists() {
        WorkJourneyConfig defaultConfig = WorkJourneyConfig.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .build();
        when(configService.findByCompanyId(companyId)).thenReturn(defaultConfig);

        ResponseEntity<?> response = controller.findByCompanyId(companyId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
    }

    @Test
    void testFindByCompanyId_ShouldHandleError() {
        when(configService.findByCompanyId(companyId))
                .thenThrow(new RuntimeException("Company not found"));

        ResponseEntity<?> response = controller.findByCompanyId(companyId);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertFalse((Boolean) body.get("success"));
        assertEquals("Company not found", body.get("error"));
    }

    // ════════════════════════════════════════════
    // PUT /api/work-journey-configs/company/{companyId}
    // ════════════════════════════════════════════

    @Test
    void testSaveOrUpdate_ShouldUpdateConfig() {
        WorkJourneyConfig updatedConfig = WorkJourneyConfig.builder()
                .id(configId)
                .companyId(companyId)
                .cargaHorariaDiaria(new BigDecimal("7.00"))
                .toleranciaAtrasoMin(5)
                .build();

        Map<String, Object> updates = Map.of(
                "cargaHorariaDiaria", "7.00",
                "toleranciaAtrasoMin", "5"
        );

        when(configService.saveOrUpdate(eq(companyId), any())).thenReturn(updatedConfig);

        ResponseEntity<?> response = controller.saveOrUpdate(companyId, updates);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        assertEquals("Configuração salva com sucesso", body.get("message"));
        verify(configService).saveOrUpdate(eq(companyId), eq(updates));
    }

    @Test
    void testSaveOrUpdate_ShouldCreateNewConfig() {
        UUID newCompanyId = UUID.randomUUID();
        WorkJourneyConfig newConfig = WorkJourneyConfig.builder()
                .id(UUID.randomUUID())
                .companyId(newCompanyId)
                .cargaHorariaDiaria(new BigDecimal("6.00"))
                .intervaloMin(45)
                .build();

        Map<String, Object> updates = new java.util.HashMap<>();
        updates.put("cargaHorariaDiaria", "6.00");
        updates.put("intervaloMin", "45");

        when(configService.saveOrUpdate(eq(newCompanyId), any())).thenReturn(newConfig);

        ResponseEntity<?> response = controller.saveOrUpdate(newCompanyId, updates);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        verify(configService).saveOrUpdate(eq(newCompanyId), any());
    }

    @Test
    void testSaveOrUpdate_ShouldHandleError() {
        when(configService.saveOrUpdate(eq(companyId), any()))
                .thenThrow(new RuntimeException("Validation error"));

        ResponseEntity<?> response = controller.saveOrUpdate(
                companyId, Map.of("cargaHorariaDiaria", "8.00"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertFalse((Boolean) body.get("success"));
        assertEquals("Validation error", body.get("error"));
    }

    // ════════════════════════════════════════════
    // DELETE /api/work-journey-configs/{id}
    // ════════════════════════════════════════════

    @Test
    void testDelete_ShouldDeleteConfig() {
        ResponseEntity<?> response = controller.delete(configId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        assertEquals("Configuração excluída", body.get("message"));
        verify(configService).deleteById(configId);
    }

    @Test
    void testDelete_ShouldHandleError() {
        doThrow(new RuntimeException("Config not found"))
                .when(configService).deleteById(configId);

        ResponseEntity<?> response = controller.delete(configId);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertFalse((Boolean) body.get("success"));
        assertEquals("Config not found", body.get("error"));
    }

    // ════════════════════════════════════════════
    // GET /api/work-journey-configs/admin/companies-status
    // ════════════════════════════════════════════

    @Test
    void testGetCompaniesWithConfigStatus_ShouldReturnList() {
        when(companyService.getAllCompanies()).thenReturn(List.of(sampleCompany));
        when(configService.findAll()).thenReturn(List.of(sampleConfig));

        ResponseEntity<?> response = controller.getCompaniesWithConfigStatus();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue((Boolean) body.get("success"));
        List<?> data = (List<?>) body.get("data");
        assertEquals(1, data.size());
        Map<String, Object> entry = (Map<String, Object>) data.get(0);
        assertEquals("Empresa Teste", entry.get("name"));
        assertTrue((Boolean) entry.get("hasConfig"));
    }

    @Test
    void testGetCompaniesWithConfigStatus_ShouldShowNoConfig() {
        UUID newCompanyId = UUID.randomUUID();
        CompanyDTO companyWithoutConfig = new CompanyDTO();
        companyWithoutConfig.setId(newCompanyId);
        companyWithoutConfig.setName("Sem Config");
        companyWithoutConfig.setSigla("SC");

        when(companyService.getAllCompanies()).thenReturn(List.of(companyWithoutConfig));
        when(configService.findAll()).thenReturn(List.of(sampleConfig));

        ResponseEntity<?> response = controller.getCompaniesWithConfigStatus();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        List<?> data = (List<?>) body.get("data");
        assertEquals(1, data.size());
        Map<String, Object> entry = (Map<String, Object>) data.get(0);
        assertFalse((Boolean) entry.get("hasConfig"));
    }

    @Test
    void testGetCompaniesWithConfigStatus_ShouldHandleEmptyData() {
        when(companyService.getAllCompanies()).thenReturn(List.of());
        when(configService.findAll()).thenReturn(List.of());

        ResponseEntity<?> response = controller.getCompaniesWithConfigStatus();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        List<?> data = (List<?>) body.get("data");
        assertTrue(data.isEmpty());
    }

    @Test
    void testGetCompaniesWithConfigStatus_ShouldHandleError() {
        when(companyService.getAllCompanies())
                .thenThrow(new RuntimeException("Service unavailable"));

        ResponseEntity<?> response = controller.getCompaniesWithConfigStatus();

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertFalse((Boolean) body.get("success"));
        assertEquals("Service unavailable", body.get("error"));
    }
}
