package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateActivityReportDocumentDTO {
    @NotBlank(message = "Document name is required")
    private String name;
    @NotBlank(message = "Document URL is required")
    private String url;
    @NotBlank(message = "Document type is required")
    private String type;
    @NotNull(message = "Document size is required")
    private long size;
    @NotNull(message = "Uploaded at timestamp is required")
    private LocalDateTime uploadedAt;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}

