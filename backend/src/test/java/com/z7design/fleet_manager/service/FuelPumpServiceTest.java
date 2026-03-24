package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FuelDelivery;
import com.z7design.fleet_manager.model.FuelPump;
import com.z7design.fleet_manager.model.FuelPumpReading;
import com.z7design.fleet_manager.model.FuelTank;
import com.z7design.fleet_manager.repository.FuelDeliveryRepository;
import com.z7design.fleet_manager.repository.FuelPumpReadingRepository;
import com.z7design.fleet_manager.repository.FuelPumpRepository;
import com.z7design.fleet_manager.repository.FuelTankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FuelPumpServiceTest {

    @Mock
    private FuelTankRepository fuelTankRepository;
    @Mock
    private FuelPumpRepository fuelPumpRepository;
    @Mock
    private FuelDeliveryRepository fuelDeliveryRepository;
    @Mock
    private FuelPumpReadingRepository fuelPumpReadingRepository;

    @InjectMocks
    private FuelPumpService fuelPumpService;

    private UUID companyId;
    private FuelTank tank;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        tank = FuelTank.builder()
                .id(UUID.randomUUID())
                .name("Test Tank")
                .capacity(new BigDecimal("10000.00"))
                .currentLevel(new BigDecimal("5000.00"))
                .companyId(companyId)
                .build();
    }

    @Test
    void testRecordDelivery_IncreasesTankLevel() {
        // Arrange
        FuelDelivery delivery = FuelDelivery.builder()
                .fuelTank(tank)
                .liters(new BigDecimal("2000.00"))
                .build();

        when(fuelTankRepository.findById(tank.getId())).thenReturn(Optional.of(tank));
        when(fuelTankRepository.save(any(FuelTank.class))).thenAnswer(i -> i.getArguments()[0]);
        when(fuelDeliveryRepository.save(any(FuelDelivery.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        FuelDelivery result = fuelPumpService.recordDelivery(delivery, companyId);

        // Assert
        assertEquals(new BigDecimal("7000.00"), tank.getCurrentLevel());
        verify(fuelTankRepository).save(tank);
        verify(fuelDeliveryRepository).save(delivery);
        assertEquals(companyId, result.getCompanyId());
    }

    @Test
    void testRecordReading_DeductsTankLevelAndUpdatesPump() {
        // Arrange
        FuelPump pump = FuelPump.builder()
                .id(UUID.randomUUID())
                .name("Test Pump")
                .fuelTank(tank)
                .lastMeterReading(new BigDecimal("1000.00"))
                .companyId(companyId)
                .build();

        FuelPumpReading reading = FuelPumpReading.builder()
                .fuelPump(pump)
                .initialValue(new BigDecimal("1000.00"))
                .finalValue(new BigDecimal("1200.00"))
                .build();

        when(fuelPumpRepository.findById(pump.getId())).thenReturn(Optional.of(pump));
        when(fuelPumpRepository.save(any(FuelPump.class))).thenAnswer(i -> i.getArguments()[0]);
        when(fuelTankRepository.save(any(FuelTank.class))).thenAnswer(i -> i.getArguments()[0]);
        when(fuelPumpReadingRepository.save(any(FuelPumpReading.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        FuelPumpReading result = fuelPumpService.recordReading(reading, companyId);

        // Assert
        assertEquals(new BigDecimal("200.00"), result.getTotalLiters());
        assertEquals(new BigDecimal("4800.00"), tank.getCurrentLevel());
        assertEquals(new BigDecimal("1200.00"), pump.getLastMeterReading());

        verify(fuelPumpRepository).save(pump);
        verify(fuelTankRepository).save(tank);
        verify(fuelPumpReadingRepository).save(reading);
    }
}
