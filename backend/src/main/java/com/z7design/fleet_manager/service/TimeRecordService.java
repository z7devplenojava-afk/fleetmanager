package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.dto.WorkedHoursReportDTO;
import com.z7design.fleet_manager.dto.DailyWorkedHoursDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeRecordService {

    private final TimeRecordRepository timeRecordRepository;
    private final QRCodeWorkPostRepository qrCodeWorkPostRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;

    @Transactional
    public TimeRecord registerTimeRecord(UUID employeeId, TimeRecord.RecordType recordType,
            String qrCode, String location, Double latitude,
            Double longitude, String ipAddress, String userAgent) {

        log.info("ðŸ“ Registrando ponto - Employee: {}, Tipo: {}, QRCode: {}",
                employeeId, recordType, qrCode);

        // Buscar funcionÃ¡rio
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Validar QR Code se fornecido
        WorkPost workPost = null;
        if (qrCode != null && !qrCode.isEmpty()) {
            QRCodeWorkPost qrCodeWorkPost = qrCodeWorkPostRepository
                    .findValidQRCode(qrCode, LocalDateTime.now())
                    .orElseThrow(() -> new RuntimeException("QR Code invÃ¡lido ou expirado"));

            workPost = qrCodeWorkPost.getWorkPost();
            log.info("âœ… QR Code vÃ¡lido para posto: {}", workPost.getName());

            // Validar geolocalizaÃ§Ã£o se configurado
            if (qrCodeWorkPost.getLatitude() != null && qrCodeWorkPost.getLongitude() != null) {
                if (latitude == null || longitude == null) {
                    throw new RuntimeException("GeolocalizaÃ§Ã£o obrigatÃ³ria para este posto");
                }

                double distance = calculateDistance(
                        qrCodeWorkPost.getLatitude(), qrCodeWorkPost.getLongitude(),
                        latitude, longitude);

                if (distance > qrCodeWorkPost.getRadiusMeters()) {
                    log.warn("âš ï¸ DistÃ¢ncia excedida: {} metros (limite: {})",
                            distance, qrCodeWorkPost.getRadiusMeters());
                    throw new RuntimeException("VocÃª estÃ¡ fora da Ã¡rea permitida para registro");
                }
            }
        }

        // Validar sequÃªncia de registros
        validateRecordSequence(employeeId, recordType);

        // Criar registro
        TimeRecord record = new TimeRecord();
        record.setEmployee(employee);
        record.setWorkPost(workPost);
        record.setRecordType(recordType);
        record.setRecordedAt(LocalDateTime.now());
        record.setLocation(location);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setIpAddress(ipAddress);
        record.setUserAgent(userAgent);
        record.setQrCodeUsed(qrCode);
        record.setIsManual(false);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);

        TimeRecord saved = timeRecordRepository.save(record);
        log.info("âœ… Ponto registrado com sucesso - ID: {}", saved.getId());

        return saved;
    }

    private void validateRecordSequence(UUID employeeId, TimeRecord.RecordType newRecordType) {
        List<TimeRecord> todayRecords = timeRecordRepository.findTodayRecordsByEmployeeId(employeeId);

        if (todayRecords.isEmpty() && newRecordType != TimeRecord.RecordType.ENTRADA) {
            throw new RuntimeException("Primeiro registro do dia deve ser ENTRADA");
        }

        if (!todayRecords.isEmpty()) {
            TimeRecord lastRecord = todayRecords.get(0);

            // Validar sequÃªncia lÃ³gica
            switch (lastRecord.getRecordType()) {
                case ENTRADA:
                    if (newRecordType == TimeRecord.RecordType.ENTRADA) {
                        throw new RuntimeException("JÃ¡ existe uma entrada registrada");
                    }
                    break;
                case SAIDA_ALMOCO:
                    if (newRecordType != TimeRecord.RecordType.RETORNO_ALMOCO) {
                        throw new RuntimeException("ApÃ³s saÃ­da para almoÃ§o, deve registrar retorno");
                    }
                    break;
                case RETORNO_ALMOCO:
                    if (newRecordType == TimeRecord.RecordType.RETORNO_ALMOCO) {
                        throw new RuntimeException("Retorno do almoÃ§o jÃ¡ registrado");
                    }
                    break;
                case SAIDA:
                    throw new RuntimeException("Jornada jÃ¡ foi encerrada hoje");
            }
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Raio da Terra em metros
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<TimeRecord> getTodayRecords(UUID employeeId) {
        return timeRecordRepository.findTodayRecordsByEmployeeId(employeeId);
    }

    public List<TimeRecord> getRecordsByPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return timeRecordRepository.findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                employeeId, start, end);
    }

    public Page<TimeRecord> getRecordsByEmployee(UUID employeeId, Pageable pageable) {
        return timeRecordRepository.findByEmployeeIdOrderByRecordedAtDesc(employeeId, pageable);
    }

    public Page<TimeRecord> getPendingRecords(Pageable pageable) {
        return timeRecordRepository.findByStatusOrderByRecordedAtDesc(
                TimeRecord.RecordStatus.PENDING, pageable);
    }

    @Transactional
    public TimeRecord approveRecord(UUID recordId, UUID approverId) {
        TimeRecord record = timeRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Registro nÃ£o encontrado"));

        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setApprovedById(approverId);
        record.setApprovedAt(LocalDateTime.now());

        return timeRecordRepository.save(record);
    }

    @Transactional
    public TimeRecord rejectRecord(UUID recordId, UUID approverId, String reason) {
        TimeRecord record = timeRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Registro nÃ£o encontrado"));

        record.setStatus(TimeRecord.RecordStatus.REJECTED);
        record.setApprovedById(approverId);
        record.setApprovedAt(LocalDateTime.now());
        record.setJustification(reason);

        return timeRecordRepository.save(record);
    }

    public WorkedHoursReportDTO getWorkedHoursReport(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        List<TimeRecord> records = getRecordsByPeriod(employeeId, startDate, endDate);

        java.util.Map<LocalDate, DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder> dailyMap = new java.util.HashMap<>();

        // Fill dates
        startDate.datesUntil(endDate.plusDays(1)).forEach(date -> {
            dailyMap.put(date, DailyWorkedHoursDTO.builder().date(date).status("ABSENCE"));
        });

        for (TimeRecord record : records) {
            LocalDate date = record.getRecordedAt().toLocalDate();
            DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder builder = dailyMap.get(date);
            if (builder == null)
                continue;

            String time = record.getRecordedAt().toLocalTime().toString();
            switch (record.getRecordType()) {
                case ENTRADA -> builder.entry(time).status("NORMAL");
                case SAIDA_ALMOCO -> builder.exitLunch(time);
                case RETORNO_ALMOCO -> builder.returnLunch(time);
                case SAIDA -> builder.exit(time);
            }
        }

        List<DailyWorkedHoursDTO> dailyList = dailyMap.values().stream()
                .map(DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder::build)
                .sorted(java.util.Comparator.comparing(DailyWorkedHoursDTO::getDate))
                .toList();

        return WorkedHoursReportDTO.builder()
                .employeeName(employee.getName())
                .period(startDate + " a " + endDate)
                .days(dailyList)
                .totalHours("Calculado no frontend") // Simplification for now
                .build();
    }

    public TimeRecord.RecordType getNextRecordType(UUID employeeId) {
        // Simple logic placeholder to fix the build
        return TimeRecord.RecordType.ENTRADA;
    }
}
