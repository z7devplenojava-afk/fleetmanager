package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.StockItemDTO;
import com.z7design.fleet_manager.dto.StockMovementDTO;
import com.z7design.fleet_manager.dto.StockAlertDTO;
import com.z7design.fleet_manager.dto.StockItemReportDTO;
import com.z7design.fleet_manager.dto.MovementSummaryDTO;
import com.z7design.fleet_manager.dto.MovementsReportDTO;
import com.z7design.fleet_manager.dto.LowStockReportDTO;
import com.z7design.fleet_manager.dto.DateRangeReportDTO;
import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.StockAlert;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.enums.StockCategory;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.repository.StockItemRepository;
import com.z7design.fleet_manager.repository.StockMovementRepository;
import com.z7design.fleet_manager.repository.StockAlertRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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

    // ===== GESTÃƒO DE ITENS =====

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
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque nÃ£o encontrado: " + id));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO getItemByCode(String code) {
        log.info("Buscando item por cÃ³digo: {}", code);
        StockItem item = stockItemRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Item nÃ£o encontrado com cÃ³digo: " + code));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO getItemByQrCode(String qrCode) {
        log.info("Buscando item por QR Code: {}", qrCode);
        StockItem item = stockItemRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ResourceNotFoundException("Item nÃ£o encontrado com QR Code: " + qrCode));
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO createItem(StockItemDTO dto) {
        log.info("Criando novo item de estoque: {}", dto.getName());
        
        // Verificar se cÃ³digo jÃ¡ existe
        if (dto.getCode() != null && stockItemRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("JÃ¡ existe um item com o cÃ³digo: " + dto.getCode());
        }
        
        StockItem item = StockItemDTO.toEntity(dto);
        
        // Associar unidade se especificada
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada: " + dto.getUnitId()));
            item.setUnit(unit);
        }
        
        item = stockItemRepository.save(item);
        
        // Criar alerta se quantidade inicial for baixa
        checkAndCreateLowStockAlert(item);
        
        log.info("Item criado com sucesso - ID: {}, CÃ³digo: {}", item.getId(), item.getCode());
        return StockItemDTO.fromEntity(item);
    }

    public StockItemDTO updateItem(UUID id, StockItemDTO dto) {
        log.info("Atualizando item de estoque: {}", id);
        
        StockItem existingItem = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque nÃ£o encontrado: " + id));

        // Verificar se cÃ³digo jÃ¡ existe em outro item
        if (dto.getCode() != null && !dto.getCode().equals(existingItem.getCode()) && 
            stockItemRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new IllegalArgumentException("JÃ¡ existe outro item com o cÃ³digo: " + dto.getCode());
        }

        // Atualizar campos
        existingItem.setCode(dto.getCode());
        existingItem.setName(dto.getName());
        existingItem.setCategory(dto.getCategory());
        existingItem.setSizeVariation(dto.getSizeVariation());
        existingItem.setDescription(dto.getDescription());
        if (dto.getCurrentQuantity() != null) {
            existingItem.setCurrentQuantity(dto.getCurrentQuantity());
        }
        if (dto.getMinimumQuantity() != null) {
            existingItem.setMinimumQuantity(dto.getMinimumQuantity());
        }
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
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada: " + dto.getUnitId()));
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
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque nÃ£o encontrado: " + id));
        
        // Marcar como inativo em vez de excluir (para manter histÃ³rico)
        item.setActive(false);
        stockItemRepository.save(item);
        
        log.info("Item marcado como inativo: {}", id);
    }

    // ===== MOVIMENTAÃ‡Ã•ES =====

    public StockMovementDTO createMovement(StockMovementDTO dto, UUID userId) {
        log.info("Criando movimentaÃ§Ã£o - Tipo: {}, Item: {}, Quantidade: {}", 
                dto.getMovementType(), dto.getStockItemId(), dto.getQuantity());
        
        StockItem item = stockItemRepository.findById(dto.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item nÃ£o encontrado: " + dto.getStockItemId()));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado: " + userId));

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
                throw new IllegalArgumentException("Quantidade insuficiente em estoque. DisponÃ­vel: " + item.getCurrentQuantity());
            }
        }
        
        movement.setNewQuantity(newQuantity);

        // Associar funcionÃ¡rio se for saÃ­da
        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado: " + dto.getEmployeeId()));
            movement.setEmployee(employee);
        }

        // Associar unidade
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada: " + dto.getUnitId()));
            movement.setUnit(unit);
        }

        // Salvar movimentaÃ§Ã£o
        movement = stockMovementRepository.save(movement);

        // Atualizar quantidade do item
        item.setCurrentQuantity(newQuantity);
        stockItemRepository.save(item);

        // Verificar alertas
        checkAndCreateLowStockAlert(item);
        
        log.info("MovimentaÃ§Ã£o criada com sucesso - ID: {}, Nova quantidade: {}", movement.getId(), newQuantity);
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
            log.info("Buscando movimentaÃ§Ãµes com filtros - Item: {}, FuncionÃ¡rio: {}, Tipo: {}", 
                    stockItemId, employeeId, movementType);
            
            // Criar Specification dinamicamente
            Specification<StockMovement> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                
                // Filtro por item de estoque
                if (stockItemId != null) {
                    predicates.add(cb.equal(root.get("stockItem").get("id"), stockItemId));
                }
                
                // Filtro por funcionÃ¡rio
                if (employeeId != null) {
                    predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
                }
                
                // Filtro por tipo de movimentaÃ§Ã£o
                if (movementType != null) {
                    predicates.add(cb.equal(root.get("movementType"), movementType));
                }
                
                // Filtro por motivo
                if (reason != null) {
                    predicates.add(cb.equal(root.get("reason"), reason));
                }
                
                // Filtro por unidade
                if (unitId != null) {
                    predicates.add(cb.equal(root.get("unit").get("id"), unitId));
                }
                
                // Filtro por data inicial
                if (startDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("movementDate"), startDate));
                }
                
                // Filtro por data final
                if (endDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("movementDate"), endDate));
                }
                
                // Filtro por termo de busca
                if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                    String searchPattern = "%" + searchTerm.toLowerCase() + "%";
                    Predicate itemNamePred = cb.and(
                        cb.isNotNull(root.get("stockItem").get("name")),
                        cb.like(cb.lower(root.get("stockItem").get("name")), searchPattern)
                    );
                    Predicate itemCodePred = cb.and(
                        cb.isNotNull(root.get("stockItem").get("code")),
                        cb.like(cb.lower(root.get("stockItem").get("code")), searchPattern)
                    );
                    Predicate employeeNamePred = cb.and(
                        cb.isNotNull(root.get("employeeName")),
                        cb.like(cb.lower(root.get("employeeName")), searchPattern)
                    );
                    Predicate userNamePred = cb.and(
                        cb.isNotNull(root.get("userName")),
                        cb.like(cb.lower(root.get("userName")), searchPattern)
                    );
                    Predicate documentNumberPred = cb.and(
                        cb.isNotNull(root.get("documentNumber")),
                        cb.like(cb.lower(root.get("documentNumber")), searchPattern)
                    );
                    
                    predicates.add(cb.or(itemNamePred, itemCodePred, employeeNamePred, userNamePred, documentNumberPred));
                }
                
                // Ordenar por data de movimentaÃ§Ã£o (mais recente primeiro)
                query.orderBy(cb.desc(root.get("movementDate")));
                
                return cb.and(predicates.toArray(new Predicate[0]));
            };
            
            Page<StockMovement> movements = stockMovementRepository.findAll(spec, pageable);
            
            log.info("Encontradas {} movimentaÃ§Ãµes", movements.getTotalElements());
            
            // Converter movimentaÃ§Ãµes para DTO, filtrando nulos
            List<StockMovementDTO> dtos = movements.getContent().stream()
                    .map(movement -> {
                        try {
                            return StockMovementDTO.fromEntity(movement);
                        } catch (Exception e) {
                            log.error("Erro ao converter movimentaÃ§Ã£o {}: {}", movement.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
            
            // Criar nova pÃ¡gina com os DTOs convertidos
            return new PageImpl<>(
                    dtos,
                    pageable,
                    movements.getTotalElements()
            );
            
        } catch (Exception e) {
            log.error("Erro ao buscar movimentaÃ§Ãµes com filtros: {}", e.getMessage(), e);
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
        log.info("Buscando histÃ³rico de entregas do funcionÃ¡rio: {}", employeeId);
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
            log.info("Buscando alertas nÃ£o lidos...");
            List<StockAlert> alerts = stockAlertRepository.findByIsReadFalseOrderByPriorityDescCreatedAtDesc();
            log.info("Encontrados {} alertas nÃ£o lidos", alerts.size());
            
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
            log.error("Erro ao buscar alertas nÃ£o lidos: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public void markAlertAsRead(UUID alertId) {
        StockAlert alert = stockAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta nÃ£o encontrado: " + alertId));
        alert.markAsRead();
        stockAlertRepository.save(alert);
    }

    public void resolveAlert(UUID alertId, UUID userId) {
        StockAlert alert = stockAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta nÃ£o encontrado: " + alertId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado: " + userId));
        
        alert.resolve(user);
        stockAlertRepository.save(alert);
    }

    // ===== RELATÃ“RIOS =====

    public Map<String, Object> getStockReport() {
        log.info("Gerando relatÃ³rio de estoque");
        
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

    // ===== RELATÃ“RIOS DETALHADOS =====

    @Transactional(readOnly = true)
    public StockItemReportDTO getItemReport(UUID itemId) {
        log.info("Gerando relatÃ³rio detalhado para item: {}", itemId);
        
        StockItem item = stockItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item nÃ£o encontrado: " + itemId));
        
        List<StockMovement> movements = stockMovementRepository.findByStockItemIdOrderByMovementDateDesc(itemId);
        
        long totalMovements = movements.size();
        long totalEntries = movements.stream().filter(m -> m.getMovementType() == MovementType.ENTRADA).count();
        long totalExits = movements.stream().filter(m -> m.getMovementType() == MovementType.SAIDA).count();
        
        int totalQuantityEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        int totalQuantityExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        BigDecimal totalCostEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCostExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        LocalDateTime lastMovementDate = movements.isEmpty() ? null : movements.get(0).getMovementDate();
        
        // Calcular giro de estoque (quantidade mÃ©dia movimentada por mÃªs nos Ãºltimos 6 meses)
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<StockMovement> recentMovements = movements.stream()
                .filter(m -> m.getMovementDate().isAfter(sixMonthsAgo))
                .collect(Collectors.toList());
        
        int recentQuantityExited = recentMovements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        double turnoverRate = recentQuantityExited > 0 && item.getCurrentQuantity() > 0 
                ? (double) recentQuantityExited / (6.0 * item.getCurrentQuantity()) 
                : 0.0;
        
        int averageMonthlyConsumption = recentMovements.size() > 0 
                ? recentQuantityExited / 6 
                : 0;
        
        String status = item.getCurrentQuantity() == 0 ? "OUT" :
                       item.getCurrentQuantity() <= item.getMinimumQuantity() ? "LOW" :
                       item.getCurrentQuantity() > (item.getMinimumQuantity() * 3) ? "OVER" : "NORMAL";
        
        BigDecimal totalValue = item.getUnitCost() != null && item.getCurrentQuantity() != null
                ? item.getUnitCost().multiply(BigDecimal.valueOf(item.getCurrentQuantity()))
                : BigDecimal.ZERO;
        
        List<MovementSummaryDTO> recentMovementsDTO = movements.stream()
                .limit(10)
                .map(this::convertToMovementSummaryDTO)
                .collect(Collectors.toList());
        
        return StockItemReportDTO.builder()
                .id(item.getId())
                .code(item.getCode())
                .name(item.getName())
                .category(item.getCategory())
                .sizeVariation(item.getSizeVariation())
                .currentQuantity(item.getCurrentQuantity())
                .minimumQuantity(item.getMinimumQuantity())
                .unitCost(item.getUnitCost())
                .totalValue(totalValue)
                .supplier(item.getSupplier())
                .unitName(item.getUnit() != null ? item.getUnit().getName() : null)
                .lastMovementDate(lastMovementDate)
                .totalMovements(totalMovements)
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .totalQuantityEntered(totalQuantityEntered)
                .totalQuantityExited(totalQuantityExited)
                .totalCostEntered(totalCostEntered)
                .totalCostExited(totalCostExited)
                .turnoverRate(turnoverRate)
                .averageMonthlyConsumption(averageMonthlyConsumption)
                .status(status)
                .recentMovements(recentMovementsDTO)
                .build();
    }

    @Transactional(readOnly = true)
    public MovementsReportDTO getMovementsReport(LocalDateTime startDate, LocalDateTime endDate, UUID itemId, UUID employeeId, MovementType movementType) {
        log.info("Gerando relatÃ³rio de movimentaÃ§Ãµes de {} atÃ© {}", startDate, endDate);
        
        Specification<StockMovement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("movementDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("movementDate"), endDate));
            }
            if (itemId != null) {
                predicates.add(cb.equal(root.get("stockItem").get("id"), itemId));
            }
            if (employeeId != null) {
                predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            }
            if (movementType != null) {
                predicates.add(cb.equal(root.get("movementType"), movementType));
            }
            
            query.orderBy(cb.desc(root.get("movementDate")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        List<StockMovement> movements = stockMovementRepository.findAll(spec);
        
        long totalMovements = movements.size();
        long totalEntries = movements.stream().filter(m -> m.getMovementType() == MovementType.ENTRADA).count();
        long totalExits = movements.stream().filter(m -> m.getMovementType() == MovementType.SAIDA).count();
        
        int totalQuantityEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        int totalQuantityExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        BigDecimal totalCostEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCostExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<String, Long> movementsByType = movements.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getMovementType().name(),
                        Collectors.counting()
                ));
        
        Map<String, Long> movementsByReason = movements.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getReason().name(),
                        Collectors.counting()
                ));
        
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Integer> movementsByDay = movements.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getMovementDate().format(dayFormatter),
                        Collectors.summingInt(StockMovement::getQuantity)
                ));
        
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Integer> movementsByMonth = movements.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getMovementDate().format(monthFormatter),
                        Collectors.summingInt(StockMovement::getQuantity)
                ));
        
        // Top itens mais movimentados
        Map<UUID, MovementsReportDTO.ItemMovementSummaryDTO> itemMap = new HashMap<>();
        for (StockMovement m : movements) {
            UUID itemIdKey = m.getStockItem().getId();
            MovementsReportDTO.ItemMovementSummaryDTO summary = itemMap.getOrDefault(itemIdKey,
                    MovementsReportDTO.ItemMovementSummaryDTO.builder()
                            .itemId(itemIdKey.toString())
                            .itemName(m.getStockItem().getName())
                            .itemCode(m.getStockItem().getCode())
                            .movementCount(0L)
                            .totalQuantity(0)
                            .totalCost(BigDecimal.ZERO)
                            .build());
            
            summary.setMovementCount(summary.getMovementCount() + 1);
            summary.setTotalQuantity(summary.getTotalQuantity() + m.getQuantity());
            if (m.getTotalCost() != null) {
                summary.setTotalCost(summary.getTotalCost().add(m.getTotalCost()));
            }
            itemMap.put(itemIdKey, summary);
        }
        
        List<MovementsReportDTO.ItemMovementSummaryDTO> topMovedItems = itemMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getMovementCount(), a.getMovementCount()))
                .limit(10)
                .collect(Collectors.toList());
        
        // Top funcionÃ¡rios
        Map<UUID, MovementsReportDTO.EmployeeMovementSummaryDTO> employeeMap = new HashMap<>();
        for (StockMovement m : movements) {
            if (m.getEmployee() != null) {
                UUID empId = m.getEmployee().getId();
                MovementsReportDTO.EmployeeMovementSummaryDTO summary = employeeMap.getOrDefault(empId,
                        MovementsReportDTO.EmployeeMovementSummaryDTO.builder()
                                .employeeId(empId.toString())
                                .employeeName(m.getEmployeeName())
                                .movementCount(0L)
                                .totalQuantity(0)
                                .itemsReceived(new ArrayList<>())
                                .build());
                
                summary.setMovementCount(summary.getMovementCount() + 1);
                summary.setTotalQuantity(summary.getTotalQuantity() + m.getQuantity());
                if (!summary.getItemsReceived().contains(m.getStockItem().getName())) {
                    summary.getItemsReceived().add(m.getStockItem().getName());
                }
                employeeMap.put(empId, summary);
            }
        }
        
        List<MovementsReportDTO.EmployeeMovementSummaryDTO> topEmployees = employeeMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getMovementCount(), a.getMovementCount()))
                .limit(10)
                .collect(Collectors.toList());
        
        List<MovementSummaryDTO> movementsDTO = movements.stream()
                .map(this::convertToMovementSummaryDTO)
                .collect(Collectors.toList());
        
        return MovementsReportDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalMovements(totalMovements)
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .totalQuantityEntered(totalQuantityEntered)
                .totalQuantityExited(totalQuantityExited)
                .totalCostEntered(totalCostEntered)
                .totalCostExited(totalCostExited)
                .movements(movementsDTO)
                .movementsByType(movementsByType)
                .movementsByReason(movementsByReason)
                .movementsByDay(movementsByDay)
                .movementsByMonth(movementsByMonth)
                .topMovedItems(topMovedItems)
                .topEmployees(topEmployees)
                .build();
    }

    @Transactional(readOnly = true)
    public LowStockReportDTO getLowStockReport() {
        log.info("Gerando relatÃ³rio de estoque baixo");
        
        List<StockItem> allItems = stockItemRepository.findByActiveTrue();
        List<StockItem> lowStockItems = stockItemRepository.findLowStockItems();
        List<StockItem> outOfStockItems = stockItemRepository.findOutOfStockItems();
        
        // Itens crÃ­ticos (estoque <= 10% do mÃ­nimo)
        List<StockItem> criticalItems = allItems.stream()
                .filter(item -> item.getMinimumQuantity() > 0 && 
                               item.getCurrentQuantity() <= (item.getMinimumQuantity() * 0.1))
                .collect(Collectors.toList());
        
        BigDecimal totalValueAtRisk = lowStockItems.stream()
                .filter(item -> item.getUnitCost() != null)
                .map(item -> item.getUnitCost().multiply(BigDecimal.valueOf(item.getCurrentQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<StockItemReportDTO> itemsDTO = lowStockItems.stream()
                .map(item -> convertToItemReportDTO(item, false))
                .collect(Collectors.toList());
        
        List<StockItemReportDTO> criticalItemsDTO = criticalItems.stream()
                .map(item -> convertToItemReportDTO(item, false))
                .collect(Collectors.toList());
        
        List<StockItemReportDTO> outOfStockItemsDTO = outOfStockItems.stream()
                .map(item -> convertToItemReportDTO(item, false))
                .collect(Collectors.toList());
        
        return LowStockReportDTO.builder()
                .totalItems((long) allItems.size())
                .lowStockItems((long) lowStockItems.size())
                .outOfStockItems((long) outOfStockItems.size())
                .criticalItems((long) criticalItems.size())
                .totalValueAtRisk(totalValueAtRisk)
                .items(itemsDTO)
                .criticalItemsList(criticalItemsDTO)
                .outOfStockItemsList(outOfStockItemsDTO)
                .build();
    }

    @Transactional(readOnly = true)
    public DateRangeReportDTO getDateRangeReport(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Gerando relatÃ³rio por perÃ­odo de {} atÃ© {}", startDate, endDate);
        
        List<StockMovement> movements = stockMovementRepository.findByMovementDateBetweenOrderByMovementDateDesc(
                startDate, endDate);
        
        long totalMovements = movements.size();
        long totalEntries = movements.stream().filter(m -> m.getMovementType() == MovementType.ENTRADA).count();
        long totalExits = movements.stream().filter(m -> m.getMovementType() == MovementType.SAIDA).count();
        
        int totalQuantityEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        int totalQuantityExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        BigDecimal totalCostEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCostExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Resumo diÃ¡rio
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, DateRangeReportDTO.DailySummaryDTO> dailySummaries = new HashMap<>();
        for (StockMovement m : movements) {
            String dateKey = m.getMovementDate().format(dayFormatter);
            DateRangeReportDTO.DailySummaryDTO daily = dailySummaries.getOrDefault(dateKey,
                    DateRangeReportDTO.DailySummaryDTO.builder()
                            .date(dateKey)
                            .movements(0L)
                            .entries(0)
                            .exits(0)
                            .costEntered(BigDecimal.ZERO)
                            .costExited(BigDecimal.ZERO)
                            .build());
            
            daily.setMovements(daily.getMovements() + 1);
            if (m.getMovementType() == MovementType.ENTRADA) {
                daily.setEntries(daily.getEntries() + m.getQuantity());
                if (m.getTotalCost() != null) {
                    daily.setCostEntered(daily.getCostEntered().add(m.getTotalCost()));
                }
            } else {
                daily.setExits(daily.getExits() + m.getQuantity());
                if (m.getTotalCost() != null) {
                    daily.setCostExited(daily.getCostExited().add(m.getTotalCost()));
                }
            }
            dailySummaries.put(dateKey, daily);
        }
        
        // Resumo mensal
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, DateRangeReportDTO.MonthlySummaryDTO> monthlySummaries = new HashMap<>();
        for (StockMovement m : movements) {
            String monthKey = m.getMovementDate().format(monthFormatter);
            DateRangeReportDTO.MonthlySummaryDTO monthly = monthlySummaries.getOrDefault(monthKey,
                    DateRangeReportDTO.MonthlySummaryDTO.builder()
                            .month(monthKey)
                            .movements(0L)
                            .entries(0)
                            .exits(0)
                            .costEntered(BigDecimal.ZERO)
                            .costExited(BigDecimal.ZERO)
                            .build());
            
            monthly.setMovements(monthly.getMovements() + 1);
            if (m.getMovementType() == MovementType.ENTRADA) {
                monthly.setEntries(monthly.getEntries() + m.getQuantity());
                if (m.getTotalCost() != null) {
                    monthly.setCostEntered(monthly.getCostEntered().add(m.getTotalCost()));
                }
            } else {
                monthly.setExits(monthly.getExits() + m.getQuantity());
                if (m.getTotalCost() != null) {
                    monthly.setCostExited(monthly.getCostExited().add(m.getTotalCost()));
                }
            }
            monthlySummaries.put(monthKey, monthly);
        }
        
        // Itens com movimentaÃ§Ãµes
        Set<UUID> itemIds = movements.stream()
                .map(m -> m.getStockItem().getId())
                .collect(Collectors.toSet());
        
        List<StockItemReportDTO> itemsWithMovements = itemIds.stream()
                .map(id -> {
                    StockItem item = stockItemRepository.findById(id).orElse(null);
                    return item != null ? convertToItemReportDTO(item, true) : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        // Resumo por categoria
        Map<StockCategory, DateRangeReportDTO.CategorySummaryDTO> categoryMap = new HashMap<>();
        for (StockMovement m : movements) {
            StockCategory category = m.getStockItem().getCategory();
            DateRangeReportDTO.CategorySummaryDTO summary = categoryMap.getOrDefault(category,
                    DateRangeReportDTO.CategorySummaryDTO.builder()
                            .category(category.name())
                            .totalMovements(0L)
                            .totalQuantity(0)
                            .totalCost(BigDecimal.ZERO)
                            .itemsCount(0L)
                            .build());
            
            summary.setTotalMovements(summary.getTotalMovements() + 1);
            summary.setTotalQuantity(summary.getTotalQuantity() + m.getQuantity());
            if (m.getTotalCost() != null) {
                summary.setTotalCost(summary.getTotalCost().add(m.getTotalCost()));
            }
            categoryMap.put(category, summary);
        }
        
        // Contar itens Ãºnicos por categoria
        for (StockCategory category : categoryMap.keySet()) {
            long uniqueItems = movements.stream()
                    .filter(m -> m.getStockItem().getCategory() == category)
                    .map(m -> m.getStockItem().getId())
                    .distinct()
                    .count();
            categoryMap.get(category).setItemsCount(uniqueItems);
        }
        
        List<DateRangeReportDTO.CategorySummaryDTO> categorySummaries = new ArrayList<>(categoryMap.values());
        
        return DateRangeReportDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalMovements(totalMovements)
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .totalQuantityEntered(totalQuantityEntered)
                .totalQuantityExited(totalQuantityExited)
                .totalCostEntered(totalCostEntered)
                .totalCostExited(totalCostExited)
                .dailySummaries(dailySummaries)
                .monthlySummaries(monthlySummaries)
                .itemsWithMovements(itemsWithMovements)
                .categorySummaries(categorySummaries)
                .build();
    }

    // ===== MÃ‰TODOS AUXILIARES PARA RELATÃ“RIOS =====

    private MovementSummaryDTO convertToMovementSummaryDTO(StockMovement movement) {
        return MovementSummaryDTO.builder()
                .id(movement.getId())
                .movementDate(movement.getMovementDate())
                .movementType(movement.getMovementType())
                .reason(movement.getReason())
                .quantity(movement.getQuantity())
                .previousQuantity(movement.getPreviousQuantity())
                .newQuantity(movement.getNewQuantity())
                .unitCost(movement.getUnitCost())
                .totalCost(movement.getTotalCost())
                .employeeName(movement.getEmployeeName())
                .userName(movement.getUserName())
                .documentNumber(movement.getDocumentNumber())
                .itemName(movement.getStockItem().getName())
                .itemCode(movement.getStockItem().getCode())
                .build();
    }

    private StockItemReportDTO convertToItemReportDTO(StockItem item, boolean includeMovements) {
        List<StockMovement> movements = includeMovements 
                ? stockMovementRepository.findByStockItemIdOrderByMovementDateDesc(item.getId())
                : new ArrayList<>();
        
        long totalMovements = movements.size();
        long totalEntries = movements.stream().filter(m -> m.getMovementType() == MovementType.ENTRADA).count();
        long totalExits = movements.stream().filter(m -> m.getMovementType() == MovementType.SAIDA).count();
        
        int totalQuantityEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        int totalQuantityExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA)
                .mapToInt(StockMovement::getQuantity)
                .sum();
        
        BigDecimal totalCostEntered = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.ENTRADA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCostExited = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SAIDA && m.getTotalCost() != null)
                .map(StockMovement::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        LocalDateTime lastMovementDate = movements.isEmpty() ? null : movements.get(0).getMovementDate();
        
        String status = item.getCurrentQuantity() == 0 ? "OUT" :
                       item.getCurrentQuantity() <= item.getMinimumQuantity() ? "LOW" :
                       item.getCurrentQuantity() > (item.getMinimumQuantity() * 3) ? "OVER" : "NORMAL";
        
        BigDecimal totalValue = item.getUnitCost() != null && item.getCurrentQuantity() != null
                ? item.getUnitCost().multiply(BigDecimal.valueOf(item.getCurrentQuantity()))
                : BigDecimal.ZERO;
        
        List<MovementSummaryDTO> recentMovementsDTO = includeMovements 
                ? movements.stream()
                        .limit(10)
                        .map(this::convertToMovementSummaryDTO)
                        .collect(Collectors.toList())
                : new ArrayList<>();
        
        return StockItemReportDTO.builder()
                .id(item.getId())
                .code(item.getCode())
                .name(item.getName())
                .category(item.getCategory())
                .sizeVariation(item.getSizeVariation())
                .currentQuantity(item.getCurrentQuantity())
                .minimumQuantity(item.getMinimumQuantity())
                .unitCost(item.getUnitCost())
                .totalValue(totalValue)
                .supplier(item.getSupplier())
                .unitName(item.getUnit() != null ? item.getUnit().getName() : null)
                .lastMovementDate(lastMovementDate)
                .totalMovements(totalMovements)
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .totalQuantityEntered(totalQuantityEntered)
                .totalQuantityExited(totalQuantityExited)
                .totalCostEntered(totalCostEntered)
                .totalCostExited(totalCostExited)
                .status(status)
                .recentMovements(recentMovementsDTO)
                .build();
    }

    // ===== MÃ‰TODOS AUXILIARES =====

    private void checkAndCreateLowStockAlert(StockItem item) {
        // Verificar se jÃ¡ existe alerta ativo para este item
        boolean hasActiveAlert = stockAlertRepository.existsByStockItemIdAndAlertTypeAndIsResolvedFalse(
                item.getId(), "LOW_STOCK");
        
        if (item.isLowStock() && !hasActiveAlert) {
            // Criar alerta de baixo estoque
            StockAlert alert = new StockAlert();
            alert.setStockItem(item);
            alert.setAlertType("LOW_STOCK");
            alert.setMessage(String.format("Item '%s' com baixo estoque: %d unidades (mÃ­nimo: %d)", 
                    item.getFullName(), item.getCurrentQuantity(), item.getMinimumQuantity()));
            alert.setCurrentQuantity(item.getCurrentQuantity());
            alert.setMinimumQuantity(item.getMinimumQuantity());
            alert.setPriority(item.getCurrentQuantity() == 0 ? 4 : 3); // CrÃ­tica se zerado, alta se baixo
            
            stockAlertRepository.save(alert);
            log.info("Alerta de baixo estoque criado para item: {}", item.getFullName());
        }
        
        // Se nÃ£o estÃ¡ mais em baixo estoque, resolver alertas ativos
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

    // ===== MÃ‰TODOS ESPECÃFICOS =====

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
            log.info("Buscando as {} movimentaÃ§Ãµes mais recentes...", limit);
            List<StockMovement> recentMovements = stockMovementRepository.findTop10ByOrderByMovementDateDesc();
            log.info("Encontrados {} movimentaÃ§Ãµes recentes", recentMovements.size());
            
            return recentMovements.stream()
                    .map(movement -> {
                        try {
                            return StockMovementDTO.fromEntity(movement);
                        } catch (Exception e) {
                            log.error("Erro ao converter movimentaÃ§Ã£o {}: {}", movement.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(movement -> movement != null)
                    .limit(limit)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Erro ao buscar movimentaÃ§Ãµes recentes: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}
