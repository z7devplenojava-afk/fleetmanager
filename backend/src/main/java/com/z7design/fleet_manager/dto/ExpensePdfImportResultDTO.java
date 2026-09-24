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
public class ExpensePdfImportResultDTO {
    private int totalRead;
    private int created;
    private int updated;
    private int skipped;
    private List<String> errors;
    private List<InvoiceDTO> items;

    public static ExpensePdfImportResultDTO empty() {
        ExpensePdfImportResultDTO result = new ExpensePdfImportResultDTO();
        result.setTotalRead(0);
        result.setCreated(0);
        result.setUpdated(0);
        result.setSkipped(0);
        result.setErrors(new ArrayList<>());
        result.setItems(new ArrayList<>());
        return result;
    }
}
