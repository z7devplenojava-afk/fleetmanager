package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.DriverDTO;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DriverAutoSyncTest {

    @Mock private DriverRepository driverRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserCompanyResolver userCompanyResolver;
    @Mock private JdbcTemplate jdbcTemplate;

    private DriverService service;

    @BeforeEach
    void setUp() {
        service = spy(new DriverService(
                driverRepository, employeeRepository, userRepository, userCompanyResolver, jdbcTemplate));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void listagemSincronizaMotoristasQuandoTabelaVazia() {
        UUID companyId = UUID.randomUUID();
        TenantContext.set(companyId);

        Driver sync = Driver.builder()
                .name("WESLEY CRISTIANO FERREIRA DE OLIVEIRA")
                .licenseNumber("12345678901")
                .status("ATIVO")
                .companyId(companyId)
                .build();

        when(driverRepository.findByCompanyId(companyId))
                .thenReturn(List.of(), List.of(sync));
        doNothing().when(service).syncDriversFromEmployees(companyId);

        List<DriverDTO> result = service.getAllDrivers();

        verify(service).syncDriversFromEmployees(companyId);
        assertEquals(1, result.size());
        assertEquals("WESLEY CRISTIANO FERREIRA DE OLIVEIRA", result.get(0).getName());
    }
}
