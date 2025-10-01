package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

import br.com.fleetmanager.model.enums.UserRole;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
} 