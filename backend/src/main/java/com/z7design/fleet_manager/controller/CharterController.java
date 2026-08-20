package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.CharterContract;
import com.z7design.fleet_manager.service.CharterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/charter")
@RequiredArgsConstructor
@Slf4j
public class CharterController {

    private final CharterService charterService;

    @GetMapping("/contracts")
    public ResponseEntity<List<CharterContract>> findAllContracts() {
        log.info("GET /api/charter/contracts - Listando todos os contratos de fretamento");
        try {
            return ResponseEntity.ok(charterService.findAllContracts());
        } catch (Exception e) {
            log.error("Erro ao listar contratos de fretamento: {}", e.getMessage());
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    @GetMapping("/contracts/{id}")
    public ResponseEntity<CharterContract> findContractById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(charterService.findContractById(id));
    }

    @PostMapping("/contracts")
    public CharterContract createContract(@RequestBody CharterContract contract) {
        return charterService.saveContract(contract);
    }

    @PutMapping("/contracts/{id}")
    public ResponseEntity<CharterContract> updateContract(@PathVariable("id") UUID id,
            @RequestBody CharterContract contract) {
        contract.setId(id);
        return ResponseEntity.ok(charterService.saveContract(contract));
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable("id") UUID id) {
        charterService.deleteContract(id);
        return ResponseEntity.noContent().build();
    }
}
