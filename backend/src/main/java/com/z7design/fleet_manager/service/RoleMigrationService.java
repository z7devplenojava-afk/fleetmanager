package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleMigrationService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Async
    @Transactional
    public void migrateRolesOnStartup() {
        try {
            log.info("Iniciando migraÃ§Ã£o de roles do enum para entidades JPA (assÃ­ncrono)...");

            // Verificar se existem usuÃ¡rios antes de tentar migrar
            long userCount = userRepository.count();
            if (userCount == 0) {
                log.info("Nenhum usuÃ¡rio encontrado no banco. Pulando migraÃ§Ã£o de roles.");
                return;
            }

            migrateExistingUsers();
            log.info("MigraÃ§Ã£o de roles concluÃ­da com sucesso!");
        } catch (Exception e) {
            log.error("âŒ Erro durante migraÃ§Ã£o de roles: {}", e.getMessage(), e);
            // NÃ£o re-lanÃ§ar exceÃ§Ã£o para nÃ£o crashar a aplicaÃ§Ã£o
            // A migraÃ§Ã£o de roles nÃ£o Ã© crÃ­tica para o funcionamento bÃ¡sico
        }
    }

    @Transactional
    private void migrateExistingUsers() {
        // Usar paginaÃ§Ã£o para evitar carregar todos os usuÃ¡rios de uma vez
        int pageSize = 100;
        int page = 0;
        List<User> users;

        do {
            users = userRepository.findAll(org.springframework.data.domain.PageRequest.of(page, pageSize)).getContent();
            page++;

            for (User user : users) {
                try {
                    // Se o usuÃ¡rio jÃ¡ tem role_id, pular
                    if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                        log.debug("UsuÃ¡rio {} jÃ¡ tem role JPA, pulando...", user.getUsername());
                        continue;
                    }

                    // Tentar migrar baseado no campo role enum (se ainda existir)
                    // Como o modelo foi refatorado, vamos buscar o role pelo nome do usuÃ¡rio
                    // ou criar um role padrÃ£o

                    String roleName = determineUserRoleName(user);
                    Optional<Role> roleOpt = roleRepository.findByName(roleName);

                    if (roleOpt.isPresent()) {
                        user.setRoles(new java.util.HashSet<>(java.util.List.of(roleOpt.get())));
                        userRepository.save(user);
                        log.info("UsuÃ¡rio {} migrado para role: {}", user.getUsername(), roleName);
                    } else {
                        // Se nÃ£o encontrar o role, usar SUPER_ADMIN como padrÃ£o
                        Optional<Role> defaultRole = roleRepository.findByName("SUPER_ADMIN");
                        if (defaultRole.isPresent()) {
                            user.setRoles(new java.util.HashSet<>(java.util.List.of(defaultRole.get())));
                            userRepository.save(user);
                            log.warn("UsuÃ¡rio {} migrado para role padrÃ£o SUPER_ADMIN", user.getUsername());
                        } else {
                            log.error("NÃ£o foi possÃ­vel encontrar role SUPER_ADMIN para usuÃ¡rio: {}",
                                    user.getUsername());
                        }
                    }

                } catch (Exception e) {
                    log.error("Erro ao migrar usuÃ¡rio {}: {}", user.getUsername(), e.getMessage(), e);
                }
            }
        } while (!users.isEmpty());
    }

    private String determineUserRoleName(User user) {
        // Como o modelo foi refatorado, vamos usar uma lÃ³gica baseada no username
        // ou grupos do usuÃ¡rio para determinar o role

        if (user.getUsername().equals("jose.ramos")) {
            return "SUPER_ADMIN";
        }

        // Verificar grupos do usuÃ¡rio
        if (user.getGroups() != null && !user.getGroups().isEmpty()) {
            for (var group : user.getGroups()) {
                String groupName = group.getGroupName().name();
                if (groupName.contains("SUPER_ADMIN")) {
                    return "SUPER_ADMIN";
                } else if (groupName.contains("ADMIN")) {
                    return "ADMIN";
                } else if (groupName.contains("RH")) {
                    return "RH";
                } else if (groupName.contains("FINANCEIRO")) {
                    return "FINANCEIRO";
                } else if (groupName.contains("SUPERVISOR")) {
                    return "SUPERVISOR";
                } else if (groupName.contains("TI")) {
                    return "TI_SUPORTE";
                } else if (groupName.contains("AUDITOR")) {
                    return "AUDITOR";
                }
            }
        }

        // Role padrÃ£o
        return "USER";
    }

    @EventListener(ApplicationReadyEvent.class)
    @Async
    @Transactional
    public void createDefaultRolesIfNotExist() {
        try {
            log.info("Verificando e criando roles padrÃ£o (assÃ­ncrono)...");

            // Verificar se jÃ¡ existem roles
            long roleCount = roleRepository.count();
            if (roleCount > 0) {
                log.info("Roles jÃ¡ existem no banco. Pulando criaÃ§Ã£o de roles padrÃ£o.");
                return;
            }

            createDefaultRoles();
            log.info("Roles padrÃ£o criadas com sucesso!");
        } catch (Exception e) {
            log.error("âŒ Erro durante criaÃ§Ã£o de roles padrÃ£o: {}", e.getMessage(), e);
            // NÃ£o re-lanÃ§ar exceÃ§Ã£o para nÃ£o crashar a aplicaÃ§Ã£o
            // A criaÃ§Ã£o de roles padrÃ£o nÃ£o Ã© crÃ­tica para o funcionamento bÃ¡sico
        }
    }

    private void createDefaultRoles() {
        // Criar roles padrÃ£o se nÃ£o existirem
        String[] defaultRoles = {
                "FLEX_ADMIN",
                "COMPANY_ADMIN",
                "SUPER_ADMIN",
                "ADMIN",
                "RH",
                "FINANCEIRO",
                "SUPERVISOR",
                "TI_SUPORTE",
                "AUDITOR",
                "USER"
        };

        for (String roleName : defaultRoles) {
            if (!roleRepository.findByName(roleName).isPresent()) {
                Role role = Role.builder()
                        .name(roleName)
                        .description("Role " + roleName)
                        .build();
                roleRepository.save(role);
                log.info("Role criada: {}", roleName);
            }
        }
    }
}
