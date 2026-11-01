package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.BoardingDTO;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.BoardingStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardingService {

    private final BoardingRepository boardingRepository;
    private final TripRepository tripRepository;
    private final PassengerRepository passengerRepository;
    private final VehicleRepository vehicleRepository;
    private final RoutePointRepository routePointRepository;
    private final ScheduleRepository scheduleRepository;
    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;
    private final StandardReportLayoutService standardReportLayoutService;

    @Transactional
    public BoardingDTO create(BoardingDTO dto) {
        Boarding boarding = toEntity(dto);
        Boarding saved = boardingRepository.save(boarding);
        return toDTO(saved);
    }

    @Transactional
    public BoardingDTO update(UUID id, BoardingDTO dto) {
        Boarding existing = findById(id);

        if (dto.getTripId() != null) {
            Trip trip = tripRepository.findById(dto.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + dto.getTripId()));
            existing.setTrip(trip);
        }
        if (dto.getPassengerId() != null) {
            Passenger passenger = passengerRepository.findById(dto.getPassengerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + dto.getPassengerId()));
            existing.setPassenger(passenger);
        }
        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            existing.setVehicle(vehicle);
        }
        if (dto.getBoardingTime() != null) {
            existing.setBoardingTime(dto.getBoardingTime());
        }
        if (dto.getBoardingLatitude() != null) {
            existing.setBoardingLatitude(dto.getBoardingLatitude());
        }
        if (dto.getBoardingLongitude() != null) {
            existing.setBoardingLongitude(dto.getBoardingLongitude());
        }
        if (dto.getBoardingPointId() != null) {
            RoutePoint boardingPoint = routePointRepository.findById(dto.getBoardingPointId())
                    .orElseThrow(() -> new ResourceNotFoundException("RoutePoint not found with id: " + dto.getBoardingPointId()));
            existing.setBoardingPoint(boardingPoint);
        }
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        if (dto.getDirection() != null) {
            existing.setDirection(dto.getDirection());
        }
        if (dto.getValidationMode() != null) {
            existing.setValidationMode(dto.getValidationMode());
        }

        Boarding saved = boardingRepository.save(existing);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Boarding boarding = findById(id);
        boardingRepository.delete(boarding);
    }

    public BoardingDTO getById(UUID id) {
        Boarding boarding = findById(id);
        return toDTO(boarding);
    }

    public List<BoardingDTO> getByTripId(UUID tripId) {
        List<Boarding> boardings = boardingRepository.findByTripId(tripId);
        return boardings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<BoardingDTO> getByPassengerId(UUID passengerId) {
        List<Boarding> boardings = boardingRepository.findByPassengerId(passengerId);
        return boardings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public BoardingDTO checkIn(UUID tripId, UUID passengerId, Double latitude, Double longitude) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        Passenger passenger = passengerRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + passengerId));

        validatePassengerActive(passenger);

        Boarding boarding = new Boarding();
        boarding.setTrip(trip);
        boarding.setPassenger(passenger);
        boarding.setVehicle(trip.getSchedule() != null ? trip.getSchedule().getVehicle() : null);
        boarding.setCompanyId(passenger.getCompanyId());
        boarding.setClientId(passenger.getClientId());
        boarding.setBoardingTime(LocalDateTime.now());
        boarding.setBoardingLatitude(latitude);
        boarding.setBoardingLongitude(longitude);
        boarding.setBoardingPoint(passenger.getBoardingPoint());
        boarding.setStatus(BoardingStatus.BOARDED);
        boarding.setValidationMode("QR_MOTORISTA");

        Boarding saved = boardingRepository.save(boarding);
        return toDTO(saved);
    }

    /**
     * Valida QR Code e confirma embarque (bidirecional e seguro)
     */
    @Transactional
    public BoardingDTO validateQrAndBoard(Map<String, Object> req, UUID currentUserId, UUID tenantCompanyId) {
        // 1. Identificar o passageiro
        Passenger passenger = null;
        if (req.get("passengerId") != null) {
            try {
                UUID pid = UUID.fromString(req.get("passengerId").toString());
                passenger = passengerRepository.findById(pid).orElse(null);
            } catch (Exception ignored) {}
        }

        if (passenger == null && req.get("cpf") != null) {
            String cleanCpf = req.get("cpf").toString().replaceAll("\\D", "");
            if (!cleanCpf.isEmpty()) {
                passenger = passengerRepository.findByCleanCpfNative(cleanCpf).orElse(null);
            }
        }

        if (passenger == null && req.get("matricula") != null) {
            String reg = req.get("matricula").toString().trim();
            passenger = passengerRepository.findByRegistrationIgnoreCase(reg).orElse(null);
        }

        if (passenger == null && currentUserId != null) {
            passenger = passengerRepository.findByUserIdNative(currentUserId).orElse(null);
        }

        if (passenger == null) {
            throw new ResourceNotFoundException("Passageiro não identificado no sistema. Verifique a matrícula ou CPF.");
        }

        // 2. Validação de status crítico: DEMITIDO ou BLOQUEADO
        validatePassengerActive(passenger);

        // 3. Resolver Viagem ou Escala
        Trip trip = null;
        Schedule schedule = null;

        if (req.get("tripId") != null) {
            try {
                UUID tid = UUID.fromString(req.get("tripId").toString());
                trip = tripRepository.findById(tid).orElse(null);
            } catch (Exception ignored) {}
        }

        if (req.get("scheduleId") != null) {
            try {
                UUID sid = UUID.fromString(req.get("scheduleId").toString());
                schedule = scheduleRepository.findById(sid).orElse(null);
                if (schedule != null && trip == null) {
                    List<Trip> trips = tripRepository.findByScheduleId(sid);
                    if (!trips.isEmpty()) {
                        trip = trips.get(0);
                    }
                }
            } catch (Exception ignored) {}
        }

        // 4. Validação de Rotas: Regra de Linha Fixa vs Múltiplas Linhas
        Route tripRoute = (trip != null) ? trip.getRoute() : (schedule != null ? schedule.getRoute() : null);
        if (tripRoute != null && !Boolean.TRUE.equals(passenger.getMultipleRoutesAllowed())) {
            UUID routeId = tripRoute.getId();
            boolean isAllowedRoute = (passenger.getRoute() != null && passenger.getRoute().getId().equals(routeId))
                    || (passenger.getReturnRoute() != null && passenger.getReturnRoute().getId().equals(routeId));

            if (!isAllowedRoute) {
                String allowedName = passenger.getRoute() != null ? passenger.getRoute().getName() : "Rota não cadastrada";
                throw new IllegalStateException("EMBARQUE RECUSADO: Colaborador " + passenger.getName() +
                        " não está autorizado para a linha '" + tripRoute.getName() + "'. Linha permitida: '" + allowedName + "'.");
            }
        }

        // 5. Coordenadas e Modo de Validação
        Double lat = req.get("latitude") != null ? Double.parseDouble(req.get("latitude").toString()) : null;
        Double lng = req.get("longitude") != null ? Double.parseDouble(req.get("longitude").toString()) : null;
        String mode = req.get("validationMode") != null ? req.get("validationMode").toString() : "QR_PASSAGEIRO";
        String direction = req.get("direction") != null ? req.get("direction").toString() : "IDA";

        Vehicle vehicle = null;
        if (trip != null && trip.getVehicle() != null) {
            vehicle = trip.getVehicle();
        } else if (schedule != null && schedule.getVehicle() != null) {
            vehicle = schedule.getVehicle();
        }

        UUID companyId = passenger.getCompanyId() != null ? passenger.getCompanyId() : tenantCompanyId;

        Boarding boarding = new Boarding();
        boarding.setPassenger(passenger);
        boarding.setTrip(trip);
        boarding.setSchedule(schedule);
        boarding.setVehicle(vehicle);
        boarding.setCompanyId(companyId);
        boarding.setClientId(passenger.getClientId());
        boarding.setBoardingTime(LocalDateTime.now());
        boarding.setBoardingLatitude(lat);
        boarding.setBoardingLongitude(lng);
        boarding.setBoardingPoint(passenger.getBoardingPoint());
        boarding.setStatus(BoardingStatus.BOARDED);
        boarding.setDirection(direction);
        boarding.setValidationMode(mode);
        boarding.setIsSyncedOffline(Boolean.TRUE.equals(req.get("isSyncedOffline")));

        Boarding saved = boardingRepository.save(boarding);
        log.info("✅ Embarque confirmado com sucesso: Passageiro={}, Linha={}, Modo={}", passenger.getName(),
                tripRoute != null ? tripRoute.getName() : "Avulsa", mode);
        return toDTO(saved);
    }

    /**
     * Sincronização em lote da fila offline do motorista ou do passageiro
     */
    @Transactional
    public List<BoardingDTO> batchSync(List<BoardingDTO> boardings, UUID companyId) {
        List<BoardingDTO> synced = new ArrayList<>();
        if (boardings == null || boardings.isEmpty()) {
            return synced;
        }

        for (BoardingDTO dto : boardings) {
            try {
                Passenger passenger = null;
                if (dto.getPassengerId() != null) {
                    passenger = passengerRepository.findById(dto.getPassengerId()).orElse(null);
                }
                if (passenger == null && dto.getPassengerCpf() != null) {
                    String clean = dto.getPassengerCpf().replaceAll("\\D", "");
                    passenger = passengerRepository.findByCleanCpfNative(clean).orElse(null);
                }
                if (passenger == null && dto.getPassengerRegistration() != null) {
                    passenger = passengerRepository.findByRegistrationIgnoreCase(dto.getPassengerRegistration()).orElse(null);
                }

                if (passenger != null) {
                    validatePassengerActive(passenger);

                    Boarding boarding = toEntity(dto);
                    boarding.setPassenger(passenger);
                    boarding.setCompanyId(passenger.getCompanyId() != null ? passenger.getCompanyId() : companyId);
                    boarding.setClientId(passenger.getClientId());
                    boarding.setIsSyncedOffline(true);
                    if (boarding.getBoardingTime() == null) {
                        boarding.setBoardingTime(LocalDateTime.now());
                    }
                    Boarding saved = boardingRepository.save(boarding);
                    synced.add(toDTO(saved));
                }
            } catch (Exception ex) {
                log.warn("⚠️ Erro ao sincronizar embarque offline do passageiro {}: {}", dto.getPassengerName(), ex.getMessage());
            }
        }
        return synced;
    }

    /**
     * Histórico de embarques do próprio passageiro logado
     */
    public List<BoardingDTO> getMyHistory(UUID userId) {
        Passenger passenger = passengerRepository.findByUserIdNative(userId)
                .orElse(null);
        if (passenger == null) {
            return Collections.emptyList();
        }
        List<Boarding> list = boardingRepository.findByPassengerIdOrderByBoardingTimeDesc(passenger.getId());
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Listagem filtrada para a Gestão de Embarques do Gestor de Tráfego e RH
     */
    public List<BoardingDTO> getFilteredBoardings(UUID companyId, UUID clientId, UUID passengerId, LocalDateTime start, LocalDateTime end) {
        List<Boarding> list = boardingRepository.findFiltered(companyId, clientId, passengerId, start, end);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Emissão de Relatório PDF de Movimentação de Embarques com iText 7
     */
    public byte[] generatePdfReport(UUID companyId, UUID clientId, UUID passengerId, LocalDateTime start, LocalDateTime end) {
        try {
            List<Boarding> boardings = boardingRepository.findFiltered(companyId, clientId, passengerId, start, end);
            Company company = companyRepository.findById(companyId).orElse(null);
            Client client = clientId != null ? clientRepository.findById(clientId).orElse(null) : null;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);

            ReportLayoutConfig config = new ReportLayoutConfig();
            config.setCompanyId(companyId);
            config.setReportTitle("RELATÓRIO DE GESTÃO DE EMBARQUES E MOVIMENTAÇÃO");
            config.setLandscape(true);
            config.setTopMargin(80f);
            config.setBottomMargin(50f);
            config.setLeftMargin(30f);
            config.setRightMargin(30f);

            var docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, config);
            Document document = docWithPdf.getDocument();

            // Cabeçalho de Filtros do Relatório
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String clientName = client != null ? client.getName() : "Todos os Clientes / Contratantes";
            String periodo = (start != null ? start.format(dtf) : "Início") + " até " + (end != null ? end.format(dtf) : "Atual");

            document.add(new Paragraph("Período: " + periodo + " | Cliente: " + clientName)
                    .setFontSize(10).setBold().setFontColor(new DeviceRgb(70, 80, 95)));
            document.add(new Paragraph("Total de Embarques Confirmados: " + boardings.size())
                    .setFontSize(10).setBold().setFontColor(new DeviceRgb(16, 149, 193)).setMarginBottom(12f));

            // Tabela Detalhada com Colunas
            Table table = new Table(UnitValue.createPercentArray(new float[]{12, 20, 12, 14, 18, 8, 16}));
            table.setWidth(UnitValue.createPercentValue(100));

            // Header Cells
            String[] headers = {"Data / Hora", "Passageiro / Colaborador", "Matrícula", "CPF", "Linha / Rota", "Sentido", "Modo Validação"};
            for (String h : headers) {
                table.addHeaderCell(new Cell()
                        .setBackgroundColor(new DeviceRgb(240, 243, 246))
                        .setTextAlignment(TextAlignment.CENTER)
                        .add(new Paragraph(h).setBold().setFontSize(9).setFontColor(new DeviceRgb(30, 41, 59))));
            }

            for (Boarding b : boardings) {
                String hora = b.getBoardingTime() != null ? b.getBoardingTime().format(dtf) : "-";
                String passName = b.getPassenger() != null ? b.getPassenger().getName() : "Não informado";
                String reg = b.getPassenger() != null && b.getPassenger().getRegistration() != null ? b.getPassenger().getRegistration() : "-";
                String cpf = b.getPassenger() != null && b.getPassenger().getCpf() != null ? b.getPassenger().getCpf() : "-";
                String rota = b.getTrip() != null && b.getTrip().getRoute() != null ? b.getTrip().getRoute().getName() :
                        (b.getPassenger() != null && b.getPassenger().getRoute() != null ? b.getPassenger().getRoute().getName() : "-");
                String sentido = b.getDirection() != null ? b.getDirection() : "IDA";
                String modo = b.getValidationMode() != null ? b.getValidationMode().replace("_", " ") : "QR CODE";

                table.addCell(new Cell().add(new Paragraph(hora).setFontSize(8)));
                table.addCell(new Cell().add(new Paragraph(passName).setFontSize(8).setBold()));
                table.addCell(new Cell().add(new Paragraph(reg).setFontSize(8)));
                table.addCell(new Cell().add(new Paragraph(cpf).setFontSize(8)));
                table.addCell(new Cell().add(new Paragraph(rota).setFontSize(8)));
                table.addCell(new Cell().add(new Paragraph(sentido).setFontSize(8).setTextAlignment(TextAlignment.CENTER)));
                table.addCell(new Cell().add(new Paragraph(modo).setFontSize(8).setTextAlignment(TextAlignment.CENTER)));
            }

            document.add(table);
            document.close();

            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de movimentação de embarques: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório em PDF de embarques: " + e.getMessage());
        }
    }

    private void validatePassengerActive(Passenger passenger) {
        if ("DEMITIDO".equalsIgnoreCase(passenger.getStatus()) ||
            "BLOQUEADO".equalsIgnoreCase(passenger.getStatus()) ||
            Boolean.FALSE.equals(passenger.getActive())) {
            String motivo = passenger.getStatus() != null ? passenger.getStatus() : "INATIVO";
            log.warn("🚫 Tentativa de embarque negada: Passageiro {} com status {}", passenger.getName(), motivo);
            throw new IllegalStateException("EMBARQUE RECUSADO: O passageiro " + passenger.getName() +
                    " está com status " + motivo + ". O acesso ao transporte corporativo foi revogado.");
        }
    }

    private Boarding findById(UUID id) {
        return boardingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boarding not found with id: " + id));
    }

    public BoardingDTO toDTO(Boarding boarding) {
        Passenger p = boarding.getPassenger();
        Trip t = boarding.getTrip();
        Vehicle v = boarding.getVehicle();
        Route r = t != null ? t.getRoute() : (p != null ? p.getRoute() : null);

        return BoardingDTO.builder()
                .id(boarding.getId())
                .tripId(t != null ? t.getId() : null)
                .scheduleId(boarding.getSchedule() != null ? boarding.getSchedule().getId() : null)
                .passengerId(p != null ? p.getId() : null)
                .passengerName(p != null ? p.getName() : null)
                .passengerRegistration(p != null ? p.getRegistration() : null)
                .passengerCpf(p != null ? p.getCpf() : null)
                .companyId(boarding.getCompanyId())
                .clientId(boarding.getClientId())
                .clientName(p != null && p.getClient() != null ? p.getClient().getName() : null)
                .routeName(r != null ? r.getName() : null)
                .vehicleId(v != null ? v.getId() : null)
                .vehiclePlate(v != null ? v.getPlate() : null)
                .boardingTime(boarding.getBoardingTime())
                .boardingLatitude(boarding.getBoardingLatitude())
                .boardingLongitude(boarding.getBoardingLongitude())
                .boardingPointId(boarding.getBoardingPoint() != null ? boarding.getBoardingPoint().getId() : null)
                .status(boarding.getStatus())
                .direction(boarding.getDirection())
                .validationMode(boarding.getValidationMode())
                .isSyncedOffline(boarding.getIsSyncedOffline())
                .createdAt(boarding.getCreatedAt())
                .updatedAt(boarding.getUpdatedAt())
                .build();
    }

    private Boarding toEntity(BoardingDTO dto) {
        Boarding boarding = new Boarding();

        if (dto.getTripId() != null) {
            tripRepository.findById(dto.getTripId()).ifPresent(boarding::setTrip);
        }

        if (dto.getScheduleId() != null) {
            scheduleRepository.findById(dto.getScheduleId()).ifPresent(boarding::setSchedule);
        }

        if (dto.getPassengerId() != null) {
            passengerRepository.findById(dto.getPassengerId()).ifPresent(boarding::setPassenger);
        }

        if (dto.getVehicleId() != null) {
            vehicleRepository.findById(dto.getVehicleId()).ifPresent(boarding::setVehicle);
        }

        boarding.setCompanyId(dto.getCompanyId());
        boarding.setClientId(dto.getClientId());
        boarding.setBoardingTime(dto.getBoardingTime() != null ? dto.getBoardingTime() : LocalDateTime.now());
        boarding.setBoardingLatitude(dto.getBoardingLatitude());
        boarding.setBoardingLongitude(dto.getBoardingLongitude());

        if (dto.getBoardingPointId() != null) {
            routePointRepository.findById(dto.getBoardingPointId()).ifPresent(boarding::setBoardingPoint);
        }

        boarding.setStatus(dto.getStatus() != null ? dto.getStatus() : BoardingStatus.BOARDED);
        boarding.setDirection(dto.getDirection() != null ? dto.getDirection() : "IDA");
        boarding.setValidationMode(dto.getValidationMode() != null ? dto.getValidationMode() : "QR_PASSAGEIRO");
        boarding.setIsSyncedOffline(Boolean.TRUE.equals(dto.getIsSyncedOffline()));

        return boarding;
    }
}
