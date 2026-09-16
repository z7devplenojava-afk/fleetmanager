package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.DailyLogBook;
import com.z7design.fleet_manager.model.DailyLogBookEntry;
import com.z7design.fleet_manager.model.enums.DailyLogBookStatus;
import com.z7design.fleet_manager.repository.DailyLogBookEntryRepository;
import com.z7design.fleet_manager.repository.DailyLogBookRepository;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PRD 1.0 - Módulo 3 (RF-03.5): emissão e controle de talões de Parte Diária.
 */
@ExtendWith(MockitoExtension.class)
class DailyLogBookServiceTest {

    @Mock
    private DailyLogBookRepository bookRepository;

    @Mock
    private DailyLogBookEntryRepository entryRepository;

    @Mock
    private DailyLogRepository dailyLogRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private DailyLogBookService service;

    private DailyLogBook request;

    @BeforeEach
    void setUp() {
        request = new DailyLogBook();
        request.setIssuedBy("Tráfego");
    }

    @Test
    @DisplayName("Emite talão com faixa sequencial exclusiva e contínua")
    void testIssueBookSequentialRange() {
        DailyLogBook previous = new DailyLogBook();
        previous.setLastNumber(100);

        when(bookRepository.findAll()).thenReturn(List.of(previous));
        when(bookRepository.save(any(DailyLogBook.class))).thenAnswer(inv -> inv.getArgument(0));

        DailyLogBook saved = service.issueBook(request, 50);

        assertEquals(101, saved.getFirstNumber());
        assertEquals(150, saved.getLastNumber());
        assertEquals(101, saved.getCurrentNumber());
        assertEquals(50, saved.getTotalSheets());
        assertEquals(DailyLogBookStatus.ACTIVE, saved.getStatus());
        assertNotNull(saved.getBookNumber());
        assertTrue(saved.getBookNumber().startsWith("TAL-"));
    }

    @Test
    @DisplayName("Primeiro talão do sistema começa na folha 1")
    void testFirstBookStartsAtOne() {
        when(bookRepository.findAll()).thenReturn(List.of());
        when(bookRepository.save(any(DailyLogBook.class))).thenAnswer(inv -> inv.getArgument(0));

        DailyLogBook saved = service.issueBook(request, 10);
        assertEquals(1, saved.getFirstNumber());
        assertEquals(10, saved.getLastNumber());
    }

    @Test
    @DisplayName("Rejeita quantidade de folhas inválida")
    void testInvalidSheetsQuantity() {
        assertThrows(IllegalArgumentException.class, () -> service.issueBook(request, 0));
        assertThrows(IllegalArgumentException.class, () -> service.issueBook(request, 201));
    }

    @Test
    @DisplayName("Consumo de folha avança cursor e vincula a Parte Diária")
    void testConsumeSheet() {
        DailyLogBook book = new DailyLogBook();
        book.setId(UUID.randomUUID());
        book.setBookNumber("TAL-2026-00001");
        book.setFirstNumber(1);
        book.setLastNumber(50);
        book.setCurrentNumber(1);
        book.setStatus(DailyLogBookStatus.ACTIVE);

        UUID dailyLogId = UUID.randomUUID();
        DailyLog dailyLog = new DailyLog();
        dailyLog.setId(dailyLogId);

        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));
        when(entryRepository.findByBookIdAndSequentialNumber(book.getId(), 1)).thenReturn(Optional.empty());
        when(dailyLogRepository.findById(dailyLogId)).thenReturn(Optional.of(dailyLog));
        when(entryRepository.save(any(DailyLogBookEntry.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookRepository.save(any(DailyLogBook.class))).thenAnswer(inv -> inv.getArgument(0));

        DailyLogBookEntry entry = service.consumeNextSheet(book.getId(), dailyLogId, "Motorista João");

        assertEquals(1, entry.getSequentialNumber());
        // Parte Diária vinculada à folha (rastreabilidade M3 ↔ M5)
        assertEquals(book, dailyLog.getBook());
        assertEquals(1, dailyLog.getBookSequentialNumber());
        // Cursor avançou
        assertEquals(2, book.getCurrentNumber());
        assertEquals(DailyLogBookStatus.ACTIVE, book.getStatus());
    }

    @Test
    @DisplayName("Última folha consumida marca o talão como esgotado")
    void testLastSheetExhaustsBook() {
        DailyLogBook book = new DailyLogBook();
        book.setId(UUID.randomUUID());
        book.setBookNumber("TAL-2026-00002");
        book.setFirstNumber(10);
        book.setLastNumber(11);
        book.setCurrentNumber(11);
        book.setStatus(DailyLogBookStatus.ACTIVE);

        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));
        when(entryRepository.findByBookIdAndSequentialNumber(book.getId(), 11)).thenReturn(Optional.empty());
        when(entryRepository.save(any(DailyLogBookEntry.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookRepository.save(any(DailyLogBook.class))).thenAnswer(inv -> inv.getArgument(0));

        service.consumeNextSheet(book.getId(), null, null);

        assertEquals(DailyLogBookStatus.EXHAUSTED, book.getStatus());
    }

    @Test
    @DisplayName("Folha já utilizada é rejeitada")
    void testSheetAlreadyUsed() {
        DailyLogBook book = new DailyLogBook();
        book.setId(UUID.randomUUID());
        book.setBookNumber("TAL-2026-00003");
        book.setFirstNumber(1);
        book.setLastNumber(50);
        book.setCurrentNumber(5);
        book.setStatus(DailyLogBookStatus.ACTIVE);

        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));
        when(entryRepository.findByBookIdAndSequentialNumber(book.getId(), 5))
                .thenReturn(Optional.of(new DailyLogBookEntry()));

        assertThrows(IllegalArgumentException.class,
                () -> service.consumeNextSheet(book.getId(), null, null));
    }

    @Test
    @DisplayName("Talão esgotado não aceita consumo")
    void testExhaustedBookRejected() {
        DailyLogBook book = new DailyLogBook();
        book.setId(UUID.randomUUID());
        book.setBookNumber("TAL-2026-00004");
        book.setFirstNumber(1);
        book.setLastNumber(10);
        book.setCurrentNumber(11);
        book.setStatus(DailyLogBookStatus.EXHAUSTED);

        when(bookRepository.findById(book.getId())).thenReturn(Optional.of(book));

        assertThrows(IllegalArgumentException.class,
                () -> service.consumeNextSheet(book.getId(), null, null));
    }

    @Test
    @DisplayName("Talão inexistente gera ResourceNotFoundException")
    void testBookNotFound() {
        UUID id = UUID.randomUUID();
        when(bookRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.consumeNextSheet(id, null, null));
    }
}
