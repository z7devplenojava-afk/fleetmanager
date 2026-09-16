package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO.MotoristaApuradoDTO;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.ParteDiaria;
import com.z7design.fleet_manager.repository.ParteDiariaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParteDiariaFineMatcherService {

    private final ParteDiariaRepository parteDiariaRepository;

    /**
     * Tenta identificar o motorista responsável pela autuação cruzando a placa do veículo
     * e a data/hora da infração com as Partes Diárias lançadas.
     */
    @Transactional(readOnly = true)
    public MotoristaApuradoDTO findMatchingDriver(String vehiclePlate, String dataHoraStr) {
        if (vehiclePlate == null || vehiclePlate.isBlank() || dataHoraStr == null || dataHoraStr.isBlank()) {
            return null;
        }

        String cleanPlate = vehiclePlate.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        LocalDate infractionDate = extractDate(dataHoraStr);
        LocalTime infractionTime = extractTime(dataHoraStr);

        if (infractionDate == null) {
            log.debug("Não foi possível extrair data válida de {}", dataHoraStr);
            return null;
        }

        log.debug("Buscando Parte Diária para placa {} na data {}", cleanPlate, infractionDate);
        
        // Busca partes diárias no dia da infração
        List<ParteDiaria> partes = parteDiariaRepository.findByVehiclePlateAndDateBetween(
                cleanPlate, infractionDate, infractionDate
        );

        // Se não encontrou pela placa higienizada, tenta com hífen se for formato tradicional
        if (partes.isEmpty() && cleanPlate.length() == 7) {
            String formattedPlate = cleanPlate.substring(0, 3) + "-" + cleanPlate.substring(3);
            partes = parteDiariaRepository.findByVehiclePlateAndDateBetween(
                    formattedPlate, infractionDate, infractionDate
            );
        }

        if (partes.isEmpty()) {
            log.debug("Nenhuma Parte Diária encontrada para placa {} em {}", cleanPlate, infractionDate);
            return null;
        }

        // Se houver mais de uma diária no dia, prioriza a que cobre o horário da infração
        ParteDiaria bestMatch = null;
        String confidence = "MEDIA";

        for (ParteDiaria pd : partes) {
            if (infractionTime != null && pd.getStartTime() != null && pd.getEndTime() != null) {
                try {
                    LocalTime start = LocalTime.parse(pd.getStartTime().substring(0, 5));
                    LocalTime end = LocalTime.parse(pd.getEndTime().substring(0, 5));
                    
                    if ((infractionTime.equals(start) || infractionTime.isAfter(start)) &&
                        (infractionTime.equals(end) || infractionTime.isBefore(end))) {
                        bestMatch = pd;
                        confidence = "ALTA";
                        break;
                    }
                } catch (Exception e) {
                    log.debug("Erro ao comparar horários da diária {}: {}", pd.getNumber(), e.getMessage());
                }
            }
        }

        if (bestMatch == null) {
            bestMatch = partes.get(0);
        }

        Driver driver = bestMatch.getDriver();
        String driverName = driver != null ? driver.getName() : bestMatch.getDriverName();
        String driverCnh = driver != null ? driver.getLicenseNumber() : null;
        String driverPhone = driver != null ? driver.getPhone() : null;

        return MotoristaApuradoDTO.builder()
                .driverId(driver != null ? driver.getId() : null)
                .driverName(driverName != null ? driverName : "Motorista não identificado")
                .driverCnh(driverCnh)
                .driverPhone(driverPhone)
                .parteDiariaId(bestMatch.getId())
                .parteDiariaNumber(bestMatch.getNumber())
                .obraNome(bestMatch.getObraName())
                .rotaNome(bestMatch.getRouteName())
                .horarioInicio(bestMatch.getStartTime())
                .horarioFim(bestMatch.getEndTime())
                .confiancaCruzamento(confidence)
                .build();
    }

    private LocalDate extractDate(String dateTimeStr) {
        try {
            if (dateTimeStr.contains("T")) {
                return LocalDate.parse(dateTimeStr.substring(0, 10));
            } else if (dateTimeStr.length() >= 10) {
                return LocalDate.parse(dateTimeStr.substring(0, 10));
            }
        } catch (DateTimeParseException e) {
            log.debug("Falha no parse da data: {}", dateTimeStr);
        }
        return null;
    }

    private LocalTime extractTime(String dateTimeStr) {
        try {
            if (dateTimeStr.contains("T") && dateTimeStr.length() >= 16) {
                return LocalTime.parse(dateTimeStr.substring(11, 16));
            } else if (dateTimeStr.contains(" ") && dateTimeStr.length() >= 16) {
                return LocalTime.parse(dateTimeStr.substring(11, 16));
            }
        } catch (Exception e) {
            log.debug("Falha no parse da hora: {}", dateTimeStr);
        }
        return null;
    }
}
