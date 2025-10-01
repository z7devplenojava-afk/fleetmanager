package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ClientService;

import br.com.fleetmanager.dto.ClientDTO;
import br.com.fleetmanager.dto.ClientSelectDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Client;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
@Tag(name = "Clientes", description = "Endpoints para gestão de clientes")
public class ClientController {
    
    private final ClientService clientService;
    
    @GetMapping
    @Operation(summary = "Listar todos os clientes", description = "Retorna uma lista paginada de todos os clientes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de clientes retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ClientDTO>> getAll(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        return ResponseEntity.ok(clientService.getAllClients(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os clientes (sem paginação)", description = "Retorna uma lista completa de todos os clientes")
    public ResponseEntity<List<ClientDTO>> getAllWithoutPagination() {
        return ResponseEntity.ok(clientService.getAllClients(Pageable.unpaged()).getContent());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID", description = "Retorna um cliente específico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente encontrado"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(clientService.getClientById(UUID.fromString(id)));
    }
    
    @GetMapping("/select")
    @Operation(summary = "Listar clientes para seleção", description = "Retorna uma lista de clientes para seleção")
    public ResponseEntity<List<ClientDTO>> getForSelect() {
        return ResponseEntity.ok(clientService.getAllClients(Pageable.unpaged()).getContent());
    }
    
    @PostMapping
    @Operation(summary = "Criar novo cliente", description = "Cria um novo cliente no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cliente criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> create(@Valid @RequestBody ClientDTO clientDTO) {
        ClientDTO saved = clientService.createClient(clientDTO);
        return ResponseEntity.status(201).body(saved);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente", description = "Atualiza os dados de um cliente existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ClientDTO> update(@PathVariable String id, @Valid @RequestBody ClientDTO clientDTO) {
        ClientDTO updated = clientService.updateClient(UUID.fromString(id), clientDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir cliente", description = "Exclui um cliente do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cliente excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        clientService.deleteClient(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
} 