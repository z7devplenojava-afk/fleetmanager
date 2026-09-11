package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAccountRequest {
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
    private String authType; // 'password' | 'oauth2'
    private String signature;
}
