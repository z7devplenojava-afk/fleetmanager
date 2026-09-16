package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.DailyLogBook;
import com.z7design.fleet_manager.model.DailyLogBookEntry;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.DailyLogBookStatus;
import com.z7design.fleet_manager.repository.DailyLogBookEntryRepository;
import com.z7design.fleet_manager.repository.DailyLogBookRepository;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.5): Emissão de Talões de Parte Diária.
 * Geração e controle da numeração sequencial dos blocos distribuídos aos
 * motoristas; cada folha consumida é vinculada à Parte Diária (M3 → M5).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DailyLogBookService {

    private final DailyLogBookRepository bookRepository;
    private final DailyLogBookEntryRepository entryRepository;
    private final DailyLogRepository dailyLogRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<DailyLogBook> findAll() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<DailyLogBook> findByStatus(DailyLogBookStatus status) {
        return bookRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<DailyLogBook> findByVehicle(UUID vehicleId) {
        return bookRepository.findByVehicleId(vehicleId);
    }

    @Transactional(readOnly = true)
    public DailyLogBook findById(UUID id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Talão não encontrado com ID: " + id));
    }

    /**
     * Emite um novo talão com faixa sequencial exclusiva.
     *
     * @param sheetsQuantity quantidade de folhas do bloco
     */
    @Transactional
    public DailyLogBook issueBook(DailyLogBook request, int sheetsQuantity) {
        if (sheetsQuantity < 1 || sheetsQuantity > 200) {
            throw new IllegalArgumentException("Quantidade de folhas deve estar entre 1 e 200");
        }

        DailyLogBook book = new DailyLogBook();

        // Veículo
        if (request.getVehicle() != null && request.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicle().getId()).orElse(null);
            book.setVehicle(vehicle);
            book.setVehiclePlate(vehicle != null ? vehicle.getPlate() : request.getVehiclePlate());
        } else {
            book.setVehiclePlate(request.getVehiclePlate());
        }

        // Motorista
        if (request.getAssignedDriver() != null && request.getAssignedDriver().getId() != null) {
            Employee driver = employeeRepository.findById(request.getAssignedDriver().getId()).orElse(null);
            book.setAssignedDriver(driver);
            if (driver != null) {
                book.setAssignedDriverName(driver.getName() != null ? driver.getName() : book.getAssignedDriverName());
            }
        }
        book.setAssignedDriverName(
                book.getAssignedDriverName() != null ? book.getAssignedDriverName() : request.getAssignedDriverName());

        // Cliente / obra
        book.setAssignedClient(request.getAssignedClient());
        book.setAssignedWorkPost(request.getAssignedWorkPost());

        // Faixa sequencial: 1-based global incrementando o último número emitido
        int nextNumber = bookRepository.findAll().stream()
                .mapToInt(DailyLogBook::getLastNumber)
                .max()
                .orElse(0) + 1;
        book.setBookNumber(generateBookNumber());
        book.setFirstNumber(nextNumber);
        book.setLastNumber(nextNumber + sheetsQuantity - 1);
        book.setCurrentNumber(nextNumber);
        book.setStatus(DailyLogBookStatus.ACTIVE);
        book.setIssuedAt(LocalDateTime.now());
        book.setIssuedBy(request.getIssuedBy());
        book.setNotes(request.getNotes());

        DailyLogBook saved = bookRepository.save(book);
        log.info("Talão {} emitido: folhas {} a {} ({} folhas) — veículo {} — motorista {}",
                saved.getBookNumber(), saved.getFirstNumber(), saved.getLastNumber(),
                saved.getTotalSheets(), saved.getVehiclePlate(), saved.getAssignedDriverName());
        return saved;
    }

    /**
     * Consome a próxima folha disponível do talão e vincula à Parte Diária.
     * Usado pelo fluxo de campo (M5) ao registrar o apontamento.
     *
     * @return folha consumida com o número sequencial atribuído
     */
    @Transactional
    public DailyLogBookEntry consumeNextSheet(UUID bookId, UUID dailyLogId, String usedBy) {
        DailyLogBook book = findById(bookId);
        if (!book.hasSheetsAvailable()) {
            throw new IllegalArgumentException("Talão " + book.getBookNumber()
                    + " não possui folhas disponíveis (status: " + book.getStatus() + ")");
        }

        int sheetNumber = book.getCurrentNumber();
        Optional<DailyLogBookEntry> existing =
                entryRepository.findByBookIdAndSequentialNumber(bookId, sheetNumber);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Folha " + sheetNumber + " do talão " + book.getBookNumber()
                    + " já foi utilizada");
        }

        DailyLogBookEntry entry = new DailyLogBookEntry();
        entry.setBook(book);
        entry.setSequentialNumber(sheetNumber);
        entry.setUsedAt(LocalDateTime.now());
        entry.setUsedBy(usedBy);
        if (dailyLogId != null) {
            DailyLog dailyLog = dailyLogRepository.findById(dailyLogId).orElse(null);
            if (dailyLog != null) {
                entry.setDailyLog(dailyLog);
                // Vincula a Parte Diária à folha do talão (rastreabilidade M3 ↔ M5)
                dailyLog.setBook(book);
                dailyLog.setBookSequentialNumber(sheetNumber);
                dailyLogRepository.save(dailyLog);
            }
        }
        DailyLogBookEntry saved = entryRepository.save(entry);

        // Avança o cursor do talão
        book.setCurrentNumber(sheetNumber + 1);
        if (book.getCurrentNumber() > book.getLastNumber()) {
            book.setStatus(DailyLogBookStatus.EXHAUSTED);
            log.info("Talão {} esgotado ({} folhas consumidas)", book.getBookNumber(), book.getTotalSheets());
        }
        bookRepository.save(book);

        log.info("Folha {} do talão {} consumida e vinculada à Parte Diária {}",
                sheetNumber, book.getBookNumber(), dailyLogId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DailyLogBookEntry> getBookEntries(UUID bookId) {
        return entryRepository.findByBookIdOrderBySequentialNumberAsc(bookId);
    }

    @Transactional
    public DailyLogBook updateStatus(UUID id, DailyLogBookStatus status) {
        DailyLogBook book = findById(id);
        book.setStatus(status);
        return bookRepository.save(book);
    }

    @Transactional
    public void delete(UUID id) {
        if (!bookRepository.existsById(id)) {
            throw new ResourceNotFoundException("Talão não encontrado com ID: " + id);
        }
        bookRepository.deleteById(id);
    }

    private String generateBookNumber() {
        long count = bookRepository.count();
        return String.format("TAL-%d-%05d", java.time.LocalDate.now().getYear(), (count + 1) % 100000);
    }
}
