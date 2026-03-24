package com.z7design.fleet_manager.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ActivityLogDTO {
    private String id;
    private String userId;
    private String username;
    private String action;
    private String module;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private String status;
    private Long executionTimeMs;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;
}

