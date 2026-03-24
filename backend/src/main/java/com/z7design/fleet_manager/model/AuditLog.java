// Classe AuditLog temporariamente comentada devido a conflito de schema
// A tabela audit_logs no banco usa UUID mas o modelo estava usando Long
// Para resolver, alterar o tipo do ID para UUID ou ajustar a migraÃ§Ã£o

/*
package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "username")
    private String username;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "status")
    private String status; // SUCCESS, FAILURE, ERROR

    @Column(name = "error_message")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    // Constructors
    public AuditLog() {}

    public AuditLog(String action, String resourceType, String resourceId) {
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.status = "SUCCESS";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    // Builder pattern for easy creation
    public static class Builder {
        private AuditLog auditLog;

        public Builder() {
            auditLog = new AuditLog();
        }

        public Builder action(String action) {
            auditLog.action = action;
            return this;
        }

        public Builder resourceType(String resourceType) {
            auditLog.resourceType = resourceType;
            return this;
        }

        public Builder resourceId(String resourceId) {
            auditLog.resourceId = resourceId;
            return this;
        }

        public Builder userId(String userId) {
            auditLog.userId = userId;
            return this;
        }

        public Builder username(String username) {
            auditLog.username = username;
            return this;
        }

        public Builder details(String details) {
            auditLog.details = details;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            auditLog.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            auditLog.userAgent = userAgent;
            return this;
        }

        public Builder status(String status) {
            auditLog.status = status;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            auditLog.errorMessage = errorMessage;
            return this;
        }

        public AuditLog build() {
            return auditLog;
        }
    }
}
*/

// Classe vazia temporÃ¡ria
package com.z7design.fleet_manager.model;

public class AuditLog {
    // Classe temporariamente desabilitada devido a conflito de schema
} 
