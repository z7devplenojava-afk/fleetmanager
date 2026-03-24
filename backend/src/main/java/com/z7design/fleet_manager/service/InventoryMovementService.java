package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.InventoryMovementDTO;
import com.z7design.fleet_manager.model.InventoryItem;
import com.z7design.fleet_manager.model.InventoryMovement;
import com.z7design.fleet_manager.repository.InventoryItemRepository;
import com.z7design.fleet_manager.repository.InventoryMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryMovementService {
    
    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryItemRepository inventoryItemRepository;
    
    public List<InventoryMovement> findAll() {
        return inventoryMovementRepository.findAll();
    }
    
    public Page<InventoryMovement> findAll(Pageable pageable) {
        return inventoryMovementRepository.findAll(pageable);
    }
    
    public Optional<InventoryMovement> findById(UUID id) {
        return inventoryMovementRepository.findById(id);
    }
    
    public List<InventoryMovement> findByItem(UUID itemId) {
        return inventoryMovementRepository.findByItemId(itemId);
    }
    
    public List<InventoryMovement> findByType(InventoryMovement.MovementType type) {
        return inventoryMovementRepository.findByType(type);
    }
    
    public List<InventoryMovement> findByStatus(InventoryMovement.MovementStatus status) {
        return inventoryMovementRepository.findByStatus(status);
    }
    
    public List<InventoryMovement> findByMovementDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return inventoryMovementRepository.findByMovementDateBetween(start, end);
    }
    
    public Page<InventoryMovement> findByAdvancedFilters(UUID itemId, InventoryMovement.MovementType type, InventoryMovement.MovementStatus status, String requester, String employeeName, String department, String location, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable) {
        return inventoryMovementRepository.findByAdvancedFilters(itemId, type, status, requester, employeeName, department, location, startDate, endDate, pageable);
    }
    
    public InventoryMovement create(InventoryMovementDTO dto) {
        InventoryItem item = inventoryItemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new RuntimeException("Item de estoque nÃ£o encontrado"));
        
        // ValidaÃ§Ã£o de quantidade
        BigDecimal previousQuantity = item.getCountedQuantity() != null ? item.getCountedQuantity() : BigDecimal.ZERO;
        BigDecimal newQuantity = previousQuantity;
        if (dto.getType() == InventoryMovement.MovementType.IN) {
            newQuantity = newQuantity.add(BigDecimal.valueOf(dto.getQuantity()));
        } else if (dto.getType() == InventoryMovement.MovementType.OUT) {
            if (BigDecimal.valueOf(dto.getQuantity()).compareTo(previousQuantity) > 0) {
                throw new RuntimeException("Quantidade insuficiente em estoque");
            }
            newQuantity = newQuantity.subtract(BigDecimal.valueOf(dto.getQuantity()));
        } else if (dto.getType() == InventoryMovement.MovementType.ADJUSTMENT) {
            newQuantity = BigDecimal.valueOf(dto.getNewQuantity());
        }
        // Outras movimentaÃ§Ãµes podem ser tratadas conforme a regra de negÃ³cio
        
        // Atualizar estoque do item
        item.setCountedQuantity(newQuantity);
        inventoryItemRepository.save(item);
        
        InventoryMovement movement = new InventoryMovement();
        updateMovementFromDTO(movement, dto, item, previousQuantity.intValue(), newQuantity.intValue());
        return inventoryMovementRepository.save(movement);
    }
    
    public void deleteById(UUID id) {
        inventoryMovementRepository.deleteById(id);
    }
    
    private void updateMovementFromDTO(InventoryMovement movement, InventoryMovementDTO dto, InventoryItem item, int previousQuantity, int newQuantity) {
        movement.setItem(item);
        movement.setType(dto.getType());
        movement.setQuantity(dto.getQuantity());
        movement.setPreviousQuantity(previousQuantity);
        movement.setNewQuantity(newQuantity);
        movement.setUnitPrice(dto.getUnitPrice());
        movement.setReason(dto.getReason());
        movement.setRequester(dto.getRequester());
        movement.setApprovedBy(dto.getApprovedBy());
        movement.setEmployeeId(dto.getEmployeeId());
        movement.setEmployeeName(dto.getEmployeeName());
        movement.setDepartment(dto.getDepartment());
        movement.setLocation(dto.getLocation());
        movement.setNotes(dto.getNotes());
        movement.setStatus(dto.getStatus());
        movement.setMovementDate(dto.getMovementDate() != null ? dto.getMovementDate() : java.time.LocalDateTime.now());
    }
} 
