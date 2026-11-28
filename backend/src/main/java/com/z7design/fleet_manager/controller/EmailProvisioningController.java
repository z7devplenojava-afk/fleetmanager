package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateCompanyMailboxRequest;
import com.z7design.fleet_manager.dto.EmailAccountDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.email.EmailProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Criação de caixas corporativas (@domínio da empresa) com DNS automático. */
@RestController
@RequestMapping("/api/email/provisioning")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class EmailProvisioningController {

    private final EmailProvisioningService provisioningService;
    private final AuthenticationService authenticationService;

    @PostMapping("/mailboxes")
    public ResponseEntity<?> createMailbox(@RequestBody CreateCompanyMailboxRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = auth != null ? authenticationService.getCurrentUser(auth) : null;
            EmailAccountDTO account = provisioningService.createMailbox(request, user);
            return ResponseEntity.ok(Map.of("success", true, "data", account));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao criar caixa corporativa: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
