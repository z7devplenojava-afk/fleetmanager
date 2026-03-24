package com.z7design.secured_guard.controller;

import com.z7design.secured_guard.dto.FunctionalityDTO;
import com.z7design.secured_guard.dto.MessageResponseDTO;
import com.z7design.secured_guard.dto.UpdateProfileRequestDTO;
import com.z7design.secured_guard.dto.UserProfileDTO;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.repository.UserRepository;
import com.z7design.secured_guard.service.LogService;
import com.z7design.secured_guard.service.RoleFunctionalityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Perfil de Usuário", description = "Endpoints para gerenciar perfil do usuário logado")
public class UserProfileController {

    private final UserRepository userRepository;
    private final RoleFunctionalityService roleFunctionalityService;
    private final LogService logService;

    @Operation(summary = "Obtém perfil do usuário logado", description = "Retorna dados completos do perfil incluindo funcionalidades disponíveis")
    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("📋 Obtendo perfil para usuário: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            // Obter roles do usuário
            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList());

            // Obter funcionalidades disponíveis
            List<RoleFunctionalityService.Functionality> functionalities = 
                    roleFunctionalityService.getAllUserFunctionalities(roles);

            // Converter para DTO
            List<FunctionalityDTO> functionalityDTOs = functionalities.stream()
                    .map(f -> FunctionalityDTO.builder()
                            .id(f.getId())
                            .name(f.getName())
                            .description(f.getDescription())
                            .icon(f.getIcon())
                            .route(f.getRoute())
                            .category(f.getCategory())
                            .order(f.getOrder())
                            .build())
                    .sorted((a, b) -> Integer.compare(a.getOrder(), b.getOrder()))
                    .collect(Collectors.toList());

            UserProfileDTO profile = UserProfileDTO.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .name(user.getName())
                    .whatsapp(user.getWhatsapp())
                    .roles(roles)
                    .status(user.getStatus().toString())
                    .active(user.isActive())
                    .firstAccess(user.isFirstAccess())
                    .twoFactorEnabled(user.isTwoFactorEnabled())
                    .lastPasswordChange(user.getLastPasswordChange())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .functionalities(functionalityDTOs)
                    .build();

            log.info("✅ Perfil obtido com sucesso - {} funcionalidades disponíveis", functionalityDTOs.size());
            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            log.error("💥 Erro ao obter perfil: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @Operation(summary = "Atualiza perfil do usuário", description = "Atualiza dados do perfil do usuário logado")
    @PutMapping
    public ResponseEntity<MessageResponseDTO> updateProfile(
            @Valid @RequestBody UpdateProfileRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("📝 Atualizando perfil para usuário: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            // Atualizar campos permitidos
            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                String oldEmail = user.getEmail();
                String newEmail = request.getEmail();
                
                // Verificar se email já está em uso por outro usuário
                Optional<User> existingUser = userRepository.findByEmail(newEmail);
                if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                    return ResponseEntity.badRequest().body(MessageResponseDTO.builder()
                            .message("Email já está em uso por outro usuário")
                            .success(false)
                            .build());
                }
                
                // 🔒 VALIDAÇÃO DE SEGURANÇA: Verificar mudança de padrão de email
                boolean wasColaboradorEmail = oldEmail != null && oldEmail.matches("colaborador\\..*@promovervigilancia\\.com\\.br");
                boolean isNewColaboradorEmail = newEmail.matches("colaborador\\..*@promovervigilancia\\.com\\.br");
                boolean hasColaboradorRole = user.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("COLABORADOR"));
                
                // Avisar se usuário está mudando de padrão colaborador para outro
                if (wasColaboradorEmail && !isNewColaboradorEmail && hasColaboradorRole) {
                    log.warn("⚠️ Usuário {} alterando email de padrão colaborador para: {}", user.getUsername(), newEmail);
                    log.warn("   Email anterior: {}", oldEmail);
                    log.warn("   Novo email: {}", newEmail);
                    log.warn("   ATENÇÃO: Role COLABORADOR será mantido, mas email não segue mais o padrão automático");
                }
                
                // Avisar se usuário está tentando usar padrão de email privilegiado
                if (newEmail.matches("(admin|rh|supervisor|financeiro)\\..*@promovervigilancia\\.com\\.br") && 
                    !user.getRoles().stream().anyMatch(role -> 
                        role.getName().equals("SUPER_ADMIN") || 
                        role.getName().equals("ADMIN") ||
                        role.getName().equals("RH") ||
                        role.getName().equals("SUPERVISOR") ||
                        role.getName().equals("FINANCEIRO")
                    )) {
                    log.warn("⚠️ SEGURANÇA: Usuário {} tentando usar email com padrão privilegiado sem ter o role correspondente", user.getUsername());
                    return ResponseEntity.badRequest().body(MessageResponseDTO.builder()
                            .message("Você não pode usar um email com padrão de role privilegiado (admin.*, rh.*, supervisor.*, financeiro.*) sem ter o role correspondente")
                            .success(false)
                            .build());
                }
                
                user.setEmail(newEmail);
                log.info("📧 Email atualizado: {} -> {}", oldEmail, newEmail);
            }

            if (request.getName() != null && !request.getName().isEmpty()) {
                user.setName(request.getName());
            }

            if (request.getWhatsapp() != null) {
                user.setWhatsapp(request.getWhatsapp());
            }

            userRepository.save(user);

            log.info("✅ Perfil atualizado com sucesso para: {}", user.getUsername());
            
            // Log da atividade
            logService.logUserActivity(user.getUsername(), "PROFILE_UPDATE", 
                "Perfil atualizado");

            return ResponseEntity.ok(MessageResponseDTO.builder()
                    .message("Perfil atualizado com sucesso!")
                    .success(true)
                    .build());

        } catch (Exception e) {
            log.error("💥 Erro ao atualizar perfil: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                    .message("Erro ao atualizar perfil: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Obtém funcionalidades disponíveis", description = "Retorna lista de funcionalidades baseadas nos roles do usuário")
    @GetMapping("/functionalities")
    public ResponseEntity<List<FunctionalityDTO>> getFunctionalities(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("🔍 Obtendo funcionalidades para: {}", userDetails.getUsername());

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList());

            List<RoleFunctionalityService.Functionality> functionalities = 
                    roleFunctionalityService.getAllUserFunctionalities(roles);

            List<FunctionalityDTO> functionalityDTOs = functionalities.stream()
                    .map(f -> FunctionalityDTO.builder()
                            .id(f.getId())
                            .name(f.getName())
                            .description(f.getDescription())
                            .icon(f.getIcon())
                            .route(f.getRoute())
                            .category(f.getCategory())
                            .order(f.getOrder())
                            .build())
                    .sorted((a, b) -> Integer.compare(a.getOrder(), b.getOrder()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(functionalityDTOs);

        } catch (Exception e) {
            log.error("💥 Erro ao obter funcionalidades: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}

