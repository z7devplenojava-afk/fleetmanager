package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.client.*;
import com.z7design.fleet_manager.dto.client.ClientPortalDashboardDTO.*;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.ClientServiceRequest;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.SupportTicket;
import com.z7design.fleet_manager.model.TicketMessage;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClientPortalService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final VehicleRepository vehicleRepository;
    private final ClientServiceRequestRepository requestRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final ClientDocumentationRepository clientDocRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Obter o ID do cliente associado ao usuário atual
     */
    private UUID resolveClientId(User user) {
        if (user.getClientId() != null) {
            return user.getClientId();
        }
        // Fallback: tentar buscar por email do cliente
        if (user.getEmail() != null) {
            Optional<Client> clientOpt = clientRepository.findByEmail(user.getEmail());
            if (clientOpt.isPresent()) {
                return clientOpt.get().getId();
            }
        }
        throw new BusinessException("Usuário não possui uma empresa cliente vinculada.");
    }

    /**
     * Dashboard 360 do Portal do Cliente
     */
    @Transactional(readOnly = true)
    public ClientPortalDashboardDTO getDashboard(User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new BusinessException("Cliente não encontrado: " + clientId));

        UUID companyId = currentUser.getCompanyId() != null ? currentUser.getCompanyId() : client.getCompanyId();

        // 1. Contratos do Cliente
        List<Contract> contracts = contractRepository.findByClientId(clientId);
        List<UUID> contractIds = contracts.stream().map(Contract::getId).collect(Collectors.toList());

        // 2. Veículos alocados nos contratos
        List<Vehicle> vehicles = contractIds.isEmpty() 
                ? Collections.emptyList() 
                : vehicleRepository.findAll().stream()
                    .filter(v -> v.getContractId() != null && contractIds.contains(v.getContractId()))
                    .collect(Collectors.toList());

        // 3. Solicitações do Cliente
        List<ClientServiceRequest> requests = requestRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        long pendingRequestsCount = requests.stream()
                .filter(r -> r.getStatus() == ClientServiceRequest.RequestStatus.PENDING)
                .count();

        // 4. Chamados de Suporte do Cliente
        List<SupportTicket> tickets = supportTicketRepository.findAll().stream()
                .filter(t -> (t.getClientId() != null && t.getClientId().equals(clientId)) 
                          || (t.getCustomerEmail() != null && t.getCustomerEmail().equalsIgnoreCase(currentUser.getEmail())))
                .sorted(Comparator.comparing(SupportTicket::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        long openTicketsCount = tickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.CLOSED && t.getStatus() != TicketStatus.RESOLVED)
                .count();
        long resolvedTicketsCount = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .count();

        return ClientPortalDashboardDTO.builder()
                .clientId(clientId)
                .clientName(client.getName())
                .clientCnpj(client.getCnpj())
                .companyName(client.getCompany() != null ? client.getCompany().getName() : "FleetManager")
                .activeContractsCount(contracts.size())
                .totalVehiclesAllocated(vehicles.size())
                .pendingRequestsCount(pendingRequestsCount)
                .openTicketsCount(openTicketsCount)
                .resolvedTicketsCount(resolvedTicketsCount)
                .contracts(contracts.stream().map(c -> ContractSummaryDTO.builder()
                        .id(c.getId())
                        .contractNumber(c.getContractNumber())
                        .description(c.getDescription())
                        .obraName(c.getObraName())
                        .startDate(c.getStartDate())
                        .endDate(c.getEndDate())
                        .status(c.getStatus() != null ? c.getStatus().name() : "ACTIVE")
                        .vehicleQuantity(c.getVehicleQuantity() != null ? c.getVehicleQuantity() : 0)
                        .value(c.getValue())
                        .hasReserveClause(checkHasReserveClause(c))
                        .build()).collect(Collectors.toList()))
                .vehicles(vehicles.stream().map(v -> VehicleSummaryDTO.builder()
                        .id(v.getId())
                        .plate(v.getPlate())
                        .fleetNumber(v.getFleetNumber())
                        .model(v.getModel())
                        .brand(v.getBrand())
                        .year(v.getYear())
                        .capacity(v.getCapacity())
                        .status(v.getStatus() != null ? v.getStatus().name() : "DISPONIVEL")
                        .assignedDriver(v.getAssignedDriver() != null ? v.getAssignedDriver() : (v.getResponsibleEmployee() != null ? v.getResponsibleEmployee().getName() : "A Definir"))
                        .contractNumber(contracts.stream().filter(c -> c.getId().equals(v.getContractId())).map(Contract::getContractNumber).findFirst().orElse("-"))
                        .lastChecklistStatus("Conforme")
                        .build()).collect(Collectors.toList()))
                .recentRequests(requests.stream().limit(5).map(r -> RecentRequestDTO.builder()
                        .id(r.getId())
                        .requestType(r.getRequestType().name())
                        .status(r.getStatus().name())
                        .title(r.getTitle())
                        .reason(r.getReason())
                        .origin(r.getOrigin())
                        .destination(r.getDestination())
                        .departureDateTime(r.getDepartureDateTime())
                        .assignedVehiclePlate(r.getAssignedVehiclePlate())
                        .createdAt(r.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .recentTickets(tickets.stream().limit(5).map(t -> RecentTicketDTO.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .category(t.getCategory() != null ? t.getCategory().name() : "OTHER")
                        .priority(t.getPriority() != null ? t.getPriority().name() : "NORMAL")
                        .status(t.getStatus() != null ? t.getStatus().name() : "OPEN")
                        .customerName(t.getCustomerName())
                        .createdAt(t.getCreatedAt())
                        .messageCount(t.getMessages() != null ? t.getMessages().size() : 0)
                        .build()).collect(Collectors.toList()))
                .build();
    }

    /**
     * Verificar se o contrato contempla cláusula de veículo reserva
     */
    private boolean checkHasReserveClause(Contract contract) {
        if (contract == null) return false;
        String notes = contract.getNotes() != null ? contract.getNotes().toLowerCase() : "";
        String desc = contract.getDescription() != null ? contract.getDescription().toLowerCase() : "";
        String vigencia = contract.getVigenciaText() != null ? contract.getVigenciaText().toLowerCase() : "";
        
        return notes.contains("reserva") || desc.contains("reserva") || vigencia.contains("reserva")
                || (contract.getVehicleQuantity() != null && contract.getVehicleQuantity() > 1);
    }

    /**
     * Listar Veículos do Cliente com detalhes completos
     */
    @Transactional(readOnly = true)
    public List<VehicleSummaryDTO> getClientVehicles(User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        List<Contract> contracts = contractRepository.findByClientId(clientId);
        List<UUID> contractIds = contracts.stream().map(Contract::getId).collect(Collectors.toList());

        if (contractIds.isEmpty()) {
            return Collections.emptyList();
        }

        return vehicleRepository.findAll().stream()
                .filter(v -> v.getContractId() != null && contractIds.contains(v.getContractId()))
                .map(v -> VehicleSummaryDTO.builder()
                        .id(v.getId())
                        .plate(v.getPlate())
                        .fleetNumber(v.getFleetNumber())
                        .model(v.getModel())
                        .brand(v.getBrand())
                        .year(v.getYear())
                        .capacity(v.getCapacity())
                        .status(v.getStatus() != null ? v.getStatus().name() : "DISPONIVEL")
                        .assignedDriver(v.getAssignedDriver() != null ? v.getAssignedDriver() : (v.getResponsibleEmployee() != null ? v.getResponsibleEmployee().getName() : "A Definir"))
                        .contractNumber(contracts.stream().filter(c -> c.getId().equals(v.getContractId())).map(Contract::getContractNumber).findFirst().orElse("-"))
                        .lastChecklistStatus("Conforme")
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Solicitação de Veículo Reserva (com verificação contratual e notificação simultânea Operacional + Manutenção)
     */
    public ClientServiceRequest requestReserveVehicle(ReserveVehicleRequestDTO dto, User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new BusinessException("Cliente não encontrado."));

        Contract contract = null;
        if (dto.getContractId() != null) {
            contract = contractRepository.findById(dto.getContractId()).orElse(null);
        } else {
            List<Contract> contracts = contractRepository.findByClientId(clientId);
            if (!contracts.isEmpty()) {
                contract = contracts.get(0);
            }
        }

        boolean hasReserveClause = checkHasReserveClause(contract);
        boolean isExtra = Boolean.TRUE.equals(dto.getIsExtraReserve()) || !hasReserveClause;

        ClientServiceRequest request = ClientServiceRequest.builder()
                .companyId(client.getCompanyId())
                .clientId(clientId)
                .contractId(contract != null ? contract.getId() : null)
                .requestType(ClientServiceRequest.RequestType.RESERVE_VEHICLE)
                .status(ClientServiceRequest.RequestStatus.PENDING)
                .title("Solicitação de Veículo Reserva - Placa " + dto.getAffectedVehiclePlate())
                .affectedVehiclePlate(dto.getAffectedVehiclePlate())
                .reason(dto.getReason())
                .description(dto.getObservations())
                .hasContractReserveClause(hasReserveClause)
                .isExtraReserve(isExtra)
                .requestedByUserId(currentUser.getId())
                .requestedByUserName(currentUser.getName())
                .build();

        ClientServiceRequest saved = requestRepository.save(request);

        // Notificação Simultânea: OPERACIONAL e MANUTENÇÃO
        notifyDepartments(client, saved, "OPERACIONAL,MANUTENCAO", 
                "🚨 Novo Veículo Reserva Solicitado: Cliente " + client.getName() + " para placa " + dto.getAffectedVehiclePlate() 
                + (isExtra ? " (Reserva Extra / Sem Franquia Contratual)" : " (Reserva Contratual Prevista)"));

        return saved;
    }

    /**
     * Solicitação de Viagem Extra / Serviço Eventual
     */
    public ClientServiceRequest requestExtraTrip(ExtraTripRequestDTO dto, User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new BusinessException("Cliente não encontrado."));

        ClientServiceRequest request = ClientServiceRequest.builder()
                .companyId(client.getCompanyId())
                .clientId(clientId)
                .contractId(dto.getContractId())
                .requestType(ClientServiceRequest.RequestType.EXTRA_TRIP)
                .status(ClientServiceRequest.RequestStatus.PENDING)
                .title("Viagem Extra: " + dto.getOrigin() + " -> " + dto.getDestination())
                .origin(dto.getOrigin())
                .destination(dto.getDestination())
                .departureDateTime(dto.getDepartureDateTime())
                .returnDateTime(dto.getReturnDateTime())
                .passengerCount(dto.getPassengerCount())
                .vehicleTypeNeeded(dto.getVehicleTypeNeeded())
                .reason(dto.getReason())
                .description(dto.getObservations())
                .requestedByUserId(currentUser.getId())
                .requestedByUserName(currentUser.getName())
                .build();

        ClientServiceRequest saved = requestRepository.save(request);

        // Notificação: OPERACIONAL e COMERCIAL
        notifyDepartments(client, saved, "OPERACIONAL,COMERCIAL", 
                "🚐 Nova Viagem Extra Solicitada: Cliente " + client.getName() + " - " + dto.getOrigin() + " até " + dto.getDestination());

        return saved;
    }

    /**
     * Listar Solicitações do Cliente
     */
    @Transactional(readOnly = true)
    public List<ClientServiceRequest> getClientRequests(User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        return requestRepository.findByClientIdOrderByCreatedAtDesc(clientId);
    }

    /**
     * Abertura de Chamado pelo Cliente
     */
    public SupportTicket createTicket(ClientTicketCreateDTO dto, User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new BusinessException("Cliente não encontrado."));

        SupportTicket ticket = new SupportTicket();
        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription() + (dto.getVehiclePlate() != null ? " [Veículo: " + dto.getVehiclePlate() + "]" : ""));
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority() != null ? dto.getPriority() : TicketPriority.NORMAL);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCustomerName(currentUser.getName() + " (" + client.getName() + ")");
        ticket.setCustomerEmail(currentUser.getEmail());
        ticket.setCustomerPhone(dto.getContactPhone() != null ? dto.getContactPhone() : currentUser.getPhone());
        ticket.setCompany(client.getCompany());
        ticket.setClientId(clientId);

        SupportTicket saved = supportTicketRepository.save(ticket);

        // Disparo de mensagem inicial
        TicketMessage message = new TicketMessage();
        message.setTicket(saved);
        message.setContent(dto.getDescription());
        message.setSenderName(currentUser.getName());
        message.setSenderEmail(currentUser.getEmail());
        message.setIsSupport(false);
        ticketMessageRepository.save(message);

        // Notificação departamental de acordo com a categoria
        String targetDep = "OPERACIONAL";
        if (dto.getCategory() != null) {
            switch (dto.getCategory()) {
                case MANUTENCAO_HIGIENE:
                    targetDep = "MANUTENCAO";
                    break;
                case DUVIDAS_FINANCEIRAS:
                    targetDep = "FINANCEIRO";
                    break;
                default:
                    targetDep = "OPERACIONAL";
            }
        }

        notifyDepartments(client, null, targetDep, 
                "📩 Novo Chamado do Cliente (" + dto.getCategory() + "): " + dto.getTitle() + " - " + client.getName());

        return saved;
    }

    /**
     * Listar Chamados do Cliente
     */
    @Transactional(readOnly = true)
    public List<SupportTicket> getClientTickets(User currentUser) {
        UUID clientId = resolveClientId(currentUser);
        return supportTicketRepository.findAll().stream()
                .filter(t -> (t.getClientId() != null && t.getClientId().equals(clientId)) 
                          || (t.getCustomerEmail() != null && t.getCustomerEmail().equalsIgnoreCase(currentUser.getEmail())))
                .sorted(Comparator.comparing(SupportTicket::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    /**
     * Adicionar mensagem/resposta ao chamado
     */
    public TicketMessage addTicketMessage(UUID ticketId, String messageText, User currentUser) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessException("Chamado não encontrado."));

        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setContent(messageText);
        message.setSenderName(currentUser.getName());
        message.setSenderEmail(currentUser.getEmail());
        message.setIsSupport(false);
        
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        supportTicketRepository.save(ticket);

        return ticketMessageRepository.save(message);
    }

    /**
     * Enviar notificação em tempo real via WebSocket
     */
    private void notifyDepartments(Client client, ClientServiceRequest request, String departments, String message) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", "Portal do Cliente - " + client.getName());
            payload.put("message", message);
            payload.put("departments", departments);
            payload.put("clientId", client.getId());
            payload.put("timestamp", LocalDateTime.now());

            messagingTemplate.convertAndSend("/topic/notifications", payload);
            messagingTemplate.convertAndSend("/topic/client-portal", payload);
        } catch (Exception e) {
            log.warn("Erro ao enviar notificação WebSocket: {}", e.getMessage());
        }
    }
}
