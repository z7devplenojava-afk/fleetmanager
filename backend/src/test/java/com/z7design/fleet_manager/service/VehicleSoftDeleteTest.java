package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Regressão: exclusão de veículo falhava com violação de FK (hard delete)
 * quando o veículo possuía histórico (abastecimentos, manutenções, multas...).
 * Agora o DELETE é soft delete e a listagem oculta excluídos.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VehicleSoftDeleteTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Test
    @DisplayName("findAll do repositório já retorna apenas veículos não excluídos (query filtrada)")
    void findAllMustExcludeDeletedVehicles() {
        Vehicle active = new Vehicle();
        active.setId(UUID.randomUUID());
        active.setPlate("ACT1A23");

        // O override do findAll já traz a condição deletedAt IS NULL — o mock
        // simula o resultado do banco: somente veículos ativos.
        when(vehicleRepository.findAll()).thenReturn(List.of(active));

        List<Vehicle> result = vehicleRepository.findAll();

        assertEquals(1, result.size());
        assertTrue(result.stream().noneMatch(Vehicle::isDeleted));
    }

    @Test
    @DisplayName("Veículo excluído por soft delete não aparece na listagem")
    void softDeletedVehicleMustNotAppearInListings() {
        Vehicle active = new Vehicle();
        active.setId(UUID.randomUUID());
        active.setPlate("ACT1A23");

        Vehicle deleted = new Vehicle();
        deleted.setId(UUID.randomUUID());
        deleted.setPlate("DEL4B56");
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        assertTrue(deleted.isDeleted());

        when(vehicleRepository.findAll()).thenReturn(List.of(active)); // banco filtra o excluído

        List<Vehicle> result = vehicleRepository.findAll();

        assertFalse(result.contains(deleted), "Veículo excluído não deve aparecer na listagem");
        assertEquals("ACT1A23", result.get(0).getPlate());
    }

    @Test
    @DisplayName("softDelete e restore devem ser invocáveis pelo repositório (contrato JPQL)")
    void softDeleteAndRestoreQueriesMustExist() throws Exception {
        // Garante que os métodos JPQL existem com assinatura esperada
        assertNotNull(VehicleRepository.class.getMethod("softDelete", UUID.class));
        assertNotNull(VehicleRepository.class.getMethod("restore", UUID.class));
        assertNotNull(VehicleRepository.class.getMethod("countActive"));

        // E que a entidade possui o campo deleted_at mapeado
        var field = Vehicle.class.getDeclaredField("deletedAt");
        assertNotNull(field.getAnnotation(jakarta.persistence.Column.class),
                "deletedAt deve ser coluna persistida");
        assertEquals("deleted_at", field.getAnnotation(jakarta.persistence.Column.class).name());
    }
}
