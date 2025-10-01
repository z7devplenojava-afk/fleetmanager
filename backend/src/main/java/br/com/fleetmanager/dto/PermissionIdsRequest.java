package br.com.fleetmanager.dto;

import java.util.List;
import java.util.UUID;

public class PermissionIdsRequest {
    private List<UUID> permissionIds;
    public List<UUID> getPermissionIds() { return permissionIds; }
    public void setPermissionIds(List<UUID> permissionIds) { this.permissionIds = permissionIds; }
} 