package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.VehicleMaintenanceDTO;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.model.VehicleMaintenance;
import br.com.fleetmanager.repository.VehicleMaintenanceRepository;
import br.com.fleetmanager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    // Buscar todas as manutenções
    public List<VehicleMaintenanceDTO> getAllMaintenances() {
        log.info("Buscando todas as manutenções");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAllWithVehicle(); // Usar método com JOIN FETCH
            log.info("Total de manutenções encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenção para DTO. ID: {}, VehicleId: {}", 
                                    maintenance.getId(), 
                                    maintenance.getVehicle() != null ? maintenance.getVehicle().getId() : "null");
                            return VehicleMaintenanceDTO.fromEntity(maintenance);
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenção {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenções: {}", e.getMessage(), e);
            throw e;
        }
    }

    // Buscar todas as manutenções (versão simplificada)
    public List<VehicleMaintenanceDTO> getAllMaintenancesSimple() {
        log.info("Buscando todas as manutenções (versão simplificada)");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAll(); // Usar método padrão
            log.info("Total de manutenções encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenção para DTO. ID: {}", maintenance.getId());
                            
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
                            
                            // Definir valores padrão para campos que dependem do relacionamento
                            dto.setVehicleId(null);
                            dto.setVehiclePlate("N/A");
                            
                            return dto;
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenção {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenções: {}", e.getMessage(), e);
            throw e;
        }
    }

    // Buscar manutenção por ID
    public VehicleMaintenanceDTO getMaintenanceById(UUID id) {
        log.info("Buscando manutenção com ID: {}", id);
        VehicleMaintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manutenção não encontrada com ID: " + id));
        return VehicleMaintenanceDTO.fromEntity(maintenance);
    }

    // Criar nova manutenção
    public VehicleMaintenanceDTO createMaintenance(VehicleMaintenanceDTO dto) {
        log.info("Criando nova manutenção para veículo: {}", dto.getVehicleId());
        
        // Validar se o veículo existe
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + dto.getVehicleId()));

        // Converter DTO para entidade
        VehicleMaintenance maintenance = VehicleMaintenanceDTO.toEntity(dto);
        maintenance.setVehicle(vehicle);
        // Photos e Documents já vêm do DTO

        // Salvar manutenção
        VehicleMaintenance savedMaintenance = maintenanceRepository.save(maintenance);
        
        log.info("Manutenção criada com sucesso. ID: {}", savedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(savedMaintenance);
    }

    // Criar nova manutenção com upload de arquivos
    public VehicleMaintenanceDTO createMaintenanceWithFiles(VehicleMaintenanceDTO dto, MultipartFile[] files) {
        log.info("Criando nova manutenção com upload de arquivos para veículo: {}", dto.getVehicleId());
        
        // Validar se o veículo existe
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + dto.getVehicleId()));

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
                        
                        // Determinar se é foto ou documento baseado no tipo de arquivo
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

        // Salvar manutenção
        VehicleMaintenance savedMaintenance = maintenanceRepository.save(maintenance);
        
        log.info("Manutenção criada com sucesso. ID: {}", savedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(savedMaintenance);
    }

    // Atualizar manutenção
    public VehicleMaintenanceDTO updateMaintenance(UUID id, VehicleMaintenanceDTO dto) {
        log.info("Atualizando manutenção com ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manutenção não encontrada com ID: " + id));

        // Validar se o veículo existe (se foi alterado)
        if (!existingMaintenance.getVehicle().getId().equals(dto.getVehicleId())) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + dto.getVehicleId()));
            existingMaintenance.setVehicle(vehicle);
        }

        // Excluir arquivos marcados para remoção
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
        
        // Adicionar novas fotos (se não forem null)
        if (dto.getPhotos() != null && !dto.getPhotos().isEmpty()) {
            existingMaintenance.getPhotos().addAll(dto.getPhotos());
        }
        
        // Adicionar novos documentos (se não forem null)
        if (dto.getDocuments() != null && !dto.getDocuments().isEmpty()) {
            existingMaintenance.getDocuments().addAll(dto.getDocuments());
        }

        VehicleMaintenance updatedMaintenance = maintenanceRepository.save(existingMaintenance);
        
        log.info("Manutenção atualizada com sucesso. ID: {}", updatedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(updatedMaintenance);
    }

    // Atualizar manutenção com upload de arquivos
    public VehicleMaintenanceDTO updateMaintenanceWithFiles(UUID id, VehicleMaintenanceDTO dto, MultipartFile[] files) {
        log.info("Atualizando manutenção com upload de arquivos. ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manutenção não encontrada com ID: " + id));

        // Validar se o veículo existe (se foi alterado)
        if (!existingMaintenance.getVehicle().getId().equals(dto.getVehicleId())) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + dto.getVehicleId()));
            existingMaintenance.setVehicle(vehicle);
        }

        // Excluir arquivos marcados para remoção
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
                        
                        // Determinar se é foto ou documento baseado no tipo de arquivo
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
        
        log.info("Manutenção atualizada com sucesso. ID: {}", updatedMaintenance.getId());
        return VehicleMaintenanceDTO.fromEntity(updatedMaintenance);
    }

    // Deletar manutenção
    public void deleteMaintenance(UUID id) {
        log.info("Deletando manutenção com ID: {}", id);
        
        VehicleMaintenance existingMaintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manutenção não encontrada com ID: " + id));
        
        // Deletar arquivos associados (com tratamento de erro)
        try {
            if (existingMaintenance.getPhotos() != null && !existingMaintenance.getPhotos().isEmpty()) {
                log.info("Tentando deletar {} fotos", existingMaintenance.getPhotos().size());
                existingMaintenance.getPhotos().forEach(photoUrl -> {
                    try {
                        fileStorageService.deleteFile(photoUrl);
                    } catch (Exception e) {
                        log.warn("Erro ao deletar foto {}: {}", photoUrl, e.getMessage());
                        // Continua a execução mesmo se falhar ao deletar arquivo
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
                        // Continua a execução mesmo se falhar ao deletar arquivo
                    }
                });
            }
        } catch (Exception e) {
            log.error("Erro ao deletar arquivos da manutenção {}: {}", id, e.getMessage());
            // Continua a execução mesmo se falhar ao deletar arquivos
        }
        
        // Deletar a manutenção do banco de dados
        maintenanceRepository.deleteById(id);
        log.info("Manutenção deletada com sucesso. ID: {}", id);
    }

    // Buscar manutenções por veículo
    public List<VehicleMaintenanceDTO> getMaintenancesByVehicle(UUID vehicleId) {
        log.info("Buscando manutenções para veículo: {}", vehicleId);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar a data da última manutenção de um veículo
    public LocalDate getLastMaintenanceDateByVehicle(UUID vehicleId) {
        log.info("Buscando data da última manutenção para veículo: {}", vehicleId);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        
        if (maintenances.isEmpty()) {
            log.info("Nenhuma manutenção encontrada para o veículo: {}", vehicleId);
            return null;
        }
        
        // Buscar a manutenção mais recente com status COMPLETED
        LocalDate lastCompletedMaintenance = maintenances.stream()
                .filter(m -> m.getStatus() == VehicleMaintenance.MaintenanceStatus.COMPLETED)
                .map(VehicleMaintenance::getDate)
                .max(LocalDate::compareTo)
                .orElse(null);
        
        if (lastCompletedMaintenance != null) {
            log.info("Última manutenção concluída para veículo {}: {}", vehicleId, lastCompletedMaintenance);
            return lastCompletedMaintenance;
        }
        
        // Se não houver manutenções concluídas, retornar a mais recente de qualquer status
        LocalDate lastMaintenance = maintenances.get(0).getDate();
        log.info("Última manutenção (qualquer status) para veículo {}: {}", vehicleId, lastMaintenance);
        return lastMaintenance;
    }

    // Buscar manutenções por status
    public List<VehicleMaintenanceDTO> getMaintenancesByStatus(String status) {
        log.info("Buscando manutenções com status: {}", status);
        VehicleMaintenance.MaintenanceStatus maintenanceStatus = VehicleMaintenance.MaintenanceStatus.valueOf(status);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByStatusOrderByDateDesc(maintenanceStatus);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenções por prioridade
    public List<VehicleMaintenanceDTO> getMaintenancesByPriority(String priority) {
        log.info("Buscando manutenções com prioridade: {}", priority);
        VehicleMaintenance.MaintenancePriority maintenancePriority = VehicleMaintenance.MaintenancePriority.valueOf(priority);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByPriorityOrderByDateDesc(maintenancePriority);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenções por período
    public List<VehicleMaintenanceDTO> getMaintenancesByPeriod(LocalDate startDate, LocalDate endDate) {
        log.info("Buscando manutenções entre {} e {}", startDate, endDate);
        List<VehicleMaintenance> maintenances = maintenanceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenções agendadas para hoje
    public List<VehicleMaintenanceDTO> getScheduledForToday() {
        log.info("Buscando manutenções agendadas para hoje");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findScheduledForToday(LocalDate.now());
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenções urgentes
    public List<VehicleMaintenanceDTO> getUrgentMaintenances() {
        log.info("Buscando manutenções urgentes");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findUrgentMaintenances();
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Buscar manutenções vencidas
    public List<VehicleMaintenanceDTO> getOverdueMaintenances() {
        log.info("Buscando manutenções vencidas");
        List<VehicleMaintenance> maintenances = maintenanceRepository.findOverdueMaintenances(LocalDate.now());
        return maintenances.stream()
                .map(VehicleMaintenanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Estatísticas de manutenção
    public MaintenanceStats getMaintenanceStats() {
        log.info("Gerando estatísticas de manutenção");
        
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

    // DTO para estatísticas
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

    // Buscar todas as manutenções (versão temporária sem photos/documents)
    public List<VehicleMaintenanceDTO> getAllMaintenancesTemporary() {
        log.info("Buscando todas as manutenções (versão temporária)");
        try {
            List<VehicleMaintenance> maintenances = maintenanceRepository.findAll();
            log.info("Total de manutenções encontradas: {}", maintenances.size());
            
            return maintenances.stream()
                    .map(maintenance -> {
                        try {
                            log.debug("Convertendo manutenção para DTO. ID: {}", maintenance.getId());
                            
                            // Criar DTO sem as colunas problemáticas
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
                            
                            // Definir valores padrão para campos que dependem do relacionamento
                            dto.setVehicleId(null);
                            dto.setVehiclePlate("N/A");
                            
                            // Definir listas vazias para photos e documents
                            dto.setPhotos(new ArrayList<>());
                            dto.setDocuments(new ArrayList<>());
                            
                            return dto;
                        } catch (Exception e) {
                            log.error("Erro ao converter manutenção {} para DTO: {}", maintenance.getId(), e.getMessage());
                            throw e;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar manutenções: {}", e.getMessage(), e);
            throw e;
        }
    }
}
