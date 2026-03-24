package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateEquipmentRequest;
import com.z7design.fleet_manager.dto.EquipmentDTO;
import com.z7design.fleet_manager.model.enums.EquipmentStatus;
import com.z7design.fleet_manager.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * Busca todos os equipamentos com paginaÃ§Ã£o
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<EquipmentDTO>> getAllEquipments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        try {
            log.info("Buscando equipamentos - pÃ¡gina: {}, tamanho: {}, ordenaÃ§Ã£o: {} {}", 
                    page, size, sortBy, sortDirection);
            
            Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") 
                    ? Sort.Direction.ASC 
                    : Sort.Direction.DESC;
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<EquipmentDTO> equipments = equipmentService.findAll(pageable);
            
            log.info("Equipamentos encontrados: {}", equipments.getTotalElements());
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca todos os equipamentos sem paginaÃ§Ã£o
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getAllEquipmentsNoPagination() {
        try {
            log.info("Buscando todos os equipamentos sem paginaÃ§Ã£o");
            List<EquipmentDTO> equipments = equipmentService.findAll();
            log.info("Total de equipamentos encontrados: {}", equipments.size());
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar todos os equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca equipamento por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<EquipmentDTO> getEquipmentById(@PathVariable UUID id) {
        try {
            log.info("Buscando equipamento por ID: {}", id);
            EquipmentDTO equipment = equipmentService.findById(id);
            return ResponseEntity.ok(equipment);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamento por ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Busca equipamento por nÃºmero de sÃ©rie
     */
    @GetMapping("/serial/{serialNumber}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<EquipmentDTO> getEquipmentBySerialNumber(@PathVariable String serialNumber) {
        try {
            log.info("Buscando equipamento por nÃºmero de sÃ©rie: {}", serialNumber);
            EquipmentDTO equipment = equipmentService.findBySerialNumber(serialNumber);
            return ResponseEntity.ok(equipment);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamento por nÃºmero de sÃ©rie: {}", serialNumber, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Busca equipamentos por status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getEquipmentsByStatus(@PathVariable EquipmentStatus status) {
        try {
            log.info("Buscando equipamentos por status: {}", status);
            List<EquipmentDTO> equipments = equipmentService.findByStatus(status);
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos por status: {}", status, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca equipamentos por usuÃ¡rio
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getEquipmentsByUser(@PathVariable UUID userId) {
        try {
            log.info("Buscando equipamentos do usuÃ¡rio: {}", userId);
            List<EquipmentDTO> equipments = equipmentService.findByCurrentUser(userId);
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos do usuÃ¡rio: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca equipamentos expirando em X dias
     */
    @GetMapping("/expiring/{days}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getExpiringEquipments(@PathVariable int days) {
        try {
            log.info("Buscando equipamentos expirando em {} dias", days);
            List<EquipmentDTO> equipments = equipmentService.findExpiring(days);
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos expirando", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca equipamentos expirados
     */
    @GetMapping("/expired")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getExpiredEquipments() {
        try {
            log.info("Buscando equipamentos expirados");
            List<EquipmentDTO> equipments = equipmentService.findExpired();
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos expirados", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca equipamentos perigosos
     */
    @GetMapping("/dangerous")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<EquipmentDTO>> getDangerousEquipments() {
        try {
            log.info("Buscando equipamentos perigosos");
            List<EquipmentDTO> equipments = equipmentService.findDangerous();
            return ResponseEntity.ok(equipments);
        } catch (Exception e) {
            log.error("Erro ao buscar equipamentos perigosos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ObtÃ©m resumo de equipamentos
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getEquipmentSummary() {
        try {
            log.info("Buscando resumo de equipamentos");
            Map<String, Object> summary = equipmentService.getSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Erro ao buscar resumo de equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cria novo equipamento
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_CREATE', 'EQUIPMENTS_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<EquipmentDTO> createEquipment(@Valid @RequestBody CreateEquipmentRequest request) {
        try {
            log.info("Criando novo equipamento: {}", request.getSerialNumber());
            EquipmentDTO created = equipmentService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Erro ao criar equipamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Atualiza equipamento
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<EquipmentDTO> updateEquipment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEquipmentRequest request) {
        try {
            log.info("Atualizando equipamento: {}", id);
            EquipmentDTO updated = equipmentService.update(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao atualizar equipamento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Atualiza status do equipamento
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<EquipmentDTO> updateEquipmentStatus(
            @PathVariable UUID id,
            @RequestParam EquipmentStatus status) {
        try {
            log.info("Atualizando status do equipamento {} para {}", id, status);
            EquipmentDTO updated = equipmentService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao atualizar status do equipamento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Atribui equipamento a um usuÃ¡rio
     */
    @PatchMapping("/{equipmentId}/assign/{userId}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_ASSIGN', 'EQUIPMENTS_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<EquipmentDTO> assignEquipmentToUser(
            @PathVariable UUID equipmentId,
            @PathVariable UUID userId) {
        try {
            log.info("Atribuindo equipamento {} ao usuÃ¡rio {}", equipmentId, userId);
            EquipmentDTO updated = equipmentService.assignToUser(equipmentId, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao atribuir equipamento {} ao usuÃ¡rio {}", equipmentId, userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Remove atribuiÃ§Ã£o de equipamento (torna disponÃ­vel)
     */
    @PatchMapping("/{equipmentId}/unassign")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_ASSIGN', 'EQUIPMENTS_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<EquipmentDTO> unassignEquipment(@PathVariable UUID equipmentId) {
        try {
            log.info("Removendo atribuiÃ§Ã£o do equipamento {}", equipmentId);
            EquipmentDTO updated = equipmentService.assignToUser(equipmentId, null);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao remover atribuiÃ§Ã£o do equipamento {}", equipmentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Exclui equipamento
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_DELETE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteEquipment(@PathVariable UUID id) {
        try {
            log.info("Excluindo equipamento: {}", id);
            equipmentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir equipamento: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


