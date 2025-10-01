package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.VehicleReportDTO;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.model.Vehicle.VehicleStatus;
import br.com.fleetmanager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleReportService {
    
    private final VehicleRepository vehicleRepository;
    private final JasperReportService jasperReportService;
    
    public byte[] generateVehicleReportPDF(String statusFilter) throws IOException {
        log.info("Gerando relatório PDF de veículos - Filtro: {}", statusFilter);
        
        try {
            // Buscar veículos com filtro de status
            List<Vehicle> vehicles = getVehiclesFiltered(statusFilter);
            log.info("Dados obtidos: {} veículos", vehicles.size());
            
            // Converter para DTOs
            List<VehicleReportDTO> reportDTOs = vehicles.stream()
                    .map(VehicleReportDTO::fromEntity)
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} veículos", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateVehicleReportPDF(reportDTOs, statusFilter);
            
            log.info("Relatório PDF de veículos gerado com sucesso. {} veículos processados, {} bytes gerados", 
                    vehicles.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF de veículos", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatório PDF de veículos: " + e.getMessage(), e);
        }
    }
    
    private List<Vehicle> getVehiclesFiltered(String statusFilter) {
        log.debug("Aplicando filtro de status: {}", statusFilter);
        
        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                VehicleStatus status = VehicleStatus.valueOf(statusFilter.toUpperCase());
                return vehicleRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Status inválido fornecido: {}. Retornando todos os veículos.", statusFilter);
                return vehicleRepository.findAll();
            }
        } else {
            return vehicleRepository.findAll();
        }
    }
}
