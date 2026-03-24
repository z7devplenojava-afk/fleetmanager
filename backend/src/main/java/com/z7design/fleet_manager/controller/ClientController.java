package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ClientDTO;
import com.z7design.fleet_manager.dto.ClientSelectDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import com.z7design.fleet_manager.service.ClientService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Clientes", description = "Endpoints para gestÃ£o de clientes")
public class ClientController {
    
    private final ClientService clientService;
    
    @GetMapping
    @Operation(summary = "Listar todos os clientes", description = "Retorna uma lista paginada de todos os clientes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de clientes retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ClientDTO>> getAll(
            @Parameter(description = "Termo de busca") @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @Parameter(description = "Status do cliente") @RequestParam(value = "status", required = false) ClientStatus status,
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        
        try {
            log.info("GET /api/clients - searchTerm: {}, status: {}, page: {}, size: {}", 
                    searchTerm, status, pageable.getPageNumber(), pageable.getPageSize());
            
            Page<ClientDTO> result;
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                log.info("Executando busca por termo: {}", searchTerm);
                result = clientService.searchClients(searchTerm, pageable);
            } else if (status != null) {
                log.info("Executando busca por status: {}", status);
                result = clientService.getClientsByStatus(status, pageable);
            } else {
                log.info("Executando busca geral");
                result = clientService.getAllClients(pageable);
            }
            
            log.info("Resultado: {} clientes encontrados", result.getTotalElements());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao buscar clientes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os clientes (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todos os clientes")
    public ResponseEntity<List<ClientDTO>> getAllWithoutPagination() {
        return ResponseEntity.ok(clientService.getAllClients(Pageable.unpaged()).getContent());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID", description = "Retorna um cliente especÃ­fico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente encontrado"),
            @ApiResponse(responseCode = "404", description = "Cliente nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(clientService.getClientById(UUID.fromString(id)));
    }
    
    @GetMapping("/select")
    @Operation(summary = "Listar clientes para seleÃ§Ã£o", description = "Retorna uma lista de clientes para seleÃ§Ã£o")
    public ResponseEntity<List<ClientDTO>> getForSelect() {
        return ResponseEntity.ok(clientService.getAllClients(Pageable.unpaged()).getContent());
    }
    
    @PostMapping
    @Operation(summary = "Criar novo cliente", description = "Cria um novo cliente no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cliente criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> create(@Valid @RequestBody ClientDTO clientDTO) {
        log.info("[DEBUG] ClientController.create - Iniciando criaÃ§Ã£o de cliente");
        log.info("[DEBUG] Dados recebidos: {}", clientDTO.getName());
        log.info("[DEBUG] CNPJ: {}", clientDTO.getCnpj());
        log.info("[DEBUG] Email: {}", clientDTO.getEmail());

        // Deixar exceÃ§Ãµes de validaÃ§Ã£o/negÃ³cio propagarem para o GlobalExceptionHandler
        ClientDTO saved = clientService.createClient(clientDTO);
        log.info("[DEBUG] Cliente criado com sucesso: {}", saved.getId());
        return ResponseEntity.status(201).body(saved);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente", description = "Atualiza os dados de um cliente existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Cliente nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> update(@PathVariable String id, @Valid @RequestBody ClientDTO clientDTO) {
        ClientDTO updated = clientService.updateClient(UUID.fromString(id), clientDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir cliente", description = "Exclui um cliente do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cliente excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cliente nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        clientService.deleteClient(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 
