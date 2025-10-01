package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.OrderOfServiceService;

import br.com.fleetmanager.dto.CreateOrderOfServiceDTO;
import br.com.fleetmanager.dto.OrderOfServiceDTO;
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
@Tag(name = "Orders of Service", description = "API para gerenciamento de ordens de serviço")
public class OrderOfServiceController {
    
    private final OrderOfServiceService orderOfServiceService;
    
    @GetMapping
    @Operation(summary = "Listar ordens de serviço", description = "Lista todas as ordens de serviço ou filtra por funcionário")
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
    @Operation(summary = "Buscar ordem de serviço por ID", description = "Retorna uma ordem de serviço específica")
    public ResponseEntity<OrderOfServiceDTO> findById(@PathVariable String id) {
        OrderOfServiceDTO order = orderOfServiceService.findById(UUID.fromString(id));
        return ResponseEntity.ok(order);
    }
    
    @PostMapping
    @Operation(summary = "Criar ordem de serviço", description = "Cria uma nova ordem de serviço")
    public ResponseEntity<OrderOfServiceDTO> create(@Valid @RequestBody CreateOrderOfServiceDTO dto) {
        OrderOfServiceDTO createdOrder = orderOfServiceService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar ordem de serviço", description = "Atualiza uma ordem de serviço existente")
    public ResponseEntity<OrderOfServiceDTO> update(@PathVariable String id, @Valid @RequestBody CreateOrderOfServiceDTO dto) {
        OrderOfServiceDTO updatedOrder = orderOfServiceService.update(UUID.fromString(id), dto);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @PostMapping("/{id}/sign")
    @Operation(summary = "Assinar ordem de serviço", description = "Marca uma ordem de serviço como assinada")
    public ResponseEntity<OrderOfServiceDTO> sign(@PathVariable String id) {
        OrderOfServiceDTO signedOrder = orderOfServiceService.sign(UUID.fromString(id));
        return ResponseEntity.ok(signedOrder);
    }
    
    @PostMapping("/{id}/document")
    @Operation(summary = "Atualizar URL do documento", description = "Atualiza a URL do documento da ordem de serviço")
    public ResponseEntity<OrderOfServiceDTO> updateDocumentUrl(@PathVariable String id, @RequestBody String documentUrl) {
        OrderOfServiceDTO updatedOrder = orderOfServiceService.updateDocumentUrl(UUID.fromString(id), documentUrl);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir ordem de serviço", description = "Exclui uma ordem de serviço")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        orderOfServiceService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 