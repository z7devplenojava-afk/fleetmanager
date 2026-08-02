package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import com.z7design.fleet_manager.model.enums.MeasurementStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class MeasurementBulletinDTOFromEntityTest {

    @Test
    void fromEntity_withClientAndUnit_populatesClientNameAndUnitName() {
        // Arrange
        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setName("Cliente Exemplo LTDA");

        Unit unit = new Unit();
        unit.setId(UUID.randomUUID());
        unit.setName("Unidade Central");

        Contract contract = new Contract();
        contract.setId(UUID.randomUUID());
        contract.setContractNumber("CTC-123");
        contract.setDescription("Serviços de vigilância patrimonial");

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setContractNumber("CTC-123");
        bulletin.setStatus(MeasurementStatus.PENDING);
        bulletin.setClient(client);
        bulletin.setUnit(unit);
        bulletin.setContract(contract);

        // Act
        MeasurementBulletinDTO dto = MeasurementBulletinDTO.fromEntity(bulletin);

        // Assert
        assertEquals(client.getId(), dto.getClientId());
        assertEquals("Cliente Exemplo LTDA", dto.getClientName());
        assertEquals(unit.getId(), dto.getUnitId());
        assertEquals("Unidade Central", dto.getUnitName());
        assertEquals(contract.getId(), dto.getContractId());
        assertEquals("Serviços de vigilância patrimonial", dto.getContractDescription());
        assertEquals("CTC-123", dto.getContractNumber());
        assertEquals(MeasurementStatus.PENDING, dto.getStatus());
    }

    @Test
    void fromEntity_withoutClientOrUnit_leavesClientNameAndUnitNameNull() {
        // Arrange
        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setContractNumber("CTC-456");

        // Act
        MeasurementBulletinDTO dto = MeasurementBulletinDTO.fromEntity(bulletin);

        // Assert
        assertNull(dto.getClientId());
        assertNull(dto.getClientName());
        assertNull(dto.getUnitId());
        assertNull(dto.getUnitName());
    }

    @Test
    void fromEntity_withItems_mapsItemFieldsAndNewKmAndTripFields() {
        // Arrange
        MeasurementBulletin bulletin = new MeasurementBulletin();

        MeasurementItem item = new MeasurementItem();
        item.setItemNumber(1);
        item.setCode("EXC-001");
        item.setDescription("Quilometragem excedente");
        item.setUnit("KM");
        item.setQuantity(new BigDecimal("100.00"));
        item.setUnitPrice(new BigDecimal("2.50"));
        item.setCategory(MeasurementCategory.EXCESS_KM);
        item.setInitialKm(new BigDecimal("1000.00"));
        item.setFinalKm(new BigDecimal("1200.00"));
        item.setFranchiseKm(new BigDecimal("100.00"));
        item.setDisregardedKm(new BigDecimal("0.00"));
        item.setKmConsiderado(new BigDecimal("200.00"));
        item.setKmExcedido(new BigDecimal("100.00"));
        item.setValorKmExcedido(new BigDecimal("250.00"));
        item.setDiaria(new BigDecimal("0.00"));
        item.setTripDate(LocalDate.of(2026, 7, 15));
        item.setRoute("Belo Horizonte -> Contagem");
        item.setVehicleType("Ônibus");
        item.setVehiclePlate("ABC-1234");
        item.calculateTotalValue();
        bulletin.addItem(item);

        // Act
        MeasurementBulletinDTO dto = MeasurementBulletinDTO.fromEntity(bulletin);

        // Assert
        assertNotNull(dto.getItems());
        assertEquals(1, dto.getItems().size());

        MeasurementItemDTO itemDto = dto.getItems().get(0);
        assertEquals(1, itemDto.getItemNumber());
        assertEquals("EXC-001", itemDto.getCode());
        assertEquals(new BigDecimal("100.00"), itemDto.getQuantity());
        assertEquals(new BigDecimal("2.50"), itemDto.getUnitPrice());
        assertEquals(new BigDecimal("200.00"), itemDto.getKmConsiderado());
        assertEquals(new BigDecimal("100.00"), itemDto.getKmExcedido());
        assertEquals(new BigDecimal("250.00"), itemDto.getValorKmExcedido());
        assertEquals(LocalDate.of(2026, 7, 15), itemDto.getTripDate());
        assertEquals("Belo Horizonte -> Contagem", itemDto.getRoute());
        assertEquals("Ônibus", itemDto.getVehicleType());
        assertEquals("ABC-1234", itemDto.getVehiclePlate());
        assertEquals(bulletin.getId(), itemDto.getBulletinId());
    }
}
