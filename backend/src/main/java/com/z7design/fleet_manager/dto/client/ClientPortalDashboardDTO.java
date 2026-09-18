package com.z7design.fleet_manager.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientPortalDashboardDTO {
    private UUID clientId;
    private String clientName;
    private String clientCnpj;
    private String companyName;

    // Resumo de Contratos
    private int activeContractsCount;
    private int totalVehiclesAllocated;

    // Resumo de Solicitações e Chamados
    private long pendingRequestsCount;
    private long openTicketsCount;
    private long resolvedTicketsCount;

    // Listas rápidas
    private List<ContractSummaryDTO> contracts;
    private List<VehicleSummaryDTO> vehicles;
    private List<RecentRequestDTO> recentRequests;
    private List<RecentTicketDTO> recentTickets;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractSummaryDTO {
        private UUID id;
        private String contractNumber;
        private String description;
        private String obraName;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private Integer vehicleQuantity;
        private BigDecimal value;
        private Boolean hasReserveClause;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleSummaryDTO {
        private UUID id;
        private String plate;
        private String fleetNumber;
        private String model;
        private String brand;
        private Integer year;
        private Integer capacity;
        private String status;
        private String assignedDriver;
        private String contractNumber;
        private String lastChecklistStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentRequestDTO {
        private UUID id;
        private String requestType;
        private String status;
        private String title;
        private String reason;
        private String origin;
        private String destination;
        private LocalDateTime departureDateTime;
        private String assignedVehiclePlate;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentTicketDTO {
        private UUID id;
        private String title;
        private String category;
        private String priority;
        private String status;
        private String customerName;
        private LocalDateTime createdAt;
        private int messageCount;
    }
}
