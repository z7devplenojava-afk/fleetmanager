package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.service.SupervisorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/supervisors")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supervisores", description = "API para gerenciamento de supervisores")
public class SupervisorController {
    
    private final SupervisorService supervisorService;
    
    @GetMapping
    @Operation(summary = "Listar supervisores", description = "Retorna uma lista paginada de supervisores")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de supervisores retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Page<SupervisorDTO>> getAllSupervisors(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        Page<SupervisorDTO> supervisors = supervisorService.getAllSupervisors(pageable);
        return ResponseEntity.ok(supervisors);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar supervisores ativos", description = "Retorna uma lista de supervisores ativos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de supervisores ativos retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<SupervisorDTO>> getActiveSupervisors() {
        List<SupervisorDTO> supervisors = supervisorService.getAllActiveSupervisors();
        return ResponseEntity.ok(supervisors);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar supervisor por ID", description = "Retorna um supervisor especÃ­fico pelo seu ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Supervisor encontrado"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupervisorDTO> getSupervisorById(
            @Parameter(description = "ID do supervisor") @PathVariable UUID id) {
        SupervisorDTO supervisor = supervisorService.getSupervisorById(id);
        return ResponseEntity.ok(supervisor);
    }
    
    @GetMapping("/cpf/{cpf}")
    @Operation(summary = "Buscar supervisor por CPF", description = "Retorna um supervisor ativo pelo CPF")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Supervisor encontrado"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupervisorDTO> getSupervisorByCpf(
            @Parameter(description = "CPF do supervisor") @PathVariable String cpf) {
        SupervisorDTO supervisor = supervisorService.getSupervisorByCpf(cpf);
        return ResponseEntity.ok(supervisor);
    }
    
    @PostMapping
    @Operation(summary = "Criar novo supervisor", description = "Cria um novo supervisor no sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Supervisor criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupervisorDTO> createSupervisor(
            @Parameter(description = "Dados do supervisor") @Valid @RequestBody CreateSupervisorDTO createDTO) {
        SupervisorDTO supervisor = supervisorService.createSupervisor(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(supervisor);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar supervisor", description = "Atualiza os dados de um supervisor existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Supervisor atualizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupervisorDTO> updateSupervisor(
            @Parameter(description = "ID do supervisor") @PathVariable UUID id,
            @Parameter(description = "Dados do supervisor para atualizaÃ§Ã£o") @Valid @RequestBody UpdateSupervisorDTO updateDTO) {
        SupervisorDTO supervisor = supervisorService.updateSupervisor(id, updateDTO);
        return ResponseEntity.ok(supervisor);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir supervisor", description = "Exclui um supervisor do sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Supervisor excluÃ­do com sucesso"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteSupervisor(
            @Parameter(description = "ID do supervisor") @PathVariable UUID id) {
        supervisorService.deleteSupervisor(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/register-face")
    @Operation(summary = "Registrar face do supervisor", description = "Registra a face do supervisor para reconhecimento facial")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Face registrada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido ou qualidade insuficiente"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<SupervisorDTO> registerFace(
            @Parameter(description = "ID do supervisor") @PathVariable UUID id,
            @Parameter(description = "Arquivo de imagem da face") @RequestParam("image") MultipartFile imageFile) {
        SupervisorDTO supervisor = supervisorService.registerFace(id, imageFile);
        return ResponseEntity.ok(supervisor);
    }
    
    @DeleteMapping("/{id}/remove-face")
    @Operation(summary = "Remover face do supervisor", description = "Remove o registro facial do supervisor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Face removida com sucesso"),
        @ApiResponse(responseCode = "404", description = "Supervisor nÃ£o encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> removeFace(
            @Parameter(description = "ID do supervisor") @PathVariable UUID id) {
        supervisorService.removeFace(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar supervisores por nome", description = "Busca supervisores ativos pelo nome")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de supervisores encontrados"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<SupervisorDTO>> searchSupervisorsByName(
            @Parameter(description = "Nome para busca") @RequestParam String name) {
        List<SupervisorDTO> supervisors = supervisorService.searchSupervisorsByName(name);
        return ResponseEntity.ok(supervisors);
    }
    
    @GetMapping("/count")
    @Operation(summary = "Contar supervisores ativos", description = "Retorna o nÃºmero de supervisores ativos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Contagem retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Object> countActiveSupervisors() {
        long count = supervisorService.countActiveSupervisors();
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }
}

