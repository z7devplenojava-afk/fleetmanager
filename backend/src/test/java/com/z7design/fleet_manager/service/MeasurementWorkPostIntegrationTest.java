package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MeasurementBulletinDTO;
import com.z7design.fleet_manager.dto.MeasurementItemDTO;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.MeasurementStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MeasurementWorkPostIntegrationTest {

    @Test
    @DisplayName("Deve mapear WorkPostId e WorkPostName corretamente no MeasurementBulletinDTO")
    void testWorkPostDtoMapping() {
        // Arrange
        WorkPost workPost = new WorkPost();
        workPost.setId(UUID.randomUUID());
        workPost.setName("Obra 01 - Matriz");

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setId(UUID.randomUUID());
        bulletin.setContractNumber("CTC-2026/001");
        bulletin.setStatus(MeasurementStatus.DRAFT);
        bulletin.setWorkPost(workPost);

        // Act
        MeasurementBulletinDTO dto = MeasurementBulletinDTO.fromEntity(bulletin);

        // Assert
        assertNotNull(dto);
        assertEquals(workPost.getId(), dto.getWorkPostId());
        assertEquals("Obra 01 - Matriz", dto.getWorkPostName());
    }

    @Test
    @DisplayName("Deve mapear observações no item de medição DTO")
    void testMeasurementItemObservationsMapping() {
        MeasurementItemDTO itemDto = new MeasurementItemDTO();
        itemDto.setCode("LOC-01");
        itemDto.setDescription("Veículo Locado com Motorista");
        itemDto.setObservations("02 MOTORISTAS ESCALA 12X36");
        itemDto.setUnitPrice(new BigDecimal("5000.00"));
        itemDto.setQuantity(new BigDecimal("1"));

        assertEquals("02 MOTORISTAS ESCALA 12X36", itemDto.getObservations());
    }

    @Test
    @DisplayName("Deve vincular Mediçao a Contas a Receber com Obra/Setor")
    void testAccountsReceivableMeasurementLinkage() {
        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setName("Empresa Contratante S.A.");

        WorkPost workPost = new WorkPost();
        workPost.setId(UUID.randomUUID());
        workPost.setName("Setor Norte - Operações");

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setId(UUID.randomUUID());
        bulletin.setContractNumber("CTC-999");
        bulletin.setClient(client);
        bulletin.setWorkPost(workPost);
        bulletin.setSubtotal(new BigDecimal("15000.00"));

        AccountsReceivable ar = new AccountsReceivable();
        ar.setMeasurement(bulletin);
        ar.setClient(client);
        ar.setMeasurementNumber(bulletin.getContractNumber());
        ar.setAmount(bulletin.getSubtotal());
        ar.setDescription("Faturamento da Medição - Contrato: " + bulletin.getContractNumber() + " - Obra/Setor: " + workPost.getName());

        assertEquals(bulletin.getId(), ar.getMeasurement().getId());
        assertTrue(ar.getDescription().contains("Setor Norte - Operações"));
        assertEquals(new BigDecimal("15000.00"), ar.getAmount());
    }
}
