package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ContractRetentionDTO;
import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import com.z7design.fleet_manager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ContractRetentionServiceTest {

    private ContractRetentionRepository retentionRepository;
    private ClientRepository clientRepository;
    private ContractRepository contractRepository;
    private MeasurementBulletinRepository bulletinRepository;
    private UnitRepository unitRepository;
    private ContractRetentionService service;

    @BeforeEach
    void setUp() {
        retentionRepository = mock(ContractRetentionRepository.class);
        clientRepository = mock(ClientRepository.class);
        contractRepository = mock(ContractRepository.class);
        bulletinRepository = mock(MeasurementBulletinRepository.class);
        unitRepository = mock(UnitRepository.class);

        service = new ContractRetentionService(
                retentionRepository,
                clientRepository,
                contractRepository,
                bulletinRepository,
                unitRepository
        );
    }

    @Test
    @DisplayName("Deve calcular corretamente Valor Retenção (3%) e Valor a Faturar Líquido")
    void testCalculateValues() {
        // Measured: 10,000.00 | RMU Discount: 500.00 | Retention Rate: 3.00%
        // RetentionValue = 10,000 * 0.03 = 300.00
        // NetInvoicedValue = 10,000 - 500 - 300 = 9,200.00
        ContractRetention retention = new ContractRetention();
        retention.setMeasuredValue(new BigDecimal("10000.00"));
        retention.setRmuDiscount(new BigDecimal("500.00"));
        retention.setRetentionRate(new BigDecimal("3.00"));

        retention.calculateValues();

        assertEquals(new BigDecimal("300.00"), retention.getRetentionValue());
        assertEquals(new BigDecimal("9200.00"), retention.getNetInvoicedValue());
    }

    @Test
    @DisplayName("Deve criar retenção contratual e salvar via serviço")
    void testCreateRetention() {
        ContractRetentionDTO dto = new ContractRetentionDTO();
        dto.setMeasuredValue(new BigDecimal("5000.00"));
        dto.setRmuDiscount(new BigDecimal("100.00"));
        dto.setRetentionRate(new BigDecimal("3.00"));
        dto.setStatus(RetentionStatus.RETIDO);
        dto.setReferenceMonth("2026-08");

        when(retentionRepository.save(any(ContractRetention.class))).thenAnswer(invocation -> {
            ContractRetention entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        ContractRetentionDTO created = service.createRetention(dto);

        assertNotNull(created);
        assertEquals(new BigDecimal("150.00"), created.getRetentionValue());
        assertEquals(new BigDecimal("4750.00"), created.getNetInvoicedValue());
        assertEquals(RetentionStatus.RETIDO, created.getStatus());
    }

    @Test
    @DisplayName("Deve atualizar status para LIBERADO e registrar data de liberação")
    void testUpdateStatusToLiberado() {
        UUID id = UUID.randomUUID();
        ContractRetention existing = new ContractRetention();
        existing.setId(id);
        existing.setStatus(RetentionStatus.RETIDO);

        when(retentionRepository.findById(id)).thenReturn(Optional.of(existing));
        when(retentionRepository.save(any(ContractRetention.class))).thenAnswer(i -> i.getArgument(0));

        LocalDate releaseDate = LocalDate.of(2026, 8, 25);
        ContractRetentionDTO updated = service.updateStatus(id, RetentionStatus.LIBERADO, releaseDate);

        assertEquals(RetentionStatus.LIBERADO, updated.getStatus());
        assertEquals(releaseDate, updated.getActualReleaseDate());
    }
}
