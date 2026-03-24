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
public class ReceiptProcessingResponse {
    
    @Builder.Default
    private List<PaymentReceiptDTO> receipts = new ArrayList<>();
    
    @Builder.Default
    private ProcessingSummary summary = new ProcessingSummary();
    
    @Builder.Default
    private List<EmployeeProcessingCount> employeesByCount = new ArrayList<>();
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessingSummary {
        private int totalPages;
        private int receiptsProcessed;
        private int receiptsSaved;
        private int pagesWithError;
        private int pagesSkipped;
        private boolean validationOk;
        private String validationMessage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeProcessingCount {
        private String employeeName;
        private int count;
    }
}


