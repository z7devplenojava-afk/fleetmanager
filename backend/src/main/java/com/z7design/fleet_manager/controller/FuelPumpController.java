package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FuelDeliveryDTO;
import com.z7design.fleet_manager.dto.FuelPumpDTO;
import com.z7design.fleet_manager.dto.FuelPumpReadingDTO;
import com.z7design.fleet_manager.dto.FuelTankDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.service.FuelPumpService;
import com.z7design.fleet_manager.service.UserCompanyResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fuel-infra")
@RequiredArgsConstructor
@Slf4j
public class FuelPumpController {

    private final FuelPumpService fuelPumpService;
    private final UserCompanyResolver userCompanyResolver;
    private final UserRepository userRepository;

    @GetMapping("/tanks")
    public ResponseEntity<List<FuelTankDTO>> getTanks(Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        List<FuelTankDTO> dtos = fuelPumpService.getTanks(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/tanks")
    public ResponseEntity<FuelTankDTO> createTank(@RequestBody FuelTankDTO dto, Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        FuelTank tank = FuelTank.builder()
                .name(dto.getName())
                .capacity(dto.getCapacity())
                .currentLevel(dto.getCurrentLevel())
                .fuelType(dto.getFuelType())
                .garage(dto.getGarageId() != null ? Garage.builder().id(dto.getGarageId()).build() : null)
                .build();
        return ResponseEntity.ok(convertToDTO(fuelPumpService.saveTank(tank, companyId)));
    }

    @GetMapping("/pumps")
    public ResponseEntity<List<FuelPumpDTO>> getPumps(Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        List<FuelPumpDTO> dtos = fuelPumpService.getPumps(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/pumps")
    public ResponseEntity<FuelPumpDTO> createPump(@RequestBody FuelPumpDTO dto, Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        FuelPump pump = FuelPump.builder()
                .name(dto.getName())
                .fuelTank(FuelTank.builder().id(dto.getFuelTankId()).build())
                .lastMeterReading(dto.getLastMeterReading())
                .garage(dto.getGarageId() != null ? Garage.builder().id(dto.getGarageId()).build() : null)
                .build();
        return ResponseEntity.ok(convertToDTO(fuelPumpService.savePump(pump, companyId)));
    }

    @GetMapping("/deliveries")
    public ResponseEntity<List<FuelDeliveryDTO>> getDeliveries(Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        List<FuelDeliveryDTO> dtos = fuelPumpService.getDeliveries(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/deliveries")
    public ResponseEntity<FuelDeliveryDTO> recordDelivery(@RequestBody FuelDeliveryDTO dto,
            Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        FuelDelivery delivery = FuelDelivery.builder()
                .deliveryDate(dto.getDeliveryDate())
                .invoiceNumber(dto.getInvoiceNumber())
                .supplier(dto.getSupplier())
                .liters(dto.getLiters())
                .pricePerLiter(dto.getPricePerLiter())
                .totalPrice(dto.getTotalPrice())
                .fuelTank(FuelTank.builder().id(dto.getFuelTankId()).build())
                .build();
        return ResponseEntity.ok(convertToDTO(fuelPumpService.recordDelivery(delivery, companyId)));
    }

    @GetMapping("/readings")
    public ResponseEntity<List<FuelPumpReadingDTO>> getReadings(Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        List<FuelPumpReadingDTO> dtos = fuelPumpService.getReadings(companyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/readings")
    public ResponseEntity<FuelPumpReadingDTO> recordReading(@RequestBody FuelPumpReadingDTO dto,
            Authentication authentication) {
        UUID companyId = getCompanyId(authentication);
        FuelPumpReading reading = FuelPumpReading.builder()
                .readingDate(dto.getReadingDate())
                .initialValue(dto.getInitialValue())
                .finalValue(dto.getFinalValue())
                .totalLiters(dto.getTotalLiters())
                .fuelPump(FuelPump.builder().id(dto.getFuelPumpId()).build())
                .build();
        return ResponseEntity.ok(convertToDTO(fuelPumpService.recordReading(reading, companyId)));
    }

    private UUID getCompanyId(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return userCompanyResolver.resolveCompanyId(user);
    }

    private FuelTankDTO convertToDTO(FuelTank tank) {
        FuelTankDTO dto = new FuelTankDTO();
        dto.setId(tank.getId());
        dto.setName(tank.getName());
        dto.setCapacity(tank.getCapacity());
        dto.setCurrentLevel(tank.getCurrentLevel());
        dto.setFuelType(tank.getFuelType());
        if (tank.getGarage() != null) {
            dto.setGarageId(tank.getGarage().getId());
            dto.setGarageName(tank.getGarage().getName());
        }
        return dto;
    }

    private FuelPumpDTO convertToDTO(FuelPump pump) {
        FuelPumpDTO dto = new FuelPumpDTO();
        dto.setId(pump.getId());
        dto.setName(pump.getName());
        dto.setFuelTankId(pump.getFuelTank().getId());
        dto.setFuelTankName(pump.getFuelTank().getName());
        dto.setLastMeterReading(pump.getLastMeterReading());
        Garage pumpGarage = pump.getGarage() != null ? pump.getGarage()
                : (pump.getFuelTank() != null ? pump.getFuelTank().getGarage() : null);
        if (pumpGarage != null) {
            dto.setGarageId(pumpGarage.getId());
            dto.setGarageName(pumpGarage.getName());
        }
        return dto;
    }

    private FuelDeliveryDTO convertToDTO(FuelDelivery delivery) {
        FuelDeliveryDTO dto = new FuelDeliveryDTO();
        dto.setId(delivery.getId());
        dto.setDeliveryDate(delivery.getDeliveryDate());
        dto.setInvoiceNumber(delivery.getInvoiceNumber());
        dto.setSupplier(delivery.getSupplier());
        dto.setLiters(delivery.getLiters());
        dto.setPricePerLiter(delivery.getPricePerLiter());
        dto.setTotalPrice(delivery.getTotalPrice());
        dto.setFuelTankId(delivery.getFuelTank().getId());
        dto.setFuelTankName(delivery.getFuelTank().getName());
        return dto;
    }

    private FuelPumpReadingDTO convertToDTO(FuelPumpReading reading) {
        FuelPumpReadingDTO dto = new FuelPumpReadingDTO();
        dto.setId(reading.getId());
        dto.setReadingDate(reading.getReadingDate());
        dto.setInitialValue(reading.getInitialValue());
        dto.setFinalValue(reading.getFinalValue());
        dto.setTotalLiters(reading.getTotalLiters());
        dto.setFuelPumpId(reading.getFuelPump().getId());
        dto.setFuelPumpName(reading.getFuelPump().getName());
        return dto;
    }
}
