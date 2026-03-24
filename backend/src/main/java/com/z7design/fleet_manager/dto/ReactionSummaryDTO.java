package com.z7design.fleet_manager.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionSummaryDTO {
    
    private String emoji;
    
    private Long count;
    
    private List<UUID> userIds; // IDs dos usuÃ¡rios que reagiram com este emoji
    
    private Boolean currentUserReacted; // Se o usuÃ¡rio atual reagiu com este emoji
}


