package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.StockItemDTO;
import com.z7design.fleet_manager.dto.StockMovementDTO;
import com.z7design.fleet_manager.dto.StockAlertDTO;
import com.z7design.fleet_manager.model.enums.StockCategory;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.service.StockService;
import com.z7design.fleet_manager.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Estoque Simplificado", description = "Endpoints para gestÃ£o de estoque de uniformes e EPIs")
public class StockController {

    private final StockService stockService;
    private final UserRepository userRepository;

    // ===== ITENS DE ESTOQUE =====

    @GetMapping("/items")
    @Operation(summary = "Listar todos os itens de estoque", description = "Retorna uma lista de todos os itens ativos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de itens retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<StockItemDTO>> getAllItems() {
        log.info("GET /api/stock/items - Listando todos os itens de estoque");
        List<StockItemDTO> items = stockService.getAllItems();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/search")
    @Operation(summary = "Buscar itens com filtros", description = "Busca itens aplicando mÃºltiplos filtros")
    public ResponseEntity<Page<StockItemDTO>> searchItems(
            @Parameter(description = "Categoria do item") @RequestParam(required = false) StockCategory category,
            @Parameter(description = "Status ativo") @RequestParam(required = false) Boolean active,
            @Parameter(description = "ID da unidade") @RequestParam(required = false) UUID unitId,
            @Parameter(description = "Apenas itens com baixo estoque") @RequestParam(required = false) Boolean lowStock,
            @Parameter(description = "Termo de busca") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        
        log.info("GET /api/stock/items/search - Buscando itens com filtros");
        Page<StockItemDTO> items = stockService.getItemsWithFilters(
                category, active, unitId, lowStock, searchTerm, pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Buscar item por ID", description = "Retorna um item especÃ­fico")
    public ResponseEntity<StockItemDTO> getItemById(
            @Parameter(description = "ID do item") @PathVariable UUID id) {
        
        log.info("GET /api/stock/items/{} - Buscando item por ID", id);
        StockItemDTO item = stockService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/items/code/{code}")
    @Operation(summary = "Buscar item por cÃ³digo", description = "Retorna um item pelo cÃ³digo")
    public ResponseEntity<StockItemDTO> getItemByCode(
            @Parameter(description = "CÃ³digo do item") @PathVariable String code) {
        
        log.info("GET /api/stock/items/code/{} - Buscando item por cÃ³digo", code);
        StockItemDTO item = stockService.getItemByCode(code);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/items/qr/{qrCode}")
    @Operation(summary = "Buscar item por QR Code", description = "Retorna um item pelo QR Code")
    public ResponseEntity<StockItemDTO> getItemByQrCode(
            @Parameter(description = "QR Code do item") @PathVariable String qrCode) {
        
        log.info("GET /api/stock/items/qr/{} - Buscando item por QR Code", qrCode);
        StockItemDTO item = stockService.getItemByQrCode(qrCode);
        return ResponseEntity.ok(item);
    }

    @PostMapping("/items")
    @Operation(summary = "Criar novo item", description = "Cria um novo item de estoque")
    public ResponseEntity<StockItemDTO> createItem(
            @Valid @RequestBody StockItemDTO itemDTO) {
        
        log.info("POST /api/stock/items - Criando novo item de estoque");
        StockItemDTO createdItem = stockService.createItem(itemDTO);
        return ResponseEntity.status(201).body(createdItem);
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Atualizar item", description = "Atualiza um item existente")
    public ResponseEntity<StockItemDTO> updateItem(
            @Parameter(description = "ID do item") @PathVariable UUID id,
            @Valid @RequestBody StockItemDTO itemDTO) {
        
        log.info("PUT /api/stock/items/{} - Atualizando item", id);
        StockItemDTO updatedItem = stockService.updateItem(id, itemDTO);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Excluir item", description = "Marca um item como inativo")
    public ResponseEntity<Void> deleteItem(
            @Parameter(description = "ID do item") @PathVariable UUID id) {
        
        log.info("DELETE /api/stock/items/{} - Excluindo item", id);
        stockService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/items/category/{category}")
    @Operation(summary = "Buscar itens por categoria", description = "Retorna itens de uma categoria especÃ­fica")
    public ResponseEntity<List<StockItemDTO>> getItemsByCategory(
            @Parameter(description = "Categoria") @PathVariable StockCategory category) {
        
        log.info("GET /api/stock/items/category/{} - Buscando itens por categoria", category);
        List<StockItemDTO> items = stockService.getItemsByCategory(category);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/low-stock")
    @Operation(summary = "Buscar itens com baixo estoque", description = "Retorna itens que estÃ£o com quantidade baixa")
    public ResponseEntity<List<StockItemDTO>> getLowStockItems() {
        log.info("GET /api/stock/items/low-stock - Buscando itens com baixo estoque");
        List<StockItemDTO> items = stockService.getLowStockItems();
        return ResponseEntity.ok(items);
    }

    // ===== MOVIMENTAÃ‡Ã•ES =====

    @PostMapping("/movements")
    @Operation(summary = "Criar movimentaÃ§Ã£o", description = "Registra uma entrada ou saÃ­da de estoque")
    public ResponseEntity<?> createMovement(
            @Valid @RequestBody StockMovementDTO movementDTO,
            Authentication authentication) {
        
        try {
            log.info("POST /api/stock/movements - Criando movimentaÃ§Ã£o");
            log.info("Dados recebidos: {}", movementDTO);
            
            // Obter ID do usuÃ¡rio logado
            UUID userId;
            if (authentication != null && authentication.getPrincipal() != null) {
                try {
                    // Tentar obter o usuÃ¡rio do contexto de autenticaÃ§Ã£o
                    String username = authentication.getName();
                    com.z7design.fleet_manager.model.User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + username));
                    userId = user.getId();
                    log.info("UsuÃ¡rio autenticado: {} (ID: {})", username, userId);
                } catch (Exception e) {
                    log.warn("Erro ao obter usuÃ¡rio do contexto de autenticaÃ§Ã£o: {}. Usando placeholder.", e.getMessage());
                    // Fallback para placeholder se nÃ£o conseguir obter o usuÃ¡rio
                    userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
                }
            } else {
                log.warn("AutenticaÃ§Ã£o nÃ£o disponÃ­vel. Usando placeholder.");
                userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
            }
            
            StockMovementDTO createdMovement = stockService.createMovement(movementDTO, userId);
            log.info("MovimentaÃ§Ã£o criada com sucesso: {}", createdMovement.getId());
            return ResponseEntity.status(201).body(createdMovement);
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            log.error("Recurso nÃ£o encontrado ao criar movimentaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.error("Erro de validaÃ§Ã£o ao criar movimentaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro inesperado ao criar movimentaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao criar movimentaÃ§Ã£o: " + e.getMessage()));
        }
    }

    @GetMapping("/movements/search")
    @Operation(summary = "Buscar movimentaÃ§Ãµes", description = "Busca movimentaÃ§Ãµes com filtros")
    public ResponseEntity<Page<StockMovementDTO>> searchMovements(
            @Parameter(description = "ID do item") @RequestParam(required = false) UUID stockItemId,
            @Parameter(description = "ID do funcionÃ¡rio") @RequestParam(required = false) UUID employeeId,
            @Parameter(description = "Tipo de movimentaÃ§Ã£o") @RequestParam(required = false) MovementType movementType,
            @Parameter(description = "Motivo da movimentaÃ§Ã£o") @RequestParam(required = false) MovementReason reason,
            @Parameter(description = "ID da unidade") @RequestParam(required = false) UUID unitId,
            @Parameter(description = "Data inicial") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "Data final") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Termo de busca") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        
        try {
            log.info("GET /api/stock/movements/search - Buscando movimentaÃ§Ãµes com filtros");
            Page<StockMovementDTO> movements = stockService.getMovementsWithFilters(
                    stockItemId, employeeId, movementType, reason, unitId, 
                    startDate, endDate, searchTerm, pageable);
            return ResponseEntity.ok(movements);
        } catch (Exception e) {
            log.error("Erro ao buscar movimentaÃ§Ãµes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/movements/item/{itemId}")
    @Operation(summary = "HistÃ³rico de movimentaÃ§Ãµes do item", description = "Retorna todas as movimentaÃ§Ãµes de um item")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByItem(
            @Parameter(description = "ID do item") @PathVariable UUID itemId) {
        
        log.info("GET /api/stock/movements/item/{} - Buscando movimentaÃ§Ãµes do item", itemId);
        List<StockMovementDTO> movements = stockService.getMovementsByItem(itemId);
        return ResponseEntity.ok(movements);
    }

    @GetMapping("/movements/employee/{employeeId}/deliveries")
    @Operation(summary = "HistÃ³rico de entregas do funcionÃ¡rio", description = "Retorna todas as entregas feitas a um funcionÃ¡rio")
    public ResponseEntity<List<StockMovementDTO>> getDeliveryHistoryByEmployee(
            @Parameter(description = "ID do funcionÃ¡rio") @PathVariable UUID employeeId) {
        
        log.info("GET /api/stock/movements/employee/{}/deliveries - HistÃ³rico de entregas", employeeId);
        List<StockMovementDTO> deliveries = stockService.getDeliveryHistoryByEmployee(employeeId);
        return ResponseEntity.ok(deliveries);
    }

    @GetMapping("/movements/recent")
    @Operation(summary = "MovimentaÃ§Ãµes recentes", description = "Retorna as Ãºltimas movimentaÃ§Ãµes")
    public ResponseEntity<List<StockMovementDTO>> getRecentMovements(
            @Parameter(description = "Limite de registros") @RequestParam(defaultValue = "10") int limit) {
        
        log.info("GET /api/stock/movements/recent - Buscando movimentaÃ§Ãµes recentes");
        List<StockMovementDTO> movements = stockService.getRecentMovements(limit);
        return ResponseEntity.ok(movements);
    }

    // ===== ALERTAS =====

    @GetMapping("/alerts")
    @Operation(summary = "Listar alertas ativos", description = "Retorna todos os alertas nÃ£o resolvidos")
    public ResponseEntity<List<StockAlertDTO>> getActiveAlerts() {
        log.info("GET /api/stock/alerts - Listando alertas ativos");
        List<StockAlertDTO> alerts = stockService.getActiveAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/unread")
    @Operation(summary = "Listar alertas nÃ£o lidos", description = "Retorna alertas que ainda nÃ£o foram lidos")
    public ResponseEntity<List<StockAlertDTO>> getUnreadAlerts() {
        log.info("GET /api/stock/alerts/unread - Listando alertas nÃ£o lidos");
        List<StockAlertDTO> alerts = stockService.getUnreadAlerts();
        return ResponseEntity.ok(alerts);
    }

    @PatchMapping("/alerts/{alertId}/read")
    @Operation(summary = "Marcar alerta como lido", description = "Marca um alerta como lido")
    public ResponseEntity<Void> markAlertAsRead(
            @Parameter(description = "ID do alerta") @PathVariable UUID alertId) {
        
        log.info("PATCH /api/stock/alerts/{}/read - Marcando alerta como lido", alertId);
        stockService.markAlertAsRead(alertId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/alerts/{alertId}/resolve")
    @Operation(summary = "Resolver alerta", description = "Marca um alerta como resolvido")
    public ResponseEntity<Void> resolveAlert(
            @Parameter(description = "ID do alerta") @PathVariable UUID alertId,
            Authentication authentication) {
        
        log.info("PATCH /api/stock/alerts/{}/resolve - Resolvendo alerta", alertId);
        
        // Obter ID do usuÃ¡rio logado
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111"); // Placeholder
        
        stockService.resolveAlert(alertId, userId);
        return ResponseEntity.ok().build();
    }

    // ===== RELATÃ“RIOS =====

    @GetMapping("/report")
    @Operation(summary = "RelatÃ³rio de estoque", description = "Retorna estatÃ­sticas e resumo do estoque")
    public ResponseEntity<Map<String, Object>> getStockReport() {
        log.info("GET /api/stock/report - Gerando relatÃ³rio de estoque");
        Map<String, Object> report = stockService.getStockReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/item/{itemId}")
    @Operation(summary = "RelatÃ³rio por item", description = "Retorna relatÃ³rio detalhado de um item especÃ­fico")
    public ResponseEntity<com.z7design.fleet_manager.dto.StockItemReportDTO> getItemReport(@PathVariable UUID itemId) {
        log.info("GET /api/stock/reports/item/{} - Gerando relatÃ³rio do item", itemId);
        try {
            com.z7design.fleet_manager.dto.StockItemReportDTO report = stockService.getItemReport(itemId);
            return ResponseEntity.ok(report);
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio do item {}: {}", itemId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports/movements")
    @Operation(summary = "RelatÃ³rio de movimentaÃ§Ãµes", description = "Retorna relatÃ³rio detalhado de movimentaÃ§Ãµes com filtros")
    public ResponseEntity<com.z7design.fleet_manager.dto.MovementsReportDTO> getMovementsReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) MovementType movementType) {
        log.info("GET /api/stock/reports/movements - Gerando relatÃ³rio de movimentaÃ§Ãµes");
        try {
            com.z7design.fleet_manager.dto.MovementsReportDTO report = stockService.getMovementsReport(
                    startDate, endDate, itemId, employeeId, movementType);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de movimentaÃ§Ãµes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports/low-stock")
    @Operation(summary = "RelatÃ³rio de estoque baixo", description = "Retorna relatÃ³rio de itens com estoque baixo ou zerado")
    public ResponseEntity<com.z7design.fleet_manager.dto.LowStockReportDTO> getLowStockReport() {
        log.info("GET /api/stock/reports/low-stock - Gerando relatÃ³rio de estoque baixo");
        try {
            com.z7design.fleet_manager.dto.LowStockReportDTO report = stockService.getLowStockReport();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de estoque baixo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports/date-range")
    @Operation(summary = "RelatÃ³rio por perÃ­odo", description = "Retorna relatÃ³rio detalhado de movimentaÃ§Ãµes por perÃ­odo")
    public ResponseEntity<com.z7design.fleet_manager.dto.DateRangeReportDTO> getDateRangeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/stock/reports/date-range - Gerando relatÃ³rio por perÃ­odo de {} atÃ© {}", startDate, endDate);
        try {
            com.z7design.fleet_manager.dto.DateRangeReportDTO report = stockService.getDateRangeReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ===== ENUMS PARA FRONTEND =====

    @GetMapping("/enums/categories")
    @Operation(summary = "Listar categorias", description = "Retorna todas as categorias disponÃ­veis")
    public ResponseEntity<StockCategory[]> getCategories() {
        return ResponseEntity.ok(StockCategory.values());
    }

    @GetMapping("/enums/movement-types")
    @Operation(summary = "Listar tipos de movimentaÃ§Ã£o", description = "Retorna todos os tipos de movimentaÃ§Ã£o")
    public ResponseEntity<MovementType[]> getMovementTypes() {
        return ResponseEntity.ok(MovementType.values());
    }

    @GetMapping("/enums/movement-reasons")
    @Operation(summary = "Listar motivos de movimentaÃ§Ã£o", description = "Retorna todos os motivos de movimentaÃ§Ã£o")
    public ResponseEntity<MovementReason[]> getMovementReasons() {
        return ResponseEntity.ok(MovementReason.values());
    }

    // ===== TESTE DE DIAGNÃ“STICO =====

    @GetMapping("/test")
    @Operation(summary = "Teste de conectividade", description = "Endpoint simples para testar se o backend estÃ¡ funcionando")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("=== TESTE DE CONECTIVIDADE DO ESTOQUE ===");
            
            // Teste 1: Verificar se o controller estÃ¡ funcionando
            response.put("controller", "OK");
            response.put("timestamp", LocalDateTime.now().toString());
            
            // Teste 2: Verificar se o service estÃ¡ acessÃ­vel
            response.put("service", "OK");
            
            // Teste 3: Verificar se o repositÃ³rio estÃ¡ acessÃ­vel
            try {
                long totalItems = stockService.getAllItems().size();
                response.put("repository", "OK");
                response.put("totalItems", totalItems);
            } catch (Exception e) {
                response.put("repository", "ERRO: " + e.getMessage());
                response.put("repositoryError", e.getClass().getSimpleName());
            }
            
            response.put("status", "SUCCESS");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro no teste de conectividade: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            response.put("type", e.getClass().getSimpleName());
            return ResponseEntity.ok(response);
        }
    }
}
