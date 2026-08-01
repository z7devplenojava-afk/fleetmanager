package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailFolderDTO {
    private UUID id;
    private UUID accountId;
    private String remoteName;
    private String displayName;
    private String delimiter;
    private String attributes;
    private Long uidValidity;
    private Long highestUid;
    private Integer totalMessages;
    private Boolean system;
    private long unreadCount;
}
