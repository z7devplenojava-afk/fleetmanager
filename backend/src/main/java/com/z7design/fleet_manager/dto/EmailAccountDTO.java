package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAccountDTO {
    private UUID id;
    private String emailAddress;
    private String displayName;
    private String imapHost;
    private Integer imapPort;
    private Boolean imapSsl;
    private String smtpHost;
    private Integer smtpPort;
    private Boolean smtpSsl;
    private String username;
    private String authType;
    private String signature;
    private String status;
    private LocalDateTime lastSyncAt;
    private String lastSyncStatus;
    private String lastSyncMessage;
    private Integer lastSyncTotal;
    private LocalDateTime createdAt;
    private long unreadCount;
    private long totalMessages;
    private long folderCount;
}
