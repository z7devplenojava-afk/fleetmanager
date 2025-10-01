package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EmployeeService;

import br.com.fleetmanager.dto.EmployeeDTO;
import br.com.fleetmanager.dto.SimpleEmployeeDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Employee;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Funcionários", description = "Endpoints para gestão de funcionários")
public class EmployeeController {
    
    private final EmployeeService employeeService;
    
    @GetMapping
    @Operation(summary = "Listar todos os funcionários", description = "Retorna uma lista de todos os funcionários")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionários retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> getAll() {
        List<Employee> employees = employeeService.findAll();
        List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar funcionário por ID", description = "Retorna um funcionário específico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Funcionário encontrado"),
            @ApiResponse(responseCode = "404", description = "Funcionário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> getById(@PathVariable String id) {
        Employee employee = employeeService.findById(UUID.fromString(id));
        return ResponseEntity.ok(employeeService.toDTO(employee));
    }
    
    @GetMapping("/email/{email}")
    @Operation(summary = "Buscar funcionário por email", description = "Retorna um funcionário específico pelo email")
    public ResponseEntity<EmployeeDTO> getByEmail(@PathVariable String email) {
        Employee employee = employeeService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado"));
        return ResponseEntity.ok(employeeService.toDTO(employee));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo funcionário", description = "Cria um novo funcionário no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Funcionário criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> create(@Valid @RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO createdEmployee = employeeService.create(employeeDTO);
        return ResponseEntity.status(201).body(createdEmployee);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar funcionário", description = "Atualiza os dados de um funcionário existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Funcionário atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Funcionário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> update(@PathVariable String id, @Valid @RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO updatedEmployee = employeeService.update(UUID.fromString(id), employeeDTO);
        return ResponseEntity.ok(updatedEmployee);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir funcionário", description = "Exclui um funcionário do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Funcionário excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Funcionário não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        employeeService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/status")
    @Operation(summary = "Atualizar status do funcionário", description = "Atualiza apenas o status de um funcionário")
    public ResponseEntity<Employee> updateStatus(@PathVariable String id, @RequestParam String status) {
        try {
            br.com.fleetmanager.model.enums.EmploymentStatus employmentStatus = 
                br.com.fleetmanager.model.enums.EmploymentStatus.valueOf(status.toUpperCase());
            Employee employee = employeeService.updateStatus(UUID.fromString(id), employmentStatus);
            return ResponseEntity.ok(employee);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Status inválido: " + status);
        }
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Listar funcionários por status", description = "Retorna uma lista de funcionários filtrados por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionários retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status inválido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> getByStatus(@PathVariable String status) {
        try {
            System.out.println("[DEBUG] EmployeeController.getByStatus - Status recebido: " + status);
            br.com.fleetmanager.model.enums.EmploymentStatus employmentStatus = 
                br.com.fleetmanager.model.enums.EmploymentStatus.valueOf(status.toUpperCase());
            System.out.println("[DEBUG] EmployeeController.getByStatus - Status convertido: " + employmentStatus);
            List<Employee> employees = employeeService.findByStatus(employmentStatus);
            System.out.println("[DEBUG] EmployeeController.getByStatus - Funcionários encontrados: " + employees.size());
            List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
            System.out.println("[DEBUG] EmployeeController.getByStatus - DTOs criados: " + dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (IllegalArgumentException e) {
            System.err.println("[ERROR] EmployeeController.getByStatus - Status inválido: " + status);
            throw new RuntimeException("Status inválido: " + status);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.getByStatus - Erro geral: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/search/name")
    @Operation(summary = "Buscar funcionários por nome", description = "Retorna funcionários cujo nome contenha o termo informado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionários retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca inválido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> searchByName(@RequestParam String name) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchByName - Nome recebido: " + name);
            List<Employee> employees = employeeService.findByNameContaining(name);
            System.out.println("[DEBUG] EmployeeController.searchByName - Funcionários encontrados: " + employees.size());
            List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchByName - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários por nome: " + e.getMessage());
        }
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar funcionários por nome ou documento", description = "Retorna funcionários cujo nome ou documento contenha o termo informado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionários retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca inválido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> searchByNameOrDocument(@RequestParam String q) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchByNameOrDocument - Termo recebido: " + q);
            List<Employee> employees = employeeService.findByNameOrDocumentContaining(q);
            System.out.println("[DEBUG] EmployeeController.searchByNameOrDocument - Funcionários encontrados: " + employees.size());
            List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchByNameOrDocument - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários: " + e.getMessage());
        }
    }
    
    @GetMapping("/search/simple")
    @Operation(summary = "Buscar funcionários simplificados", description = "Retorna dados simplificados de funcionários para seleção em formulários")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionários simplificados retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca inválido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<SimpleEmployeeDTO>> searchSimple(@RequestParam String q) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchSimple - Termo recebido: " + q);
            List<SimpleEmployeeDTO> employees = employeeService.findSimpleEmployeesByNameOrDocument(q);
            System.out.println("[DEBUG] EmployeeController.searchSimple - Funcionários encontrados: " + employees.size());
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchSimple - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionários: " + e.getMessage());
        }
    }
} 