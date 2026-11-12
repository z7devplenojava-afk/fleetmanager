package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ChecklistItemRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VehicleGateChecklistRepository;
import com.z7design.fleet_manager.repository.VehicleInspectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FleetWorkOrderPdfServiceDriverTest {

    @Mock
    private FleetWorkOrderRepository repository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ChecklistItemRepository checklistItemRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VehicleGateChecklistRepository vehicleGateChecklistRepository;

    @Mock
    private VehicleInspectionRepository vehicleInspectionRepository;

    @Mock
    private StoredUploadService storedUploadService;

    private FleetWorkOrderPdfService service;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        service = new FleetWorkOrderPdfService(
                repository,
                companyRepository,
                checklistItemRepository,
                employeeRepository,
                userRepository,
                vehicleGateChecklistRepository,
                vehicleInspectionRepository,
                storedUploadService,
                templateEngine);
        ReflectionTestUtils.setField(service, "uploadDir", "uploads");
    }

    @Test
    @DisplayName("gera PDF do motorista sem dados financeiros")
    void generatesDriverPdf() {
        UUID companyId = UUID.randomUUID();
        UUID workOrderId = UUID.randomUUID();

        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setPlate("ABC1D23");
        vehicle.setBrand("Mercedes");
        vehicle.setModel("Sprinter");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(workOrderId)
                .companyId(companyId)
                .osNumber("OS-1")
                .vehicle(vehicle)
                .status(FleetWorkOrder.WorkOrderStatus.COMPLETED)
                .maintenanceType(FleetWorkOrder.MaintenanceType.CORRETIVA)
                .maintenancePerformed("Troca de óleo e filtros")
                .completionDate(LocalDateTime.now())
                .odometerIn(120000)
                .odometerOut(120010)
                .build();

        when(repository.findById(workOrderId)).thenReturn(Optional.of(order));
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        byte[] pdf = service.generateDriverPdf(workOrderId);

        assertNotNull(pdf);
        assertTrue(pdf.length > 1000);
        assertTrue(new String(pdf, 0, 4, StandardCharsets.US_ASCII).startsWith("%PDF"));
    }
}
