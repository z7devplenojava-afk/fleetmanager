package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.dto.VehicleMaintenanceDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleMaintenance;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.VehicleMaintenanceRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VehicleMaintenanceService {

    private final VehicleMaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final FileStorageService fileStorageService;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;

    // Buscar todas as manutenÃ§Ãµes
    public List<VehicleMaintenanceDTO> getAllMaintenances() {
        log.info("Buscando todas as manutenÃ§Ãµes");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAllWithVehicle(); // Usar mÃ©todo com JOIN FETCH
            log.info("Total de manutenÃ§Ãµes encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenÃ§Ã£o para DTO. ID: {}, VehicleId: {}", 
                                    maintenance.getId(), 
                                    maintenance.getVehicle() != null ? maintenance.getVehicle().getId() : "null");
                            return VehicleMaintenanceDTO.fromEntity(maintenance);
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenÃ§Ã£o {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenÃ§Ãµes: {}", e.getMessage(), e);
            throw e;
        }
    }

    // Buscar todas as manutenÃ§Ãµes (versÃ£o simplificada)
    public List<VehicleMaintenanceDTO> getAllMaintenancesSimple() {
        log.info("Buscando todas as manutenÃ§Ãµes (versÃ£o simplificada)");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAll(); // Usar mÃ©todo padrÃ£o
            log.info("Total de manutenÃ§Ãµes encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenÃ§Ã£o para DTO. ID: {}", maintenance.getId());
                            
                            // Criar DTO sem acessar relacionamentos
                            VehicleMaintenanceDTO dto = new VehicleMaintenanceDTO();
                            dto.setId(maintenance.getId());
                            dto.setDate(maintenance.getDate());
                            dto.setMaintenanceType(maintenance.getMaintenanceType().name());
                            dto.setDescription(maintenance.getDescription());
                            dto.setCost(maintenance.getCost());
                            dto.setProvider(maintenance.getProvider());
                            dto.setMileage(maintenance.getMileage());
                            dto.setStatus(maintenance.getStatus().name());
                            dto.setPriority(maintenance.getPriority().name());
                            dto.setNotes(maintenance.getNotes());
                            dto.setCreatedAt(maintenance.getCreatedAt());
                            dto.setUpdatedAt(maintenance.getUpdatedAt());
                            dto.setPhotos(maintenance.getPhotos());
                            dto.setDocuments(maintenance.getDocuments());
                            
                            // Definir valores padrÃ£o para campos que dependem do relacionamento
                            dto.setVehicleId(null);
                            dto.setVehiclePlate("N/A");
                            
                            return dto;
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenÃ§Ã£o {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenÃ§Ãµes: {}", e.getMessage(), e);
            throw e;
        }
    }

    // Buscar manutenÃ§Ã£o por ID
    public VehicleMaintenanceDTO getMaintenanceById(UUID id) {
        log.info("Buscando manutenÃ§Ã£o com ID: {}", id);
        VehicleMaintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ManutenÃ§Ã£o nÃ£o encontrada com ID: " + id));
        return VehicleMaintenanceDTO.fromEntity(maintenance);
    }

    // Criar nova manutenÃ§Ã£o
    public VehicleMaintenanceDTO createMaintenance(VehicleMaintenanceDTO dto) {
        log.info("Criando nova manutenÃ§Ã£o para veÃ­culo: {}", dto.getVehicleId());
        
        // Validar se o veÃ­culo existe
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + dto.getVehicleId()));

        // Converter DTO para entidade
        VehicleMaintenance maintenance = VehicleMaintenanceDTO.toEntity(dto);
        maintenance.setVehicle(vehicle);
        // Photos e Documents jÃ¡ vÃªm do DTO

        // Salvar manutenÃ§Ã£o
        VehicleMaintenance savedMaintenance = maintenanceRepository.save(maintenance);
        
        log.info("ManutenÃ§Ã£o criada com sucesso. ID: {}", savedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(savedMaintenance);
    }

    // Criar nova manutenÃ§Ã£o com upload de arquivos
    public VehicleMaintenanceDTO createMaintenanceWithFiles(VehicleMaintenanceDTO dto, MultipartFile[] files) {
        log.info("Criando nova manutenÃ§Ã£o com upload de arquivos para veÃ­culo: {}", dto.getVehicleId());
        
        // Validar se o veÃ­culo existe
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + dto.getVehicleId()));

        // Converter DTO para entidade
        VehicleMaintenance maintenance = VehicleMaintenanceDTO.toEntity(dto);
        maintenance.setVehicle(vehicle);

        // Processar arquivos enviados
        if (files != null && files.length > 0) {
            log.info("Processando {} arquivos enviados", files.length);
            
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        String fileUrl = fileStorageService.storeFile(file);
                        log.info("Arquivo salvo: {}", fileUrl);
                        
                        // Determinar se Ã© foto ou documento baseado no tipo de arquivo
                        String contentType = file.getContentType();
                        if (contentType != null && contentType.startsWith("image/")) {
                            maintenance.getPhotos().add(fileUrl);
                            log.info("Foto adicionada: {}", fileUrl);
                        } else {
                            maintenance.getDocuments().add(fileUrl);
                            log.info("Documento adicionado: {}", fileUrl);
                        }
                    } catch (Exception e) {
                        log.error("Erro ao processar arquivo {}: {}", file.getOriginalFilename(), e.getMessage());
                        throw new RuntimeException("Erro ao processar arquivo: " + file.getOriginalFilename(), e);
                    }
                }
            }
        }

        // Salvar manutenÃ§Ã£o
        VehicleMaintenance savedMaintenance = maintenanceRepository.save(maintenance);
        
        log.info("ManutenÃ§Ã£o criada com sucesso. ID: {}", savedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(savedMaintenance);
    }

    // Atualizar manutenÃ§Ã£o
    public VehicleMaintenanceDTO updateMaintenance(UUID id, VehicleMaintenanceDTO dto) {
        log.info("Atualizando manutenÃ§Ã£o com ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ManutenÃ§Ã£o nÃ£o encontrada com ID: " + id));

        // Validar se o veÃ­culo existe (se foi alterado)
        if (!existingMaintenance.getVehicle().getId().equals(dto.getVehicleId())) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + dto.getVehicleId()));
            existingMaintenance.setVehicle(vehicle);
        }

        // Excluir arquivos marcados para remoÃ§Ã£o
        if (dto.getRemovedPhotos() != null && !dto.getRemovedPhotos().isEmpty()) {
            log.info("Removendo fotos antigas: {}", dto.getRemovedPhotos());
            dto.getRemovedPhotos().forEach(fileStorageService::deleteFile);
            // Remover as fotos da lista existente na entidade
            existingMaintenance.getPhotos().removeAll(dto.getRemovedPhotos());
        }
        if (dto.getRemovedDocuments() != null && !dto.getRemovedDocuments().isEmpty()) {
            log.info("Removendo documentos antigos: {}", dto.getRemovedDocuments());
            dto.getRemovedDocuments().forEach(fileStorageService::deleteFile);
            // Remover os documentos da lista existente na entidade
            existingMaintenance.getDocuments().removeAll(dto.getRemovedDocuments());
        }

        // Atualizar campos
        existingMaintenance.setDate(dto.getDate());
        existingMaintenance.setMaintenanceType(VehicleMaintenance.MaintenanceType.valueOf(dto.getMaintenanceType()));
        existingMaintenance.setDescription(dto.getDescription());
        existingMaintenance.setCost(dto.getCost());
        existingMaintenance.setProvider(dto.getProvider());
        existingMaintenance.setMileage(dto.getMileage());
        existingMaintenance.setStatus(VehicleMaintenance.MaintenanceStatus.valueOf(dto.getStatus()));
        existingMaintenance.setPriority(VehicleMaintenance.MaintenancePriority.valueOf(dto.getPriority()));
        existingMaintenance.setNotes(dto.getNotes());
        
        // Adicionar novas fotos (se nÃ£o forem null)
        if (dto.getPhotos() != null && !dto.getPhotos().isEmpty()) {
            existingMaintenance.getPhotos().addAll(dto.getPhotos());
        }
        
        // Adicionar novos documentos (se nÃ£o forem null)
        if (dto.getDocuments() != null && !dto.getDocuments().isEmpty()) {
            existingMaintenance.getDocuments().addAll(dto.getDocuments());
        }

        VehicleMaintenance updatedMaintenance = maintenanceRepository.save(existingMaintenance);
        
        log.info("ManutenÃ§Ã£o atualizada com sucesso. ID: {}", updatedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(updatedMaintenance);
    }

    // Atualizar manutenÃ§Ã£o com upload de arquivos
    public VehicleMaintenanceDTO updateMaintenanceWithFiles(UUID id, VehicleMaintenanceDTO dto, MultipartFile[] files) {
        log.info("Atualizando manutenÃ§Ã£o com upload de arquivos. ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ManutenÃ§Ã£o nÃ£o encontrada com ID: " + id));

        // Validar se o veÃ­culo existe (se foi alterado)
        if (!existingMaintenance.getVehicle().getId().equals(dto.getVehicleId())) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("VeÃ­culo nÃ£o encontrado com ID: " + dto.getVehicleId()));
            existingMaintenance.setVehicle(vehicle);
        }

        // Excluir arquivos marcados para remoÃ§Ã£o
        if (dto.getRemovedPhotos() != null && !dto.getRemovedPhotos().isEmpty()) {
            log.info("Removendo fotos antigas: {}", dto.getRemovedPhotos());
            dto.getRemovedPhotos().forEach(fileStorageService::deleteFile);
            // Remover as fotos da lista existente na entidade
            existingMaintenance.getPhotos().removeAll(dto.getRemovedPhotos());
        }
        if (dto.getRemovedDocuments() != null && !dto.getRemovedDocuments().isEmpty()) {
            log.info("Removendo documentos antigos: {}", dto.getRemovedDocuments());
            dto.getRemovedDocuments().forEach(fileStorageService::deleteFile);
            // Remover os documentos da lista existente na entidade
            existingMaintenance.getDocuments().removeAll(dto.getRemovedDocuments());
        }

        // Atualizar campos
        existingMaintenance.setDate(dto.getDate());
        existingMaintenance.setMaintenanceType(VehicleMaintenance.MaintenanceType.valueOf(dto.getMaintenanceType()));
        existingMaintenance.setDescription(dto.getDescription());
        existingMaintenance.setCost(dto.getCost());
        existingMaintenance.setProvider(dto.getProvider());
        existingMaintenance.setMileage(dto.getMileage());
        existingMaintenance.setStatus(VehicleMaintenance.MaintenanceStatus.valueOf(dto.getStatus()));
        existingMaintenance.setPriority(VehicleMaintenance.MaintenancePriority.valueOf(dto.getPriority()));
        existingMaintenance.setNotes(dto.getNotes());

        // Processar novos arquivos enviados
        if (files != null && files.length > 0) {
            log.info("Processando {} novos arquivos enviados", files.length);
            
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        String fileUrl = fileStorageService.storeFile(file);
                        log.info("Arquivo salvo: {}", fileUrl);
                        
                        // Determinar se Ã© foto ou documento baseado no tipo de arquivo
                        String contentType = file.getContentType();
                        if (contentType != null && contentType.startsWith("image/")) {
                            existingMaintenance.getPhotos().add(fileUrl);
                            log.info("Foto adicionada: {}", fileUrl);
                        } else {
                            existingMaintenance.getDocuments().add(fileUrl);
                            log.info("Documento adicionado: {}", fileUrl);
                        }
                    } catch (Exception e) {
                        log.error("Erro ao processar arquivo {}: {}", file.getOriginalFilename(), e.getMessage());
                        throw new RuntimeException("Erro ao processar arquivo: " + file.getOriginalFilename(), e);
                    }
                }
            }
        }

        VehicleMaintenance updatedMaintenance = maintenanceRepository.save(existingMaintenance);
        
        log.info("ManutenÃ§Ã£o atualizada com sucesso. ID: {}", updatedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(updatedMaintenance);
    }

    // Deletar manutenÃ§Ã£o
    public void deleteMaintenance(UUID id) {
        log.info("Deletando manutenÃ§Ã£o com ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ManutenÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        // Deletar arquivos associados (com tratamento de erro)
        try {
            if (existingMaintenance.getPhotos() != null && !existingMaintenance.getPhotos().isEmpty()) {
                log.info("Tentando deletar {} fotos", existingMaintenance.getPhotos().size());
                existingMaintenance.getPhotos().forEach(photoUrl -> {
                    try {
                        fileStorageService.deleteFile(photoUrl);
                    } catch (Exception e) {
                        log.warn("Erro ao deletar foto {}: {}", photoUrl, e.getMessage());
                        // Continua a execuÃ§Ã£o mesmo se falhar ao deletar arquivo
                    }
                });
            }
            
            if (existingMaintenance.getDocuments() != null && !existingMaintenance.getDocuments().isEmpty()) {
                log.info("Tentando deletar {} documentos", existingMaintenance.getDocuments().size());
                existingMaintenance.getDocuments().forEach(docUrl -> {
                    try {
                        fileStorageService.deleteFile(docUrl);
                    } catch (Exception e) {
                        log.warn("Erro ao deletar documento {}: {}", docUrl, e.getMessage());
                        // Continua a execuÃ§Ã£o mesmo se falhar ao deletar arquivo
                    }
                });
            }
        } catch (Exception e) {
            log.error("Erro ao deletar arquivos da manutenÃ§Ã£o {}: {}", id, e.getMessage());
            // Continua a execuÃ§Ã£o mesmo se falhar ao deletar arquivos
        }
        
        // Deletar a manutenÃ§Ã£o do banco de dados
        maintenanceRepository.deleteById(id);
        log.info("ManutenÃ§Ã£o deletada com sucesso. ID: {}", id);
    }

    // Buscar manutenÃ§Ãµes por veÃ­culo
    public List<VehicleMaintenanceDTO> getMaintenancesByVehicle(UUID vehicleId) {
        log.info("Buscando manutenÃ§Ãµes para veÃ­culo: {}", vehicleId);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar a data da Ãºltima manutenÃ§Ã£o de um veÃ­culo
    public LocalDate getLastMaintenanceDateByVehicle(UUID vehicleId) {
        log.info("Buscando data da Ãºltima manutenÃ§Ã£o para veÃ­culo: {}", vehicleId);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        
        if (maintenances.isEmpty()) {
            log.info("Nenhuma manutenÃ§Ã£o encontrada para o veÃ­culo: {}", vehicleId);
            return null;
        }
        
        // Buscar a manutenÃ§Ã£o mais recente com status COMPLETED
        LocalDate lastCompletedMaintenance = maintenances.stream()
                .filter(m -> m.getStatus() == VehicleMaintenance.MaintenanceStatus.COMPLETED)
                .map(VehicleMaintenance::getDate)
                .max(LocalDate::compareTo)
                .orElse(null);
        
        if (lastCompletedMaintenance != null) {
            log.info("Ãšltima manutenÃ§Ã£o concluÃ­da para veÃ­culo {}: {}", vehicleId, lastCompletedMaintenance);
            return lastCompletedMaintenance;
        }
        
        // Se nÃ£o houver manutenÃ§Ãµes concluÃ­das, retornar a mais recente de qualquer status
        LocalDate lastMaintenance = maintenances.get(0).getDate();
        log.info("Ãšltima manutenÃ§Ã£o (qualquer status) para veÃ­culo {}: {}", vehicleId, lastMaintenance);
        return lastMaintenance;
    }

    // Buscar manutenÃ§Ãµes por status
    public List<VehicleMaintenanceDTO> getMaintenancesByStatus(String status) {
        log.info("Buscando manutenÃ§Ãµes com status: {}", status);
        VehicleMaintenance.MaintenanceStatus maintenanceStatus = VehicleMaintenance.MaintenanceStatus.valueOf(status);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByStatusOrderByDateDesc(maintenanceStatus);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenÃ§Ãµes por prioridade
    public List<VehicleMaintenanceDTO> getMaintenancesByPriority(String priority) {
        log.info("Buscando manutenÃ§Ãµes com prioridade: {}", priority);
        VehicleMaintenance.MaintenancePriority maintenancePriority = VehicleMaintenance.MaintenancePriority.valueOf(priority);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByPriorityOrderByDateDesc(maintenancePriority);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenÃ§Ãµes por perÃ­odo
    public List<VehicleMaintenanceDTO> getMaintenancesByPeriod(LocalDate startDate, LocalDate endDate) {
        log.info("Buscando manutenÃ§Ãµes entre {} e {}", startDate, endDate);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenÃ§Ãµes agendadas para hoje
    public List<VehicleMaintenanceDTO> getScheduledForToday() {
        log.info("Buscando manutenÃ§Ãµes agendadas para hoje");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findScheduledForToday(LocalDate.now());
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenÃ§Ãµes urgentes
    public List<VehicleMaintenanceDTO> getUrgentMaintenances() {
        log.info("Buscando manutenÃ§Ãµes urgentes");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findUrgentMaintenances();
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenÃ§Ãµes vencidas
    public List<VehicleMaintenanceDTO> getOverdueMaintenances() {
        log.info("Buscando manutenÃ§Ãµes vencidas");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findOverdueMaintenances(LocalDate.now());
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // EstatÃ­sticas de manutenÃ§Ã£o
    public MaintenanceStats getMaintenanceStats() {
        log.info("Gerando estatÃ­sticas de manutenÃ§Ã£o");
        
        long total = maintenanceRepository.count();
        long scheduled = maintenanceRepository.countByStatus(VehicleMaintenance.MaintenanceStatus.SCHEDULED);
        long inProgress = maintenanceRepository.countByStatus(VehicleMaintenance.MaintenanceStatus.IN_PROGRESS);
        long completed = maintenanceRepository.countByStatus(VehicleMaintenance.MaintenanceStatus.COMPLETED);
        long cancelled = maintenanceRepository.countByStatus(VehicleMaintenance.MaintenanceStatus.CANCELLED);
        
        long urgent = maintenanceRepository.countByPriority(VehicleMaintenance.MaintenancePriority.URGENT);
        long high = maintenanceRepository.countByPriority(VehicleMaintenance.MaintenancePriority.HIGH);
        
        return MaintenanceStats.builder()
                .total(total)
                .scheduled(scheduled)
                .inProgress(inProgress)
                .completed(completed)
                .cancelled(cancelled)
                .urgent(urgent)
                .high(high)
                .build();
    }

    // DTO para estatÃ­sticas
    public static class MaintenanceStats {
        private final long total;
        private final long scheduled;
        private final long inProgress;
        private final long completed;
        private final long cancelled;
        private final long urgent;
        private final long high;

        public MaintenanceStats(long total, long scheduled, long inProgress, long completed, long cancelled, long urgent, long high) {
            this.total = total;
            this.scheduled = scheduled;
            this.inProgress = inProgress;
            this.completed = completed;
            this.cancelled = cancelled;
            this.urgent = urgent;
            this.high = high;
        }

        // Getters
        public long getTotal() { return total; }
        public long getScheduled() { return scheduled; }
        public long getInProgress() { return inProgress; }
        public long getCompleted() { return completed; }
        public long getCancelled() { return cancelled; }
        public long getUrgent() { return urgent; }
        public long getHigh() { return high; }

        // Builder
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private long total;
            private long scheduled;
            private long inProgress;
            private long completed;
            private long cancelled;
            private long urgent;
            private long high;

            public Builder total(long total) { this.total = total; return this; }
            public Builder scheduled(long scheduled) { this.scheduled = scheduled; return this; }
            public Builder inProgress(long inProgress) { this.inProgress = inProgress; return this; }
            public Builder completed(long completed) { this.completed = completed; return this; }
            public Builder cancelled(long cancelled) { this.cancelled = cancelled; return this; }
            public Builder urgent(long urgent) { this.urgent = urgent; return this; }
            public Builder high(long high) { this.high = high; return this; }

            public MaintenanceStats build() {
                return new MaintenanceStats(total, scheduled, inProgress, completed, cancelled, urgent, high);
            }
        }
    }

    // Buscar todas as manutenÃ§Ãµes (versÃ£o temporÃ¡ria sem photos/documents)
    public List<VehicleMaintenanceDTO> getAllMaintenancesTemporary() {
        log.info("Buscando todas as manutenÃ§Ãµes (versÃ£o temporÃ¡ria)");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAll();
            log.info("Total de manutenÃ§Ãµes encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenÃ§Ã£o para DTO. ID: {}", maintenance.getId());
                            
                            // Criar DTO sem as colunas problemÃ¡ticas
                            VehicleMaintenanceDTO dto = new VehicleMaintenanceDTO();
                            dto.setId(maintenance.getId());
                            dto.setDate(maintenance.getDate());
                            dto.setMaintenanceType(maintenance.getMaintenanceType().name());
                            dto.setDescription(maintenance.getDescription());
                            dto.setCost(maintenance.getCost());
                            dto.setProvider(maintenance.getProvider());
                            dto.setMileage(maintenance.getMileage());
                            dto.setStatus(maintenance.getStatus().name());
                            dto.setPriority(maintenance.getPriority().name());
                            dto.setNotes(maintenance.getNotes());
                            dto.setCreatedAt(maintenance.getCreatedAt());
                            dto.setUpdatedAt(maintenance.getUpdatedAt());
                            
                            // Definir valores padrÃ£o para campos que dependem do relacionamento
                            dto.setVehicleId(null);
                            dto.setVehiclePlate("N/A");
                            
                            // Definir listas vazias para photos e documents
                            dto.setPhotos(new ArrayList<>());
                            dto.setDocuments(new ArrayList<>());
                            
                            return dto;
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenÃ§Ã£o {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenÃ§Ãµes: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public byte[] generatePDFReport(LocalDate startDate, LocalDate endDate, UUID vehicleId, 
                                    VehicleMaintenance.MaintenanceStatus status, 
                                    VehicleMaintenance.MaintenanceType maintenanceType,
                                    String description) throws IOException {
        log.info("Gerando relatÃ³rio PDF de manutenÃ§Ãµes - StartDate: {}, EndDate: {}, VehicleId: {}, Status: {}, Type: {}, Description: {}",
                startDate, endDate, vehicleId, status, maintenanceType, description);

        List<VehicleMaintenance> maintenances = getMaintenancesFiltered(startDate, endDate, vehicleId, status, maintenanceType, description);
        log.info("Total de manutenÃ§Ãµes encontradas para o relatÃ³rio: {}", maintenances.size());

        // Determinar companyId - tentar obter das manutenÃ§Ãµes primeiro
        java.util.UUID companyId = null;
        if (!maintenances.isEmpty()) {
            for (VehicleMaintenance maintenance : maintenances) {
                if (maintenance.getVehicle() != null && maintenance.getVehicle().getCompanyId() != null) {
                    companyId = maintenance.getVehicle().getCompanyId();
                    log.info("Usando empresa do veÃ­culo {}: {}", maintenance.getVehicle().getPlate(), companyId);
                    break;
                }
            }
        }
        
        // Fallback: usar primeira empresa ativa se nenhuma manutenÃ§Ã£o tiver companyId
        if (companyId == null) {
            log.warn("Nenhuma manutenÃ§Ã£o possui empresa associada. Buscando primeira empresa ativa como fallback...");
            List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
            if (activeCompanies != null && !activeCompanies.isEmpty()) {
                companyId = activeCompanies.get(0).getId();
                log.info("Usando primeira empresa ativa como fallback: {} (ID: {})", 
                        activeCompanies.get(0).getName(), companyId);
            } else {
                List<Company> allCompanies = companyRepository.findAll();
                if (allCompanies != null && !allCompanies.isEmpty()) {
                    companyId = allCompanies.get(0).getId();
                    log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                            allCompanies.get(0).getName(), companyId);
                } else {
                    throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                            "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
                }
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE MANUTENÃ‡Ã•ES")
                .topMargin(120f)  // EspaÃ§o para cabeÃ§alho
                .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                .leftMargin(50f)
                .rightMargin(50f)
                .build();
            
            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);

            // Filtros aplicados
            if (startDate != null || endDate != null || vehicleId != null || status != null || maintenanceType != null || description != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + 
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (vehicleId != null) {
                    Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
                    String vehiclePlate = vehicle != null ? vehicle.getPlate() : "ID: " + vehicleId;
                    document.add(new Paragraph("Placa: " + vehiclePlate).setFontSize(10).setMarginBottom(2));
                }
                if (status != null) {
                    document.add(new Paragraph("Status: " + getStatusLabel(status)).setFontSize(10).setMarginBottom(2));
                }
                if (maintenanceType != null) {
                    document.add(new Paragraph("Tipo: " + getTypeLabel(maintenanceType)).setFontSize(10).setMarginBottom(2));
                }
                if (description != null && !description.trim().isEmpty()) {
                    document.add(new Paragraph("DescriÃ§Ã£o contÃ©m: " + description).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Total de manutenÃ§Ãµes
            Paragraph totalInfo = new Paragraph("Total de manutenÃ§Ãµes: " + maintenances.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);

            // Tabela de manutenÃ§Ãµes
            if (maintenances.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma manutenÃ§Ã£o encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(8).setWidth(UnitValue.createPercentValue(100));

                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Placa"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("DescriÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Prioridade"));
                table.addHeaderCell(createHeaderCell("Quilometragem"));
                table.addHeaderCell(createHeaderCell("Custo"));

                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (VehicleMaintenance maintenance : maintenances) {
                    table.addCell(createCell(maintenance.getDate() != null ? 
                            maintenance.getDate().format(dateFormatter) : ""));
                    table.addCell(createCell(maintenance.getVehicle() != null ? maintenance.getVehicle().getPlate() : ""));
                    table.addCell(createCell(maintenance.getMaintenanceType() != null ? getTypeLabel(maintenance.getMaintenanceType()) : ""));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = maintenance.getDescription() != null ? maintenance.getDescription() : "";
                    if (desc.length() > 50) {
                        desc = desc.substring(0, 47) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    table.addCell(createCell(maintenance.getStatus() != null ? getStatusLabel(maintenance.getStatus()) : ""));
                    table.addCell(createCell(maintenance.getPriority() != null ? getPriorityLabel(maintenance.getPriority()) : ""));
                    
                    // Quilometragem formatada
                    String mileage = "";
                    if (maintenance.getMileage() != null) {
                        mileage = String.format("%,.0f km", maintenance.getMileage().doubleValue()).replace(",", ".");
                    }
                    table.addCell(createCell(mileage));
                    
                    // Custo formatado
                    String cost = "";
                    if (maintenance.getCost() != null) {
                        cost = "R$ " + maintenance.getCost().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    }
                    table.addCell(createCell(cost));
                }

                document.add(table);
            }

            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de manutenÃ§Ãµes: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }

        byte[] result = baos.toByteArray();
        log.info("PDF de manutenÃ§Ãµes gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    private List<VehicleMaintenance> getMaintenancesFiltered(LocalDate startDate, LocalDate endDate, UUID vehicleId,
                                                             VehicleMaintenance.MaintenanceStatus status,
                                                             VehicleMaintenance.MaintenanceType maintenanceType,
                                                             String description) {
        log.debug("Aplicando filtros - startDate: {}, endDate: {}, vehicleId: {}, status: {}, type: {}, description: {}",
                startDate, endDate, vehicleId, status, maintenanceType, description);

        try {
            List<VehicleMaintenance> maintenances;

            // Aplicar filtros de data e veÃ­culo primeiro
            if (startDate != null && endDate != null) {
                if (vehicleId != null) {
                    maintenances = maintenanceRepository.findByVehicleIdAndDateBetweenOrderByDateDesc(vehicleId, startDate, endDate);
                } else {
                    maintenances = maintenanceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
                }
            } else if (vehicleId != null) {
                maintenances = maintenanceRepository.findByVehicleIdOrderByDateDesc(vehicleId);
            } else {
                maintenances = maintenanceRepository.findAllWithVehicle();
            }

            // Aplicar filtros adicionais em memÃ³ria
            if (status != null) {
                maintenances = maintenances.stream()
                        .filter(m -> m.getStatus() == status)
                        .collect(Collectors.toList());
            }

            if (maintenanceType != null) {
                maintenances = maintenances.stream()
                        .filter(m -> m.getMaintenanceType() == maintenanceType)
                        .collect(Collectors.toList());
            }

            if (description != null && !description.trim().isEmpty()) {
                String descLower = description.toLowerCase();
                maintenances = maintenances.stream()
                        .filter(m -> m.getDescription() != null && 
                                m.getDescription().toLowerCase().contains(descLower))
                        .collect(Collectors.toList());
            }

            log.info("Filtros aplicados. {} manutenÃ§Ãµes encontradas", maintenances.size());
            return maintenances;

        } catch (Exception e) {
            log.error("Erro ao aplicar filtros nas manutenÃ§Ãµes", e);
            throw new RuntimeException("Erro ao buscar manutenÃ§Ãµes: " + e.getMessage(), e);
        }
    }

    private String getStatusLabel(VehicleMaintenance.MaintenanceStatus status) {
        if (status == null) return "";
        switch (status) {
            case SCHEDULED: return "Agendada";
            case IN_PROGRESS: return "Em Andamento";
            case COMPLETED: return "ConcluÃ­da";
            case CANCELLED: return "Cancelada";
            default: return status.toString();
        }
    }

    private String getTypeLabel(VehicleMaintenance.MaintenanceType type) {
        if (type == null) return "";
        switch (type) {
            case PREVENTIVE: return "Preventiva";
            case CORRECTIVE: return "Corretiva";
            case PREDICTIVE: return "Preditiva";
            case IMPROVEMENT: return "Melhoria";
            case OTHER: return "Outro";
            default: return type.toString();
        }
    }

    private String getPriorityLabel(VehicleMaintenance.MaintenancePriority priority) {
        if (priority == null) return "";
        switch (priority) {
            case LOW: return "Baixa";
            case MEDIUM: return "MÃ©dia";
            case HIGH: return "Alta";
            case URGENT: return "Urgente";
            default: return priority.toString();
        }
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT);
    }
}

