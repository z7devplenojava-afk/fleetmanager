package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.service.CompanyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyControllerTest {

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private CompanyController controller;

    private UUID companyId;
    private CompanyDTO sampleDTO;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();

        sampleDTO = new CompanyDTO();
        sampleDTO.setId(companyId);
        sampleDTO.setName("Empresa Teste");
        sampleDTO.setSigla("ET");
        sampleDTO.setCnpj("11.222.333/0001-44");
        sampleDTO.setStatus(CompanyStatus.ACTIVE);
    }

    // ════════════════════════════════════════════
    // GET /api/companies — getAllCompanies
    // ════════════════════════════════════════════

    @Test
    void testGetAllCompanies_ShouldReturnList() {
        when(companyService.getAllCompanies()).thenReturn(List.of(sampleDTO));

        ResponseEntity<List<CompanyDTO>> response = controller.getAllCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<CompanyDTO> body = response.getBody();
        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("Empresa Teste", body.get(0).getName());
    }

    @Test
    void testGetAllCompanies_ShouldReturnEmptyList() {
        when(companyService.getAllCompanies()).thenReturn(List.of());

        ResponseEntity<List<CompanyDTO>> response = controller.getAllCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<CompanyDTO> body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    @Test
    void testGetAllCompanies_ShouldHandleError() {
        when(companyService.getAllCompanies()).thenThrow(new RuntimeException("DB error"));

        ResponseEntity<List<CompanyDTO>> response = controller.getAllCompanies();

        // Controller catches Exception internally and returns empty list
        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<CompanyDTO> body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    // ════════════════════════════════════════════
    // GET /api/companies/search — searchCompanies
    // ════════════════════════════════════════════

    @Test
    void testSearchCompanies_ShouldReturnEmptyList() {
        // Controller currently returns empty list as stub
        ResponseEntity<Object> response = controller.searchCompanies("teste");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> body = (List<?>) response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    @Test
    void testSearchCompanies_ShouldReturnEmptyList_WithAnyQuery() {
        // Controller's search is currently a stub returning empty list
        ResponseEntity<Object> response = controller.searchCompanies("qualquer-query");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> body = (List<?>) response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    // ════════════════════════════════════════════
    // GET /api/companies/test — testCompanies
    // ════════════════════════════════════════════

    @Test
    void testTestCompanies_ShouldReturnMapWithCompanies() {
        when(companyService.getAllCompanies()).thenReturn(List.of(sampleDTO));

        ResponseEntity<Object> response = controller.testCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(1, body.get("count"));
        assertEquals("Teste de empresas funcionando", body.get("message"));
        List<?> companies = (List<?>) body.get("companies");
        assertEquals(1, companies.size());
    }

    @Test
    void testTestCompanies_ShouldReturnMapWithZeroCount() {
        when(companyService.getAllCompanies()).thenReturn(List.of());

        ResponseEntity<Object> response = controller.testCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(0, body.get("count"));
        assertEquals("Teste de empresas funcionando", body.get("message"));
        List<?> companies = (List<?>) body.get("companies");
        assertTrue(companies.isEmpty());
    }

    @Test
    void testTestCompanies_ShouldHandleError() {
        when(companyService.getAllCompanies()).thenThrow(new RuntimeException("Service error"));

        ResponseEntity<Object> response = controller.testCompanies();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("Service error", body.get("error"));
    }

    // ════════════════════════════════════════════
    // GET /api/companies/active — getActiveCompanies
    // ════════════════════════════════════════════

    @Test
    void testGetActiveCompanies_ShouldReturnList() {
        when(companyService.getActiveCompanies()).thenReturn(List.of(sampleDTO));

        ResponseEntity<List<CompanyDTO>> response = controller.getActiveCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<CompanyDTO> body = response.getBody();
        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("Empresa Teste", body.get(0).getName());
    }

    @Test
    void testGetActiveCompanies_ShouldReturnEmptyList() {
        when(companyService.getActiveCompanies()).thenReturn(List.of());

        ResponseEntity<List<CompanyDTO>> response = controller.getActiveCompanies();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<CompanyDTO> body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isEmpty());
    }

    @Test
    void testGetActiveCompanies_ShouldPropagateException() {
        when(companyService.getActiveCompanies())
                .thenThrow(new RuntimeException("Unexpected error"));

        // No try-catch in controller — exception should propagate
        assertThrows(RuntimeException.class, () -> controller.getActiveCompanies());
    }

    // ════════════════════════════════════════════
    // GET /api/companies/{id} — getCompanyById
    // ════════════════════════════════════════════

    @Test
    void testGetCompanyById_ShouldReturnCompany() {
        when(companyService.getCompanyById(companyId)).thenReturn(sampleDTO);

        ResponseEntity<CompanyDTO> response = controller.getCompanyById(companyId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        CompanyDTO body = response.getBody();
        assertNotNull(body);
        assertEquals(companyId, body.getId());
        assertEquals("Empresa Teste", body.getName());
    }

    @Test
    void testGetCompanyById_ShouldPropagateNotFound() {
        when(companyService.getCompanyById(companyId))
                .thenThrow(new ResourceNotFoundException("Empresa não encontrada"));

        assertThrows(ResourceNotFoundException.class, () -> controller.getCompanyById(companyId));
    }

    // ════════════════════════════════════════════
    // GET /api/companies/sigla/{sigla} — getCompanyBySigla
    // ════════════════════════════════════════════

    @Test
    void testGetCompanyBySigla_ShouldReturnCompany() {
        when(companyService.getCompanyBySigla("ET")).thenReturn(sampleDTO);

        ResponseEntity<CompanyDTO> response = controller.getCompanyBySigla("ET");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        CompanyDTO body = response.getBody();
        assertNotNull(body);
        assertEquals("ET", body.getSigla());
    }

    @Test
    void testGetCompanyBySigla_ShouldPropagateNotFound() {
        when(companyService.getCompanyBySigla("XX"))
                .thenThrow(new ResourceNotFoundException("Empresa não encontrada pela sigla: XX"));

        assertThrows(ResourceNotFoundException.class,
                () -> controller.getCompanyBySigla("XX"));
    }

    // ════════════════════════════════════════════
    // POST /api/companies — createCompany
    // ════════════════════════════════════════════

    @Test
    void testCreateCompany_ShouldReturnCreated() {
        when(companyService.createCompany(sampleDTO)).thenReturn(sampleDTO);

        ResponseEntity<CompanyDTO> response = controller.createCompany(sampleDTO);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        CompanyDTO body = response.getBody();
        assertNotNull(body);
        assertEquals("Empresa Teste", body.getName());
        verify(companyService).createCompany(sampleDTO);
    }

    @Test
    void testCreateCompany_ShouldPropagateIllegalArgument() {
        CompanyDTO invalidDTO = new CompanyDTO();
        invalidDTO.setSigla("ET");
        invalidDTO.setName("Empresa Duplicada");
        invalidDTO.setCnpj("11.222.333/0001-44");

        when(companyService.createCompany(invalidDTO))
                .thenThrow(new IllegalArgumentException("Já existe empresa com este CNPJ"));

        assertThrows(IllegalArgumentException.class,
                () -> controller.createCompany(invalidDTO));
    }

    // ════════════════════════════════════════════
    // PUT /api/companies/{id} — updateCompany
    // ════════════════════════════════════════════

    @Test
    void testUpdateCompany_ShouldReturnUpdated() {
        CompanyDTO updatedDTO = new CompanyDTO();
        updatedDTO.setId(companyId);
        updatedDTO.setName("Empresa Atualizada");
        updatedDTO.setSigla("EA");
        updatedDTO.setCnpj("11.222.333/0001-44");
        updatedDTO.setStatus(CompanyStatus.ACTIVE);

        when(companyService.updateCompany(companyId, updatedDTO)).thenReturn(updatedDTO);

        ResponseEntity<CompanyDTO> response = controller.updateCompany(companyId, updatedDTO);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        CompanyDTO body = response.getBody();
        assertNotNull(body);
        assertEquals("Empresa Atualizada", body.getName());
        verify(companyService).updateCompany(companyId, updatedDTO);
    }

    @Test
    void testUpdateCompany_ShouldPropagateNotFound() {
        UUID fakeId = UUID.randomUUID();
        CompanyDTO dto = new CompanyDTO();
        dto.setName("Inexistente");
        dto.setSigla("INEX");
        dto.setCnpj("99.999.999/0001-99");

        when(companyService.updateCompany(fakeId, dto))
                .thenThrow(new ResourceNotFoundException("Empresa não encontrada"));

        assertThrows(ResourceNotFoundException.class,
                () -> controller.updateCompany(fakeId, dto));
    }

    @Test
    void testUpdateCompany_ShouldPropagateConflict() {
        UUID id = UUID.randomUUID();
        CompanyDTO dto = new CompanyDTO();
        dto.setName("Conflito");
        dto.setSigla("CONF");
        dto.setCnpj("11.222.333/0001-44");

        when(companyService.updateCompany(id, dto))
                .thenThrow(new IllegalArgumentException("Já existe empresa com esta sigla"));

        assertThrows(IllegalArgumentException.class,
                () -> controller.updateCompany(id, dto));
    }

    // ════════════════════════════════════════════
    // DELETE /api/companies/{id} — deleteCompany
    // ════════════════════════════════════════════

    @Test
    void testDeleteCompany_ShouldReturnNoContent() {
        doNothing().when(companyService).deleteCompany(companyId);

        ResponseEntity<Void> response = controller.deleteCompany(companyId);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
        verify(companyService).deleteCompany(companyId);
    }

    @Test
    void testDeleteCompany_ShouldPropagateNotFound() {
        UUID fakeId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Empresa não encontrada"))
                .when(companyService).deleteCompany(fakeId);

        assertThrows(ResourceNotFoundException.class,
                () -> controller.deleteCompany(fakeId));
    }

    @Test
    void testDeleteCompany_ShouldPropagateHasEmployees() {
        doThrow(new IllegalArgumentException(
                "Não é possível excluir empresa com funcionarios associados"))
                .when(companyService).deleteCompany(companyId);

        assertThrows(IllegalArgumentException.class,
                () -> controller.deleteCompany(companyId));
    }
}
