package br.com.fleetmanager.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;
import br.com.fleetmanager.repository.VehicleMaintenanceRepository;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import br.com.fleetmanager.model.VehicleMaintenance;

@RestController
@RequestMapping("/api/test")
@Slf4j
public class TestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VehicleMaintenanceRepository maintenanceRepository;

    @GetMapping("/simple")
    public ResponseEntity<Map<String, Object>> simpleTest() {
        log.info("🔍 Teste simples executado");
        return ResponseEntity.ok(Map.of(
            "message", "Teste simples funcionando",
            "status", "success",
            "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/maintenance-simple")
    public ResponseEntity<List<Map<String, Object>>> maintenanceSimpleTest() {
        log.info("🔧 Teste simples de manutenção executado");
        
        // Retornar dados de exemplo sem usar o banco
        List<Map<String, Object>> maintenances = new ArrayList<>();
        maintenances.add(Map.of(
            "id", "test-1",
            "vehicleId", "vehicle-1",
            "vehiclePlate", "ABC-1234",
            "date", "2024-01-20",
            "maintenanceType", "PREVENTIVE",
            "description", "Manutenção preventiva de teste",
            "status", "SCHEDULED",
            "priority", "MEDIUM"
        ));
        
        return ResponseEntity.ok(maintenances);
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        try {
            log.info("🔍 Testando conexão com banco de dados...");
            
            // Testar se a tabela vehicle_maintenances existe
            String checkTableSql = """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'vehicle_maintenances'
                ) as table_exists
                """;
            
            Boolean tableExists = jdbcTemplate.queryForObject(checkTableSql, Boolean.class);
            
            // Testar se as colunas photos e documents existem
            String checkColumnsSql = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'vehicle_maintenances' 
                AND column_name IN ('photos', 'documents')
                """;
            
            List<String> existingColumns = jdbcTemplate.queryForList(checkColumnsSql, String.class);
            
            // Testar se há dados na tabela
            String countSql = "SELECT COUNT(*) FROM vehicle_maintenances";
            Integer count = jdbcTemplate.queryForObject(countSql, Integer.class);
            
            Map<String, Object> result = Map.of(
                "tableExists", tableExists,
                "photosColumnExists", existingColumns.contains("photos"),
                "documentsColumnExists", existingColumns.contains("documents"),
                "recordCount", count,
                "status", "success"
            );
            
            log.info("✅ Teste de banco concluído: {}", result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ Erro no teste de banco: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "error", e.getMessage(),
                "status", "error"
            ));
        }
    }

    @GetMapping("/maintenance-debug")
    public ResponseEntity<Map<String, Object>> maintenanceDebug() {
        log.info("🔍 Debug do endpoint de manutenção");
        try {
            // Testar se o repositório funciona
            long count = maintenanceRepository.count();
            log.info("✅ Contagem de manutenções: {}", count);
            
            // Testar se consegue buscar uma manutenção
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAll();
            log.info("✅ Manutenções encontradas: {}", maintenances.size());
            
            if (!maintenances.isEmpty()) {
                VehicleMaintenance first = maintenances.get(0);
                log.info("✅ Primeira manutenção - ID: {}, Date: {}, Type: {}", 
                    first.getId(), first.getDate(), first.getMaintenanceType());
            }
            
            return ResponseEntity.ok(Map.of(
                "count", count,
                "maintenancesFound", maintenances.size(),
                "status", "success",
                "message", "Repositório funcionando corretamente"
            ));
            
        } catch (Exception e) {
            log.error("❌ Erro no debug de manutenção: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "error", e.getMessage(),
                "errorType", e.getClass().getSimpleName(),
                "status", "error"
            ));
        }
    }
} 