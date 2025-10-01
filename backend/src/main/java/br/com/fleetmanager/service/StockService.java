package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.StockItemDTO;
import br.com.fleetmanager.dto.StockMovementDTO;
import br.com.fleetmanager.dto.StockAlertDTO;
import br.com.fleetmanager.model.StockItem;
import br.com.fleetmanager.model.StockMovement;
import br.com.fleetmanager.model.StockAlert;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.Unit;
import br.com.fleetmanager.model.enums.StockCategory;
import br.com.fleetmanager.model.enums.MovementType;
import br.com.fleetmanager.model.enums.MovementReason;
import br.com.fleetmanager.repository.StockItemRepository;
import br.com.fleetmanager.repository.StockMovementRepository;
import br.com.fleetmanager.repository.StockAlertRepository;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.repository.UnitRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockService {

    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAlertRepository stockAlertRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;

    // ===== GESTÃO DE ITENS =====

    public List<StockItemDTO> getAllItems() {
        log.info("Buscando todos os itens de estoque");
        return stockItemRepository.findByActiveTrue().stream()
                .map(StockItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<StockItemDTO> getItemsWithFilters(
            StockCategory category,
            Boolean active,
            UUID unitId,
            Boolean lowStock,
            String searchTerm,
            Pageable pageable) {
        
        log.info("Buscando itens com filtros - Categoria: {}, Ativo: {}, Baixo estoque: {}", 
                category, active, lowStock);
        
        return stockItemRepository.findByFilters(category, active, unitId, lowStock, searchTerm, pageable)
                .map(StockItemDTO::fromEntity);
    }

    public StockItemDTO getItemById(UUID id) {
        log.info("Buscando item por ID: {}", id);
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO getItemByCode(String code) {
        log.info("Buscando item por código: {}", code);
        StockItem item = stockItemRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado com código: " + code));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO getItemByQrCode(String qrCode) {
        log.info("Buscando item por QR Code: {}", qrCode);
        StockItem item = stockItemRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado com QR Code: " + qrCode));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO createItem(StockItemDTO dto) {
        log.info("Criando novo item de estoque: {}", dto.getName());
        
        // Verificar se código já existe
        if (dto.getCode() != null && stockItemRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Já existe um item com o código: " + dto.getCode());
        }
        
        StockItem item = StockItemDTO.toEntity(dto);
        
        // Associar unidade se especificada
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + dto.getUnitId()));
            item.setUnit(unit);
        }
        
        item = stockItemRepository.save(item);
        
        // Criar alerta se quantidade inicial for baixa
        checkAndCreateLowStockAlert(item);
        
        log.info("Item criado com sucesso - ID: {}, Código: {}", item.getId(), item.getCode());
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO updateItem(UUID id, StockItemDTO dto) {
        log.info("Atualizando item de estoque: {}", id);
        
        StockItem existingItem = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));

        // Verificar se código já existe em outro item
        if (dto.getCode() != null && !dto.getCode().equals(existingItem.getCode()) && 
            stockItemRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new IllegalArgumentException("Já existe outro item com o código: " + dto.getCode());
        }

        // Atualizar campos
        existingItem.setCode(dto.getCode());
        existingItem.setName(dto.getName());
        existingItem.setCategory(dto.getCategory());
        existingItem.setSizeVariation(dto.getSizeVariation());
        existingItem.setDescription(dto.getDescription());
        existingItem.setMinimumQuantity(dto.getMinimumQuantity());
        existingItem.setUnitCost(dto.getUnitCost());
        existingItem.setSupplier(dto.getSupplier());
        existingItem.setBarcode(dto.getBarcode());
        if (dto.getActive() != null) {
            existingItem.setActive(dto.getActive());
        }
        existingItem.setNotes(dto.getNotes());

        // Atualizar unidade se especificada
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + dto.getUnitId()));
            existingItem.setUnit(unit);
        }

        existingItem = stockItemRepository.save(existingItem);
        
        // Verificar se precisa criar/resolver alertas
        checkAndCreateLowStockAlert(existingItem);
        
        log.info("Item atualizado com sucesso: {}", id);
        return StockItemDTO.fromEntity(existingItem);
    }

    public void deleteItem(UUID id) {
        log.info("Excluindo item de estoque: {}", id);
        
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));
        
        // Marcar como inativo em vez de excluir (para manter histórico)
        item.setActive(false);
        stockItemRepository.save(item);
        
        log.info("Item marcado como inativo: {}", id);
    }

    // ===== MOVIMENTAÇÕES =====

    public StockMovementDTO createMovement(StockMovementDTO dto, UUID userId) {
        log.info("Criando movimentação - Tipo: {}, Item: {}, Quantidade: {}", 
                dto.getMovementType(), dto.getStockItemId(), dto.getQuantity());
        
        StockItem item = stockItemRepository.findById(dto.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado: " + dto.getStockItemId()));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        StockMovement movement = StockMovementDTO.toEntity(dto);
        movement.setStockItem(item);
        movement.setUser(user);
        movement.setPreviousQuantity(item.getCurrentQuantity());

        // Calcular nova quantidade
        int newQuantity;
        if (dto.getMovementType() == MovementType.ENTRADA) {
            newQuantity = item.getCurrentQuantity() + dto.getQuantity();
        } else {
            newQuantity = item.getCurrentQuantity() - dto.getQuantity();
            if (newQuantity < 0) {
                throw new IllegalArgumentException("Quantidade insuficiente em estoque. Disponível: " + item.getCurrentQuantity());
            }
        }
        
        movement.setNewQuantity(newQuantity);

        // Associar funcionário se for saída
        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado: " + dto.getEmployeeId()));
            movement.setEmployee(employee);
        }

        // Associar unidade
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + dto.getUnitId()));
            movement.setUnit(unit);
        }

        // Salvar movimentação
        movement = stockMovementRepository.save(movement);

        // Atualizar quantidade do item
        item.setCurrentQuantity(newQuantity);
        stockItemRepository.save(item);

        // Verificar alertas
        checkAndCreateLowStockAlert(item);
        
        log.info("Movimentação criada com sucesso - ID: {}, Nova quantidade: {}", movement.getId(), newQuantity);
        return StockMovementDTO.fromEntity(movement);
    }

    public Page<StockMovementDTO> getMovementsWithFilters(
            UUID stockItemId,
            UUID employeeId,
            MovementType movementType,
            MovementReason reason,
            UUID unitId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String searchTerm,
            Pageable pageable) {
        
        try {
            log.info("Buscando movimentações com filtros - Item: {}, Funcionário: {}, Tipo: {}", 
                    stockItemId, employeeId, movementType);
            
            Page<StockMovement> movements = stockMovementRepository.findByFilters(
                    stockItemId, employeeId, movementType, reason, unitId, 
                    startDate, endDate, searchTerm, pageable);
            
            log.info("Encontradas {} movimentações", movements.getTotalElements());
            
            return movements.map(movement -> {
                try {
                    return StockMovementDTO.fromEntity(movement);
                } catch (Exception e) {
                    log.error("Erro ao converter movimentação {}: {}", movement.getId(), e.getMessage());
                    return null;
                }
            });
            
        } catch (Exception e) {
            log.error("Erro ao buscar movimentações com filtros: {}", e.getMessage(), e);
            // Return empty page instead of throwing exception
            return Page.empty(pageable);
        }
    }

    public List<StockMovementDTO> getMovementsByItem(UUID itemId) {
        return stockMovementRepository.findByStockItemIdOrderByMovementDateDesc(itemId).stream()
                .map(StockMovementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StockMovementDTO> getDeliveryHistoryByEmployee(UUID employeeId) {
        log.info("Buscando histórico de entregas do funcionário: {}", employeeId);
        return stockMovementRepository.findDeliveryHistoryByEmployee(employeeId).stream()
                .map(StockMovementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ===== ALERTAS =====

    public List<StockAlertDTO> getActiveAlerts() {
        try {
            log.info("Buscando alertas ativos...");
            List<StockAlert> alerts = stockAlertRepository.findByIsResolvedFalseOrderByPriorityDescCreatedAtDesc();
            log.info("Encontrados {} alertas ativos", alerts.size());
            
            return alerts.stream()
                    .map(alert -> {
                        try {
                            return StockAlertDTO.fromEntity(alert);
                        } catch (Exception e) {
                            log.error("Erro ao converter alerta {}: {}", alert.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(alert -> alert != null)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Erro ao buscar alertas ativos: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public List<StockAlertDTO> getUnreadAlerts() {
        try {
            log.info("Buscando alertas não lidos...");
            List<StockAlert> alerts = stockAlertRepository.findByIsReadFalseOrderByPriorityDescCreatedAtDesc();
            log.info("Encontrados {} alertas não lidos", alerts.size());
            
            return alerts.stream()
                    .map(alert -> {
                        try {
                            return StockAlertDTO.fromEntity(alert);
                        } catch (Exception e) {
                            log.error("Erro ao converter alerta {}: {}", alert.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(alert -> alert != null)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Erro ao buscar alertas não lidos: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public void markAlertAsRead(UUID alertId) {
        StockAlert alert = stockAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + alertId));
        alert.markAsRead();
        stockAlertRepository.save(alert);
    }

    public void resolveAlert(UUID alertId, UUID userId) {
        StockAlert alert = stockAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + alertId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
        
        alert.resolve(user);
        stockAlertRepository.save(alert);
    }

    // ===== RELATÓRIOS =====

    public Map<String, Object> getStockReport() {
        log.info("Gerando relatório de estoque");
        
        List<StockItem> allItems = stockItemRepository.findByActiveTrue();
        List<StockItem> lowStockItems = stockItemRepository.findLowStockItems();
        List<StockItem> outOfStockItems = stockItemRepository.findOutOfStockItems();
        
        Long totalItems = (long) allItems.size();
        Long lowStockCount = (long) lowStockItems.size();
        Long outOfStockCount = (long) outOfStockItems.size();
        Double totalValue = stockItemRepository.getTotalStockValue();
        
        Map<StockCategory, Long> itemsByCategory = allItems.stream()
                .collect(Collectors.groupingBy(StockItem::getCategory, Collectors.counting()));
        
        Long activeAlerts = stockAlertRepository.countByIsResolvedFalse();
        Long criticalAlerts = stockAlertRepository.countCriticalUnresolvedAlerts();

        return Map.of(
            "totalItems", totalItems,
            "lowStockCount", lowStockCount,
            "outOfStockCount", outOfStockCount,
            "totalValue", totalValue != null ? totalValue : 0.0,
            "itemsByCategory", itemsByCategory,
            "activeAlerts", activeAlerts,
            "criticalAlerts", criticalAlerts,
            "lowStockItems", lowStockItems.stream().map(StockItemDTO::fromEntity).collect(Collectors.toList()),
            "outOfStockItems", outOfStockItems.stream().map(StockItemDTO::fromEntity).collect(Collectors.toList())
        );
    }

    // ===== MÉTODOS AUXILIARES =====

    private void checkAndCreateLowStockAlert(StockItem item) {
        // Verificar se já existe alerta ativo para este item
        boolean hasActiveAlert = stockAlertRepository.existsByStockItemIdAndAlertTypeAndIsResolvedFalse(
                item.getId(), "LOW_STOCK");
        
        if (item.isLowStock() && !hasActiveAlert) {
            // Criar alerta de baixo estoque
            StockAlert alert = new StockAlert();
            alert.setStockItem(item);
            alert.setAlertType("LOW_STOCK");
            alert.setMessage(String.format("Item '%s' com baixo estoque: %d unidades (mínimo: %d)", 
                    item.getFullName(), item.getCurrentQuantity(), item.getMinimumQuantity()));
            alert.setCurrentQuantity(item.getCurrentQuantity());
            alert.setMinimumQuantity(item.getMinimumQuantity());
            alert.setPriority(item.getCurrentQuantity() == 0 ? 4 : 3); // Crítica se zerado, alta se baixo
            
            stockAlertRepository.save(alert);
            log.info("Alerta de baixo estoque criado para item: {}", item.getFullName());
        }
        
        // Se não está mais em baixo estoque, resolver alertas ativos
        if (!item.isLowStock() && hasActiveAlert) {
            List<StockAlert> activeAlerts = stockAlertRepository.findByStockItemIdAndIsResolvedFalse(item.getId());
            for (StockAlert alert : activeAlerts) {
                if ("LOW_STOCK".equals(alert.getAlertType())) {
                    alert.setIsResolved(true);
                    alert.setResolvedAt(LocalDateTime.now());
                    stockAlertRepository.save(alert);
                    log.info("Alerta de baixo estoque resolvido automaticamente para item: {}", item.getFullName());
                }
            }
        }
    }

    // ===== MÉTODOS ESPECÍFICOS =====

    public List<StockItemDTO> getLowStockItems() {
        return stockItemRepository.findLowStockItems().stream()
                .map(StockItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StockItemDTO> getItemsByCategory(StockCategory category) {
        return stockItemRepository.findByCategoryAndActiveTrue(category).stream()
                .map(StockItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StockMovementDTO> getRecentMovements(int limit) {
        try {
            log.info("Buscando as {} movimentações mais recentes...", limit);
            List<StockMovement> recentMovements = stockMovementRepository.findTop10ByOrderByMovementDateDesc();
            log.info("Encontrados {} movimentações recentes", recentMovements.size());
            
            return recentMovements.stream()
                    .map(movement -> {
                        try {
                            return StockMovementDTO.fromEntity(movement);
                        } catch (Exception e) {
                            log.error("Erro ao converter movimentação {}: {}", movement.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(movement -> movement != null)
                    .limit(limit)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Erro ao buscar movimentações recentes: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}