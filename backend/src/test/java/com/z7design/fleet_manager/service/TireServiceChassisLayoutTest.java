package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.warehouse.VehicleTireChassisDTO;
import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Valida a configuração dinâmica do chassi devolvida para o mapa de pneus:
 * 4x2 simples, 4x2 rodado duplo, 6x2, 6x4 e a preservação de pneus já montados.
 */
@ExtendWith(MockitoExtension.class)
class TireServiceChassisLayoutTest {

    @Mock private TireRepository tireRepository;
    @Mock private TireMovementRepository movementRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private WarehouseMovementRepository warehouseMovementRepository;
    @Mock private TireLifecycleConfigRepository lifecycleConfigRepository;
    @Mock private TireFrontAxleExceptionRepository frontAxleExceptionRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private MessageService messageService;
    @Mock private EmailService emailService;

    @InjectMocks
    private TireService tireService;

    private UUID vehicleId;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
    }

    @Test
    void vanSimplesDeveTerQuatroPneusDeRolamento() {
        Vehicle van = vehicle(Vehicle.VehicleType.VAN, 2);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(van));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("4x2");
        assertThat(chassis.getAxleCount()).isEqualTo(2);
        assertThat(chassis.getDualRear()).isFalse();
        assertThat(chassis.getTireCount()).isEqualTo(4);
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getPositionCode)
                .containsExactly("DE", "DD", "TSE", "TSD", "ESTEPE");
        assertThat(chassis.getLayoutLabel()).contains("rodado simples");
    }

    @Test
    void microOnibusDeveTerRodadoDuploNoEixoTraseiro() {
        Vehicle micro = vehicle(Vehicle.VehicleType.MICROBUS, 2);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(micro));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("4x2");
        assertThat(chassis.getDualRear()).isTrue();
        assertThat(chassis.getTireCount()).isEqualTo(6);
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getPositionCode)
                .containsExactly("DE", "DD", "TOE", "TIE", "TID", "TOD", "ESTEPE");
        assertThat(chassis.getLayoutLabel()).contains("rodado duplo");
    }

    @Test
    void rodoviarioComTresEixosDeveSerSeisPorDoisComEixoAuxiliar() {
        Vehicle bus = vehicle(Vehicle.VehicleType.BUS_ROAD, 3);
        bus.setBusType(Vehicle.BusType.RODOVIARIO);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(bus));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("6x2");
        assertThat(chassis.getAxleCount()).isEqualTo(3);
        assertThat(chassis.getDualRear()).isTrue();
        assertThat(chassis.getTireCount()).isEqualTo(10);
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getPositionCode)
                .contains("AOE", "AIE", "AID", "AOD", "ESTEPE");
        assertThat(chassis.getLayoutLabel()).contains("eixo auxiliar");
    }

    @Test
    void caminhaoPesadoComTresEixosDeveSerSeisPorQuatro() {
        Vehicle truck = vehicle(Vehicle.VehicleType.TRUCK, 3);
        truck.setTotalWeightKg(30000);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(truck));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("6x4");
        assertThat(chassis.getTireCount()).isEqualTo(10);
        assertThat(chassis.getLayoutLabel()).contains("tração dupla");
    }

    @Test
    void articuladoComTresEixosDeveSerSeisPorDois() {
        Vehicle bus = vehicle(Vehicle.VehicleType.BUS_URBAN, 0);
        bus.setBusType(Vehicle.BusType.ARTICULADO);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(bus));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("6x2");
        assertThat(chassis.getAxleCount()).isEqualTo(3);
        assertThat(chassis.getTireCount()).isEqualTo(10);
    }

    @Test
    void biarticuladoDeveSerOitoPorDoisComQuatroEixos() {
        Vehicle bus = vehicle(Vehicle.VehicleType.BUS_URBAN, 0);
        bus.setBusType(Vehicle.BusType.BIARTICULADO);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(bus));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getChassiType()).isEqualTo("8x2");
        assertThat(chassis.getAxleCount()).isEqualTo(4);
        assertThat(chassis.getTireCount()).isEqualTo(14);
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getPositionCode)
                .contains("BOE", "BIE", "BID", "BOD");
    }

    @Test
    void pneuJaMontadoNoRodadoDuploDevePreservarAsQuatroPosicoes() {
        Vehicle van = vehicle(Vehicle.VehicleType.VAN, 2);
        Tire mounted = new Tire();
        mounted.setVehicleId(vehicleId);
        mounted.setAxleNumber(2);
        mounted.setPositionIndex(3);
        mounted.setSerialNumber("PNEU-123");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(van));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of(mounted));

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getDualRear()).isTrue();
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getPositionCode)
                .contains("TOE", "TIE", "TID", "TOD");
    }

    @Test
    void pneuMontadoEmEixoMaiorDeveElevarAQuantidadeDeEixos() {
        Vehicle micro = vehicle(Vehicle.VehicleType.MICROBUS, 2);
        Tire mounted = new Tire();
        mounted.setVehicleId(vehicleId);
        mounted.setAxleNumber(3);
        mounted.setPositionIndex(2);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(micro));
        when(tireRepository.findByVehicleId(vehicleId)).thenReturn(List.of(mounted));

        VehicleTireChassisDTO chassis = tireService.getVehicleChassis(vehicleId);

        assertThat(chassis.getAxleCount()).isEqualTo(3);
        assertThat(chassis.getPositions())
                .extracting(VehicleTireChassisDTO.MountedPositionDTO::getAxleNumber)
                .contains(3);
    }

    private Vehicle vehicle(Vehicle.VehicleType type, int axleCount) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        vehicle.setPlate("ABC1D23");
        vehicle.setModel("Modelo de teste");
        vehicle.setVehicleType(type);
        vehicle.setAxleCount(axleCount);
        vehicle.setCurrentMileage(100000);
        return vehicle;
    }
}
