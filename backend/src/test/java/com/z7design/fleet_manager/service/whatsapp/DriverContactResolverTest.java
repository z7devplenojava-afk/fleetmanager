package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriverContactResolverTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private UserRepository userRepository;

    private DriverContactResolver resolver;
    private UUID companyId;

    @BeforeEach
    void setUp() {
        resolver = new DriverContactResolver(employeeRepository, driverRepository, userRepository);
        companyId = UUID.randomUUID();
    }

    @Test
    @DisplayName("prioriza o funcionario responsavel pelo veiculo")
    void prioritizesResponsibleEmployee() {
        UUID employeeId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setId(employeeId);
        employee.setName("Joao Silva");
        employee.setPhone("(11) 99999-9999");

        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setResponsibleEmployeeId(employeeId);
        vehicle.setAssignedDriver("Outro Motorista");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .vehicle(vehicle)
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        Optional<DriverContact> contact = resolver.resolve(order);

        assertTrue(contact.isPresent());
        assertEquals("Joao Silva", contact.get().name());
        assertEquals("5511999999999", contact.get().phone());
        assertEquals("vehicle.responsibleEmployee", contact.get().source());
        verifyNoInteractions(driverRepository);
    }

    @Test
    @DisplayName("usa o nome do motorista atribuido quando nao ha funcionario responsavel")
    void usesAssignedDriverName() {
        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setAssignedDriver("Carlos Pereira");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .vehicle(vehicle)
                .build();

        Driver driver = Driver.builder()
                .id(UUID.randomUUID())
                .name("Carlos Pereira")
                .phone("(21) 98888-7777")
                .status("ATIVO")
                .companyId(companyId)
                .build();

        when(driverRepository.findByNameIgnoreCase("Carlos Pereira")).thenReturn(List.of(driver));

        Optional<DriverContact> contact = resolver.resolve(order);

        assertTrue(contact.isPresent());
        assertEquals("Carlos Pereira", contact.get().name());
        assertEquals("5521988887777", contact.get().phone());
        assertEquals("vehicle.assignedDriver", contact.get().source());
    }

    @Test
    @DisplayName("nao envia quando o nome do motorista e ambiguo")
    void blocksAmbiguousAssignedDriver() {
        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setAssignedDriver("Carlos");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .vehicle(vehicle)
                .requesterId(UUID.randomUUID())
                .build();

        Driver first = Driver.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .phone("11988887777")
                .status("ATIVO")
                .companyId(companyId)
                .build();
        Driver second = Driver.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .phone("11977776666")
                .status("ATIVO")
                .companyId(companyId)
                .build();

        when(driverRepository.findByNameIgnoreCase("Carlos")).thenReturn(List.of(first, second));

        Optional<DriverContact> contact = resolver.resolve(order);

        assertTrue(contact.isEmpty());
        verify(driverRepository, never()).findById(any());
    }

    @Test
    @DisplayName("ignora motorista inativo")
    void ignoresInactiveDriver() {
        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setAssignedDriver("Carlos");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .vehicle(vehicle)
                .build();

        Driver inactive = Driver.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .phone("11988887777")
                .status("INATIVO")
                .companyId(companyId)
                .build();

        when(driverRepository.findByNameIgnoreCase("Carlos")).thenReturn(List.of(inactive));

        Optional<DriverContact> contact = resolver.resolve(order);

        assertTrue(contact.isEmpty());
    }

    @Test
    @DisplayName("usa o solicitante como ultimo recurso")
    void fallsBackToRequester() {
        UUID requesterId = UUID.randomUUID();
        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .requesterId(requesterId)
                .build();

        Driver requester = Driver.builder()
                .id(requesterId)
                .name("Maria Souza")
                .phone("11966665555")
                .status("ATIVO")
                .companyId(companyId)
                .build();

        when(driverRepository.findById(requesterId)).thenReturn(Optional.of(requester));

        Optional<DriverContact> contact = resolver.resolve(order);

        assertTrue(contact.isPresent());
        assertEquals("Maria Souza", contact.get().name());
        assertEquals("5511966665555", contact.get().phone());
        assertEquals("workOrder.requester", contact.get().source());
    }

    @Test
    @DisplayName("retorna vazio quando nao encontra contato")
    void returnsEmptyWhenNoContact() {
        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .build();

        assertTrue(resolver.resolve(order).isEmpty());
        verifyNoInteractions(employeeRepository, driverRepository, userRepository);
    }
}
