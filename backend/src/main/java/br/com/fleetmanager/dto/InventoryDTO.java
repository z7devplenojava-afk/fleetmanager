package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryDTO {
    
    private UUID id;
    private String inventoryNumber;
    private String title;
    private String description;
    private String type;
    private String status;
    private LocalDateTime plannedDate;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime completionDate;
    private String responsiblePerson;
    private String department;
    private String location;
    private BigDecimal totalItems;
    private BigDecimal countedItems;
    private BigDecimal varianceItems;
    private BigDecimal totalValue;
    private BigDecimal countedValue;
    private BigDecimal varianceValue;
    private BigDecimal accuracyPercentage;
    private String priority;
    private String notes;
    private String approvedBy;
    private LocalDateTime approvalDate;
    private String approvalNotes;
    private UUID unitId;
    private String unitName;
    private UUID responsibleId;
    private String responsibleName;
    private UUID approverId;
    private String approverName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Campos calculados
    private boolean inProgress;
    private boolean completed;
    private boolean overdue;
    private BigDecimal progressPercentage;
    private boolean hasVariance;
    private List<InventoryItemDTO> items;
}