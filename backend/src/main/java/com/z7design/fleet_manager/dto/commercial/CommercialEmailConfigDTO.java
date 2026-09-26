package com.z7design.fleet_manager.dto.commercial;

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
public class CommercialEmailConfigDTO {
    private UUID id;
    private UUID companyId;
    private String emailAddress;
    private String displayName;
    private String imapHost;
    private Integer imapPort;
    private Boolean imapSsl;
    private String smtpHost;
    private Integer smtpPort;
    private Boolean smtpSsl;
    private String username;
    private String password;
    private String status;
    private LocalDateTime lastSyncAt;
    private String lastSyncStatus;
    private String lastSyncMessage;
    private Integer lastSyncTotal;
}
