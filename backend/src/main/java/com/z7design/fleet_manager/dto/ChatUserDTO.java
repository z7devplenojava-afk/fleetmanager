package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatUserDTO {
    private UUID id;
    private String name;
    private String username;
    private String email;
    private boolean active;
    private boolean isOnline;
} 
