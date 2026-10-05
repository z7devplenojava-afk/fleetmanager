package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrlvImportResultDTO {
    private int totalFiles;
    private int inserted;
    private int updated;
    private int skipped;
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    @Builder.Default
    private List<CrlvImportItemDTO> items = new ArrayList<>();

    public static CrlvImportResultDTO empty() {
        return CrlvImportResultDTO.builder()
                .totalFiles(0)
                .inserted(0)
                .updated(0)
                .skipped(0)
                .errors(new ArrayList<>())
                .items(new ArrayList<>())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrlvImportItemDTO {
        private String fileName;
        private String plate;
        private String renavam;
        private String chassisNumber;
        private String brand;
        private String model;
        private Integer year;
        private String action; // CREATED, UPDATED, SKIPPED, ERROR
        @Builder.Default
        private List<String> updatedFields = new ArrayList<>();
        private String message;
    }
}
