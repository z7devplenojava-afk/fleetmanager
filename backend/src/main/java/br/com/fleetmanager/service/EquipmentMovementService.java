package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import br.com.fleetmanager.model.enums.MovementType;
import br.com.fleetmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EquipmentMovementService {
    
    private final EquipmentMovementRepository movementRepository;
    private final EquipmentRepository equipmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    
    public EquipmentMovementDTO createMovement(CreateEquipmentMovementDTO dto) {
        log.info("Criando nova movimentação de equipamento: {}", dto.getEquipmentId());
        
        // Validar entidades relacionadas
        Equipment equipment = equipmentRepository.findById(dto.getEquipmentId())
                .orElseThrow(() -> new BusinessException("Equipamento não encontrado: " + dto.getEquipmentId()));
        
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new BusinessException("Funcionário não encontrado: " + dto.getEmployeeId()));
        
        Employee authorizedBy = employeeRepository.findById(dto.getAuthorizedById())
                .orElseThrow(() -> new BusinessException("Autorizador não encontrado: " + dto.getAuthorizedById()));
        
        WorkPost workPost = null;
        if (dto.getWorkPostId() != null) {
            workPost = workPostRepository.findById(dto.getWorkPostId())
                    .orElseThrow(() -> new BusinessException("Posto de trabalho não encontrado: " + dto.getWorkPostId()));
        }
        
        // Verificar se equipamento já está em uso (para retiradas)
        if (dto.getMovementType() == MovementType.WITHDRAWAL || 
            dto.getMovementType() == MovementType.PERMANENT_ASSIGNMENT ||
            dto.getMovementType() == MovementType.TEMPORARY_USE) {
            
            movementRepository.findActiveMovementByEquipmentId(dto.getEquipmentId())
                    .ifPresent(activeMovement -> {
                        throw new BusinessException("Equipamento já está em uso por: " + 
                                activeMovement.getEmployee().getName());
                    });
        }
        
        // Processar devolução/retorno
        if (dto.getMovementType() == MovementType.RETURN) {
            // Encontrar movimentação ativa para este equipamento
            Optional<EquipmentMovement> activeMovement = movementRepository
                    .findActiveMovementByEquipmentId(dto.getEquipmentId());
            
            if (activeMovement.isPresent()) {
                EquipmentMovement activeMove = activeMovement.get();
                activeMove.setActualReturnDate(dto.getMovementDate());
                activeMove.setReturned(true);
                // activeMove.setConditionOnReturn(dto.getConditionOnReturn()); // TODO: implementar quando DTO estiver completo
                movementRepository.save(activeMove);
                
                // Atualizar status do equipamento
                equipment.setCurrentUserId(null);
                equipment.setStatus(EquipmentStatus.EM_ESTOQUE);
                equipmentRepository.save(equipment);
            }
        }
        
        // Criar movimentação
        EquipmentMovement movement = EquipmentMovement.builder()
                .equipment(equipment)
                .employee(employee)
                .workPost(workPost)
                .authorizedBy(authorizedBy)
                .movementType(dto.getMovementType())
                .movementDate(dto.getMovementDate())
                .expectedReturnDate(dto.getExpectedReturnDate())
                .reason(dto.getReason())
                .notes(dto.getNotes())
                .conditionOnWithdrawal(dto.getConditionOnWithdrawal())
                .returned(false)
                .build();
        
        EquipmentMovement savedMovement = movementRepository.save(movement);
        
        // Atualizar status e usuário atual do equipamento
        if (dto.getMovementType() == MovementType.WITHDRAWAL || 
            dto.getMovementType() == MovementType.PERMANENT_ASSIGNMENT ||
            dto.getMovementType() == MovementType.TEMPORARY_USE) {
            
            equipment.setCurrentUserId(employee.getId());
            equipment.setStatus(EquipmentStatus.EM_USO);
            equipmentRepository.save(equipment);
        }
        
        log.info("Movimentação criada com sucesso - ID: {}", savedMovement.getId());
        return convertToDTO(savedMovement);
    }
    
    public EquipmentMovementDTO returnEquipment(UUID movementId, String conditionOnReturn, String notes) {
        log.info("Processando devolução de equipamento - Movement ID: {}", movementId);
        
        EquipmentMovement movement = movementRepository.findById(movementId)
                .orElseThrow(() -> new BusinessException("Movimentação não encontrada: " + movementId));
        
        if (movement.getReturned()) {
            throw new BusinessException("Equipamento já foi devolvido");
        }
        
        // Atualizar movimentação
        movement.setReturned(true);
        movement.setActualReturnDate(LocalDateTime.now());
        movement.setConditionOnReturn(conditionOnReturn);
        if (notes != null && !notes.trim().isEmpty()) {
            movement.setNotes(movement.getNotes() != null ? 
                    movement.getNotes() + "\n" + notes : notes);
        }
        
        // Atualizar equipamento
        Equipment equipment = movement.getEquipment();
        equipment.setCurrentUserId(null);
        equipment.setStatus(EquipmentStatus.EM_ESTOQUE);
        equipmentRepository.save(equipment);
        
        EquipmentMovement savedMovement = movementRepository.save(movement);
        log.info("Devolução processada com sucesso");
        
        return convertToDTO(savedMovement);
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getEquipmentHistory(UUID equipmentId) {
        return movementRepository.findByEquipmentIdOrderByMovementDateDesc(equipmentId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getEmployeeMovements(UUID employeeId) {
        return movementRepository.findByEmployeeIdOrderByMovementDateDesc(employeeId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getWorkPostMovements(UUID workPostId) {
        return movementRepository.findByWorkPostIdOrderByMovementDateDesc(workPostId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getActiveMovements() {
        return movementRepository.findActiveWithdrawals()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getOverdueMovements() {
        return movementRepository.findOverdueMovements(LocalDateTime.now())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EquipmentMovementDTO> getMovementsDueSoon(int days) {
        LocalDateTime currentDate = LocalDateTime.now();
        LocalDateTime futureDate = currentDate.plusDays(days);
        
        return movementRepository.findMovementsDueSoon(currentDate, futureDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private EquipmentMovementDTO convertToDTO(EquipmentMovement movement) {
        return EquipmentMovementDTO.builder()
                .id(movement.getId())
                .equipmentId(movement.getEquipment().getId())
                .equipmentSerialNumber(movement.getEquipment().getSerialNumber())
                .equipmentModel(movement.getEquipment().getModel())
                .employeeId(movement.getEmployee().getId())
                .employeeName(movement.getEmployee().getName())
                .employeeCpf(movement.getEmployee().getDocument())
                .workPostId(movement.getWorkPost() != null ? movement.getWorkPost().getId() : null)
                .workPostName(movement.getWorkPost() != null ? movement.getWorkPost().getName() : null)
                .workPostLocation(movement.getWorkPost() != null ? movement.getWorkPost().getAddress() : null)
                .authorizedById(movement.getAuthorizedBy().getId())
                .authorizedByName(movement.getAuthorizedBy().getName())
                .movementType(movement.getMovementType())
                .movementDate(movement.getMovementDate())
                .expectedReturnDate(movement.getExpectedReturnDate())
                .actualReturnDate(movement.getActualReturnDate())
                .reason(movement.getReason())
                .notes(movement.getNotes())
                .returned(movement.getReturned())
                .conditionOnWithdrawal(movement.getConditionOnWithdrawal())
                .conditionOnReturn(movement.getConditionOnReturn())
                .createdAt(movement.getCreatedAt())
                .isOverdue(movement.isOverdue())
                .daysOut(movement.getDaysOut())
                .status(getMovementStatus(movement))
                .build();
    }
    
    private String getMovementStatus(EquipmentMovement movement) {
        if (movement.getReturned()) {
            return "Devolvido";
        }
        
        if (movement.isOverdue()) {
            return "Atrasado";
        }
        
        if (movement.getExpectedReturnDate() != null) {
            long daysUntilDue = java.time.Duration.between(LocalDateTime.now(), movement.getExpectedReturnDate()).toDays();
            if (daysUntilDue <= 3) {
                return "Vencendo em breve";
            }
        }
        
        return "Em uso";
    }
} 