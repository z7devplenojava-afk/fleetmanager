package br.com.fleetmanager.service;

import br.com.fleetmanager.model.AccidentRecord;
import br.com.fleetmanager.model.NearMissRecord;
import br.com.fleetmanager.repository.AccidentRecordRepository;
import br.com.fleetmanager.repository.NearMissRecordRepository;
import br.com.fleetmanager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de acidentes e quase-acidentes
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SSTAccidentService {

    private final AccidentRecordRepository accidentRepository;
    private final NearMissRecordRepository nearMissRepository;
    private final SSTAlertService alertService;

    // ========== ACIDENTES ==========

    /**
     * Cria um novo registro de acidente
     */
    public AccidentRecord createAccident(AccidentRecord accident) {
        log.info("Registrando acidente para funcionário: {}", accident.getEmployee().getId());
        
        AccidentRecord saved = accidentRepository.save(accident);
        
        // Cria alerta de acidente
        alertService.createAccidentAlert(accident.getEmployee().getId(), accident.getDescription());
        
        return saved;
    }

    /**
     * Busca todos os acidentes
     */
    @Transactional(readOnly = true)
    public List<AccidentRecord> getAllAccidents() {
        return accidentRepository.findAll();
    }

    /**
     * Busca acidente por ID
     */
    @Transactional(readOnly = true)
    public AccidentRecord getAccidentById(UUID id) {
        return accidentRepository.findById(id).orElse(null);
    }

    /**
     * Busca acidentes por funcionário
     */
    @Transactional(readOnly = true)
    public List<AccidentRecord> getAccidentsByEmployee(UUID employeeId) {
        return accidentRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca acidentes por período
     */
    @Transactional(readOnly = true)
    public List<AccidentRecord> getAccidentsByPeriod(LocalDate startDate, LocalDate endDate) {
        return accidentRepository.findByAccidentDateBetween(startDate, endDate);
    }

    /**
     * Atualiza acidente
     */
    public AccidentRecord updateAccident(UUID id, AccidentRecord accident) {
        log.info("Atualizando acidente: {}", id);
        return accidentRepository.findById(id)
                .map(existing -> {
                    existing.setAccidentType(accident.getAccidentType());
                    existing.setAccidentDate(accident.getAccidentDate());
                    existing.setDescription(accident.getDescription());
                    existing.setLocation(accident.getLocation());
                    existing.setInjuryDescription(accident.getInjuryDescription());
                    existing.setCatNumber(accident.getCatNumber());
                    existing.setStatus(accident.getStatus());
                    existing.setRootCauses(accident.getRootCauses());
                    existing.setCorrectiveActions(accident.getCorrectiveActions());
                    existing.setPreventiveActions(accident.getPreventiveActions());
                    existing.setPhotosUrls(accident.getPhotosUrls());
                    existing.setWitnessNames(accident.getWitnessNames());
                    return accidentRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui acidente
     */
    public void deleteAccident(UUID id) {
        log.info("Excluindo acidente: {}", id);
        accidentRepository.deleteById(id);
    }

    // ========== QUASE-ACIDENTES ==========

    /**
     * Cria um novo registro de quase-acidente
     */
    public NearMissRecord createNearMiss(NearMissRecord nearMiss) {
        log.info("Registrando quase-acidente para funcionário: {}", nearMiss.getEmployee().getId());
        
        NearMissRecord saved = nearMissRepository.save(nearMiss);
        
        // Cria alerta de quase-acidente
        alertService.createNearMissAlert(nearMiss.getEmployee().getId(), nearMiss.getDescription());
        
        return saved;
    }

    /**
     * Busca todos os quase-acidentes
     */
    @Transactional(readOnly = true)
    public List<NearMissRecord> getAllNearMisses() {
        return nearMissRepository.findAll();
    }

    /**
     * Busca quase-acidente por ID
     */
    @Transactional(readOnly = true)
    public NearMissRecord getNearMissById(UUID id) {
        return nearMissRepository.findById(id).orElse(null);
    }

    /**
     * Busca quase-acidentes por funcionário
     */
    @Transactional(readOnly = true)
    public List<NearMissRecord> getNearMissesByEmployee(UUID employeeId) {
        return nearMissRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca quase-acidentes por período
     */
    @Transactional(readOnly = true)
    public List<NearMissRecord> getNearMissesByPeriod(LocalDate startDate, LocalDate endDate) {
        return nearMissRepository.findByIncidentDateBetween(startDate, endDate);
    }

    /**
     * Atualiza quase-acidente
     */
    public NearMissRecord updateNearMiss(UUID id, NearMissRecord nearMiss) {
        log.info("Atualizando quase-acidente: {}", id);
        return nearMissRepository.findById(id)
                .map(existing -> {
                    existing.setIncidentDate(nearMiss.getIncidentDate());
                    existing.setDescription(nearMiss.getDescription());
                    existing.setLocation(nearMiss.getLocation());
                    existing.setPotentialConsequences(nearMiss.getPotentialConsequences());
                    existing.setRootCauses(nearMiss.getRootCauses());
                    existing.setCorrectiveActions(nearMiss.getCorrectiveActions());
                    existing.setPreventiveActions(nearMiss.getPreventiveActions());
                    existing.setPhotosUrls(nearMiss.getPhotosUrls());
                    return nearMissRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui quase-acidente
     */
    public void deleteNearMiss(UUID id) {
        log.info("Excluindo quase-acidente: {}", id);
        nearMissRepository.deleteById(id);
    }

    // ========== RELATÓRIOS E ESTATÍSTICAS ==========

    /**
     * Gera estatísticas mensais de acidentes
     */
    @Transactional(readOnly = true)
    public AccidentStatistics getMonthlyStatistics(int year) {
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        
        List<AccidentRecord> accidents = getAccidentsByPeriod(startDate, endDate);
        List<NearMissRecord> nearMisses = getNearMissesByPeriod(startDate, endDate);
        
        AccidentStatistics statistics = new AccidentStatistics();
        statistics.setTotalAccidents(accidents.size());
        statistics.setTotalNearMisses(nearMisses.size());
        statistics.setAccidentsWithInjury((int) accidents.stream().filter(a -> a.getInjuryDescription() != null && !a.getInjuryDescription().isEmpty()).count());
        statistics.setAccidentsWithoutInjury((int) accidents.stream().filter(a -> a.getInjuryDescription() == null || a.getInjuryDescription().isEmpty()).count());
        
        // TODO: Calcular taxas baseadas no número de funcionários
        statistics.setAccidentRate(0.0);
        statistics.setNearMissRate(0.0);
        
        return statistics;
    }

    /**
     * Gera estatísticas de acidentes por funcionário
     */
    @Transactional(readOnly = true)
    public EmployeeAccidentStatistics getEmployeeStatistics(UUID employeeId) {
        List<AccidentRecord> accidents = getAccidentsByEmployee(employeeId);
        List<NearMissRecord> nearMisses = getNearMissesByEmployee(employeeId);
        
        EmployeeAccidentStatistics statistics = new EmployeeAccidentStatistics();
        statistics.setEmployeeId(employeeId);
        // TODO: Buscar nome do funcionário
        statistics.setEmployeeName("Funcionário " + employeeId);
        statistics.setTotalAccidents(accidents.size());
        statistics.setTotalNearMisses(nearMisses.size());
        
        if (!accidents.isEmpty()) {
            statistics.setLastAccidentDate(accidents.stream()
                    .map(AccidentRecord::getAccidentDate)
                    .max(LocalDate::compareTo)
                    .orElse(null));
        }
        
        if (!nearMisses.isEmpty()) {
            statistics.setLastNearMissDate(nearMisses.stream()
                    .map(NearMissRecord::getIncidentDate)
                    .max(LocalDate::compareTo)
                    .orElse(null));
        }
        
        return statistics;
    }

    // ========== CLASSES AUXILIARES ==========

    public static class AccidentStatistics {
        private int totalAccidents;
        private int totalNearMisses;
        private int accidentsWithInjury;
        private int accidentsWithoutInjury;
        private double accidentRate;
        private double nearMissRate;

        // Getters e Setters
        public int getTotalAccidents() { return totalAccidents; }
        public void setTotalAccidents(int totalAccidents) { this.totalAccidents = totalAccidents; }
        
        public int getTotalNearMisses() { return totalNearMisses; }
        public void setTotalNearMisses(int totalNearMisses) { this.totalNearMisses = totalNearMisses; }
        
        public int getAccidentsWithInjury() { return accidentsWithInjury; }
        public void setAccidentsWithInjury(int accidentsWithInjury) { this.accidentsWithInjury = accidentsWithInjury; }
        
        public int getAccidentsWithoutInjury() { return accidentsWithoutInjury; }
        public void setAccidentsWithoutInjury(int accidentsWithoutInjury) { this.accidentsWithoutInjury = accidentsWithoutInjury; }
        
        public double getAccidentRate() { return accidentRate; }
        public void setAccidentRate(double accidentRate) { this.accidentRate = accidentRate; }
        
        public double getNearMissRate() { return nearMissRate; }
        public void setNearMissRate(double nearMissRate) { this.nearMissRate = nearMissRate; }
    }

    public static class EmployeeAccidentStatistics {
        private UUID employeeId;
        private String employeeName;
        private int totalAccidents;
        private int totalNearMisses;
        private LocalDate lastAccidentDate;
        private LocalDate lastNearMissDate;

        // Getters e Setters
        public UUID getEmployeeId() { return employeeId; }
        public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
        
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        
        public int getTotalAccidents() { return totalAccidents; }
        public void setTotalAccidents(int totalAccidents) { this.totalAccidents = totalAccidents; }
        
        public int getTotalNearMisses() { return totalNearMisses; }
        public void setTotalNearMisses(int totalNearMisses) { this.totalNearMisses = totalNearMisses; }
        
        public LocalDate getLastAccidentDate() { return lastAccidentDate; }
        public void setLastAccidentDate(LocalDate lastAccidentDate) { this.lastAccidentDate = lastAccidentDate; }
        
        public LocalDate getLastNearMissDate() { return lastNearMissDate; }
        public void setLastNearMissDate(LocalDate lastNearMissDate) { this.lastNearMissDate = lastNearMissDate; }
    }
}
