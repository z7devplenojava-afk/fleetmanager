package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.Permission;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.repository.PermissionRepository;
import com.z7design.fleet_manager.dto.RoleDTO;
import com.z7design.fleet_manager.dto.CreateRoleDTO;
import com.z7design.fleet_manager.dto.UpdateRoleDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "API para gerenciamento de roles (perfis/funÃ§Ãµes)")
public class RoleController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @GetMapping
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable("id") UUID id) {
        Optional<Role> role = roleRepository.findById(id);
        return role.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        if (roleRepository.existsByName(role.getName())) {
            return ResponseEntity.badRequest().build();
        }
        // Associar permissÃµes se fornecidas
        if (role.getPermissions() != null && !role.getPermissions().isEmpty()) {
            var permNames = role.getPermissions().stream().map(p -> p.getName()).toList();
            var permsFromDb = permissionRepository.findByNames(permNames);
            role.setPermissions(new java.util.HashSet<>(permsFromDb));
        }
        Role saved = roleRepository.save(role);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable("id") UUID id, @RequestBody Role role) {
        Optional<Role> existing = roleRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Role toUpdate = existing.get();
        toUpdate.setName(role.getName());
        toUpdate.setDescription(role.getDescription());
        // Atualizar permissÃµes se fornecidas
        if (role.getPermissions() != null) {
            var permNames = role.getPermissions().stream().map(p -> p.getName()).toList();
            var permsFromDb = permissionRepository.findByNames(permNames);
            toUpdate.setPermissions(new java.util.HashSet<>(permsFromDb));
        }
        Role updated = roleRepository.save(toUpdate);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable("id") UUID id) {
        if (!roleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Buscar role por nome", description = "Retorna um role especÃ­fico pelo nome")
    public ResponseEntity<RoleDTO> getRoleByName(@PathVariable("name") String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role nÃ£o encontrado com nome: " + name));
        return ResponseEntity.ok(RoleDTO.fromEntity(role));
    }

    @GetMapping("/{id}/permissions")
    @Operation(summary = "Listar permissÃµes do role", description = "Retorna todas as permissÃµes associadas a um role")
    public ResponseEntity<Set<Permission>> getRolePermissions(@PathVariable("id") UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role nÃ£o encontrado com ID: " + id));
        return ResponseEntity.ok(role.getPermissions());
    }

    @PostMapping("/{id}/permissions")
    @Operation(summary = "Adicionar permissÃµes ao role", description = "Adiciona permissÃµes a um role existente")
    public ResponseEntity<RoleDTO> addPermissionsToRole(@PathVariable("id") UUID id, @RequestBody List<String> permissionNames) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role nÃ£o encontrado com ID: " + id));

        Set<Permission> newPermissions = permissionRepository.findByNames(permissionNames)
                .stream()
                .collect(Collectors.toSet());

        role.getPermissions().addAll(newPermissions);
        Role updatedRole = roleRepository.save(role);
        return ResponseEntity.ok(RoleDTO.fromEntity(updatedRole));
    }

    @DeleteMapping("/{id}/permissions")
    @Operation(summary = "Remover permissÃµes do role", description = "Remove permissÃµes de um role existente")
    public ResponseEntity<RoleDTO> removePermissionsFromRole(@PathVariable("id") UUID id, @RequestBody List<String> permissionNames) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role nÃ£o encontrado com ID: " + id));

        Set<Permission> permissionsToRemove = permissionRepository.findByNames(permissionNames)
                .stream()
                .collect(Collectors.toSet());

        role.getPermissions().removeAll(permissionsToRemove);
        Role updatedRole = roleRepository.save(role);
        return ResponseEntity.ok(RoleDTO.fromEntity(updatedRole));
    }
} 
