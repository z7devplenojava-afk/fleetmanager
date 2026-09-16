package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.ContractRetentionRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinancialClosingServiceTest {

    @Mock
    private MeasurementBulletinRepository bulletinRepository;
    @Mock
    private ContractRetentionRepository retentionRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private AccountsReceivableRepository accountsReceivableRepository;

    private FinancialClosingService service;

    @BeforeEach
    void setUp() {
        service = new FinancialClosingService(bulletinRepository, retentionRepository,
                contractRepository, accountsReceivableRepository);
        lenient().when(retentionRepository.save(any(ContractRetention.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(accountsReceivableRepository.save(any(AccountsReceivable.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ══════════════════ Caução (RF-07.4) ══════════════════

    @Test
    void caucuaTresPorCentoNaValidacaoDoBM() {
        MeasurementBulletin bulletin = bulletin(new BigDecimal("100000.00"));

        ContractRetention retention = service.registerRetentionOnValidation(bulletin);

        assertNotNull(retention);
        assertEquals(0, new BigDecimal("3000.00").compareTo(retention.getRetentionValue()));
        assertEquals(0, new BigDecimal("97000.00").compareTo(retention.getNetInvoicedValue()));
        assertEquals(RetentionStatus.RETIDO, retention.getStatus());
        assertNotNull(retention.getExpectedReleaseDate());
    }

    @Test
    void caucuaIdempotentePorMedicao() {
        MeasurementBulletin bulletin = bulletin(new BigDecimal("50000.00"));
        ContractRetention existing = new ContractRetention();
        existing.setMeasurement(bulletin);
        existing.setRetentionRate(new BigDecimal("3.00"));
        existing.setRetentionValue(new BigDecimal("1500.00"));
        existing.setStatus(RetentionStatus.RETIDO);
        when(retentionRepository.findByMeasurementId(bulletin.getId()))
                .thenReturn(List.of(existing));

        ContractRetention retention = service.registerRetentionOnValidation(bulletin);

        // Reaproveita a retenção existente em vez de criar nova
        assertEquals(existing, retention);
        assertEquals(0, new BigDecimal("1500.00").compareTo(retention.getRetentionValue()));
    }

    @Test
    void bmSemSubtotalNaoGeraCaucao() {
        MeasurementBulletin bulletin = bulletin(BigDecimal.ZERO);
        assertNullValue(service.registerRetentionOnValidation(bulletin));
    }

    @Test
    void liberacaoDeCaucaoAtualizaStatusEData() {
        ContractRetention retention = new ContractRetention();
        retention.setId(UUID.randomUUID());
        retention.setStatus(RetentionStatus.RETIDO);
        when(retentionRepository.findById(retention.getId())).thenReturn(Optional.of(retention));

        ContractRetention released = service.releaseRetention(retention.getId(), LocalDate.of(2026, 11, 1));

        assertEquals(RetentionStatus.LIBERADO, released.getStatus());
        assertEquals(LocalDate.of(2026, 11, 1), released.getActualReleaseDate());
    }

    @Test
    void contaGraficaAcumulaRetidoELiberado() {
        ContractRetention retido = retention(RetentionStatus.RETIDO, "3000.00");
        ContractRetention liberado = retention(RetentionStatus.LIBERADO, "1000.00");
        when(retentionRepository.findByContractId(contractId)).thenReturn(List.of(retido, liberado));

        var ledger = service.getRetentionLedger(contractId);

        assertEquals(0, new BigDecimal("3000.00").compareTo((BigDecimal) ledger.get("retainedValue")));
        assertEquals(0, new BigDecimal("1000.00").compareTo((BigDecimal) ledger.get("releasedValue")));
        assertEquals(0, new BigDecimal("2000.00").compareTo((BigDecimal) ledger.get("ledgerBalance")));
    }

    // ══════════════════ Boleto (RF-07.4) ══════════════════

    @Test
    void boletoRegistradoComLinhaDigitavelEPrazoContratual() {
        AccountsReceivable receivable = new AccountsReceivable();
        receivable.setId(UUID.randomUUID());
        receivable.setAmount(new BigDecimal("97000.00"));
        receivable.setIssueDate(LocalDate.of(2026, 9, 21));
        receivable.setDueDate(LocalDate.of(2026, 9, 21).plusDays(30));
        when(accountsReceivableRepository.findById(receivable.getId()))
                .thenReturn(Optional.of(receivable));

        AccountsReceivable registered = service.registerBoleto(receivable.getId(), 30);

        assertNotNull(registered.getBoletoBarCode());
        assertNotNull(registered.getBoletoDigitableLine());
        assertTrue(registered.getBoletoDigitableLine().contains("."));
        assertNotNull(registered.getBoletoGenerationDate());
    }

    @Test
    void pdfDoBoletoEhGeradoValido() throws Exception {
        AccountsReceivable receivable = new AccountsReceivable();
        receivable.setId(UUID.randomUUID());
        receivable.setAmount(new BigDecimal("97000.00"));
        receivable.setIssueDate(LocalDate.of(2026, 9, 21));
        receivable.setDueDate(LocalDate.of(2026, 10, 21));
        receivable.setBoletoBarCode("03391970000097000000000000111222333444555666");
        receivable.setBoletoDigitableLine("03399.00001 11122.23333 44.55566 6 09700000970000");
        receivable.setBoletoGenerationDate(java.time.LocalDateTime.now());
        when(accountsReceivableRepository.findById(receivable.getId()))
                .thenReturn(Optional.of(receivable));

        byte[] pdf = service.generateBoletoPdf(receivable.getId());

        assertNotNull(pdf);
        assertTrue(pdf.length > 500);
        assertEquals(0x25, pdf[0] & 0xFF); // '%PDF'
        assertEquals(0x50, pdf[1] & 0xFF); // 'P'
    }

    // ══════════════════ Helpers ══════════════════

    private final UUID contractId = UUID.randomUUID();

    private MeasurementBulletin bulletin(BigDecimal subtotal) {
        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setId(UUID.randomUUID());
        bulletin.setSubtotal(subtotal);
        bulletin.setPeriodStart(LocalDate.of(2026, 8, 21));
        bulletin.setPeriodEnd(LocalDate.of(2026, 9, 20));
        return bulletin;
    }

    private ContractRetention retention(RetentionStatus status, String value) {
        ContractRetention r = new ContractRetention();
        r.setReferenceMonth("2026-09");
        r.setStatus(status);
        r.setRetentionValue(new BigDecimal(value));
        return r;
    }

    private void assertNullValue(Object actual) {
        org.junit.jupiter.api.Assertions.assertNull(actual);
    }
}
