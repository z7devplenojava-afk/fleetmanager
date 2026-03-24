package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.model.Permission;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.repository.PermissionRepository;
import com.z7design.fleet_manager.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class TrafficDataLoader {
    private static final Logger log = LoggerFactory.getLogger(TrafficDataLoader.class);

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    public TrafficDataLoader(PermissionRepository permissionRepository, RoleRepository roleRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
    }

    @Bean
    public CommandLineRunner initTrafficData() {
        return args -> {
            log.info("Starting Traffic Management data initialization...");

            syncPermissions();
            createTrafficManagerRole();

            log.info("Traffic Management data initialization completed!");
        };
    }

    private void syncPermissions() {
        log.info("Syncing Traffic Management permissions...");

        // Loop through the enum and ensure all are in the DB
        for (com.z7design.fleet_manager.model.enums.Permission pEnum : com.z7design.fleet_manager.model.enums.Permission
                .values()) {
            if (!permissionRepository.existsByName(pEnum.name())) {
                Permission pEntity = Permission.builder()
                        .name(pEnum.name())
                        .description("Permission for " + pEnum.name()) // Simplified
                        .build();
                permissionRepository.save(pEntity);
                log.info("Created permission: {}", pEnum.name());
            }
        }
    }

    private void createTrafficManagerRole() {
        String roleName = "ROLE_MANAGER_TRAFEGO";
        if (!roleRepository.existsByName(roleName)) {
            log.info("Creating role: {}", roleName);

            // Get relevant permissions for Traffic Manager
            Set<String> trafficPermissionNames = new HashSet<>(Arrays.asList(
                    "TRAFFIC_MANAGEMENT_READ", "TRAFFIC_MANAGEMENT_WRITE",
                    "TRAFFIC_MANAGEMENT_CREATE", "TRAFFIC_MANAGEMENT_DELETE",
                    "TRIPS_READ", "TRIPS_WRITE", "TRIPS_EXECUTE",
                    "BOARDING_READ", "BOARDING_EXECUTE",
                    "FLEET_READ", "VEHICLES_READ", "DRIVERS_READ", "CLIENTS_READ", "EMPLOYEES_READ",
                    "SCHEDULES_READ", "SCHEDULES_WRITE", "ROUTES_READ" // Assuming these exist or adding them
            ));

            Set<Permission> permissions = permissionRepository.findAll().stream()
                    .filter(p -> trafficPermissionNames.contains(p.getName()))
                    .collect(Collectors.toSet());

            Role role = Role.builder()
                    .name(roleName)
                    .description("Gestor de TrÃ¡fego - ResponsÃ¡vel por planejamento e monitoramento de viagens")
                    .permissions(permissions)
                    .build();

            roleRepository.save(role);
            log.info("Role {} created successfully with {} permissions.", roleName, permissions.size());
        }
    }
}
