package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.StockItemDTO;
import com.z7design.fleet_manager.dto.StockMovementDTO;
import com.z7design.fleet_manager.dto.StockAlertDTO;
import com.z7design.fleet_manager.dto.StockItemReportDTO;
import com.z7design.fleet_manager.dto.MovementSummaryDTO;
import com.z7design.fleet_manager.dto.MovementsReportDTO;
import com.z7design.fleet_manager.dto.LowStockReportDTO;
import com.z7design.fleet_manager.dto.DateRangeReportDTO;
import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.StockAlert;
import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.VehicleBattery;
import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.enums.TireStatus;
import com.z7design.fleet_manager.repository.VehicleBatteryRepository;
import com.z7design.fleet_manager.repository.TireRepository;
import com.z7design.fleet_manager.model.enums.StockCategory;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.StockItemRepository;
import com.z7design.fleet_manager.repository.StockMovementRepository;
import com.z7design.fleet_manager.repository.StockAlertRepository;
import com.z7design.fleet_manager.repository.PersonalProtectiveEquipmentRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import java.io.InputStream;
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
    private final CompanyRepository companyRepository;
    private final UserCompanyResolver userCompanyResolver;
    private final PersonalProtectiveEquipmentRepository personalProtectiveEquipmentRepository;
    private final VehicleBatteryRepository vehicleBatteryRepository;
    private final TireRepository tireRepository;

    // ===== GESTÃƒO DE ITENS =====

    public List<StockItemDTO> getAllItems() {
        log.info("Buscando todos os itens de estoque");
        List<StockItemDTO> dtos = stockItemRepository.findByActiveTrue().stream()
                .map(StockItemDTO::fromEntity)
                .collect(Collectors.toList());
        populateMovementCounts(dtos);
        return dtos;
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
        
        Page<StockItemDTO> page = stockItemRepository.findByFilters(category, active, unitId, lowStock, searchTerm, pageable)
                .map(StockItemDTO::fromEntity);
        populateMovementCounts(page.getContent());
        return page;
    }

    /**
     * Popula o movementCount dos DTOs com uma única query agrupada (evita N+1).
     */
    private void populateMovementCounts(List<StockItemDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        java.util.Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : stockMovementRepository.countMovementsByItem()) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                counts.put((UUID) row[0], (Long) row[1]);
            }
        }
        for (StockItemDTO dto : dtos) {
            Long c = counts.get(dto.getId());
            dto.setMovementCount(c != null ? c.intValue() : 0);
        }
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
        
        // Verificar se código já existe
        if (dto.getCode() != null && stockItemRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Já existe um item com o código: " + dto.getCode());
        }

        // Validação da NF de Entrada quando houver saldo inicial
        if (dto.getCurrentQuantity() != null && dto.getCurrentQuantity() > 0 && (dto.getInvoiceNumber() == null || dto.getInvoiceNumber().trim().isEmpty())) {
            throw new BusinessException("Para cadastrar item com saldo inicial em estoque, é obrigatório informar a Nota Fiscal de Entrada.");
        }
        
        StockItem item = StockItemDTO.toEntity(dto);
        
        // Associar unidade se especificada
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada: " + dto.getUnitId()));
            item.setUnit(unit);
        }
        
        item = stockItemRepository.save(item);
        
        // Se houver saldo inicial, registrar movimentação de entrada inicial
        if (item.getCurrentQuantity() != null && item.getCurrentQuantity() > 0) {
            try {
                StockMovement initialMovement = new StockMovement();
                initialMovement.setStockItem(item);
                initialMovement.setMovementType(com.z7design.fleet_manager.model.enums.MovementType.ENTRADA);
                initialMovement.setReason(com.z7design.fleet_manager.model.enums.MovementReason.COMPRA);
                initialMovement.setQuantity(item.getCurrentQuantity());
                initialMovement.setPreviousQuantity(0);
                initialMovement.setNewQuantity(item.getCurrentQuantity());
                initialMovement.setDocumentNumber(item.getInvoiceNumber());
                initialMovement.setSupplier(item.getSupplier());
                initialMovement.setUnitCost(item.getUnitCost());
                if (item.getUnitCost() != null && item.getCurrentQuantity() != null) {
                    initialMovement.setTotalCost(item.getUnitCost().multiply(java.math.BigDecimal.valueOf(item.getCurrentQuantity())));
                }
                initialMovement.setMovementDate(LocalDateTime.now());
                initialMovement = stockMovementRepository.save(initialMovement);

                // Sincronizar baterias ou pneus individuais na frota
                syncBatteryAndTireInbound(item, item.getCurrentQuantity(), item.getInvoiceNumber(), item.getSupplier(), item.getUnitCost(), initialMovement.getId());
            } catch (Exception e) {
                log.warn("Erro ao registrar movimentação inicial de estoque para o item {}: {}", item.getCode(), e.getMessage());
            }
        }
        
        // Criar alerta se quantidade inicial for baixa
        checkAndCreateLowStockAlert(item);
        
        // Sincronizar com módulo SST (EPIs)
        syncWithPersonalProtectiveEquipment(item);

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
        if (dto.getCurrentQuantity() != null) {
            existingItem.setCurrentQuantity(dto.getCurrentQuantity());
        }
        if (dto.getMinimumQuantity() != null) {
            existingItem.setMinimumQuantity(dto.getMinimumQuantity());
        }
        existingItem.setUnitCost(dto.getUnitCost());
        existingItem.setSupplier(dto.getSupplier());
        existingItem.setInvoiceNumber(dto.getInvoiceNumber());
        existingItem.setBarcode(dto.getBarcode());
        if (dto.getActive() != null) {
            existingItem.setActive(dto.getActive());
        }
        existingItem.setNotes(dto.getNotes());
        existingItem.setCaNumber(dto.getCaNumber());
        existingItem.setCaValidity(dto.getCaValidity());
        existingItem.setManufacturer(dto.getManufacturer());
        if (dto.getEpiId() != null) {
            existingItem.setEpiId(dto.getEpiId());
        }

        // Atualizar unidade se especificada
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + dto.getUnitId()));
            existingItem.setUnit(unit);
        }

        existingItem = stockItemRepository.save(existingItem);
        
        // Verificar se precisa criar/resolver alertas
        checkAndCreateLowStockAlert(existingItem);
        
        // Sincronizar com módulo SST (EPIs)
        syncWithPersonalProtectiveEquipment(existingItem);

        log.info("Item atualizado com sucesso: {}", id);
        return StockItemDTO.fromEntity(existingItem);
    }

    public void deleteItem(UUID id) {
        log.info("Excluindo item de estoque: {}", id);
        
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));
        
        // Regra de Negócio: Verificar se o item está zerado
        if (item.getCurrentQuantity() != null && item.getCurrentQuantity() > 0) {
            throw new BusinessException("Não é possível excluir o item '" + item.getName() + "' pois ele possui saldo em estoque (" + item.getCurrentQuantity() + " unidades). Para excluir, o saldo deve estar zerado.");
        }
        
        // Se houver histórico de movimentações, faz Soft Delete (inativa) para manter integridade
        boolean hasMovements = stockMovementRepository.existsByStockItemId(id);
        if (hasMovements) {
            item.setActive(false);
            stockItemRepository.save(item);
            log.info("Item marcado como inativo devido ao histórico de movimentações: {}", id);
        } else {
            // Se nunca teve movimentações e está zerado, exclusão física definitiva
            stockItemRepository.delete(item);
            log.info("Item excluído definitivamente: {}", id);
        }
    }

    public byte[] generateQrCodeImage(UUID id, int width, int height) {
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item de estoque não encontrado: " + id));

        StringBuilder qrPayload = new StringBuilder();
        qrPayload.append("{\"app\":\"FLEET_STOCK\"");
        qrPayload.append(",\"id\":\"").append(item.getId()).append("\"");
        qrPayload.append(",\"codigo\":\"").append(escapeJson(item.getCode())).append("\"");
        qrPayload.append(",\"nome\":\"").append(escapeJson(item.getName())).append("\"");
        if (item.getSizeVariation() != null && !item.getSizeVariation().isBlank()) {
            qrPayload.append(",\"variacao\":\"").append(escapeJson(item.getSizeVariation())).append("\"");
        }
        qrPayload.append(",\"categoria\":\"").append(item.getCategory() != null ? item.getCategory().name() : "").append("\"");
        if (item.getCaNumber() != null && !item.getCaNumber().isBlank()) {
            qrPayload.append(",\"ca\":\"").append(escapeJson(item.getCaNumber())).append("\"");
        }
        qrPayload.append(",\"quantidade\":").append(item.getCurrentQuantity() != null ? item.getCurrentQuantity() : 0);
        if (item.getSupplier() != null && !item.getSupplier().isBlank()) {
            qrPayload.append(",\"fornecedor\":\"").append(escapeJson(item.getSupplier())).append("\"");
        }
        if (item.getInvoiceNumber() != null && !item.getInvoiceNumber().isBlank()) {
            qrPayload.append(",\"nf\":\"").append(escapeJson(item.getInvoiceNumber())).append("\"");
        }
        qrPayload.append("}");

        try {
            int w = width > 0 ? width : 300;
            int h = height > 0 ? height : 300;
            com.google.zxing.common.BitMatrix bitMatrix = new com.google.zxing.MultiFormatWriter().encode(
                    qrPayload.toString(),
                    com.google.zxing.BarcodeFormat.QR_CODE,
                    w,
                    h
            );
            java.awt.image.BufferedImage image = com.google.zxing.client.j2se.MatrixToImageWriter.toBufferedImage(bitMatrix);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar imagem QR Code para item de estoque {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar QR Code do item: " + e.getMessage(), e);
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", "");
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

        // Sincronizar baterias ou pneus individuais se for ENTRADA
        if (dto.getMovementType() == MovementType.ENTRADA && dto.getQuantity() != null && dto.getQuantity() > 0) {
            syncBatteryAndTireInbound(item, dto.getQuantity(), dto.getDocumentNumber(), dto.getSupplier(), dto.getUnitCost(), movement.getId());
        }

        // Verificar alertas
        checkAndCreateLowStockAlert(item);
        
        log.info("Movimentação criada com sucesso - ID: {}, Nova quantidade: {}", movement.getId(), newQuantity);
        return StockMovementDTO.fromEntity(movement);
    }

    /**
     * Exclui uma movimentacao revertendo o efeito no saldo de estoque.
     * ENTRADA: o item perdeu a quantidade (o saldo volta ao anterior).
     * SAIDA: o item ganha a quantidade de volta.
     */
    @Transactional
    public void deleteMovement(UUID id) {
        log.info("Excluindo movimentacao: {}", id);

        StockMovement movement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimentacao nao encontrada: " + id));

        StockItem item = movement.getStockItem();
        int quantity = movement.getQuantity();
        int current = item.getCurrentQuantity() != null ? item.getCurrentQuantity() : 0;

        int revertedQuantity;
        if (movement.getMovementType() == MovementType.ENTRADA) {
            // Se for entrada de bateria ou pneu, estorna as unidades correspondentes que ainda estão em estoque
            cleanupLinkedBatteriesAndTires(movement);

            // A entrada havia adicionado ao saldo; ao excluir, subtraimos de volta.
            revertedQuantity = current - quantity;
            if (revertedQuantity < 0) {
                throw new IllegalArgumentException(
                        "Nao e possivel excluir: o item ja consumiu a quantidade desta entrada. Estoque atual: " + current);
            }
        } else {
            // A saida havia removido do saldo; ao excluir, devolvemos ao estoque.
            revertedQuantity = current + quantity;
        }

        item.setCurrentQuantity(revertedQuantity);
        stockItemRepository.save(item);
        stockMovementRepository.delete(movement);

        // Atualizar alertas depois de concluir a exclusao (evita estado inconsistente em lote)
        checkAndCreateLowStockAlert(item);

        log.info("Movimentacao {} excluida. Estoque do item {} ajustado para: {}", id, item.getCode(), revertedQuantity);
    }

    /**
     * Exclui varias movimentacoes em lote, revertendo o saldo de cada uma.
     * Retorna o numero de movimentacoes excluidas com sucesso.
     */
    @Transactional
    public int deleteMovements(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        int deleted = 0;
        java.util.List<UUID> failedIds = new java.util.ArrayList<>();
        for (UUID id : ids) {
            try {
                deleteMovement(id);
                deleted++;
            } catch (Exception e) {
                log.warn("Nao foi possivel excluir movimentacao {}: {}", id, e.getMessage());
                failedIds.add(id);
            }
        }
        if (!failedIds.isEmpty()) {
            log.warn("Movimentacoes nao excluidas ({}): {}", failedIds.size(), failedIds);
        }
        return deleted;
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
        Optional<StockAlert> alertOpt = stockAlertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alerta não encontrado no banco para resolver: {}. Ignorando ação.", alertId);
            return;
        }
        StockAlert alert = alertOpt.get();
        
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            user = userRepository.findByActiveTrue().stream().findFirst().orElse(null);
        }
        
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

    /**
     * Resolve a empresa do tenant atual a partir do TenantContext ou do Authentication / UserCompanyResolver.
     */
    private UUID resolveTenantCompanyId() {
        UUID tenantCompanyId = TenantContext.get();
        if (tenantCompanyId != null) {
            return tenantCompanyId;
        }
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String username = auth.getName();
                if (username != null) {
                    User user = userRepository.findByUsername(username)
                            .or(() -> userRepository.findByEmail(username))
                            .orElse(null);
                    if (user != null) {
                        UUID compId = userCompanyResolver.resolveCompanyId(user);
                        if (compId != null) {
                            log.info("📥 [IMPORT-STOCK] Tenant resolvido via UserCompanyResolver para usuário {}: {}",
                                    username, compId);
                            return compId;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("📥 [IMPORT-STOCK] Erro ao resolver empresa por Authentication: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Importa itens de estoque a partir de planilha Excel (.xlsx/.xls).
     * Colunas esperadas: Código/Item, Produto/Descrição, Estoque/Saldo, Vr. Compra/Custo, Custo Médio/Total.
     * Suporta relatórios ERP almoxarifado com cabeçalhos com quebra, títulos e totalizadores.
     * Realiza validação de multiempresa por CNPJ e upsert por (companyId, code).
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ImportResultDto importExcel(MultipartFile file) {
        ImportResultDto result = ImportResultDto.empty();
        UUID tenantCompanyId = resolveTenantCompanyId();

        log.info("📥 [IMPORT-STOCK] Iniciando importação - arquivo: {}, tenantCompanyId: {}",
                file != null ? file.getOriginalFilename() : "null", tenantCompanyId);

        if (file == null || file.isEmpty()) {
            result.getErrors().add("Arquivo vazio ou não enviado.");
            log.warn("📥 [IMPORT-STOCK] Falhou: arquivo vazio.");
            return result;
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            result.getErrors().add("Formato não suportado. Use .xlsx ou .xls");
            log.warn("📥 [IMPORT-STOCK] Falhou: formato inválido ({})", filename);
            return result;
        }

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                result.getErrors().add("Planilha sem abas (Sheets).");
                return result;
            }

            DataFormatter formatter = new DataFormatter();
            int colCode = -1, colQty = -1, colUnitCost = -1, colAvgCost = -1;
            int colName = -1, colCnpj = -1, colCategory = -1;
            int headerRowIndex = -1;
            String headerGlobalCnpj = null;

            // Escanear até 30 linhas para encontrar o cabeçalho real da tabela
            int maxHeaderScan = Math.min(30, sheet.getLastRowNum());
            for (int r = 0; r <= maxHeaderScan; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                Map<String, Integer> currentHeaderMap = new HashMap<>();
                boolean rowHasCode = false;
                boolean rowHasName = false;
                boolean rowHasQty = false;
                boolean rowHasCost = false;

                for (int i = 0; i < row.getLastCellNum(); i++) {
                    Cell cell = row.getCell(i);
                    if (cell == null) continue;
                    String cellRaw = formatter.formatCellValue(cell);
                    String cellText = normalizeHeader(cellRaw);
                    if (cellText.isEmpty()) continue;

                    currentHeaderMap.put(cellText, i);

                    if (isCodeHeader(cellText)) rowHasCode = true;
                    if (isNameHeader(cellText)) rowHasName = true;
                    if (isQtyHeader(cellText)) rowHasQty = true;
                    if (isUnitCostHeader(cellText) || isAvgCostHeader(cellText)) rowHasCost = true;

                    // Se encontrar menção a CNPJ no texto do cabeçalho/título prévio
                    if (headerGlobalCnpj == null && cellRaw.toLowerCase().contains("cnpj")) {
                        String digits = cellRaw.replaceAll("[^0-9]", "");
                        if (digits.length() == 14) {
                            headerGlobalCnpj = digits;
                            log.info("📥 [IMPORT-STOCK] CNPJ global detectado no título (linha {}): {}", r, headerGlobalCnpj);
                        }
                    }
                }

                // Identifica se a linha é o cabeçalho das colunas
                if ((rowHasCode && (rowHasName || rowHasQty || rowHasCost)) || (rowHasName && rowHasQty)) {
                    headerRowIndex = r;
                    log.info("📥 [IMPORT-STOCK] Linha de cabeçalho detectada no índice {}: {}", r, currentHeaderMap.keySet());

                    for (Map.Entry<String, Integer> entry : currentHeaderMap.entrySet()) {
                        String k = entry.getKey();
                        int idx = entry.getValue();

                        if (colCnpj == -1 && isCnpjHeader(k)) colCnpj = idx;
                        else if (colCode == -1 && isCodeHeader(k)) colCode = idx;
                        else if (colName == -1 && isNameHeader(k)) colName = idx;
                        else if (colQty == -1 && isQtyHeader(k)) colQty = idx;
                        else if (colUnitCost == -1 && isUnitCostHeader(k)) colUnitCost = idx;
                        else if (colAvgCost == -1 && isAvgCostHeader(k)) colAvgCost = idx;
                        else if (colCategory == -1 && isCategoryHeader(k)) colCategory = idx;
                    }
                    break;
                }
            }

            // Fallback se não detectou linha de cabeçalho explicitamente
            if (headerRowIndex == -1) {
                headerRowIndex = 0;
                colCode = 0;
                colQty = 1;
                colUnitCost = 2;
                colAvgCost = 3;
                log.warn("📥 [IMPORT-STOCK] Nenhum cabeçalho identificado com precisão. Usando colunas padrão (0=Código, 1=Estoque, 2=Vr.Compra, 3=Custo Médio).");
            } else {
                if (colCode == -1) {
                    colCode = (colName == 0) ? 1 : 0;
                }
                if (colName == -1 && colCode != 1) {
                    colName = 1;
                }
                if (colQty == -1) {
                    for (int c = 2; c <= 4; c++) {
                        if (c != colCode && c != colName && c != colUnitCost && c != colAvgCost) {
                            colQty = c;
                            break;
                        }
                    }
                }
            }

            log.info("📥 [IMPORT-STOCK] Mapeamento de colunas: code={}, name={}, qty={}, unitCost={}, avgCost={}, category={}, cnpj={}, headerRow={}",
                    colCode, colName, colQty, colUnitCost, colAvgCost, colCategory, colCnpj, headerRowIndex);

            Map<String, Optional<Company>> companyCache = new HashMap<>();
            int total = 0;

            for (int r = headerRowIndex + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String code = colCode >= 0 ? formatter.formatCellValue(row.getCell(colCode)).trim() : "";
                String name = colName >= 0 ? formatter.formatCellValue(row.getCell(colName)).trim() : "";

                // Linha completamente vazia
                if (code.isEmpty() && name.isEmpty()) {
                    continue;
                }

                String codeUpper = code.toUpperCase();
                String nameUpper = name.toUpperCase();

                // Ignora repetição de cabeçalho (comum em relatórios paginados)
                if (isCodeHeader(normalizeHeader(code)) || codeUpper.equals("CODIGO") || codeUpper.equals("CÓDIGO") || codeUpper.equals("ITEM")) {
                    continue;
                }

                // Ignora linhas de total / subtotal / sumários de ERP almoxarifado
                if (codeUpper.startsWith("TOTAL") || codeUpper.startsWith("SUBTOTAL") || codeUpper.startsWith("RELATÓRIO") ||
                        codeUpper.startsWith("RELATORIO") || codeUpper.startsWith("EMISSÃO") || codeUpper.startsWith("EMISSAO") ||
                        codeUpper.startsWith("PÁGINA") || codeUpper.startsWith("PAGINA") || codeUpper.startsWith("PAGE") ||
                        codeUpper.startsWith("FILIAL") || codeUpper.startsWith("ALMOXARIFADO") ||
                        nameUpper.startsWith("TOTAL") || nameUpper.startsWith("SUBTOTAL") || nameUpper.startsWith("TOTAL GERAL") ||
                        nameUpper.startsWith("TOTAL DO GRUPO")) {
                    log.debug("📥 [IMPORT-STOCK] Linha {} ignorada (sumário/totalizador): code='{}', name='{}'", (r + 1), code, name);
                    continue;
                }

                // Se o código estiver vazio mas houver nome, usa um código sintetizado ou pula se for separador de grupo
                if (code.isEmpty()) {
                    if (nameUpper.startsWith("GRUPO") || nameUpper.startsWith("CATEGORIA") || nameUpper.startsWith("SEÇÃO")) {
                        continue;
                    }
                    code = name.replaceAll("[^a-zA-Z0-9]", "-").toUpperCase();
                    if (code.length() > 30) code = code.substring(0, 30);
                }

                total++;

                try {
                    UUID rowCompanyId = tenantCompanyId;

                    // 1. Tenta extrair CNPJ da coluna correspondente
                    String cnpjToValidate = null;
                    if (colCnpj >= 0) {
                        String rawCnpj = formatter.formatCellValue(row.getCell(colCnpj)).trim();
                        if (!rawCnpj.isEmpty()) {
                            cnpjToValidate = rawCnpj;
                        }
                    }

                    // 2. Se não tem coluna de CNPJ na linha, mas detectamos CNPJ global no cabeçalho
                    if (cnpjToValidate == null && headerGlobalCnpj != null) {
                        cnpjToValidate = headerGlobalCnpj;
                    }

                    // 3. Validação do CNPJ e garantia multiempresa
                    if (cnpjToValidate != null) {
                        String cleanCnpj = cnpjToValidate.replaceAll("[^0-9]", "");
                        if (!cleanCnpj.isEmpty()) {
                            final String cnpjForLookup = cnpjToValidate;
                            Optional<Company> optCompany = companyCache.computeIfAbsent(cleanCnpj, key -> {
                                List<Company> found = companyRepository.findByNormalizedCnpj(key);
                                if (!found.isEmpty()) {
                                    return Optional.of(found.get(0));
                                }
                                return companyRepository.findByCnpj(cnpjForLookup);
                            });

                            if (optCompany.isEmpty()) {
                                // Se o usuário logado já possui uma empresa associada e o CNPJ global do título não foi encontrado no BD
                                // (ex: CNPJ de software house ou cabeçalho informativo), não bloqueamos a importação
                                if (tenantCompanyId != null && cnpjToValidate.equals(headerGlobalCnpj) && colCnpj < 0) {
                                    rowCompanyId = tenantCompanyId;
                                } else {
                                    result.setSkipped(result.getSkipped() + 1);
                                    String err = "Linha " + (r + 1) + " (código " + code + "): Empresa com CNPJ '" + cnpjToValidate + "' não encontrada no sistema.";
                                    result.getErrors().add(err);
                                    log.warn("📥 [IMPORT-STOCK] {}", err);
                                    continue;
                                }
                            } else {
                                Company targetCompany = optCompany.get();
                                // Trava de segurança multiempresa: usuário de uma empresa não pode importar para outra
                                if (tenantCompanyId != null && !targetCompany.getId().equals(tenantCompanyId)) {
                                    if (cnpjToValidate.equals(headerGlobalCnpj) && colCnpj < 0) {
                                        rowCompanyId = tenantCompanyId;
                                    } else {
                                        result.setSkipped(result.getSkipped() + 1);
                                        String err = "Linha " + (r + 1) + " (código " + code + "): Violação multiempresa! O CNPJ '" + cnpjToValidate + "' (" + targetCompany.getName() + ") não pertence à sua empresa.";
                                        result.getErrors().add(err);
                                        log.warn("📥 [IMPORT-STOCK] {}", err);
                                        continue;
                                    }
                                } else {
                                    rowCompanyId = targetCompany.getId();
                                }
                            }
                        }
                    }

                    Integer quantity = colQty >= 0 ? readIntCell(row.getCell(colQty)) : 0;
                    BigDecimal unitCost = colUnitCost >= 0 ? readDecimalCell(row.getCell(colUnitCost)) : null;
                    BigDecimal avgCost = colAvgCost >= 0 ? readDecimalCell(row.getCell(colAvgCost)) : null;

                    StockCategory category = null;
                    if (colCategory >= 0) {
                        category = parseCategory(formatter.formatCellValue(row.getCell(colCategory)));
                    }
                    if (category == null && name != null) {
                        category = parseCategory(name);
                    }

                    log.trace("📥 [IMPORT-STOCK] Linha {}: code={}, name={}, qty={}, unitCost={}, avgCost={}, companyId={}",
                            (r + 1), code, name, quantity, unitCost, avgCost, rowCompanyId);

                    // Busca item existente considerando o isolamento da empresa
                    Optional<StockItem> existing;
                    if (rowCompanyId != null) {
                        existing = stockItemRepository.findByCompanyIdAndCode(rowCompanyId, code);
                    } else {
                        existing = stockItemRepository.findByCodeAndCompanyIdIsNull(code);
                        if (existing.isEmpty()) {
                            existing = stockItemRepository.findByCode(code);
                        }
                    }

                    if (existing.isPresent()) {
                        StockItem item = existing.get();
                        log.debug("📥 [IMPORT-STOCK] Atualizando item existente (id={}, code={})", item.getId(), code);
                        if (name != null && !name.isEmpty()) item.setName(name);
                        if (quantity != null) item.setCurrentQuantity(quantity);
                        if (unitCost != null) item.setUnitCost(unitCost);
                        if (avgCost != null) item.setAverageCost(avgCost);
                        if (category != null) item.setCategory(category);
                        stockItemRepository.save(item);
                        result.setUpdated(result.getUpdated() + 1);
                    } else {
                        StockItem item = new StockItem();
                        item.setCode(code);
                        item.setName((name != null && !name.isEmpty()) ? name : code);
                        item.setCategory(category != null ? category : StockCategory.ACESSORIOS);
                        item.setCurrentQuantity(quantity != null ? quantity : 0);
                        item.setMinimumQuantity(0);
                        item.setUnitCost(unitCost);
                        item.setAverageCost(avgCost);
                        item.setActive(true);

                        if (rowCompanyId != null) {
                            item.setCompanyId(rowCompanyId);
                            log.debug("📥 [IMPORT-STOCK] Criando novo item (code={}) com companyId={}", code, rowCompanyId);
                        } else {
                            log.debug("📥 [IMPORT-STOCK] Criando novo item (code={}) SEM companyId (SUPER_ADMIN)", code);
                        }

                        stockItemRepository.save(item);
                        result.setInserted(result.getInserted() + 1);
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    String rootMsg = msg;
                    Throwable cause = e;
                    while (cause.getCause() != null && cause.getCause() != cause) {
                        cause = cause.getCause();
                        if (cause.getMessage() != null) rootMsg = cause.getMessage();
                    }
                    String lower = rootMsg.toLowerCase();
                    if (lower.contains("duplicate") || lower.contains("unique") || lower.contains("constraint")) {
                        if (tenantCompanyId != null) {
                            rootMsg = "Código '" + code + "' já existe na sua empresa (conflito de código).";
                        } else {
                            rootMsg = "Código '" + code + "' já existe no sistema.";
                        }
                    }
                    result.setSkipped(result.getSkipped() + 1);
                    result.getErrors().add("Linha " + (r + 1) + " (código " + code + "): " + rootMsg);
                    log.warn("📥 [IMPORT-STOCK] SKIP linha {} (code={}): {}", (r + 1), code, rootMsg);
                }
            }

            result.setTotalRows(total);
            log.info("📥 [IMPORT-STOCK] Concluído. Total linhas={}, inserted={}, updated={}, skipped={}, errors={}",
                    total, result.getInserted(), result.getUpdated(), result.getSkipped(), result.getErrors().size());

            if (result.getTotalRows() == 0) {
                result.getErrors().add("Nenhuma linha de produto/estoque válida foi identificada na planilha. Verifique se o cabeçalho contém colunas como 'Código' e 'Estoque'.");
            }
        } catch (Exception e) {
            log.error("📥 [IMPORT-STOCK] Erro FATAL ao importar planilha: {}", e.getMessage(), e);
            result.getErrors().add("Erro ao ler o arquivo: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
        return result;
    }

    private boolean isCodeHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("codigo") || key.equals("cod") || key.equals("itemcode") ||
                key.equals("coditem") || key.equals("codmaterial") || key.equals("codprod") ||
                key.equals("codproduto") || key.equals("codigodoproduto") || key.equals("codigodoitem") ||
                key.equals("codigoalmoxarifado") || key.equals("codalmox") || key.equals("sku") ||
                key.equals("id") || key.equals("identificador") || key.equals("artigo") ||
                key.equals("referencia") || key.equals("ref") || key.contains("cod") || key.contains("referencia");
    }

    private boolean isNameHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("produto") || key.equals("nomedoproduto") || key.equals("descricaodoproduto") ||
                key.equals("descricaodomaterial") || key.equals("descricaodoitem") || key.equals("descricao") ||
                key.equals("desc") || key.equals("item") || key.equals("nome") || key.equals("material") ||
                key.equals("especificacao") || key.equals("discriminacao") || key.equals("mercadoria") ||
                key.equals("artigo") || key.equals("denominacao") || key.equals("detalhes") ||
                key.contains("desc") || key.contains("produto") || key.contains("material") || key.contains("especifica");
    }

    private boolean isQtyHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("estoque") || key.equals("quantidade") || key.equals("qtd") || key.equals("qtde") ||
                key.equals("saldo") || key.equals("saldoatual") || key.equals("saldofisico") ||
                key.equals("saldodisponivel") || key.equals("quantity") || key.equals("qtdatual") ||
                key.equals("qtdestoque") || key.equals("quantidadeatual") || key.equals("quant") ||
                key.equals("qnt") || key.equals("saldoalmoxarifado") || key.equals("saldoestoque") ||
                key.equals("fisico") || key.equals("disponivel") || key.contains("saldo") ||
                key.contains("estoque") || key.contains("quant") || key.contains("qtd");
    }

    private boolean isUnitCostHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("vrcompra") || key.equals("valorcompra") || key.equals("vlcompra") ||
                key.equals("precocompra") || key.equals("custo") || key.equals("unitcost") ||
                key.equals("vrcompranf") || key.equals("valordecompra") || key.equals("vlrunitario") ||
                key.equals("valorunitario") || key.equals("precounitario") || key.equals("precounit") ||
                key.equals("vlunit") || key.equals("vrunit") || key.equals("custounitario") ||
                key.equals("custounit") || key.equals("unitario") || key.equals("custoitem") ||
                key.equals("vlrunit") || key.contains("unitario") || key.contains("vrcompra") ||
                key.contains("vlcompra") || key.contains("custounit") || key.contains("precounit");
    }

    private boolean isAvgCostHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("totalmedio") || key.equals("toralmedio") || key.equals("customedio") ||
                key.equals("customediounitario") || key.equals("totalmed") || key.equals("avgcost") ||
                key.equals("customedioatual") || key.equals("customediototal") || key.equals("vlrtotalmedio") ||
                key.equals("valortotalmedio") || key.equals("totmedio") || key.equals("valormedio") ||
                key.equals("total") || key.equals("vlrtotal") || key.equals("valortotal") ||
                key.equals("saldovalor") || key.equals("valordoestoque") || key.contains("customedio") ||
                key.contains("totalmedio");
    }

    private boolean isCategoryHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("categoria") || key.equals("category") || key.equals("grupodeestoque") ||
                key.equals("tipo") || key.equals("grupo") || key.equals("familia") ||
                key.equals("subgrupo") || key.equals("classe") || key.equals("secao") ||
                key.contains("categoria") || key.contains("grupo");
    }

    private boolean isCnpjHeader(String key) {
        if (key == null || key.isEmpty()) return false;
        return key.equals("cnpj") || key.equals("cnpjdaempresa") || key.equals("cgc") ||
                key.equals("empresa") || key.equals("cnpjempresa") || key.contains("cnpj");
    }

    private StockCategory parseCategory(String text) {
        if (text == null || text.trim().isEmpty()) return null;
        String normalized = normalizeHeader(text);
        if (normalized.contains("vigilancia") || normalized.contains("vigilante")) return StockCategory.UNIFORME_VIGILANCIA;
        if (normalized.contains("servico") || normalized.contains("limpeza") || normalized.contains("portaria")) return StockCategory.UNIFORME_SERVICOS;
        if (normalized.contains("admin") || normalized.contains("escritorio")) return StockCategory.UNIFORME_ADMINISTRATIVO;
        if (normalized.contains("cozinha") || normalized.contains("nutricao")) return StockCategory.UNIFORME_COZINHA;
        if (normalized.contains("epi") || normalized.contains("protecao") || normalized.contains("seguranca") ||
                normalized.contains("luva") || normalized.contains("oculos") || normalized.contains("capacete") || normalized.contains("mascara")) return StockCategory.EPI;
        if (normalized.contains("calcado") || normalized.contains("bota") || normalized.contains("sapato") || normalized.contains("coturno")) return StockCategory.CALCADOS;
        if (normalized.contains("acessorio") || normalized.contains("cracha") || normalized.contains("cinto") || normalized.contains("bone") || normalized.contains("apito")) return StockCategory.ACESSORIOS;
        return StockCategory.ACESSORIOS;
    }

    private String normalizeHeader(String text) {
        if (text == null) return "";
        String t = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase().trim();
        return t.replaceAll("[^a-z0-9]", "");
    }

    private Integer readIntCell(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) Math.round(cell.getNumericCellValue());
        }
        BigDecimal bd = readDecimalCell(cell);
        return bd != null ? (int) Math.round(bd.doubleValue()) : null;
    }

    private BigDecimal readDecimalCell(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        String raw = new DataFormatter().formatCellValue(cell).trim();
        if (raw.isEmpty() || raw.equals("-") || raw.equals("—")) return null;
        String cleaned = raw.replaceAll("[^0-9,\\.-]", "").trim();
        if (cleaned.isEmpty()) return null;
        try {
            if (cleaned.contains(".") && cleaned.contains(",")) {
                if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
                    cleaned = cleaned.replace(".", "").replace(",", ".");
                } else {
                    cleaned = cleaned.replace(",", "");
                }
            } else if (cleaned.contains(",")) {
                cleaned = cleaned.replace(",", ".");
            } else if (cleaned.contains(".")) {
                int dotIdx = cleaned.indexOf(".");
                int lastDotIdx = cleaned.lastIndexOf(".");
                if (dotIdx != lastDotIdx) {
                    cleaned = cleaned.replace(".", "");
                } else {
                    int decimalPlaces = cleaned.length() - dotIdx - 1;
                    if (decimalPlaces == 3) {
                        cleaned = cleaned.replace(".", "");
                    }
                }
            }
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Sincroniza item de estoque de EPI com a tabela de EPIs do módulo SST
     */
    private void syncWithPersonalProtectiveEquipment(StockItem item) {
        if (item == null) return;
        boolean isEpi = item.getCategory() == StockCategory.EPI 
                || item.getCategory() == StockCategory.CALCADOS
                || (item.getCategory() != null && item.getCategory().name().startsWith("UNIFORME"))
                || (item.getCaNumber() != null && !item.getCaNumber().isBlank());
        
        if (!isEpi) return;

        try {
            PersonalProtectiveEquipment ppe = null;
            if (item.getEpiId() != null) {
                ppe = personalProtectiveEquipmentRepository.findById(item.getEpiId()).orElse(null);
            }
            if (ppe == null && item.getId() != null) {
                ppe = personalProtectiveEquipmentRepository.findByStockItemId(item.getId()).orElse(null);
            }
            if (ppe == null && item.getCaNumber() != null && !item.getCaNumber().isBlank()) {
                List<PersonalProtectiveEquipment> byCa = personalProtectiveEquipmentRepository.findByCaNumber(item.getCaNumber().trim());
                if (!byCa.isEmpty()) {
                    ppe = byCa.get(0);
                }
            }

            if (ppe == null) {
                ppe = new PersonalProtectiveEquipment();
                ppe.setUnitOfMeasurement(item.getUnit() != null ? item.getUnit().getName() : "UNIDADE");
                ppe.setIsActive(item.getActive() != null ? item.getActive() : true);
            }

            ppe.setName(item.getName());
            ppe.setDescription(item.getDescription() != null ? item.getDescription() : item.getName());
            
            // Mapear categoria para EPICategory
            if (item.getCategory() == StockCategory.CALCADOS) {
                ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.PES);
            } else if (item.getCategory() != null && item.getCategory().name().startsWith("UNIFORME")) {
                ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.CORPO);
            } else {
                String nameLower = item.getName() != null ? item.getName().toLowerCase() : "";
                if (nameLower.contains("luva")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.MAOS);
                } else if (nameLower.contains("oculos") || nameLower.contains("óculos") || nameLower.contains("visag")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.OLHOS);
                } else if (nameLower.contains("auricular") || nameLower.contains("abafador") || nameLower.contains("ouvido")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.AUDITIVO);
                } else if (nameLower.contains("mascara") || nameLower.contains("máscara") || nameLower.contains("respirador")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.RESPIRATORIO);
                } else if (nameLower.contains("capacete")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.CABECA);
                } else if (nameLower.contains("bota") || nameLower.contains("sapato") || nameLower.contains("coturno")) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.PES);
                } else if (ppe.getCategory() == null) {
                    ppe.setCategory(com.z7design.fleet_manager.model.enums.EPICategory.CORPO);
                }
            }

            if (item.getCaNumber() != null && !item.getCaNumber().isBlank()) {
                ppe.setCaNumber(item.getCaNumber().trim());
            }
            if (item.getCaValidity() != null) {
                ppe.setCaValidity(item.getCaValidity());
            }
            if (item.getManufacturer() != null && !item.getManufacturer().isBlank()) {
                ppe.setManufacturer(item.getManufacturer());
            } else if (item.getSupplier() != null && !item.getSupplier().isBlank()) {
                ppe.setManufacturer(item.getSupplier());
            }
            ppe.setMinimumStock(item.getMinimumQuantity() != null ? item.getMinimumQuantity() : 0);
            ppe.setCurrentStock(item.getCurrentQuantity() != null ? item.getCurrentQuantity() : 0);
            ppe.setUnitCost(item.getUnitCost());
            ppe.setStockItemId(item.getId());
            if (item.getCompany() != null) {
                ppe.setCompanyId(item.getCompany().getId());
            }

            PersonalProtectiveEquipment saved = personalProtectiveEquipmentRepository.save(ppe);
            if (item.getEpiId() == null || !item.getEpiId().equals(saved.getId())) {
                item.setEpiId(saved.getId());
                stockItemRepository.save(item);
            }
            log.info("Sincronizado EPI do SST: ID {} com item de estoque ID {}", saved.getId(), item.getId());
        } catch (Exception e) {
            log.warn("Erro ao sincronizar item de estoque com EPI no SST: {}", e.getMessage());
        }
    }

    /**
     * Sincroniza a entrada de estoque gerando registros individuais de Bateria ou Pneu
     * quando o item pertencer a essas categorias.
     */
    public void syncBatteryAndTireInbound(
            StockItem item,
            int quantity,
            String documentNumber,
            String supplier,
            BigDecimal unitCost,
            UUID movementId) {
        if (item == null || quantity <= 0) {
            return;
        }

        try {
            if (isBatteryItem(item)) {
                syncBatteriesInbound(item, quantity, documentNumber, supplier, unitCost, movementId);
            } else if (isTireItem(item)) {
                syncTiresInbound(item, quantity, documentNumber, supplier, unitCost, movementId);
            }
        } catch (Exception e) {
            log.error("Erro ao sincronizar entrada individual de bateria/pneu para item {}: {}", item.getCode(), e.getMessage(), e);
        }
    }

    public boolean isBatteryItem(StockItem item) {
        if (item == null) return false;
        String name = ((item.getName() != null ? item.getName() : "") + " " + (item.getDescription() != null ? item.getDescription() : "")).toLowerCase();
        if (item.getCategory() == StockCategory.PECAS_ELETRICA) {
            return name.contains("bateria") || name.contains("battery") || name.contains("acumulador");
        }
        return name.contains("bateria") || name.contains("battery") || name.contains("acumulador");
    }

    public boolean isTireItem(StockItem item) {
        if (item == null) return false;
        String name = ((item.getName() != null ? item.getName() : "") + " " + (item.getDescription() != null ? item.getDescription() : "")).toLowerCase();
        
        // Evitar falsos positivos como câmara de ar, roda, aro ou bico/válvula
        if (name.contains("camara") || name.contains("câmara") || name.contains("roda ") || name.contains("aro ") || name.contains("valvula") || name.contains("válvula")) {
            return false;
        }
        
        if (item.getCategory() == StockCategory.PNEUS_RODAS) {
            return true;
        }
        return name.contains("pneu") || name.contains("tire") || name.contains("pneumatico") || name.contains("pneumático");
    }

    private void syncBatteriesInbound(StockItem item, int quantity, String documentNumber, String supplier, BigDecimal unitCost, UUID movementId) {
        UUID companyId = item.getCompanyId() != null ? item.getCompanyId() : resolveTenantCompanyId();
        String docClean = (documentNumber != null && !documentNumber.isBlank()) 
                ? documentNumber.trim().replaceAll("[^a-zA-Z0-9]", "") 
                : "EST";
        if (docClean.length() > 10) {
            docClean = docClean.substring(0, 10);
        }

        String brand = (supplier != null && !supplier.isBlank()) 
                ? supplier.trim() 
                : (item.getSupplier() != null && !item.getSupplier().isBlank() ? item.getSupplier().trim() : "Moura");
        if (brand.length() > 60) brand = brand.substring(0, 60);

        String model = item.getName() != null && !item.getName().isBlank() ? item.getName().trim() : "Bateria Frota";
        if (model.length() > 60) model = model.substring(0, 60);

        BigDecimal cost = unitCost != null ? unitCost : (item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO);
        String movTag = movementId != null ? movementId.toString().substring(0, 8).toUpperCase() : "INIT";

        for (int i = 1; i <= quantity; i++) {
            long randSuffix = (System.currentTimeMillis() % 10000) + (long) (Math.random() * 900);
            String serialNumber = String.format("BAT-%s-%02d-%d", docClean, i, randSuffix);

            VehicleBattery battery = VehicleBattery.builder()
                    .companyId(companyId)
                    .serialNumber(serialNumber)
                    .batteryCode(serialNumber)
                    .brand(brand)
                    .model(model)
                    .voltage("12V")
                    .capacity("150Ah")
                    .ccaRating(950)
                    .status(VehicleBattery.BatteryStatus.ACTIVE)
                    .cost(cost)
                    .warrantyExpiryDate(java.time.LocalDate.now().plusMonths(18))
                    .notes("Entrada em Estoque - Item: " + item.getCode() + " - NF: " + (documentNumber != null ? documentNumber : "N/I") + 
                           " [MOV:" + movTag + "]")
                    .build();

            vehicleBatteryRepository.save(battery);
            log.info("🔋 Bateria individual cadastrada com sucesso: {} (NF: {})", serialNumber, documentNumber);
        }
    }

    private void syncTiresInbound(StockItem item, int quantity, String documentNumber, String supplier, BigDecimal unitCost, UUID movementId) {
        UUID companyId = item.getCompanyId() != null ? item.getCompanyId() : resolveTenantCompanyId();
        String docClean = (documentNumber != null && !documentNumber.isBlank()) 
                ? documentNumber.trim().replaceAll("[^a-zA-Z0-9]", "") 
                : "EST";
        if (docClean.length() > 10) {
            docClean = docClean.substring(0, 10);
        }

        String brand = (supplier != null && !supplier.isBlank()) 
                ? supplier.trim() 
                : (item.getSupplier() != null && !item.getSupplier().isBlank() ? item.getSupplier().trim() : "Michelin");
        if (brand.length() > 60) brand = brand.substring(0, 60);

        String model = item.getName() != null && !item.getName().isBlank() ? item.getName().trim() : "295/80 R22.5";
        if (model.length() > 60) model = model.substring(0, 60);

        BigDecimal cost = unitCost != null ? unitCost : (item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO);
        int currentYear = java.time.LocalDate.now().getYear();
        String movTag = movementId != null ? movementId.toString().substring(0, 8).toUpperCase() : "INIT";

        for (int i = 1; i <= quantity; i++) {
            String serialNumber;
            do {
                long rand = (long) (Math.random() * 90000) + 10000;
                serialNumber = String.format("PN-%s-M%s-%02d-%d", docClean, movTag, i, rand);
            } while (tireRepository.existsBySerialNumber(serialNumber));

            Tire tire = new Tire();
            tire.setCompanyId(companyId);
            tire.setSerialNumber(serialNumber);
            tire.setDot("DOT-" + currentYear);
            tire.setBrand(brand);
            tire.setModel(model);
            tire.setSize("295/80 R22.5");
            tire.setStatus(TireStatus.AVAILABLE);
            tire.setCurrentMileage(0);
            tire.setRecapCount(0);
            tire.setAcquisitionCost(cost);
            tire.setInitialTreadDepth(new BigDecimal("15.00"));
            tire.setCurrentTreadDepth(new BigDecimal("15.00"));
            tire.setCreatedAt(LocalDateTime.now());
            tire.setUpdatedAt(LocalDateTime.now());

            tireRepository.save(tire);
            log.info("🛞 Pneu individual cadastrado com sucesso: {} (NF: {})", serialNumber, documentNumber);
        }
    }

    private void cleanupLinkedBatteriesAndTires(StockMovement movement) {
        if (movement == null || movement.getId() == null) return;
        String movTag = movement.getId().toString().substring(0, 8).toUpperCase();

        // 1. Verificar e estornar Baterias
        List<VehicleBattery> batteries = vehicleBatteryRepository.findByNotesContaining("[MOV:" + movTag + "]");
        for (VehicleBattery b : batteries) {
            if (b.getVehicle() != null || b.getInstallDate() != null || b.getStatus() != VehicleBattery.BatteryStatus.ACTIVE) {
                throw new IllegalArgumentException("Não é possível estornar a entrada: a bateria " + b.getSerialNumber() + " já está vinculada ou instalada em um veículo.");
            }
        }
        if (!batteries.isEmpty()) {
            vehicleBatteryRepository.deleteAll(batteries);
            log.info("🔋 {} bateria(s) estornada(s) devido à exclusão da movimentação {}", batteries.size(), movement.getId());
        }

        // 2. Verificar e estornar Pneus
        List<Tire> tires = tireRepository.findBySerialNumberContaining("-M" + movTag + "-");
        for (Tire t : tires) {
            if (t.getVehicleId() != null || t.getStatus() != TireStatus.AVAILABLE) {
                throw new IllegalArgumentException("Não é possível estornar a entrada: o pneu " + t.getSerialNumber() + " já está montado ou em uso em um veículo.");
            }
        }
        if (!tires.isEmpty()) {
            tireRepository.deleteAll(tires);
            log.info("🛞 {} pneu(s) estornado(s) devido à exclusão da movimentação {}", tires.size(), movement.getId());
        }
    }
}
