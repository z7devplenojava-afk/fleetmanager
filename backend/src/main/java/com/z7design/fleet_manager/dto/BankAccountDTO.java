package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.BankAccount;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountDTO {
    
    private UUID id;
    private String bankName;
    private String accountNumber;
    private String accountType;
    private BigDecimal balance;
    private BankAccount.BankAccountStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static BankAccountDTO fromEntity(BankAccount entity) {
        if (entity == null) return null;
        
        return BankAccountDTO.builder()
                .id(entity.getId())
                .bankName(entity.getBankName())
                .accountNumber(entity.getAccountNumber())
                .accountType(entity.getAccountType())
                .balance(entity.getBalance())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

