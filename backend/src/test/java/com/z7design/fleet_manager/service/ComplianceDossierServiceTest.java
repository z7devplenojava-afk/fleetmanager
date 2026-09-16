package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.ComplianceDossier;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ComplianceDossierRepository;
import com.z7design.fleet_manager.repository.OpacityTestRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * PRD 1.0 - Módulo 4 (RF-04.4): Dossiê Mensal de Conformidade 1-clique.
 */
@ExtendWith(MockitoExtension.class)
class ComplianceDossierServiceTest {

    @Mock
    private ComplianceDossierRepository dossierRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private OpacityTestRepository opacityTestRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    private ComplianceDossierService service;

    private ComplianceDossier dossier;
    private UUID clientId;

    @BeforeEach
    void setUp() {
        clientId = UUID.randomUUID();

        // Holder real com os mocks — evita cópias do Mockito com campos nulos
        ComplianceDossierService.OpacityTestRepositoryHolder holder =
                new ComplianceDossierService.OpacityTestRepositoryHolder(opacityTestRepository, vehicleRepository);
        service = new ComplianceDossierService(dossierRepository, clientRepository, holder);

        Client client = new Client();
        client.setId(clientId);
        client.setName("Vale S.A.");

        dossier = new ComplianceDossier();
        dossier.setId(UUID.randomUUID());
        dossier.setReferenceMonth("2026-08"); // folha do mês anterior ao BM de setembro
        dossier.setClient(client);

        lenient().when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
        lenient().when(dossierRepository.save(any(ComplianceDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        // Cobertura de fumaça preta pendente por padrão
        lenient().when(vehicleRepository.findAll()).thenReturn(List.of());
        lenient().when(opacityTestRepository.findByTestDateBetweenOrderByTestDateAsc(any(), any()))
                .thenReturn(List.of());
    }

    private void fillAllItems(ComplianceDossier d) {
        d.setPayrollSummaryOk(true);
        d.setPayrollDepositOk(true);
        d.setBenefitsProofOk(true);
        d.setFgtsGuideOk(true);
        d.setInssGuideOk(true);
        d.setCndtOk(true);
        d.setCndFgtsOk(true);
        d.setCndUnionOk(true);
    }

    @Test
    @DisplayName("Kit incompleto é bloqueado na geração 1-clique")
    void testGenerateBlockedWhenIncomplete() {
        dossier.setPayrollSummaryOk(true); // apenas 1 item

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.generate(dossier.getId(), "Diretoria"));
        assertTrue(ex.getMessage().contains("incompleto"));
    }

    @Test
    @DisplayName("Fumaça preta é validada automaticamente contra os laudos do mês")
    void testOpacityAutoValidation() {
        ComplianceDossier input = new ComplianceDossier();
        input.setId(dossier.getId());
        fillAllItems(input);
        input.setOpacityTestsOk(true); // usuário marcou OK, mas...

        // Veículo ativo SEM laudo no mês → cobertura incompleta vira pendência
        com.z7design.fleet_manager.model.Vehicle untested = new com.z7design.fleet_manager.model.Vehicle();
        untested.setId(UUID.randomUUID());
        untested.setPlate("XYZ9W87");
        when(vehicleRepository.findAll()).thenReturn(List.of(untested));

        ComplianceDossier saved = service.updateChecklist(input);
        assertFalse(saved.getOpacityTestsOk()); // corrigido para false (pendência real)
        assertFalse(saved.isComplete());
    }

    @Test
    @DisplayName("Kit completo com cobertura de fumaça preta vira COMPLETE")
    void testCompleteKit() {
        // Sem veículos pendentes (frota vazia = cobertura 100%)
        ComplianceDossier input = new ComplianceDossier();
        input.setId(dossier.getId());
        fillAllItems(input);

        ComplianceDossier saved = service.updateChecklist(input);
        assertTrue(saved.getOpacityTestsOk());
        assertTrue(saved.isComplete());
        assertEquals(ComplianceDossier.STATUS_COMPLETE, saved.getStatus());
    }

    @Test
    @DisplayName("Geração 1-clique marca dossiê como ATTACHED_TO_BM")
    void testGenerateSuccess() {
        fillAllItems(dossier);
        dossier.setOpacityTestsOk(true);
        dossier.setStatus(ComplianceDossier.STATUS_COMPLETE);

        ComplianceDossier generated = service.generate(dossier.getId(), "Coordenador Financeiro");

        assertNotNull(generated.getGeneratedAt());
        assertEquals("Coordenador Financeiro", generated.getGeneratedBy());
        assertEquals(ComplianceDossier.STATUS_ATTACHED_TO_BM, generated.getStatus());
    }

    @Test
    @DisplayName("missingItems lista exatamente os itens pendentes")
    void testMissingItems() {
        dossier.setPayrollSummaryOk(true);
        dossier.setFgtsGuideOk(true);

        List<String> missing = service.missingItems(dossier);

        assertEquals(7, missing.size());
        assertTrue(missing.contains("Comprovantes de depósito"));
        assertTrue(missing.contains("Laudos de fumaça preta"));
        assertFalse(missing.contains("Folha analítica/resumo"));
    }

    @Test
    @DisplayName("createOrGet retorna dossiê existente do mês/cliente")
    void testCreateOrGetExisting() {
        when(dossierRepository.findByReferenceMonthAndClientId("2026-08", clientId))
                .thenReturn(Optional.of(dossier));

        ComplianceDossier result = service.createOrGet("2026-08", clientId);
        assertEquals(dossier.getId(), result.getId());
    }

    @Test
    @DisplayName("createOrGet cria novo dossiê quando não existe")
    void testCreateOrGetNew() {
        when(dossierRepository.findByReferenceMonthAndClientId("2026-08", clientId))
                .thenReturn(Optional.empty());
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(dossier.getClient()));
        when(dossierRepository.save(any(ComplianceDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ComplianceDossier result = service.createOrGet("2026-08", clientId);
        assertEquals("2026-08", result.getReferenceMonth());
        assertEquals(ComplianceDossier.STATUS_DRAFT, result.getStatus());
    }

    @Test
    @DisplayName("PDF do dossiê completo é gerado")
    void testPdfGeneration() {
        fillAllItems(dossier);
        dossier.setOpacityTestsOk(true);

        byte[] pdf = service.generatePdf(dossier.getId());

        assertNotNull(pdf);
        assertTrue(pdf.length > 500);
        assertEquals('%', pdf[0]);
    }
}
