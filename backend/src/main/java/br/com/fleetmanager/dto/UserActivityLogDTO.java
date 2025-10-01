package br.com.fleetmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityLogDTO {
    private UUID id;
    private UUID userId;
    private String username;
    private String action;
    private String module;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private String status;
    private Long executionTimeMs;
    private Long durationMs;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endedAt;
}
