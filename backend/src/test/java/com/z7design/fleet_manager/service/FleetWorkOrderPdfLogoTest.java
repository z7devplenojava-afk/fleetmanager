package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ChecklistItemRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.GarageRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.VehicleGateChecklistRepository;
import com.z7design.fleet_manager.repository.VehicleInspectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FleetWorkOrderPdfLogoTest {

    @Mock private FleetWorkOrderRepository repository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ChecklistItemRepository checklistItemRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private UserRepository userRepository;
    @Mock private VehicleGateChecklistRepository vehicleGateChecklistRepository;
    @Mock private VehicleInspectionRepository vehicleInspectionRepository;
    @Mock private StoredUploadService storedUploadService;
    @Mock private ClientRepository clientRepository;
    @Mock private WorkPostRepository workPostRepository;
    @Mock private GarageRepository garageRepository;

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
                repository, companyRepository, checklistItemRepository, employeeRepository,
                userRepository, vehicleGateChecklistRepository, vehicleInspectionRepository,
                storedUploadService, templateEngine, clientRepository, workPostRepository, garageRepository);
        ReflectionTestUtils.setField(service, "uploadDir", "uploads");
    }

    @Test
    @DisplayName("PDF da OS embute a logo da empresa mesmo quando logoUrl é WebP")
    void embedsCompanyLogoFallbackToIcon() throws Exception {
        UUID companyId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Company company = new Company();
        company.setId(companyId);
        company.setName("WEG AGÊNCIA DE VIAGENS E TURISMO LTDA");
        company.setCnpj("04674482000116");
        // WebP: não decodificável pelo ImageIO; deve cair para o ícone JPG.
        company.setLogoUrl("/api/uploads/companies/logos/13bac661-10d0-4d48-8ecf-a07068f8d14e.webp");
        company.setIconUrl("/api/uploads/companies/logos/e89cf85b-a2f6-44c3-be0d-e6cf169eb149.jpg");

        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setPlate("KVD4D65");
        vehicle.setBrand("MPOLO");
        vehicle.setModel("IDEAL R");

        FleetWorkOrder order = FleetWorkOrder.builder()
                .id(orderId)
                .companyId(companyId)
                .osNumber("OS-TESTE-LOGO")
                .vehicle(vehicle)
                .status(FleetWorkOrder.WorkOrderStatus.OPEN)
                .maintenanceType(FleetWorkOrder.MaintenanceType.PREVENTIVA)
                .preventiveModel("MODELO_2")
                .maintenancePerformed("Teste")
                .requestDate(LocalDate.now())
                .stopDate(LocalDate.now())
                .odometerIn(0)
                .build();

        when(repository.findById(orderId)).thenReturn(Optional.of(order));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(checklistItemRepository.findByTemplateModelAndAtivoTrueOrderByOrdemAsc(anyString()))
                .thenReturn(List.of());
        when(employeeRepository.findById(any())).thenReturn(Optional.empty());
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        byte[] pdf = service.generatePdf(orderId, false, "MODELO_2");

        @SuppressWarnings("unchecked")
        Map<String, Object> data = ReflectionTestUtils.invokeMethod(service, "buildDataMap", order, false, "MODELO_2");
        String logoDataUri = (String) data.get("companyLogo");
        assertNotNull(logoDataUri, "companyLogo deve ser preenchido com o ícone JPG da empresa");
        assertTrue(logoDataUri.startsWith("data:image/png;base64,"),
                "companyLogo deve ser um data URI PNG válido: " + logoDataUri.substring(0, Math.min(40, logoDataUri.length())));

        assertNotNull(pdf);
        assertTrue(pdf.length > 1000);
        String content = new String(pdf, StandardCharsets.ISO_8859_1);
        assertTrue(content.contains("/Subtype /Image") || content.contains("/Subtype/Image"),
                "O PDF deve conter uma imagem (logomarca da empresa)");
    }
}
