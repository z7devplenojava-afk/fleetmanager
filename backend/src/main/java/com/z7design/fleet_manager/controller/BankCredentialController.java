package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.BankCredential;
import com.z7design.fleet_manager.service.BankCredentialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank-credentials")
@RequiredArgsConstructor
@Tag(name = "Credenciais Bancárias & API DDA", description = "Gerenciamento de chaves de API bancária (Banco Inter, Cora, Itaú, BB) por empresa")
public class BankCredentialController {

    private final BankCredentialService bankCredentialService;

    @GetMapping
    @Operation(summary = "Lista credenciais bancárias da empresa")
    public ResponseEntity<List<BankCredential>> getCredentials() {
        return ResponseEntity.ok(bankCredentialService.getCredentialsForCompany());
    }

    @PostMapping
    @Operation(summary = "Salva ou atualiza credencial bancária da empresa")
    public ResponseEntity<BankCredential> saveCredential(@RequestBody BankCredential credential) {
        return ResponseEntity.ok(bankCredentialService.saveCredential(credential));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui credencial bancária")
    public ResponseEntity<Void> deleteCredential(@PathVariable("id") UUID id) {
        bankCredentialService.deleteCredential(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    @Operation(summary = "Testa conexão com a API do banco")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(bankCredentialService.testConnection(id));
    }
}
