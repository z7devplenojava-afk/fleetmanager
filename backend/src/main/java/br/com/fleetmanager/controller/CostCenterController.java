package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.CostCenterService;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.CostCenter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cost-centers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cost Centers", description = "API para gerenciamento de centros de custo")
public class CostCenterController {
    
    private final CostCenterService costCenterService;
    
    @GetMapping
    @Operation(summary = "Listar centros de custo", description = "Lista todos os centros de custo com filtros opcionais")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<List<CostCenterDTO>> list(
            @Parameter(description = "Status do centro de custo") 
            @RequestParam(required = false) CostCenter.CostCenterStatus status,
            @Parameter(description = "Departamento do centro de custo") 
            @RequestParam(required = false) String department,
            @Parameter(description = "Termo de busca") 
            @RequestParam(required = false) String searchTerm) {
        
        log.info("Listando centros de custo - status: {}, department: {}, searchTerm: {}", 
                status, department, searchTerm);
        
        List<CostCenterDTO> costCenters = costCenterService.findByFilters(status, department, searchTerm);
        return ResponseEntity.ok(costCenters);
    }
    
    @GetMapping("/paginated")
    @Operation(summary = "Listar centros de custo paginados", description = "Lista centros de custo com paginação")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<Page<CostCenterDTO>> listPaginated(
            @Parameter(description = "Status do centro de custo") 
            @RequestParam(required = false) CostCenter.CostCenterStatus status,
            @Parameter(description = "Departamento do centro de custo") 
            @RequestParam(required = false) String department,
            @Parameter(description = "Termo de busca") 
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        
        log.info("Listando centros de custo paginados - status: {}, department: {}, searchTerm: {}", 
                status, department, searchTerm);
        
        Page<CostCenterDTO> costCenters = costCenterService.findByFilters(status, department, searchTerm, pageable);
        return ResponseEntity.ok(costCenters);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os centros de custo", description = "Lista todos os centros de custo sem filtros")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<List<CostCenterDTO>> listAll() {
        log.info("Listando todos os centros de custo");
        List<CostCenterDTO> costCenters = costCenterService.findAll();
        return ResponseEntity.ok(costCenters);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar centros de custo ativos", description = "Lista apenas centros de custo ativos")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<List<CostCenterDTO>> listActive() {
        log.info("Listando centros de custo ativos");
        List<CostCenterDTO> costCenters = costCenterService.getActiveCenters();
        return ResponseEntity.ok(costCenters);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar centro de custo por ID", description = "Retorna um centro de custo específico")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterDTO> findById(@PathVariable UUID id) {
        log.info("Buscando centro de custo por ID: {}", id);
        CostCenterDTO costCenter = costCenterService.findById(id);
        return ResponseEntity.ok(costCenter);
    }
    
    @GetMapping("/code/{code}")
    @Operation(summary = "Buscar centro de custo por código", description = "Retorna um centro de custo específico pelo código")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterDTO> findByCode(@PathVariable String code) {
        log.info("Buscando centro de custo por código: {}", code);
        CostCenterDTO costCenter = costCenterService.findByCode(code);
        return ResponseEntity.ok(costCenter);
    }
    
    @PostMapping
    @Operation(summary = "Criar centro de custo", description = "Cria um novo centro de custo")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterDTO> create(@Valid @RequestBody CreateCostCenterDTO dto) {
        log.info("Criando novo centro de custo: {}", dto.getCode());
        
        // TODO: Obter ID do usuário logado do contexto de segurança
        UUID currentUserId = UUID.randomUUID(); // Temporário
        dto.setCreatedBy(currentUserId);
        
        CostCenterDTO createdCostCenter = costCenterService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCostCenter);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar centro de custo", description = "Atualiza um centro de custo existente")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterDTO> update(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateCostCenterDTO dto) {
        log.info("Atualizando centro de custo: {}", id);
        
        // TODO: Obter ID do usuário logado do contexto de segurança
        UUID currentUserId = UUID.randomUUID(); // Temporário
        dto.setUpdatedBy(currentUserId);
        
        CostCenterDTO updatedCostCenter = costCenterService.update(id, dto);
        return ResponseEntity.ok(updatedCostCenter);
    }
    
    @PatchMapping("/{id}/spent")
    @Operation(summary = "Atualizar valor gasto", description = "Atualiza o valor gasto de um centro de custo")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterDTO> updateSpentAmount(
            @PathVariable UUID id,
            @Parameter(description = "Novo valor gasto") 
            @RequestParam BigDecimal amount) {
        log.info("Atualizando valor gasto do centro de custo: {} para {}", id, amount);
        
        CostCenterDTO updatedCostCenter = costCenterService.updateSpentAmount(id, amount);
        return ResponseEntity.ok(updatedCostCenter);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir centro de custo", description = "Exclui um centro de custo")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("Excluindo centro de custo: {}", id);
        costCenterService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/departments")
    @Operation(summary = "Listar departamentos", description = "Lista todos os departamentos distintos")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<List<String>> getDepartments() {
        log.info("Listando departamentos distintos");
        List<String> departments = costCenterService.getDistinctDepartments();
        return ResponseEntity.ok(departments);
    }
    
    @GetMapping("/summary")
    @Operation(summary = "Resumo dos centros de custo", description = "Retorna um resumo estatístico dos centros de custo")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('FINANCEIRO')")
    public ResponseEntity<CostCenterSummaryDTO> getSummary() {
        log.info("Gerando resumo dos centros de custo");
        CostCenterSummaryDTO summary = costCenterService.getSummary();
        return ResponseEntity.ok(summary);
    }
}