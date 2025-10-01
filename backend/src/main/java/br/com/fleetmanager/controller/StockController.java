package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.StockService;

import br.com.fleetmanager.dto.StockAlertDTO;
import br.com.fleetmanager.dto.StockItemDTO;
import br.com.fleetmanager.dto.StockMovementDTO;
import br.com.fleetmanager.model.enums.MovementReason;
import br.com.fleetmanager.model.enums.MovementType;
import br.com.fleetmanager.model.enums.StockCategory;
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
@Tag(name = "Estoque Simplificado", description = "Endpoints para gestão de estoque de uniformes e EPIs")
public class StockController {

    private final StockService stockService;

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
    @Operation(summary = "Buscar itens com filtros", description = "Busca itens aplicando múltiplos filtros")
    public ResponseEntity<Page<StockItemDTO>> searchItems(
            @Parameter(description = "Categoria do item") @RequestParam(required = false) StockCategory category,
            @Parameter(description = "Status ativo") @RequestParam(required = false) Boolean active,
            @Parameter(description = "ID da unidade") @RequestParam(required = false) UUID unitId,
            @Parameter(description = "Apenas itens com baixo estoque") @RequestParam(required = false) Boolean lowStock,
            @Parameter(description = "Termo de busca") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        
        log.info("GET /api/stock/items/search - Buscando itens com filtros");
        Page<StockItemDTO> items = stockService.getItemsWithFilters(
                category, active, unitId, lowStock, searchTerm, pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Buscar item por ID", description = "Retorna um item específico")
    public ResponseEntity<StockItemDTO> getItemById(
            @Parameter(description = "ID do item") @PathVariable UUID id) {
        
        log.info("GET /api/stock/items/{} - Buscando item por ID", id);
        StockItemDTO item = stockService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/items/code/{code}")
    @Operation(summary = "Buscar item por código", description = "Retorna um item pelo código")
    public ResponseEntity<StockItemDTO> getItemByCode(
            @Parameter(description = "Código do item") @PathVariable String code) {
        
        log.info("GET /api/stock/items/code/{} - Buscando item por código", code);
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
    @Operation(summary = "Buscar itens por categoria", description = "Retorna itens de uma categoria específica")
    public ResponseEntity<List<StockItemDTO>> getItemsByCategory(
            @Parameter(description = "Categoria") @PathVariable StockCategory category) {
        
        log.info("GET /api/stock/items/category/{} - Buscando itens por categoria", category);
        List<StockItemDTO> items = stockService.getItemsByCategory(category);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/low-stock")
    @Operation(summary = "Buscar itens com baixo estoque", description = "Retorna itens que estão com quantidade baixa")
    public ResponseEntity<List<StockItemDTO>> getLowStockItems() {
        log.info("GET /api/stock/items/low-stock - Buscando itens com baixo estoque");
        List<StockItemDTO> items = stockService.getLowStockItems();
        return ResponseEntity.ok(items);
    }

    // ===== MOVIMENTAÇÕES =====

    @PostMapping("/movements")
    @Operation(summary = "Criar movimentação", description = "Registra uma entrada ou saída de estoque")
    public ResponseEntity<StockMovementDTO> createMovement(
            @Valid @RequestBody StockMovementDTO movementDTO,
            Authentication authentication) {
        
        log.info("POST /api/stock/movements - Criando movimentação");
        
        // Obter ID do usuário logado (implementar conforme sua autenticação)
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111"); // Placeholder
        
        StockMovementDTO createdMovement = stockService.createMovement(movementDTO, userId);
        return ResponseEntity.status(201).body(createdMovement);
    }

    @GetMapping("/movements/search")
    @Operation(summary = "Buscar movimentações", description = "Busca movimentações com filtros")
    public ResponseEntity<Page<StockMovementDTO>> searchMovements(
            @Parameter(description = "ID do item") @RequestParam(required = false) UUID stockItemId,
            @Parameter(description = "ID do funcionário") @RequestParam(required = false) UUID employeeId,
            @Parameter(description = "Tipo de movimentação") @RequestParam(required = false) MovementType movementType,
            @Parameter(description = "Motivo da movimentação") @RequestParam(required = false) MovementReason reason,
            @Parameter(description = "ID da unidade") @RequestParam(required = false) UUID unitId,
            @Parameter(description = "Data inicial") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "Data final") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Termo de busca") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        
        try {
            log.info("GET /api/stock/movements/search - Buscando movimentações com filtros");
            Page<StockMovementDTO> movements = stockService.getMovementsWithFilters(
                    stockItemId, employeeId, movementType, reason, unitId, 
                    startDate, endDate, searchTerm, pageable);
            return ResponseEntity.ok(movements);
        } catch (Exception e) {
            log.error("Erro ao buscar movimentações: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/movements/item/{itemId}")
    @Operation(summary = "Histórico de movimentações do item", description = "Retorna todas as movimentações de um item")
    public ResponseEntity<List<StockMovementDTO>> getMovementsByItem(
            @Parameter(description = "ID do item") @PathVariable UUID itemId) {
        
        log.info("GET /api/stock/movements/item/{} - Buscando movimentações do item", itemId);
        List<StockMovementDTO> movements = stockService.getMovementsByItem(itemId);
        return ResponseEntity.ok(movements);
    }

    @GetMapping("/movements/employee/{employeeId}/deliveries")
    @Operation(summary = "Histórico de entregas do funcionário", description = "Retorna todas as entregas feitas a um funcionário")
    public ResponseEntity<List<StockMovementDTO>> getDeliveryHistoryByEmployee(
            @Parameter(description = "ID do funcionário") @PathVariable UUID employeeId) {
        
        log.info("GET /api/stock/movements/employee/{}/deliveries - Histórico de entregas", employeeId);
        List<StockMovementDTO> deliveries = stockService.getDeliveryHistoryByEmployee(employeeId);
        return ResponseEntity.ok(deliveries);
    }

    @GetMapping("/movements/recent")
    @Operation(summary = "Movimentações recentes", description = "Retorna as últimas movimentações")
    public ResponseEntity<List<StockMovementDTO>> getRecentMovements(
            @Parameter(description = "Limite de registros") @RequestParam(defaultValue = "10") int limit) {
        
        log.info("GET /api/stock/movements/recent - Buscando movimentações recentes");
        List<StockMovementDTO> movements = stockService.getRecentMovements(limit);
        return ResponseEntity.ok(movements);
    }

    // ===== ALERTAS =====

    @GetMapping("/alerts")
    @Operation(summary = "Listar alertas ativos", description = "Retorna todos os alertas não resolvidos")
    public ResponseEntity<List<StockAlertDTO>> getActiveAlerts() {
        log.info("GET /api/stock/alerts - Listando alertas ativos");
        List<StockAlertDTO> alerts = stockService.getActiveAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/unread")
    @Operation(summary = "Listar alertas não lidos", description = "Retorna alertas que ainda não foram lidos")
    public ResponseEntity<List<StockAlertDTO>> getUnreadAlerts() {
        log.info("GET /api/stock/alerts/unread - Listando alertas não lidos");
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
        
        // Obter ID do usuário logado
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111"); // Placeholder
        
        stockService.resolveAlert(alertId, userId);
        return ResponseEntity.ok().build();
    }

    // ===== RELATÓRIOS =====

    @GetMapping("/report")
    @Operation(summary = "Relatório de estoque", description = "Retorna estatísticas e resumo do estoque")
    public ResponseEntity<Map<String, Object>> getStockReport() {
        log.info("GET /api/stock/report - Gerando relatório de estoque");
        Map<String, Object> report = stockService.getStockReport();
        return ResponseEntity.ok(report);
    }

    // ===== ENUMS PARA FRONTEND =====

    @GetMapping("/enums/categories")
    @Operation(summary = "Listar categorias", description = "Retorna todas as categorias disponíveis")
    public ResponseEntity<StockCategory[]> getCategories() {
        return ResponseEntity.ok(StockCategory.values());
    }

    @GetMapping("/enums/movement-types")
    @Operation(summary = "Listar tipos de movimentação", description = "Retorna todos os tipos de movimentação")
    public ResponseEntity<MovementType[]> getMovementTypes() {
        return ResponseEntity.ok(MovementType.values());
    }

    @GetMapping("/enums/movement-reasons")
    @Operation(summary = "Listar motivos de movimentação", description = "Retorna todos os motivos de movimentação")
    public ResponseEntity<MovementReason[]> getMovementReasons() {
        return ResponseEntity.ok(MovementReason.values());
    }

    // ===== TESTE DE DIAGNÓSTICO =====

    @GetMapping("/test")
    @Operation(summary = "Teste de conectividade", description = "Endpoint simples para testar se o backend está funcionando")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("=== TESTE DE CONECTIVIDADE DO ESTOQUE ===");
            
            // Teste 1: Verificar se o controller está funcionando
            response.put("controller", "OK");
            response.put("timestamp", LocalDateTime.now().toString());
            
            // Teste 2: Verificar se o service está acessível
            response.put("service", "OK");
            
            // Teste 3: Verificar se o repositório está acessível
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