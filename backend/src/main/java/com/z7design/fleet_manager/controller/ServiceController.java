package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.Service;
import com.z7design.fleet_manager.service.ServiceService;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Services", description = "API para gerenciamento de serviÃ§os")
public class ServiceController {
    
    private final ServiceService serviceService;
    
    // ===== CRUD OPERATIONS =====
    
    @GetMapping
    @Operation(summary = "Listar serviÃ§os", description = "Lista todos os serviÃ§os com filtros opcionais")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> list(
            @Parameter(description = "Status do serviÃ§o") 
            @RequestParam(required = false) Service.ServiceStatus status,
            @Parameter(description = "Categoria do serviÃ§o") 
            @RequestParam(required = false) String category,
            @Parameter(description = "Se Ã© faturÃ¡vel") 
            @RequestParam(required = false) Boolean isBillable,
            @Parameter(description = "Termo de busca") 
            @RequestParam(required = false) String searchTerm) {
        
        log.info("Listando serviÃ§os - status: {}, category: {}, isBillable: {}, searchTerm: {}", 
                status, category, isBillable, searchTerm);
        
        List<ServiceDTO> services = serviceService.findByFilters(status, category, isBillable, searchTerm);
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/paginated")
    @Operation(summary = "Listar serviÃ§os paginados", description = "Lista serviÃ§os com paginaÃ§Ã£o")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<Page<ServiceDTO>> listPaginated(
            @Parameter(description = "Status do serviÃ§o") 
            @RequestParam(required = false) Service.ServiceStatus status,
            @Parameter(description = "Categoria do serviÃ§o") 
            @RequestParam(required = false) String category,
            @Parameter(description = "Se Ã© faturÃ¡vel") 
            @RequestParam(required = false) Boolean isBillable,
            @Parameter(description = "Termo de busca") 
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        
        log.info("Listando serviÃ§os paginados - status: {}, category: {}, isBillable: {}, searchTerm: {}", 
                status, category, isBillable, searchTerm);
        
        Page<ServiceDTO> services = serviceService.findByFilters(status, category, isBillable, searchTerm, pageable);
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os serviÃ§os", description = "Lista todos os serviÃ§os sem filtros")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> listAll() {
        log.info("Listando todos os serviÃ§os");
        List<ServiceDTO> services = serviceService.findAll();
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar serviÃ§os ativos", description = "Lista apenas serviÃ§os ativos")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> listActive() {
        log.info("Listando serviÃ§os ativos");
        List<ServiceDTO> services = serviceService.findActiveServices();
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/billable")
    @Operation(summary = "Listar serviÃ§os faturÃ¡veis", description = "Lista apenas serviÃ§os faturÃ¡veis")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> listBillable() {
        log.info("Listando serviÃ§os faturÃ¡veis");
        List<ServiceDTO> services = serviceService.findBillableServices();
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar serviÃ§o por ID", description = "Retorna um serviÃ§o especÃ­fico")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<ServiceDTO> findById(@PathVariable UUID id) {
        log.info("Buscando serviÃ§o por ID: {}", id);
        ServiceDTO service = serviceService.findById(id);
        return ResponseEntity.ok(service);
    }
    
    @GetMapping("/code/{code}")
    @Operation(summary = "Buscar serviÃ§o por cÃ³digo", description = "Retorna um serviÃ§o especÃ­fico pelo cÃ³digo")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<ServiceDTO> findByCode(@PathVariable String code) {
        log.info("Buscando serviÃ§o por cÃ³digo: {}", code);
        ServiceDTO service = serviceService.findByCode(code);
        return ResponseEntity.ok(service);
    }
    
    @PostMapping
    @Operation(summary = "Criar serviÃ§o", description = "Cria um novo serviÃ§o")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> create(@Valid @RequestBody CreateServiceDTO dto) {
        log.info("Criando novo serviÃ§o: {}", dto.getName());
        
        // TODO: Obter ID do usuÃ¡rio logado do contexto de seguranÃ§a
        UUID currentUserId = UUID.randomUUID(); // TemporÃ¡rio
        dto.setCreatedBy(currentUserId);
        
        ServiceDTO createdService = serviceService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdService);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar serviÃ§o", description = "Atualiza um serviÃ§o existente")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> update(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateServiceDTO dto) {
        log.info("Atualizando serviÃ§o: {}", id);
        
        // TODO: Obter ID do usuÃ¡rio logado do contexto de seguranÃ§a
        UUID currentUserId = UUID.randomUUID(); // TemporÃ¡rio
        dto.setUpdatedBy(currentUserId);
        
        ServiceDTO updatedService = serviceService.update(id, dto);
        return ResponseEntity.ok(updatedService);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir serviÃ§o", description = "Exclui um serviÃ§o")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("Excluindo serviÃ§o: {}", id);
        serviceService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== SPECIFIC SEARCHES =====
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Listar serviÃ§os por categoria", description = "Lista serviÃ§os de uma categoria especÃ­fica")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> findByCategory(@PathVariable String category) {
        log.info("Buscando serviÃ§os por categoria: {}", category);
        List<ServiceDTO> services = serviceService.findByCategory(category);
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/requiring-equipment")
    @Operation(summary = "Listar serviÃ§os que requerem equipamento", description = "Lista serviÃ§os que requerem equipamento")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> findServicesRequiringEquipment() {
        log.info("Buscando serviÃ§os que requerem equipamento");
        List<ServiceDTO> services = serviceService.findServicesRequiringEquipment();
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/requiring-certification")
    @Operation(summary = "Listar serviÃ§os que requerem certificaÃ§Ã£o", description = "Lista serviÃ§os que requerem certificaÃ§Ã£o")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<ServiceDTO>> findServicesRequiringCertification() {
        log.info("Buscando serviÃ§os que requerem certificaÃ§Ã£o");
        List<ServiceDTO> services = serviceService.findServicesRequiringCertification();
        return ResponseEntity.ok(services);
    }
    
    // ===== UTILITY ENDPOINTS =====
    
    @GetMapping("/categories")
    @Operation(summary = "Listar categorias", description = "Lista todas as categorias distintas")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<List<String>> getCategories() {
        log.info("Listando categorias distintas");
        List<String> categories = serviceService.getDistinctCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/statistics")
    @Operation(summary = "EstatÃ­sticas dos serviÃ§os", description = "Retorna estatÃ­sticas dos serviÃ§os")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<Object> getStatistics() {
        log.info("Gerando estatÃ­sticas dos serviÃ§os");
        
        return ResponseEntity.ok(Map.of(
            "totalServices", serviceService.countByStatus(null),
            "activeServices", serviceService.countActiveServices(),
            "billableServices", serviceService.countBillableServices(),
            "inactiveServices", serviceService.countByStatus(Service.ServiceStatus.INACTIVE)
        ));
    }
    
    @GetMapping("/exists/code/{code}")
    @Operation(summary = "Verificar se cÃ³digo existe", description = "Verifica se um cÃ³digo de serviÃ§o jÃ¡ existe")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('GESTOR')")
    public ResponseEntity<Object> existsByCode(@PathVariable String code) {
        log.info("Verificando se cÃ³digo existe: {}", code);
        boolean exists = serviceService.existsByCode(code);
        
        return ResponseEntity.ok(Map.of(
            "code", code,
            "exists", exists
        ));
    }
}

