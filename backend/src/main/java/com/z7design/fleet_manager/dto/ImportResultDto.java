package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportResultDto {
    private int totalRows;
    private int inserted;
    private int updated;
    private int skipped;
    private List<String> errors;

    public static ImportResultDto empty() {
        ImportResultDto r = new ImportResultDto();
        r.errors = new ArrayList<>();
        return r;
    }
}



