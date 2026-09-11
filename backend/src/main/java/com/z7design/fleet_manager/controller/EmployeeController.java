package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.dto.SimpleEmployeeDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.service.EmployeeService;
import com.z7design.fleet_manager.service.EmployeeRecordPdfService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.z7design.fleet_manager.service.EmployeeExcelImportService;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "FuncionÃ¡rios", description = "Endpoints para gestÃ£o de funcionÃ¡rios")
public class EmployeeController {
    
    private final EmployeeService employeeService;
    private final EmployeeRecordPdfService employeeRecordPdfService;
    private final EmployeeExcelImportService employeeExcelImportService;
    private final com.z7design.fleet_manager.service.EmployeePdfImportService employeePdfImportService;

    @PostMapping(value = "/import-pdf", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar Ficha de Registro em PDF", description = "Importa um ou múltiplos funcionários e dados da empresa a partir de PDF da Ficha de Registro de Empregado")
    public ResponseEntity<Object> importEmployeePdf(@RequestParam("file") MultipartFile file) {
        try {
            com.z7design.fleet_manager.service.EmployeePdfImportService.PdfImportResult result = employeePdfImportService.importEmployeeFromPdf(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Erro ao importar PDF de funcionário: " + e.getMessage());
            e.printStackTrace();
            String msg = (e.getMessage() != null && !e.getMessage().isBlank()) ? e.getMessage() : e.getClass().getName();
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", msg);
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/count")
    @Operation(summary = "Contar funcionÃ¡rios", description = "Retorna o nÃºmero total de funcionÃ¡rios")
    public ResponseEntity<Object> getCount() {
        try {
            System.out.println("ðŸ” EmployeeController.getCount - Testando acesso ao banco");
            long count = employeeService.count();
            System.out.println("âœ… EmployeeController.getCount - Encontrados " + count + " funcionÃ¡rios");
            return ResponseEntity.ok(java.util.Map.of("count", count, "message", "Acesso ao banco funcionando"));
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getCount - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/test")
    @Operation(summary = "Teste simples de status", description = "Endpoint de teste para verificar funcionamento")
    public ResponseEntity<Object> testStatus() {
        try {
            System.out.println("ðŸ” EmployeeController.testStatus - Testando endpoint");
            return ResponseEntity.ok(java.util.Map.of("message", "Endpoint funcionando", "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.testStatus - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/simple")
    @Operation(summary = "Listar funcionÃ¡rios simples", description = "Retorna uma lista simples de funcionÃ¡rios sem conversÃ£o DTO")
    public ResponseEntity<Object> getAllSimple() {
        try {
            System.out.println("ðŸ” EmployeeController.getAllSimple - Buscando dados bÃ¡sicos");
            
            List<Employee> employees = employeeService.findAll();
            System.out.println("ðŸ” Encontrados " + employees.size() + " funcionÃ¡rios no banco");
            
            if (employees.isEmpty()) {
                    return ResponseEntity.ok(java.util.Collections.emptyList());
                }
            
            // Retornar apenas dados bÃ¡sicos sem conversÃ£o DTO
            List<java.util.Map<String, Object>> simpleEmployees = new java.util.ArrayList<>();
            for (Employee employee : employees) {
                java.util.Map<String, Object> simple = new java.util.HashMap<>();
                simple.put("id", employee.getId());
                simple.put("name", employee.getName());
                simple.put("email", employee.getEmail());
                simple.put("phone", employee.getPhone());
                simple.put("status", employee.getStatus() != null ? employee.getStatus().name() : null);
                simple.put("createdAt", employee.getCreatedAt());
                simpleEmployees.add(simple);
            }
            
            System.out.println("âœ… EmployeeController.getAllSimple - Retornando " + simpleEmployees.size() + " funcionÃ¡rios simples");
            return ResponseEntity.ok(simpleEmployees);
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getAllSimple - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Teste bÃ¡sico", description = "Teste bÃ¡sico de acesso ao banco")
    public ResponseEntity<Object> testBasic() {
        try {
            System.out.println("ðŸ” EmployeeController.testBasic - Teste bÃ¡sico");
            
            // Teste 1: Contar funcionÃ¡rios
            long count = employeeService.count();
            System.out.println("âœ… Contagem: " + count);
            
            // Teste 2: Buscar apenas os IDs sem carregar relacionamentos
            try {
                List<Employee> employees = employeeService.findAll();
                System.out.println("âœ… Busca findAll executada com sucesso");
                
                if (!employees.isEmpty()) {
                    Employee first = employees.get(0);
                    System.out.println("âœ… Primeiro funcionÃ¡rio: " + first.getName());
                    
                    java.util.Map<String, Object> result = new java.util.HashMap<>();
                    result.put("count", count);
                    result.put("firstEmployee", first.getName());
                    result.put("firstEmployeeId", first.getId());
                    result.put("totalFound", employees.size());
                    return ResponseEntity.ok(result);
                } else {
                    return ResponseEntity.ok(java.util.Map.of("count", count, "message", "Nenhum funcionÃ¡rio encontrado"));
                }
            } catch (Exception findAllError) {
                System.err.println("âŒ Erro no findAll: " + findAllError.getMessage());
                findAllError.printStackTrace();
                
                // Retornar apenas a contagem se o findAll falhar
                return ResponseEntity.ok(java.util.Map.of(
                    "count", count, 
                    "findAllError", findAllError.getMessage(),
                    "message", "Contagem funcionou, mas findAll falhou"
                ));
            }
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.testBasic - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ids")
    @Operation(summary = "Listar apenas IDs", description = "Retorna apenas os IDs dos funcionÃ¡rios")
    public ResponseEntity<Object> getEmployeeIds() {
        try {
            System.out.println("ðŸ” EmployeeController.getEmployeeIds - Buscando apenas IDs");
            
            // Usar query nativa para buscar apenas IDs
            List<UUID> employeeIds = employeeService.findAllIds();
            System.out.println("âœ… Encontrados " + employeeIds.size() + " IDs de funcionÃ¡rios");
            
            return ResponseEntity.ok(java.util.Map.of(
                "count", employeeIds.size(),
                "ids", employeeIds
            ));
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getEmployeeIds - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-id/{id}")
    @Operation(summary = "Buscar funcionÃ¡rio por ID individual", description = "Busca um funcionÃ¡rio especÃ­fico por ID")
    public ResponseEntity<Object> getEmployeeById(@PathVariable("id") UUID id) {
        try {
            System.out.println("ðŸ” EmployeeController.getEmployeeById - Buscando funcionÃ¡rio ID: " + id);
            
            Employee employee = employeeService.findById(id);
            if (employee != null) {
                System.out.println("âœ… FuncionÃ¡rio encontrado: " + employee.getName());
                
                // Retornar dados bÃ¡sicos sem conversÃ£o DTO
                java.util.Map<String, Object> result = new java.util.HashMap<>();
                result.put("id", employee.getId());
                result.put("name", employee.getName());
                result.put("email", employee.getEmail());
                result.put("phone", employee.getPhone());
                result.put("status", employee.getStatus() != null ? employee.getStatus().name() : null);
                result.put("createdAt", employee.getCreatedAt());
                
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getEmployeeById - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/basic")
    @Operation(summary = "Listar dados bÃ¡sicos", description = "Retorna dados bÃ¡sicos dos funcionÃ¡rios usando query nativa")
    public ResponseEntity<Object> getBasicData() {
        try {
            System.out.println("ðŸ” EmployeeController.getBasicData - Buscando dados bÃ¡sicos");
            
            List<Object[]> data = employeeService.findBasicData();
            System.out.println("âœ… Encontrados " + data.size() + " registros bÃ¡sicos");
            
            List<java.util.Map<String, Object>> employees = new java.util.ArrayList<>();
            for (Object[] row : data) {
                java.util.Map<String, Object> employee = new java.util.HashMap<>();
                employee.put("id", row[0]);
                employee.put("name", row[1]);
                employee.put("email", row[11]); // email estÃ¡ na posiÃ§Ã£o 11 na query completa
                employee.put("phone", row[10]); // phone estÃ¡ na posiÃ§Ã£o 10
                employee.put("status", row[7]); // status estÃ¡ na posiÃ§Ã£o 7
                employee.put("createdAt", row[17]); // created_at estÃ¡ na posiÃ§Ã£o 17
                
                // Adicionar position e unit
                if (row.length > 19 && row[19] != null) {
                    java.util.Map<String, Object> position = new java.util.HashMap<>();
                    position.put("name", row[19]); // position_name
                    employee.put("position", position);
                }
                
                if (row.length > 20 && row[20] != null) {
                    java.util.Map<String, Object> unit = new java.util.HashMap<>();
                    unit.put("name", row[20]); // unit_name
                    employee.put("unit", unit);
                }
                
                // Adicionar company (sigla) se existir (index 21)
                if (row.length > 21 && row[21] != null) {
                    java.util.Map<String, Object> company = new java.util.HashMap<>();
                    company.put("sigla", row[21]); // company_sigla
                    employee.put("company", company);
                }
                
                // Adicionar userId se existir (index 22)
                if (row.length > 22 && row[22] != null) {
                    employee.put("userId", row[22]);
                }
                
                employees.add(employee);
            }
            
            return ResponseEntity.ok(java.util.Map.of(
                "count", employees.size(),
                "employees", employees
            ));
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getBasicData - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Listar todos os funcionÃ¡rios", description = "Retorna uma lista de todos os funcionÃ¡rios com opÃ§Ã£o de busca por nome ou CPF")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionÃ¡rios retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @Transactional(readOnly = true)
    public ResponseEntity<Object> getAll(@RequestParam(value = "searchTerm", required = false) String searchTerm) {
        try {
            System.out.println("ðŸ” EmployeeController.getAll - Usando query nativa para evitar problemas de relacionamentos");
            System.out.println("ðŸ” EmployeeController.getAll - searchTerm: " + searchTerm);
            
            // Se houver searchTerm, usar busca por nome ou documento
            List<Object[]> data;
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                System.out.println("ðŸ” EmployeeController.getAll - Buscando por termo: " + searchTerm);
                data = employeeService.findBasicDataBySearchTerm(searchTerm.trim());
            } else {
                data = employeeService.findBasicData();
            }
            System.out.println("ðŸ” Encontrados " + data.size() + " funcionÃ¡rios no banco");
            
            if (data.isEmpty()) {
                System.out.println("âš ï¸ Lista de funcionÃ¡rios vazia");
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }
            
            // Converter para Map simples
            List<java.util.Map<String, Object>> employees = new java.util.ArrayList<>();
            for (Object[] row : data) {
                try {
                    java.util.Map<String, Object> employee = new java.util.HashMap<>();
                    employee.put("id", row[0]);
                    employee.put("name", row[1]);
                    employee.put("document", row[2]);
                    employee.put("birthDate", row[3]);
                    employee.put("registrationNumber", row[4]);
                    employee.put("hireDate", row[5]);
                    employee.put("terminationDate", row[6]);
                    employee.put("status", row[7]);
                    employee.put("notes", row[8]);
                    employee.put("address", row[9]);
                    employee.put("phone", row[10]);
                    employee.put("email", row[11]);
                    employee.put("cnhNumber", row[12]);
                    employee.put("ctps", row[13]);
                    employee.put("cbo", row[14]);
                    employee.put("pis", row[15]);
                    employee.put("salario", row[16]);
                    employee.put("createdAt", row[17]);
                    employee.put("updatedAt", row[18]);
                    
                    // Adicionar position e unit (novas colunas da query)
                    if (row.length > 19 && row[19] != null) {
                        java.util.Map<String, Object> position = new java.util.HashMap<>();
                        position.put("name", row[19]); // position_name
                        employee.put("position", position);
                    }
                    
                    if (row.length > 20 && row[20] != null) {
                        java.util.Map<String, Object> unit = new java.util.HashMap<>();
                        unit.put("name", row[20]); // unit_name
                        employee.put("unit", unit);
                    }
                    
                    // Adicionar company (sigla) se existir (index 21)
                    if (row.length > 21 && row[21] != null) {
                        java.util.Map<String, Object> company = new java.util.HashMap<>();
                        company.put("sigla", row[21]); // company_sigla
                        employee.put("company", company);
                    }
                    
                    // Adicionar userId se existir (index 22)
                    if (row.length > 22 && row[22] != null) {
                        employee.put("userId", row[22]);
                    }
                    
                    // Adicionar workPost se existir (index 23)
                    if (row.length > 23 && row[23] != null) {
                        java.util.Map<String, Object> workPost = new java.util.HashMap<>();
                        workPost.put("name", row[23]); // work_post_name
                        employee.put("workPost", workPost);
                    }
                    
                    // Adicionar department se existir (index 24)
                    if (row.length > 24 && row[24] != null) {
                        java.util.Map<String, Object> department = new java.util.HashMap<>();
                        department.put("name", row[24]); // department_name
                        employee.put("department", department);
                    }
                    
                    employees.add(employee);
                    } catch (Exception dtoError) {
                    System.err.println("âŒ Erro ao converter funcionÃ¡rio: " + dtoError.getMessage());
                        dtoError.printStackTrace();
                        // Continua com os outros funcionÃ¡rios
                    }
                }
                
            System.out.println("âœ… EmployeeController.getAll - Retornando " + employees.size() + " funcionÃ¡rios");
            return ResponseEntity.ok(employees);
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.getAll - Erro geral: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar funcionÃ¡rio por ID", description = "Retorna um funcionÃ¡rio especÃ­fico pelo seu ID com todos os relacionamentos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "FuncionÃ¡rio encontrado"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @Transactional(readOnly = true, noRollbackFor = com.z7design.fleet_manager.exception.ResourceNotFoundException.class)
    public ResponseEntity<Object> getById(@PathVariable("id") String id) {
        try {
            System.out.println("ðŸ” EmployeeController.getById - Buscando funcionÃ¡rio ID: " + id);
            
            // Converter String para UUID
            UUID employeeId;
            try {
                employeeId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                System.err.println("âŒ ID invÃ¡lido: " + id);
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "ID invÃ¡lido: " + id));
            }
            
            // Buscar funcionÃ¡rio completo com relacionamentos usando findById e toDTO
            Employee employee = employeeService.findById(employeeId);
            System.out.println("âœ… FuncionÃ¡rio encontrado: " + employee.getName());
            
            // Converter para DTO que inclui todos os relacionamentos (user, position, unit, etc)
            EmployeeDTO dto = employeeService.toDTO(employee);
            
            System.out.println("âœ… DTO convertido - User ID: " + (dto.getUser() != null ? dto.getUser().getId() : "null"));
            System.out.println("âœ… DTO convertido - Position ID: " + (dto.getPosition() != null ? dto.getPosition().getId() : "null"));
            System.out.println("âœ… DTO convertido - Unit ID: " + (dto.getUnit() != null ? dto.getUnit().getId() : "null"));
            
            return ResponseEntity.ok(dto);
            
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            System.err.println("❌ Funcionário não encontrado: " + id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            if (e.getMessage() != null && (e.getMessage().contains("não encontrado") || e.getMessage().contains("not found"))) {
                System.err.println("❌ Funcionário não encontrado: " + id);
                return ResponseEntity.notFound().build();
            }
            System.err.println("❌ EmployeeController.getById - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/email/{email}")
    @Operation(summary = "Buscar funcionÃ¡rio por email", description = "Retorna um funcionÃ¡rio especÃ­fico pelo email")
    public ResponseEntity<EmployeeDTO> getByEmail(@PathVariable("email") String email) {
        Employee employee = employeeService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
        return ResponseEntity.ok(employeeService.toDTO(employee));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo funcionÃ¡rio", description = "Cria um novo funcionÃ¡rio no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "FuncionÃ¡rio criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> create(@Valid @RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO createdEmployee = employeeService.create(employeeDTO);
        return ResponseEntity.status(201).body(createdEmployee);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar funcionÃ¡rio", description = "Atualiza os dados de um funcionÃ¡rio existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "FuncionÃ¡rio atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> update(@PathVariable("id") String id, @Valid @RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO updatedEmployee = employeeService.update(UUID.fromString(id), employeeDTO);
        return ResponseEntity.ok(updatedEmployee);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir funcionÃ¡rio", description = "Exclui um funcionÃ¡rio do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "FuncionÃ¡rio excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        employeeService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/status")
    @Operation(summary = "Atualizar status do funcionÃ¡rio", description = "Atualiza apenas o status de um funcionÃ¡rio")
    public ResponseEntity<Employee> updateStatus(@PathVariable("id") String id, @RequestParam(value = "status") String status) {
        try {
            com.z7design.fleet_manager.model.enums.EmploymentStatus employmentStatus = 
                com.z7design.fleet_manager.model.enums.EmploymentStatus.valueOf(status.toUpperCase());
            Employee employee = employeeService.updateStatus(UUID.fromString(id), employmentStatus);
            return ResponseEntity.ok(employee);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Status invÃ¡lido: " + status);
        }
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Listar funcionÃ¡rios por status", description = "Retorna uma lista de funcionÃ¡rios filtrados por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionÃ¡rios retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> getByStatus(@PathVariable("status") String status) {
        try {
            System.out.println("[DEBUG] EmployeeController.getByStatus - Status recebido: " + status);
            com.z7design.fleet_manager.model.enums.EmploymentStatus employmentStatus = 
                com.z7design.fleet_manager.model.enums.EmploymentStatus.valueOf(status.toUpperCase());
            System.out.println("[DEBUG] EmployeeController.getByStatus - Status convertido: " + employmentStatus);
            List<Employee> employees = employeeService.findByStatus(employmentStatus);
            System.out.println("[DEBUG] EmployeeController.getByStatus - FuncionÃ¡rios encontrados: " + employees.size());
            // Converter um por um para identificar qual estÃ¡ causando problema
            List<EmployeeDTO> dtos = new ArrayList<>();
            for (int i = 0; i < employees.size(); i++) {
                Employee employee = employees.get(i);
                try {
                    System.out.println("[DEBUG] Convertendo funcionÃ¡rio " + (i+1) + "/" + employees.size() + ": " + employee.getName());
                    
                    // Teste bÃ¡sico - apenas dados essenciais
                    EmployeeDTO dto = new EmployeeDTO();
                    dto.setId(employee.getId());
                    dto.setName(employee.getName());
                    dto.setEmail(employee.getEmail());
                    dto.setStatus(employee.getStatus() != null ? employee.getStatus().name() : null);
                    dto.setCreatedAt(employee.getCreatedAt());
                    dto.setUpdatedAt(employee.getUpdatedAt());
                    
                    dtos.add(dto);
                    System.out.println("[DEBUG] FuncionÃ¡rio " + (i+1) + " convertido com sucesso");
                    
                } catch (Exception ex) {
                    System.err.println("[ERROR] Erro ao converter funcionÃ¡rio " + (i+1) + " (" + employee.getName() + "): " + ex.getMessage());
                    ex.printStackTrace();
                    // Continuar com os outros funcionÃ¡rios
                }
            }
            
            System.out.println("[DEBUG] EmployeeController.getByStatus - DTOs criados: " + dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (IllegalArgumentException e) {
            System.err.println("[ERROR] EmployeeController.getByStatus - Status invÃ¡lido: " + status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.getByStatus - Erro geral: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/search/name")
    @Operation(summary = "Buscar funcionÃ¡rios por nome", description = "Retorna funcionÃ¡rios cujo nome contenha o termo informado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionÃ¡rios retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> searchByName(@RequestParam(value = "name") String name) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchByName - Nome recebido: " + name);
            List<Employee> employees = employeeService.findByNameContaining(name);
            System.out.println("[DEBUG] EmployeeController.searchByName - FuncionÃ¡rios encontrados: " + employees.size());
            List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchByName - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios por nome: " + e.getMessage());
        }
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar funcionÃ¡rios por nome ou documento", description = "Retorna funcionÃ¡rios cujo nome ou documento contenha o termo informado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionÃ¡rios retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<EmployeeDTO>> searchByNameOrDocument(@RequestParam(value = "q") String q) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchByNameOrDocument - Termo recebido: " + q);
            List<Employee> employees = employeeService.findByNameOrDocumentContaining(q);
            System.out.println("[DEBUG] EmployeeController.searchByNameOrDocument - FuncionÃ¡rios encontrados: " + employees.size());
            List<EmployeeDTO> dtos = employees.stream().map(employeeService::toDTO).collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchByNameOrDocument - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios: " + e.getMessage());
        }
    }
    
    @GetMapping("/search/simple")
    @PreAuthorize("hasAnyAuthority('EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'EMPLOYEES_CREATE', 'EMPLOYEES_DELETE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_HR', 'HR_READ')")
    @Operation(summary = "Buscar funcionÃ¡rios simplificados", description = "Retorna dados simplificados de funcionÃ¡rios para seleÃ§Ã£o em formulÃ¡rios")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de funcionÃ¡rios simplificados retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Termo de busca invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<SimpleEmployeeDTO>> searchSimple(@RequestParam(value = "q") String q) {
        try {
            System.out.println("[DEBUG] EmployeeController.searchSimple - Termo recebido: " + q);
            List<SimpleEmployeeDTO> employees = employeeService.findSimpleEmployeesByNameOrDocument(q);
            System.out.println("[DEBUG] EmployeeController.searchSimple - FuncionÃ¡rios encontrados: " + employees.size());
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.searchSimple - Erro: " + e.getMessage());
            throw new RuntimeException("Erro ao buscar funcionÃ¡rios: " + e.getMessage());
        }
    }
    
    @GetMapping("/search/cpf/{cpf}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'EMPLOYEES_CREATE', 'EMPLOYEES_DELETE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_HR', 'HR_READ')")
    @Operation(summary = "Buscar funcionÃ¡rio por CPF exato", description = "Busca funcionÃ¡rio por CPF normalizado (remove caracteres nÃ£o numÃ©ricos)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "FuncionÃ¡rio encontrado"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EmployeeDTO> findByCpfExact(@PathVariable("cpf") String cpf) {
        try {
            System.out.println("[DEBUG] EmployeeController.findByCpfExact - CPF recebido: " + cpf);
            
            java.util.Optional<Employee> employeeOpt = employeeService.findByCpfExact(cpf);
            
            if (employeeOpt.isPresent()) {
                EmployeeDTO dto = employeeService.toDTO(employeeOpt.get());
                System.out.println("[DEBUG] EmployeeController.findByCpfExact - FuncionÃ¡rio encontrado: " + dto.getName());
                return ResponseEntity.ok(dto);
            } else {
                System.out.println("[DEBUG] EmployeeController.findByCpfExact - FuncionÃ¡rio nÃ£o encontrado para CPF: " + cpf);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.findByCpfExact - Erro: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao buscar funcionÃ¡rio por CPF: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}/generate-record-pdf")
    @Operation(summary = "Gerar PDF da ficha de registro do funcionÃ¡rio", description = "Gera e retorna o PDF da ficha de registro do funcionÃ¡rio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF gerado com sucesso"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar PDF")
    })
    public ResponseEntity<byte[]> generateEmployeeRecordPdf(@PathVariable("id") String id) {
        try {
            System.out.println("[DEBUG] EmployeeController.generateEmployeeRecordPdf - ID: " + id);
            
            UUID employeeId = UUID.fromString(id);
            byte[] pdf = employeeRecordPdfService.generateEmployeeRecordPdf(employeeId);
            
            String fileName = "ficha-registro-funcionario-" + id + ".pdf";
            
            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdf);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.generateEmployeeRecordPdf - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/generate-record-excel")
    @Operation(summary = "Gerar Excel da ficha de registro do funcionÃ¡rio", description = "Gera e retorna o Excel da ficha de registro do funcionÃ¡rio")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Excel gerado com sucesso"),
            @ApiResponse(responseCode = "404", description = "FuncionÃ¡rio nÃ£o encontrado"),
            @ApiResponse(responseCode = "500", description = "Erro ao gerar Excel")
    })
    public ResponseEntity<byte[]> generateEmployeeRecordExcel(@PathVariable("id") String id) {
        try {
            System.out.println("[DEBUG] EmployeeController.generateEmployeeRecordExcel - ID: " + id);

            UUID employeeId = UUID.fromString(id);
            byte[] excel = employeeRecordPdfService.generateEmployeeRecordExcel(employeeId);

            String fileName = "ficha-registro-funcionario-" + id + ".xlsx";

            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excel);
        } catch (Exception e) {
            System.err.println("[ERROR] EmployeeController.generateEmployeeRecordExcel - Erro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ðŸ“¥ Importar funcionÃ¡rios de planilha Excel
     */
    @PostMapping("/import/excel")
    @Operation(summary = "Importar funcionÃ¡rios do Excel", description = "Importa funcionÃ¡rios de uma planilha Excel. A planilha deve conter uma coluna 'CNPJ Empresa' e os dados dos funcionÃ¡rios.")
    @PreAuthorize("hasAnyAuthority('RH_FUNCIONARIOS_CREATE', 'SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> importEmployeesFromExcel(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("ðŸ“¥ EmployeeController.importEmployeesFromExcel - Arquivo recebido: " + file.getOriginalFilename());
            
            if (file.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Arquivo vazio");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Processar importaÃ§Ã£o
            EmployeeExcelImportService.ImportResult result = employeeExcelImportService.importEmployees(file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("created", result.getCreated());
            response.put("updated", result.getUpdated());
            response.put("errors", result.getErrors());
            response.put("warnings", result.getWarnings());
            response.put("message", result.getSummary());
            
            System.out.println("âœ… EmployeeController.importEmployeesFromExcel - ImportaÃ§Ã£o concluÃ­da: " + result.getSummary());
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            System.err.println("âŒ EmployeeController.importEmployeesFromExcel - Erro: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao processar importaÃ§Ã£o: " + e.getMessage());
            errorResponse.put("errors", List.of(e.getMessage()));
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
} 
