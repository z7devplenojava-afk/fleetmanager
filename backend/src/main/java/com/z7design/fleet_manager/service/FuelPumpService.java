package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FuelDelivery;
import com.z7design.fleet_manager.model.FuelPump;
import com.z7design.fleet_manager.model.FuelPumpReading;
import com.z7design.fleet_manager.model.FuelTank;
import com.z7design.fleet_manager.repository.FuelDeliveryRepository;
import com.z7design.fleet_manager.repository.FuelPumpReadingRepository;
import com.z7design.fleet_manager.repository.FuelPumpRepository;
import com.z7design.fleet_manager.repository.FuelTankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FuelPumpService {

    private final FuelTankRepository fuelTankRepository;
    private final FuelPumpRepository fuelPumpRepository;
    private final FuelDeliveryRepository fuelDeliveryRepository;
    private final FuelPumpReadingRepository fuelPumpReadingRepository;

    // --- Tank Management ---

    public List<FuelTank> getTanks(UUID companyId) {
        return fuelTankRepository.findByCompanyId(companyId);
    }

    public FuelTank saveTank(FuelTank tank, UUID companyId) {
        tank.setCompanyId(companyId);
        if (tank.getCurrentLevel() == null) {
            tank.setCurrentLevel(BigDecimal.ZERO);
        }
        return fuelTankRepository.save(tank);
    }

    // --- Pump Management ---

    public List<FuelPump> getPumps(UUID companyId) {
        return fuelPumpRepository.findByCompanyId(companyId);
    }

    public FuelPump savePump(FuelPump pump, UUID companyId) {
        pump.setCompanyId(companyId);
        if (pump.getLastMeterReading() == null) {
            pump.setLastMeterReading(BigDecimal.ZERO);
        }
        return fuelPumpRepository.save(pump);
    }

    // --- Deliveries (Input) ---

    public List<FuelDelivery> getDeliveries(UUID companyId) {
        return fuelDeliveryRepository.findByCompanyId(companyId);
    }

    @Transactional
    public FuelDelivery recordDelivery(FuelDelivery delivery, UUID companyId) {
        delivery.setCompanyId(companyId);

        // Update Tank Level
        FuelTank tank = fuelTankRepository.findById(delivery.getFuelTank().getId())
                .orElseThrow(() -> new RuntimeException("Tanque não encontrado"));

        tank.setCurrentLevel(tank.getCurrentLevel().add(delivery.getLiters()));
        fuelTankRepository.save(tank);

        return fuelDeliveryRepository.save(delivery);
    }

    // --- Readings (Output) ---

    public List<FuelPumpReading> getReadings(UUID companyId) {
        return fuelPumpReadingRepository.findByCompanyId(companyId);
    }

    @Transactional
    public FuelPumpReading recordReading(FuelPumpReading reading, UUID companyId) {
        reading.setCompanyId(companyId);

        FuelPump pump = fuelPumpRepository.findById(reading.getFuelPump().getId())
                .orElseThrow(() -> new RuntimeException("Bomba não encontrada"));

        // Calculate total liters if not provided
        if (reading.getTotalLiters() == null) {
            reading.setTotalLiters(reading.getFinalValue().subtract(reading.getInitialValue()));
        }

        // Update Pump last reading
        pump.setLastMeterReading(reading.getFinalValue());
        fuelPumpRepository.save(pump);

        // Update Tank Level (Deduct)
        FuelTank tank = pump.getFuelTank();
        tank.setCurrentLevel(tank.getCurrentLevel().subtract(reading.getTotalLiters()));
        fuelTankRepository.save(tank);

        return fuelPumpReadingRepository.save(reading);
    }
}
