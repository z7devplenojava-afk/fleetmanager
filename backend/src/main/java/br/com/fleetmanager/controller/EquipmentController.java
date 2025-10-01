package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EquipmentService;

import br.com.fleetmanager.dto.CreateEquipmentRequest;
import br.com.fleetmanager.dto.EquipmentDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
@Tag(name = "Equipamentos", description = "Endpoints para gestão de equipamentos")
public class EquipmentController {
    
    private final EquipmentService equipmentService;
    
    @GetMapping
    @Operation(summary = "Listar todos os equipamentos", description = "Retorna uma lista paginada de todos os equipamentos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de equipamentos retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<EquipmentDTO>> getAll(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        Page<EquipmentDTO> equipments = equipmentService.findAll(pageable);
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os equipamentos (sem paginação)", description = "Retorna uma lista completa de todos os equipamentos")
    public ResponseEntity<List<EquipmentDTO>> getAllWithoutPagination() {
        List<EquipmentDTO> equipments = equipmentService.findAll();
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar equipamento por ID", description = "Retorna um equipamento específico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Equipamento encontrado"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EquipmentDTO> getById(@PathVariable String id) {
        EquipmentDTO equipment = equipmentService.findById(UUID.fromString(id));
        return ResponseEntity.ok(equipment);
    }
    
    @GetMapping("/serial/{serialNumber}")
    @Operation(summary = "Buscar equipamento por número de série", description = "Retorna um equipamento específico pelo número de série")
    public ResponseEntity<EquipmentDTO> getBySerialNumber(@PathVariable String serialNumber) {
        EquipmentDTO equipment = equipmentService.findBySerialNumber(serialNumber);
        return ResponseEntity.ok(equipment);
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar equipamentos por status", description = "Retorna equipamentos com um status específico")
    public ResponseEntity<List<EquipmentDTO>> getByStatus(@PathVariable EquipmentStatus status) {
        List<EquipmentDTO> equipments = equipmentService.findByStatus(status);
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Buscar equipamentos por usuário", description = "Retorna equipamentos atribuídos a um usuário específico")
    public ResponseEntity<List<EquipmentDTO>> getByUser(@PathVariable String userId) {
        List<EquipmentDTO> equipments = equipmentService.findByCurrentUser(UUID.fromString(userId));
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/expiring/{days}")
    @Operation(summary = "Buscar equipamentos expirando", description = "Retorna equipamentos que expiram nos próximos X dias")
    public ResponseEntity<List<EquipmentDTO>> getExpiring(@PathVariable int days) {
        List<EquipmentDTO> equipments = equipmentService.findExpiring(days);
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/expired")
    @Operation(summary = "Buscar equipamentos expirados", description = "Retorna equipamentos que já expiraram")
    public ResponseEntity<List<EquipmentDTO>> getExpired() {
        List<EquipmentDTO> equipments = equipmentService.findExpired();
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/dangerous")
    @Operation(summary = "Buscar equipamentos perigosos", description = "Retorna equipamentos marcados como perigosos")
    public ResponseEntity<List<EquipmentDTO>> getDangerous() {
        List<EquipmentDTO> equipments = equipmentService.findDangerous();
        return ResponseEntity.ok(equipments);
    }
    
    @GetMapping("/summary")
    @Operation(summary = "Resumo estatístico", description = "Retorna um resumo estatístico dos equipamentos")
    public ResponseEntity<java.util.Map<String, Object>> getSummary() {
        java.util.Map<String, Object> summary = equipmentService.getSummary();
        return ResponseEntity.ok(summary);
    }
    
    @PostMapping
    @Operation(summary = "Criar novo equipamento", description = "Cria um novo equipamento no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Equipamento criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EquipmentDTO> create(@Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentDTO createdEquipment = equipmentService.create(request);
        return ResponseEntity.status(201).body(createdEquipment);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar equipamento", description = "Atualiza os dados de um equipamento existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Equipamento atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EquipmentDTO> update(@PathVariable String id, @Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentDTO updatedEquipment = equipmentService.update(UUID.fromString(id), request);
        return ResponseEntity.ok(updatedEquipment);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir equipamento", description = "Exclui um equipamento do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Equipamento excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        equipmentService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do equipamento", description = "Atualiza apenas o status de um equipamento")
    public ResponseEntity<EquipmentDTO> updateStatus(@PathVariable String id, @RequestParam EquipmentStatus status) {
        EquipmentDTO equipment = equipmentService.updateStatus(UUID.fromString(id), status);
        return ResponseEntity.ok(equipment);
    }
    
    @PatchMapping("/{equipmentId}/assign/{userId}")
    @Operation(summary = "Atribuir equipamento a usuário", description = "Atribui um equipamento a um usuário específico")
    public ResponseEntity<EquipmentDTO> assignToUser(@PathVariable String equipmentId, @PathVariable String userId) {
        EquipmentDTO equipment = equipmentService.assignToUser(UUID.fromString(equipmentId), UUID.fromString(userId));
        return ResponseEntity.ok(equipment);
    }
} 