package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EmailAccountDTO;
import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.dto.EmailSendRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.email.EmailAccountService;
import com.z7design.fleet_manager.service.email.ImapSyncService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/email/accounts")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class EmailAccountController {

    private final EmailAccountService emailAccountService;
    private final ImapSyncService imapSyncService;

    private UUID companyIdOrThrow() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new IllegalArgumentException("Empresa não identificada - faça login novamente");
        }
        return companyId;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            List<EmailAccountDTO> accounts = emailAccountService.findAll(companyIdOrThrow());
            return ResponseEntity.ok(Map.of("success", true, "data", accounts));
        } catch (Exception e) {
            log.error("Erro ao listar contas de e-mail: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable("id") UUID id) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", emailAccountService.getDTO(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody EmailAccountRequest request,
            Authentication authentication) {
        try {
            User currentUser = authentication != null && authentication.getPrincipal() instanceof User
                    ? (User) authentication.getPrincipal()
                    : null;
            EmailAccountDTO created = emailAccountService.create(request, currentUser);
            return ResponseEntity.ok(Map.of("success", true, "message", "Conta de e-mail adicionada", "data", created));
        } catch (Exception e) {
            log.error("Erro ao criar conta de e-mail: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") UUID id, @RequestBody EmailAccountRequest request) {
        try {
            EmailAccountDTO updated = emailAccountService.update(id, request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Conta de e-mail atualizada", "data", updated));
        } catch (Exception e) {
            log.error("Erro ao atualizar conta de e-mail: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") UUID id) {
        try {
            emailAccountService.delete(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Conta de e-mail excluída"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/test-credentials")
    public ResponseEntity<?> testCredentials(@RequestBody EmailAccountRequest request) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", emailAccountService.testCredentials(request)));
        } catch (Exception e) {
            log.error("Erro ao testar credenciais: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<?> testConnection(@PathVariable("id") UUID id) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "data", emailAccountService.testConnection(id)));
        } catch (Exception e) {
            log.error("Erro ao testar conexão da conta {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<?> sync(@PathVariable("id") UUID id,
            @RequestParam(value = "fullSync", defaultValue = "false") boolean fullSync) {
        try {
            Map<String, Object> result = imapSyncService.syncAccount(id, fullSync);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao sincronizar conta {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/sync-folders")
    public ResponseEntity<?> syncFolders(@PathVariable("id") UUID id) {
        try {
            List<Map<String, Object>> folders = imapSyncService.syncFolders(id);
            return ResponseEntity.ok(Map.of("success", true, "data", folders));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/folders")
    public ResponseEntity<?> listFolders(@PathVariable("id") UUID id) {
        try {
            List<Map<String, Object>> folders = imapSyncService.listLocalFolders(id);
            return ResponseEntity.ok(Map.of("success", true, "data", folders));
        } catch (Exception e) {
            log.error("Erro ao listar pastas da conta {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<?> send(@PathVariable("id") UUID id, @RequestBody EmailSendRequest request) {
        try {
            return ResponseEntity.ok(emailAccountService.sendEmail(id, request));
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail via conta {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/attachments/upload")
    public ResponseEntity<?> uploadAttachment(@PathVariable("id") UUID id,
            @RequestParam(value = "file") MultipartFile file) {
        try {
            Map<String, Object> uploaded = emailAccountService.uploadComposeAttachment(id, file);
            return ResponseEntity.ok(Map.of("success", true, "data", uploaded));
        } catch (Exception e) {
            log.error("Erro ao enviar anexo para a conta {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
