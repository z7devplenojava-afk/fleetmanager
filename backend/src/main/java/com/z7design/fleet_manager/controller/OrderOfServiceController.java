package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateOrderOfServiceDTO;
import com.z7design.fleet_manager.dto.OrderOfServiceDTO;
import com.z7design.fleet_manager.service.OrderOfServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders-of-service")
@RequiredArgsConstructor
@Tag(name = "Orders of Service", description = "API para gerenciamento de ordens de serviÃ§o")
public class OrderOfServiceController {
    
    private final OrderOfServiceService orderOfServiceService;
    
    @GetMapping
    @Operation(summary = "Listar ordens de serviÃ§o", description = "Lista todas as ordens de serviÃ§o ou filtra por funcionÃ¡rio")
    public ResponseEntity<List<OrderOfServiceDTO>> list(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) Boolean signed,
            @RequestParam(required = false) String search) {
        
        if (employeeId != null) {
            List<OrderOfServiceDTO> orders = orderOfServiceService.listByEmployee(UUID.fromString(employeeId));
            return ResponseEntity.ok(orders);
        }
        
        if (signed != null) {
            List<OrderOfServiceDTO> orders = orderOfServiceService.findBySigned(signed);
            return ResponseEntity.ok(orders);
        }
        
        if (search != null && !search.trim().isEmpty()) {
            List<OrderOfServiceDTO> orders = orderOfServiceService.searchByTerm(search);
            return ResponseEntity.ok(orders);
        }
        
        List<OrderOfServiceDTO> orders = orderOfServiceService.listAll();
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar ordem de serviÃ§o por ID", description = "Retorna uma ordem de serviÃ§o especÃ­fica")
    public ResponseEntity<OrderOfServiceDTO> findById(@PathVariable String id) {
        OrderOfServiceDTO order = orderOfServiceService.findById(UUID.fromString(id));
        return ResponseEntity.ok(order);
    }
    
    @PostMapping
    @Operation(summary = "Criar ordem de serviÃ§o", description = "Cria uma nova ordem de serviÃ§o")
    public ResponseEntity<OrderOfServiceDTO> create(@Valid @RequestBody CreateOrderOfServiceDTO dto) {
        OrderOfServiceDTO createdOrder = orderOfServiceService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar ordem de serviÃ§o", description = "Atualiza uma ordem de serviÃ§o existente")
    public ResponseEntity<OrderOfServiceDTO> update(@PathVariable String id, @Valid @RequestBody CreateOrderOfServiceDTO dto) {
        OrderOfServiceDTO updatedOrder = orderOfServiceService.update(UUID.fromString(id), dto);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @PostMapping("/{id}/sign")
    @Operation(summary = "Assinar ordem de serviÃ§o", description = "Marca uma ordem de serviÃ§o como assinada")
    public ResponseEntity<OrderOfServiceDTO> sign(@PathVariable String id) {
        OrderOfServiceDTO signedOrder = orderOfServiceService.sign(UUID.fromString(id));
        return ResponseEntity.ok(signedOrder);
    }
    
    @PostMapping("/{id}/document")
    @Operation(summary = "Atualizar URL do documento", description = "Atualiza a URL do documento da ordem de serviÃ§o")
    public ResponseEntity<OrderOfServiceDTO> updateDocumentUrl(@PathVariable String id, @RequestBody String documentUrl) {
        OrderOfServiceDTO updatedOrder = orderOfServiceService.updateDocumentUrl(UUID.fromString(id), documentUrl);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir ordem de serviÃ§o", description = "Exclui uma ordem de serviÃ§o")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        orderOfServiceService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 
