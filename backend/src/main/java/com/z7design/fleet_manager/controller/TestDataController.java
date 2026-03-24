package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.WorkPostStatus;
import com.z7design.fleet_manager.model.enums.WorkPostType;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/test-data")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dados de Teste", description = "Endpoints para criar dados de teste")
public class TestDataController {

    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;

    @PostMapping("/create-basic-data")
    @Operation(summary = "Criar dados bÃ¡sicos de teste", description = "Insere clientes, funcionÃ¡rios e postos de teste")
    public ResponseEntity<Map<String, Object>> createBasicTestData() {
        try {
            log.info("Criando dados bÃ¡sicos de teste...");
            
            // 1. Criar cliente de teste
            Client testClient = new Client();
            testClient.setId(UUID.randomUUID());
            testClient.setName("Cliente Teste ABC");
            testClient.setCnpj("12.345.678/0001-90");
            testClient.setEmail("teste@abc.com");
            testClient.setPhone("(11) 3333-3333");
            testClient.setAddress("Rua das Flores, 123");
            testClient.setCity("SÃ£o Paulo");
            testClient.setState("SP");
            testClient.setZipCode("01234-567");
            testClient.setStatus(com.z7design.fleet_manager.model.enums.ClientStatus.ACTIVE);
            
            Client savedClient = clientRepository.save(testClient);
            log.info("Cliente criado: {}", savedClient.getName());

            // 2. Criar funcionÃ¡rios de teste
            Employee emp1 = new Employee();
            emp1.setId(UUID.randomUUID());
            emp1.setName("JoÃ£o Silva");
            emp1.setDocument("123.456.789-01");
            emp1.setBirthDate(LocalDate.of(1985, 3, 15));
            emp1.setAddress("Rua A, 100");
            emp1.setPhone("(11) 99999-9999");
            emp1.setEmail("joao@teste.com");
            emp1.setHireDate(LocalDate.of(2024, 1, 15));
            emp1.setStatus(com.z7design.fleet_manager.model.enums.EmploymentStatus.ACTIVE);
            
            Employee emp2 = new Employee();
            emp2.setId(UUID.randomUUID());
            emp2.setName("Maria Santos");
            emp2.setDocument("987.654.321-09");
            emp2.setBirthDate(LocalDate.of(1990, 7, 22));
            emp2.setAddress("Av. B, 200");
            emp2.setPhone("(11) 88888-8888");
            emp2.setEmail("maria@teste.com");
            emp2.setHireDate(LocalDate.of(2023, 8, 10));
            emp2.setStatus(com.z7design.fleet_manager.model.enums.EmploymentStatus.ACTIVE);
            
            Employee savedEmp1 = employeeRepository.save(emp1);
            Employee savedEmp2 = employeeRepository.save(emp2);
            log.info("FuncionÃ¡rios criados: {}, {}", savedEmp1.getName(), savedEmp2.getName());

            // 3. Criar postos de teste
            WorkPost post1 = new WorkPost();
            post1.setId(UUID.randomUUID());
            post1.setPostCode("POST-001");
            post1.setName("Posto Shopping Center");
            post1.setDescription("Posto de seguranÃ§a no shopping");
            post1.setType(WorkPostType.POSTO_24H);
            post1.setStatus(WorkPostStatus.ATIVO);
            post1.setAddress("Av. Paulista, 1000");
            post1.setCity("SÃ£o Paulo");
            post1.setState("SP");
            post1.setZipCode("01310-100");
            post1.setClient(savedClient);
            post1.setRequiredVigilantes(3);
            post1.setWorkSchedule("24 horas");
            
            WorkPost post2 = new WorkPost();
            post2.setId(UUID.randomUUID());
            post2.setPostCode("POST-002");
            post2.setName("Posto Banco Central");
            post2.setDescription("Posto de seguranÃ§a bancÃ¡rio");
            post2.setType(WorkPostType.POSTO_12H_DIURNO);
            post2.setStatus(WorkPostStatus.ATIVO);
            post2.setAddress("Rua Augusta, 500");
            post2.setCity("SÃ£o Paulo");
            post2.setState("SP");
            post2.setZipCode("01305-000");
            post2.setClient(savedClient);
            post2.setRequiredVigilantes(2);
            post2.setWorkSchedule("12h diurno");
            
            WorkPost savedPost1 = workPostRepository.save(post1);
            WorkPost savedPost2 = workPostRepository.save(post2);
            log.info("Postos criados: {}, {}", savedPost1.getName(), savedPost2.getName());

            // Resposta
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Dados de teste criados com sucesso!");
            response.put("data", Map.of(
                "clients", 1,
                "employees", 2,
                "workPosts", 2
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro ao criar dados de teste: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao criar dados de teste: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/check-data")
    @Operation(summary = "Verificar dados existentes", description = "Conta quantos registros existem em cada tabela")
    public ResponseEntity<Map<String, Object>> checkExistingData() {
        try {
            long clientCount = clientRepository.count();
            long employeeCount = employeeRepository.count();
            long workPostCount = workPostRepository.count();
            
            Map<String, Object> response = new HashMap<>();
            response.put("clients", clientCount);
            response.put("employees", employeeCount);
            response.put("workPosts", workPostCount);
            response.put("hasData", clientCount > 0 && employeeCount > 0 && workPostCount > 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro ao verificar dados: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

