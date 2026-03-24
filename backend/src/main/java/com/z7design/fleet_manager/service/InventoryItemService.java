package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.InventoryItemDTO;
import com.z7design.fleet_manager.model.InventoryItem;
import com.z7design.fleet_manager.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryItemService {
    
    private final InventoryItemRepository inventoryItemRepository;
    
    public List<InventoryItem> findAll() {
        return inventoryItemRepository.findAll();
    }
    
    public Page<InventoryItem> findAll(Pageable pageable) {
        return inventoryItemRepository.findAll(pageable);
    }
    
    public Optional<InventoryItem> findById(UUID id) {
        return inventoryItemRepository.findById(id);
    }
    
    public List<InventoryItem> findByCategory(String category) {
        return inventoryItemRepository.findByCategory(category);
    }
    
    public List<InventoryItem> findByStatus(String status) {
        return inventoryItemRepository.findByStatus(status);
    }
    
    public List<InventoryItem> findByItemName(String itemName) {
        return inventoryItemRepository.findByItemNameContainingIgnoreCase(itemName);
    }
    
    public List<InventoryItem> findLowStockItems() {
        return inventoryItemRepository.findLowStockItems();
    }
    
    public List<InventoryItem> findOutOfStockItems() {
        return inventoryItemRepository.findOutOfStockItems();
    }
    
    public Page<InventoryItem> findByAdvancedFilters(String category, String status, String itemName, String brand, Pageable pageable) {
        return inventoryItemRepository.findByAdvancedFilters(category, status, itemName, brand, pageable);
    }
    
    public InventoryItem create(InventoryItemDTO dto) {
        InventoryItem item = new InventoryItem();
        updateItemFromDTO(item, dto);
        return inventoryItemRepository.save(item);
    }
    
    public InventoryItem update(UUID id, InventoryItemDTO dto) {
        return inventoryItemRepository.findById(id)
                .map(item -> {
                    updateItemFromDTO(item, dto);
                    return inventoryItemRepository.save(item);
                })
                .orElseThrow(() -> new RuntimeException("Item de estoque nÃ£o encontrado"));
    }
    
    public void deleteById(UUID id) {
        inventoryItemRepository.deleteById(id);
    }
    
    private void updateItemFromDTO(InventoryItem item, InventoryItemDTO dto) {
        item.setItemName(dto.getItemName());
        item.setDescription(dto.getDescription());
        item.setCategory(dto.getCategory());
        item.setBrand(dto.getBrand());
        item.setModel(dto.getModel());
        item.setLocation(dto.getLocation());
        item.setStatus(dto.getStatus());
        item.setCondition(dto.getCondition());
        item.setNotes(dto.getNotes());
        item.setUnit(dto.getUnit());
        item.setExpectedQuantity(dto.getExpectedQuantity());
        item.setCountedQuantity(dto.getCountedQuantity());
        item.setUnitPrice(dto.getUnitPrice());
        item.setExpectedValue(dto.getExpectedValue());
        item.setCountedValue(dto.getCountedValue());
        item.setMinimumStock(dto.getMinimumStock());
        item.setMaximumStock(dto.getMaximumStock());
        item.setPriority(dto.getPriority());
        item.setAbcClassification(dto.getAbcClassification());
        item.setStockStatus(dto.getStockStatus());
    }
} 
