package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Holiday;
import com.z7design.fleet_manager.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HolidayService {

    private final HolidayRepository holidayRepository;

    @Transactional
    public Holiday create(Holiday holiday) {
        log.info("ðŸ“… Criando feriado: {} - {}", holiday.getDate(), holiday.getName());
        
        // Verificar se jÃ¡ existe
        if (holidayRepository.existsByDateAndName(holiday.getDate(), holiday.getName())) {
            throw new RuntimeException("JÃ¡ existe um feriado com a mesma data e nome");
        }
        
        Holiday saved = holidayRepository.save(holiday);
        log.info("âœ… Feriado criado com sucesso - ID: {}", saved.getId());
        return saved;
    }

    @Transactional
    public Holiday update(UUID id, Holiday holiday) {
        log.info("ðŸ“… Atualizando feriado: {}", id);
        
        Holiday existing = findById(id);
        holiday.setId(id);
        holiday.setCreatedAt(existing.getCreatedAt()); // Preservar data de criaÃ§Ã£o
        
        Holiday updated = holidayRepository.save(holiday);
        log.info("âœ… Feriado atualizado com sucesso - ID: {}", updated.getId());
        return updated;
    }

    @Transactional
    public void delete(UUID id) {
        log.info("ðŸ“… Deletando feriado: {}", id);
        Holiday holiday = findById(id);
        holidayRepository.delete(holiday);
        log.info("âœ… Feriado deletado com sucesso - ID: {}", id);
    }

    public Holiday findById(UUID id) {
        return holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feriado nÃ£o encontrado com id: " + id));
    }

    public List<Holiday> findAll() {
        return holidayRepository.findAll();
    }

    public List<Holiday> findByDate(LocalDate date) {
        return holidayRepository.findByDate(date);
    }

    public List<Holiday> findByDateBetween(LocalDate startDate, LocalDate endDate) {
        return holidayRepository.findByDateBetween(startDate, endDate);
    }

    public List<Holiday> findByType(Holiday.HolidayType type) {
        return holidayRepository.findByType(type);
    }

    public List<Holiday> findByYear(int year) {
        return holidayRepository.findByYear(year);
    }

    /**
     * Verifica se uma data Ã© feriado nacional ou obrigatÃ³rio
     */
    public boolean isHoliday(LocalDate date) {
        List<Holiday> holidays = holidayRepository.findNationalAndMandatoryByDate(date);
        return !holidays.isEmpty();
    }

    /**
     * Retorna feriados aplicÃ¡veis para uma data, considerando estado e cidade
     */
    public List<Holiday> getApplicableHolidays(LocalDate date, String stateCode, String cityName) {
        return holidayRepository.findApplicableHolidays(date, stateCode, cityName);
    }

    /**
     * Verifica se uma data Ã© feriado (considerando estado e cidade)
     */
    public boolean isHoliday(LocalDate date, String stateCode, String cityName) {
        List<Holiday> holidays = getApplicableHolidays(date, stateCode, cityName);
        return !holidays.isEmpty();
    }
}






