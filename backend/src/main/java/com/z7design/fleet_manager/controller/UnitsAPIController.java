package com.z7design.fleet_manager.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/units-api")
@RequiredArgsConstructor
@Slf4j
public class UnitsAPIController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "UnitsAPIController funcionando!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Map<String, Object>> units = new ArrayList<>();
        
        Map<String, Object> unit1 = new HashMap<>();
        unit1.put("id", "00000000-0000-0000-0000-000000000005");
        unit1.put("name", "Matriz");
        unit1.put("address", "Rua Principal, 123");
        unit1.put("phone", "(11) 1234-5678");
        unit1.put("email", "matriz@example.com");
        unit1.put("active", true);
        units.add(unit1);
        
        Map<String, Object> unit2 = new HashMap<>();
        unit2.put("id", "5b4ae6b0-391f-474f-954f-a551dc3b2b4e");
        unit2.put("name", "Unidade Padrao");
        unit2.put("address", "Endereco da Unidade Padrao");
        unit2.put("active", true);
        units.add(unit2);
        
        Map<String, Object> unit3 = new HashMap<>();
        unit3.put("id", "dcf94047-d5cb-4d6d-a7b0-12f545799467");
        unit3.put("name", "Base Uberlandia");
        unit3.put("address", "Av. Getulio Vagas, 1000");
        unit3.put("phone", "1133333333");
        unit3.put("active", true);
        units.add(unit3);
        
        return ResponseEntity.ok(units);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> unitData) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", UUID.randomUUID().toString());
        response.put("name", unitData.get("name"));
        response.put("address", unitData.get("address"));
        response.put("description", unitData.get("description"));
        response.put("phone", unitData.get("phone"));
        response.put("email", unitData.get("email"));
        response.put("active", true);
        response.put("message", "Unidade criada com sucesso");
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String id, @RequestBody Map<String, Object> unitData) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("name", unitData.get("name"));
        response.put("address", unitData.get("address"));
        response.put("description", unitData.get("description"));
        response.put("phone", unitData.get("phone"));
        response.put("email", unitData.get("email"));
        response.put("active", unitData.get("active"));
        response.put("message", "Unidade atualizada com sucesso");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Unidade excluÃ­da com sucesso");
        response.put("id", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable String id) {
        Map<String, Object> unit = new HashMap<>();
        unit.put("id", id);
        unit.put("name", "Unidade Exemplo");
        unit.put("address", "EndereÃ§o Exemplo");
        unit.put("active", true);
        return ResponseEntity.ok(unit);
    }
} 
