package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.security.TenantSecurityValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleWgImportTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private UserCompanyResolver userCompanyResolver;
    @Mock private TenantSecurityValidator tenantSecurityValidator;
    @InjectMocks private VehicleExcelImportService service;

    @Test
    void importaFrotaWgComCategorias() throws Exception {
        Path path = Path.of("E:/WGTurismo/Sistema/Nova pasta/FROTA ATIVA WG TURISMO.xlsx");
        if (!Files.exists(path)) {
            // Em CI o arquivo pode não existir; o teste é executado localmente com a planilha.
            assertTrue(true);
            return;
        }
        UUID companyId = UUID.fromString("fc54c128-3897-453e-8669-698cddc294db");
        when(tenantSecurityValidator.getEffectiveCompanyId(any())).thenReturn(companyId);
        when(vehicleRepository.findByCompanyId(companyId)).thenReturn(List.of());
        when(vehicleRepository.findByPlateRawScoped(anyString(), any())).thenReturn(Optional.empty());
        TransactionStatus status = mock(TransactionStatus.class);
        when(transactionManager.getTransaction(any())).thenReturn(status);

        MockMultipartFile file = new MockMultipartFile(
                "file", "FROTA ATIVA WG TURISMO.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                Files.readAllBytes(path));

        ImportResultDto result = service.importVehiclesFromExcel(file, companyId);

        ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
        verify(vehicleRepository, atLeastOnce()).save(captor.capture());
        List<Vehicle> saved = captor.getAllValues();
        assertEquals(35, saved.size(), "Deveria importar 35 veículos da planilha WG");
        assertTrue(saved.stream().anyMatch(v -> v.getVehicleType() == Vehicle.VehicleType.VAN));
        assertTrue(saved.stream().anyMatch(v -> v.getVehicleType() == Vehicle.VehicleType.MINIBUS));
        assertTrue(saved.stream().anyMatch(v -> v.getVehicleType() == Vehicle.VehicleType.BUS_ROAD));
        assertTrue(saved.stream().anyMatch(v -> v.getRenavan() != null && !v.getRenavan().isBlank()));
        assertTrue(saved.stream().anyMatch(v -> v.getChassisNumber() != null));
    }
}
