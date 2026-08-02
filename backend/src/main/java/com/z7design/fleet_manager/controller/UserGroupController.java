package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.UserGroupDTO;
import com.z7design.fleet_manager.dto.UserResponseDTO;
import com.z7design.fleet_manager.service.UserGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class UserGroupController {

    @Autowired
    private UserGroupService userGroupService;

    @GetMapping
    public ResponseEntity<List<UserGroupDTO>> getAllGroups() {
        List<UserGroupDTO> groups = userGroupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/user/{userId}")
    // Deve ficar ANTES de /{id} para não conflitar com o path variable
    public ResponseEntity<List<UserGroupDTO>> getGroupsByUserId(@PathVariable("userId") String userId) {
        try {
            UUID uuid = UUID.fromString(userId);
            List<UserGroupDTO> groups = userGroupService.getGroupsByUserId(uuid);
            return ResponseEntity.ok(groups);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            System.err.println("Erro ao buscar grupos do usuário " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/user/{userId}/permissions")
    public ResponseEntity<Set<String>> getUserPermissions(@PathVariable("userId") String userId) {
        try {
            UUID uuid = UUID.fromString(userId);
            Set<String> permissions = userGroupService.getUserPermissions(uuid);
            return ResponseEntity.ok(permissions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(Set.of());
        } catch (Exception e) {
            System.err.println("Erro ao buscar permissões do usuário " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(Set.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserGroupDTO> getGroupById(@PathVariable("id") UUID id) {
        UserGroupDTO group = userGroupService.getGroupById(id);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/{groupId}/users")
    public ResponseEntity<List<UserResponseDTO>> getUsersByGroup(@PathVariable("groupId") UUID groupId) {
        List<UserResponseDTO> users = userGroupService.getUsersByGroup(groupId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{groupId}/available-users")
    public ResponseEntity<List<UserResponseDTO>> getAvailableUsersForGroup(@PathVariable("groupId") UUID groupId) {
        List<UserResponseDTO> users = userGroupService.getAvailableUsersForGroup(groupId);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserGroupDTO> createGroup(@RequestBody UserGroupDTO groupDTO) {
        UserGroupDTO createdGroup = userGroupService.createGroup(groupDTO);
        return ResponseEntity.ok(createdGroup);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserGroupDTO> updateGroup(@PathVariable("id") UUID id, @RequestBody UserGroupDTO groupDTO) {
        UserGroupDTO updatedGroup = userGroupService.updateGroup(id, groupDTO);
        return ResponseEntity.ok(updatedGroup);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable("id") UUID id) {
        userGroupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/users/{userId}")
    public ResponseEntity<?> addUserToGroup(@PathVariable("groupId") UUID groupId,
            @PathVariable("userId") String userId) {
        try {
            UUID uuid = UUID.fromString(userId);
            userGroupService.addUserToGroup(uuid, groupId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "ID de usuÃ¡rio invÃ¡lido"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/users/{userId}")
    public ResponseEntity<?> removeUserFromGroup(@PathVariable("groupId") UUID groupId,
            @PathVariable("userId") String userId) {
        try {
            UUID uuid = UUID.fromString(userId);
            userGroupService.removeUserFromGroup(uuid, groupId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "ID de usuÃ¡rio invÃ¡lido"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/initialize")
    public ResponseEntity<Void> initializeDefaultGroups() {
        userGroupService.initializeDefaultGroups();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sync-users")
    public ResponseEntity<Void> syncUsersWithGroups() {
        userGroupService.syncUsersWithGroups();
        return ResponseEntity.ok().build();
    }
}
