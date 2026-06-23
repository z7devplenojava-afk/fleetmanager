package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import org.springframework.web.multipart.MultipartFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadDTO {
    private String documentType;
    private MultipartFile file;
    private LocalDate expirationDate;
    private String description;
}
