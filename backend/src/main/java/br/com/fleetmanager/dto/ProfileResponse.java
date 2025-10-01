package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    
    private UUID id;
    private String username;
    private String name;
    private String email;
    private String whatsapp;
    private boolean active;
    private List<String> roles;
}
