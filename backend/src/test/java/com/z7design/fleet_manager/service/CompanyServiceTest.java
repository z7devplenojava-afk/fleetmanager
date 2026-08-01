package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CompanyBrandingDTO;
import com.z7design.fleet_manager.dto.CompanyDTO;
import com.z7design.fleet_manager.dto.CompanyDefaultEPIDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.CompanyDefaultEPI;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyDefaultEPIRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyDefaultEPIRepository companyDefaultEPIRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CompanyService companyService;

    @Captor
    private ArgumentCaptor<Company> companyCaptor;

    @Captor
    private ArgumentCaptor<CompanyDefaultEPI> epiCaptor;

    private UUID companyId;
    private UUID companyId2;
    private Company company;
    private Company company2;
    private CompanyDTO companyDTO;
    private CompanyDTO companyDTO2;
    private User user;
    private Employee employee;
    private CompanyDefaultEPI defaultEpi;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        companyId2 = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);
        company.setName("Transportadora ABC");
        company.setSigla("ABC");
        company.setCnpj("12.345.678/0001-90");
        company.setDescription("Transportadora de cargas");
        company.setAddress("Rua A, 123");
        company.setStatus(CompanyStatus.ACTIVE);
        company.setLogoUrl("/logos/abc.png");

        company2 = new Company();
        company2.setId(companyId2);
        company2.setName("Viação XYZ");
        company2.setSigla("XYZ");
        company2.setCnpj("98.765.432/0001-10");
        company2.setDescription("Transporte de passageiros");
        company2.setStatus(CompanyStatus.ACTIVE);

        defaultEpi = new CompanyDefaultEPI();
        defaultEpi.setId(UUID.randomUUID());
        defaultEpi.setCompany(company);
        defaultEpi.setEpiName("Capacete");
        defaultEpi.setQuantity(1);
        defaultEpi.setOrderIndex(0);

        company.setDefaultEpis(List.of(defaultEpi));

        companyDTO = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC")
                .cnpj("12.345.678/0001-90")
                .description("Transportadora de cargas")
                .status(CompanyStatus.ACTIVE)
                .defaultEpis(List.of(
                        CompanyDefaultEPIDTO.builder()
                                .epiName("Capacete")
                                .quantity(1)
                                .build()
                ))
                .build();

        companyDTO2 = CompanyDTO.builder()
                .name("Viação XYZ")
                .sigla("XYZ")
                .cnpj("98.765.432/0001-10")
                .build();

        user = User.builder()
                .id(UUID.randomUUID())
                .username("joao")
                .name("João Teste")
                .build();

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("João Teste");
        employee.setCompanyId(companyId);
        employee.setUser(user);
    }

    // ───── getAllCompanies ─────

    @Test
    void testGetAllCompanies_ShouldReturnList() {
        // Arrange
        when(companyRepository.findAllWithDefaultEpis()).thenReturn(List.of(company, company2));

        // Act
        List<CompanyDTO> result = companyService.getAllCompanies();

        // Assert
        assertEquals(2, result.size());
        assertEquals("Transportadora ABC", result.get(0).getName());
        assertEquals("Viação XYZ", result.get(1).getName());
        verify(companyRepository).findAllWithDefaultEpis();
    }

    @Test
    void testGetAllCompanies_ShouldReturnEmptyList_WhenNoCompanies() {
        // Arrange
        when(companyRepository.findAllWithDefaultEpis()).thenReturn(Collections.emptyList());

        // Act
        List<CompanyDTO> result = companyService.getAllCompanies();

        // Assert
        assertTrue(result.isEmpty());
        verify(companyRepository).findAllWithDefaultEpis();
    }

    @Test
    void testGetAllCompanies_ShouldHandleRepositoryError() {
        // Arrange
        when(companyRepository.findAllWithDefaultEpis()).thenThrow(new RuntimeException("DB error"));

        // Act
        List<CompanyDTO> result = companyService.getAllCompanies();

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetAllCompanies_ShouldHandleCompanyWithNullFields() {
        // Arrange
        Company sparseCompany = new Company();
        sparseCompany.setId(UUID.randomUUID());
        sparseCompany.setName("Somente Nome");
        // Other fields remain null - fromEntity should still produce a valid DTO

        when(companyRepository.findAllWithDefaultEpis()).thenReturn(List.of(company, sparseCompany));

        // Act
        List<CompanyDTO> result = companyService.getAllCompanies();

        // Assert
        assertEquals(2, result.size());
        assertEquals("Somente Nome", result.get(1).getName());
        assertNull(result.get(1).getCnpj());
    }

    // ───── searchCompanies ─────

    @Test
    void testSearchCompanies_WithQuery_ShouldReturnFiltered() {
        // Arrange
        when(companyRepository.searchCompanies("ABC")).thenReturn(List.of(company));

        // Act
        List<CompanyDTO> result = companyService.searchCompanies("ABC");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Transportadora ABC", result.get(0).getName());
        verify(companyRepository).searchCompanies("ABC");
    }

    @Test
    void testSearchCompanies_WithEmptyQuery_ShouldReturnAllOrdered() {
        // Arrange
        when(companyRepository.findAllByOrderByNameAsc()).thenReturn(List.of(company, company2));

        // Act
        List<CompanyDTO> result = companyService.searchCompanies("");

        // Assert
        assertEquals(2, result.size());
        verify(companyRepository).findAllByOrderByNameAsc();
        verify(companyRepository, never()).searchCompanies(anyString());
    }

    @Test
    void testSearchCompanies_WithNullQuery_ShouldReturnAllOrdered() {
        // Arrange
        when(companyRepository.findAllByOrderByNameAsc()).thenReturn(List.of(company, company2));

        // Act
        List<CompanyDTO> result = companyService.searchCompanies(null);

        // Assert
        assertEquals(2, result.size());
        verify(companyRepository).findAllByOrderByNameAsc();
    }

    // ───── getCompanyById ─────

    @Test
    void testGetCompanyById_ShouldReturnCompany() {
        // Arrange
        when(companyRepository.findByIdWithDefaultEpis(companyId)).thenReturn(Optional.of(company));

        // Act
        CompanyDTO result = companyService.getCompanyById(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(companyId, result.getId());
        assertEquals("Transportadora ABC", result.getName());
        assertEquals(CompanyStatus.ACTIVE, result.getStatus());
        verify(companyRepository).findByIdWithDefaultEpis(companyId);
    }

    @Test
    void testGetCompanyById_ShouldThrowWhenNotFound() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(companyRepository.findByIdWithDefaultEpis(id)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> companyService.getCompanyById(id));
        assertTrue(ex.getMessage().contains(id.toString()));
    }

    // ───── getCompanyBySigla ─────

    @Test
    void testGetCompanyBySigla_ShouldReturnCompany() {
        // Arrange
        when(companyRepository.findBySigla("ABC")).thenReturn(Optional.of(company));

        // Act
        CompanyDTO result = companyService.getCompanyBySigla("ABC");

        // Assert
        assertNotNull(result);
        assertEquals("ABC", result.getSigla());
        assertEquals("Transportadora ABC", result.getName());
        verify(companyRepository).findBySigla("ABC");
    }

    @Test
    void testGetCompanyBySigla_ShouldThrowWhenNotFound() {
        // Arrange
        when(companyRepository.findBySigla("ZZZ")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> companyService.getCompanyBySigla("ZZZ"));
        assertTrue(ex.getMessage().contains("ZZZ"));
    }

    // ───── createCompany ─────

    @Test
    void testCreateCompany_ShouldCreateWithDefaultEpi() {
        // Arrange
        when(companyRepository.existsBySigla("ABC")).thenReturn(false);
        when(companyRepository.existsByCnpj("12.345.678/0001-90")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company saved = invocation.getArgument(0);
            saved.setId(companyId);
            return saved;
        });
        when(companyDefaultEPIRepository.save(any(CompanyDefaultEPI.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        CompanyDTO result = companyService.createCompany(companyDTO);

        // Assert
        assertNotNull(result);
        assertEquals("Transportadora ABC", result.getName());
        assertEquals(CompanyStatus.ACTIVE, result.getStatus());

        verify(companyRepository).existsBySigla("ABC");
        verify(companyRepository).existsByCnpj("12.345.678/0001-90");
        verify(companyRepository).save(any(Company.class));
        verify(companyDefaultEPIRepository).save(any(CompanyDefaultEPI.class));
    }

    @Test
    void testCreateCompany_ShouldThrowWhenSiglaExists() {
        // Arrange
        when(companyRepository.existsBySigla("ABC")).thenReturn(true);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> companyService.createCompany(companyDTO));
        assertTrue(ex.getMessage().contains("sigla"));
        verify(companyRepository, never()).save(any());
    }

    @Test
    void testCreateCompany_ShouldThrowWhenCnpjExists() {
        // Arrange
        when(companyRepository.existsBySigla("ABC")).thenReturn(false);
        when(companyRepository.existsByCnpj("12.345.678/0001-90")).thenReturn(true);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> companyService.createCompany(companyDTO));
        assertTrue(ex.getMessage().contains("CNPJ"));
        verify(companyRepository, never()).save(any());
    }

    @Test
    void testCreateCompany_ShouldDefaultToActive_WhenStatusNull() {
        // Arrange
        CompanyDTO dtoNoStatus = CompanyDTO.builder()
                .name("Nova Empresa")
                .sigla("NOV")
                .build();

        when(companyRepository.existsBySigla("NOV")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        Company savedCompany = new Company();
        savedCompany.setId(UUID.randomUUID());
        savedCompany.setName("Nova Empresa");
        savedCompany.setSigla("NOV");
        savedCompany.setStatus(CompanyStatus.ACTIVE);
        when(companyRepository.findById(any(UUID.class))).thenReturn(Optional.of(savedCompany));

        // Act
        CompanyDTO result = companyService.createCompany(dtoNoStatus);

        // Assert
        assertNotNull(result);
        assertEquals(CompanyStatus.ACTIVE, result.getStatus());
    }

    @Test
    void testCreateCompany_ShouldNotSaveDefaultEpis_WhenNotProvided() {
        // Arrange
        CompanyDTO dtoWithoutEpis = CompanyDTO.builder()
                .name("Sem EPI")
                .sigla("SEP")
                .build();

        when(companyRepository.existsBySigla("SEP")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        Company savedCompany = new Company();
        savedCompany.setId(UUID.randomUUID());
        savedCompany.setName("Sem EPI");
        savedCompany.setSigla("SEP");
        savedCompany.setStatus(CompanyStatus.ACTIVE);
        when(companyRepository.findById(any(UUID.class))).thenReturn(Optional.of(savedCompany));

        // Act
        companyService.createCompany(dtoWithoutEpis);

        // Assert
        verify(companyDefaultEPIRepository, never()).save(any(CompanyDefaultEPI.class));
    }

    @Test
    void testCreateCompany_ShouldNotValidateCnpj_WhenNotProvided() {
        // Arrange
        CompanyDTO dtoNoCnpj = CompanyDTO.builder()
                .name("Sem CNPJ")
                .sigla("SCP")
                .build();

        when(companyRepository.existsBySigla("SCP")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        Company savedCompany = new Company();
        savedCompany.setId(UUID.randomUUID());
        savedCompany.setName("Sem CNPJ");
        savedCompany.setSigla("SCP");
        savedCompany.setStatus(CompanyStatus.ACTIVE);
        when(companyRepository.findById(any(UUID.class))).thenReturn(Optional.of(savedCompany));

        // Act
        CompanyDTO result = companyService.createCompany(dtoNoCnpj);

        // Assert
        assertNotNull(result);
        verify(companyRepository, never()).existsByCnpj(anyString());
    }

    // ───── updateCompany ─────

    @Test
    void testUpdateCompany_ShouldUpdateAllFields() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC");
        existing.setCnpj("12.345.678/0001-90");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC Atualizada")
                .sigla("ABC")
                .description("Nova descrição")
                .cnpj("12.345.678/0001-90")
                .status(CompanyStatus.ACTIVE)
                .build();

        // Act
        CompanyDTO result = companyService.updateCompany(companyId, updateDto);

        // Assert
        assertNotNull(result);
        assertEquals("Transportadora ABC Atualizada", result.getName());
        assertEquals("Nova descrição", result.getDescription());
        verify(companyRepository).save(existing);
    }

    @Test
    void testUpdateCompany_ShouldThrowWhenNotFound() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(companyRepository.findById(id)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> companyService.updateCompany(id, companyDTO));
    }

    @Test
    void testUpdateCompany_ShouldThrowWhenSiglaConflict() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC_OLD");
        existing.setCnpj("12.345.678/0001-90");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.existsBySigla("ABC")).thenReturn(true);

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC") // different from existing sigla
                .cnpj("12.345.678/0001-90")
                .build();

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> companyService.updateCompany(companyId, updateDto));
        assertTrue(ex.getMessage().contains("sigla"));
    }

    @Test
    void testUpdateCompany_ShouldThrowWhenCnpjConflict() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC");
        existing.setCnpj("00.000.000/0000-00");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.existsByCnpj("12.345.678/0001-90")).thenReturn(true);

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC")
                .cnpj("12.345.678/0001-90") // different from existing CNPJ
                .build();

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> companyService.updateCompany(companyId, updateDto));
        assertTrue(ex.getMessage().contains("CNPJ"));
    }

    @Test
    void testUpdateCompany_ShouldUpdateEpis_WhenProvided() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC");
        existing.setCnpj("12.345.678/0001-90");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));
        when(companyDefaultEPIRepository.save(any(CompanyDefaultEPI.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC")
                .status(CompanyStatus.ACTIVE)
                .defaultEpis(List.of(
                        CompanyDefaultEPIDTO.builder()
                                .epiName("Luva")
                                .quantity(2)
                                .build()
                ))
                .build();

        // Act
        companyService.updateCompany(companyId, updateDto);

        // Assert
        verify(companyDefaultEPIRepository).deleteByCompanyId(companyId);
        verify(companyDefaultEPIRepository).save(any(CompanyDefaultEPI.class));
    }

    @Test
    void testUpdateCompany_ShouldNotUpdateEpis_WhenNotProvided() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC");
        existing.setCnpj("12.345.678/0001-90");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC")
                .status(CompanyStatus.ACTIVE)
                .build();

        // Act
        companyService.updateCompany(companyId, updateDto);

        // Assert
        verify(companyDefaultEPIRepository, never()).deleteByCompanyId(any());
        verify(companyDefaultEPIRepository, never()).save(any(CompanyDefaultEPI.class));
    }

    @Test
    void testUpdateCompany_ShouldNotValidateCnpj_WhenEmptyInDto() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Transportadora ABC");
        existing.setSigla("ABC");
        existing.setCnpj("12.345.678/0001-90");
        existing.setStatus(CompanyStatus.ACTIVE);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));

        CompanyDTO updateDto = CompanyDTO.builder()
                .name("Transportadora ABC")
                .sigla("ABC")
                .cnpj("")
                .status(CompanyStatus.ACTIVE)
                .build();

        // Act
        companyService.updateCompany(companyId, updateDto);

        // Assert
        verify(companyRepository, never()).existsByCnpj(anyString());
    }

    // ───── deleteCompany ─────

    @Test
    void testDeleteCompany_ShouldDelete() {
        // Arrange
        Company existing = new Company();
        existing.setId(companyId);
        existing.setEmployees(null); // No employees

        when(companyRepository.existsById(companyId)).thenReturn(true);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));
        doNothing().when(companyRepository).deleteById(companyId);

        // Act
        companyService.deleteCompany(companyId);

        // Assert
        verify(companyRepository).deleteById(companyId);
    }

    @Test
    void testDeleteCompany_ShouldThrowWhenNotFound() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(companyRepository.existsById(id)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> companyService.deleteCompany(id));
        verify(companyRepository, never()).deleteById(any());
    }

    @Test
    void testDeleteCompany_ShouldThrowWhenHasEmployees() {
        // Arrange
        Employee emp = new Employee();
        emp.setId(UUID.randomUUID());

        Company existing = new Company();
        existing.setId(companyId);
        existing.setEmployees(List.of(emp));

        when(companyRepository.existsById(companyId)).thenReturn(true);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(existing));

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> companyService.deleteCompany(companyId));
        assertTrue(ex.getMessage().contains("funcionarios"));
        verify(companyRepository, never()).deleteById(any());
    }

    // ───── getActiveCompanies ─────

    @Test
    void testGetActiveCompanies_ShouldReturnOnlyActive() {
        // Arrange
        when(companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE))
                .thenReturn(List.of(company, company2));

        // Act
        List<CompanyDTO> result = companyService.getActiveCompanies();

        // Assert
        assertEquals(2, result.size());
        verify(companyRepository).findByStatusOrderByNameAsc(CompanyStatus.ACTIVE);
    }

    // ───── getAccessibleCompaniesForUser ─────

    @Test
    void testGetAccessibleCompanies_ShouldReturnAllActive_WhenAnonymous() {
        // Arrange
        when(companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE))
                .thenReturn(List.of(company));

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser("anonymous");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Transportadora ABC", result.get(0).getNome());
        assertEquals("/logos/abc.png", result.get(0).getLogoUrl());
        verify(companyRepository).findByStatusOrderByNameAsc(CompanyStatus.ACTIVE);
        verifyNoInteractions(userRepository);
    }

    @Test
    void testGetAccessibleCompanies_ShouldReturnAllActive_WhenNullUsername() {
        // Arrange
        when(companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE))
                .thenReturn(List.of(company, company2));

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser(null);

        // Assert
        assertEquals(2, result.size());
    }

    @Test
    void testGetAccessibleCompanies_ShouldReturnAllActive_WhenEmptyUsername() {
        // Arrange
        when(companyRepository.findByStatusOrderByNameAsc(CompanyStatus.ACTIVE))
                .thenReturn(List.of(company, company2));

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser("");

        // Assert
        assertEquals(2, result.size());
    }

    @Test
    void testGetAccessibleCompanies_ShouldReturnEmpty_WhenUserNotFound() {
        // Arrange
        String username = "inexistente";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser(username);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetAccessibleCompanies_ShouldReturnEmpty_WhenUserHasNoEmployees() {
        // Arrange
        String username = "sem_empregado";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(employeeRepository.findByUser(user)).thenReturn(Collections.emptyList());

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser(username);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetAccessibleCompanies_ShouldReturnCompanies_WhenUserHasEmployees() {
        // Arrange
        String username = "joao";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(employeeRepository.findByUser(user)).thenReturn(List.of(employee));
        when(companyRepository.findByIdInAndStatus(
                java.util.Set.of(companyId), CompanyStatus.ACTIVE))
                .thenReturn(List.of(company));

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser(username);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Transportadora ABC", result.get(0).getNome());
        assertEquals("/logos/abc.png", result.get(0).getLogoUrl());
        assertEquals("ABC", result.get(0).getSigla());
        assertEquals("dark", result.get(0).getTheme()); // default when temaCor is null
    }

    @Test
    void testGetAccessibleCompanies_ShouldHandleEmployeesWithoutCompanyId() {
        // Arrange
        String username = "sem_company";
        Employee empNoCompany = new Employee();
        empNoCompany.setId(UUID.randomUUID());
        empNoCompany.setUser(user);
        empNoCompany.setCompanyId(null);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(employeeRepository.findByUser(user)).thenReturn(List.of(empNoCompany));

        // Act
        List<CompanyBrandingDTO> result = companyService.getAccessibleCompaniesForUser(username);

        // Assert
        assertTrue(result.isEmpty());
    }

    // ───── getCompanyBranding ─────

    @Test
    void testGetCompanyBranding_ShouldReturnBranding() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        CompanyBrandingDTO result = companyService.getCompanyBranding(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(companyId, result.getId());
        assertEquals("Transportadora ABC", result.getNome());
        assertEquals("/logos/abc.png", result.getLogoUrl());
        assertEquals("dark", result.getTheme());
        assertNotNull(result.getEnabledFeatures());
        assertTrue(result.getEnabledFeatures().size() >= 6); // all features enabled
    }

    @Test
    void testGetCompanyBranding_ShouldThrowWhenNotFound() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(companyRepository.findById(id)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> companyService.getCompanyBranding(id));
    }

    @Test
    void testGetCompanyBranding_ShouldUseCompanyTheme() {
        // Arrange
        company.setTemaCor("light");
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        // Act
        CompanyBrandingDTO result = companyService.getCompanyBranding(companyId);

        // Assert
        assertEquals("light", result.getTheme());
    }
}
