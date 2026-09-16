package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.GeneratedContractDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.ContractTemplate;
import com.z7design.fleet_manager.model.GeneratedContract;
import com.z7design.fleet_manager.model.enums.ContractTemplateType;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.model.enums.GeneratedContractStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractTemplateRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.GeneratedContractRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PRD 1.0 - Módulo 2: geração de minutas contratuais alimentadas pela
 * precificação aprovada do Módulo 1 (RF-02.1, RF-02.2, RF-02.3).
 */
@ExtendWith(MockitoExtension.class)
class ContractGenerationServiceTest {

    @Mock
    private ContractTemplateRepository templateRepository;

    @Mock
    private GeneratedContractRepository generatedContractRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private CostSimulationRepository costSimulationRepository;

    @InjectMocks
    private ContractGenerationService service;

    private ContractTemplate template;
    private Client client;
    private CostSimulation approvedSimulation;
    private UUID templateId;
    private UUID clientId;
    private UUID simulationId;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();
        clientId = UUID.randomUUID();
        simulationId = UUID.randomUUID();

        template = new ContractTemplate();
        template.setId(templateId);
        template.setName("Prestação de Serviços com Franquia de KM");
        template.setTemplateType(ContractTemplateType.FRANCHISE_KM);
        template.setBody("Pelo valor mensal de {{VALOR_MENSAL}}, franquia de {{FRANQUIA_KM}} km, "
                + "diária de {{VALOR_DIARIA}} e km excedente a {{TARIFA_KM_EXCEDENTE}}.");
        template.setAdjustmentClause("Reajuste anual pelo {{INDICE_REAJUSTE}}.");
        template.setDieselTriggerClause("Reequilíbrio se diesel subir além de {{GATILHO_DIESEL_PCT}}.");
        template.setPmpPaymentClause("Dias parados para PMP serão pagos normalmente.");
        template.setMeasurementClause("Fechamento dia 20, pagamento em {{DIAS_PAGAMENTO}} dias.");
        template.setRetentionClause("Retenção de {{RETENCAO_PCT}} como caução técnica.");
        template.setDefaultRetentionPct(new BigDecimal("0.0300"));
        template.setDefaultAdjustmentIndex("IGP-M");
        template.setDefaultPaymentDays(30);
        template.setDieselTriggerPct(new BigDecimal("0.0500"));

        client = new Client();
        client.setId(clientId);
        client.setName("Vale S.A.");
        client.setCnpj("33.000.167/0001-01");
        client.setAddress("Rua das Minas, 100 — Nova Lima/MG");

        approvedSimulation = new CostSimulation();
        approvedSimulation.setId(simulationId);
        approvedSimulation.setName("Vale - Ibirité x FM2C");
        approvedSimulation.setStatus(CostSimulationStatus.APPROVED);
        approvedSimulation.setMonthlyPrice(new BigDecimal("25995.80"));
        approvedSimulation.setDailyRate(new BigDecimal("1181.63"));
        approvedSimulation.setFranchiseKm(new BigDecimal("4840.00"));
        approvedSimulation.setExcessKmRate(new BigDecimal("5.0974"));
        approvedSimulation.setExtraTripRate(new BigDecimal("1358.87"));
    }

    private GeneratedContractDTO request() {
        GeneratedContractDTO dto = new GeneratedContractDTO();
        dto.setTemplateId(templateId);
        dto.setClientId(clientId);
        dto.setCostSimulationId(simulationId);
        dto.setContractorName("Transportadora Ltda");
        dto.setContractorCnpj("12.345.678/0001-90");
        dto.setContractorAddress("Av. Industrial, 500 — Contagem/MG");
        return dto;
    }

    @Test
    @DisplayName("Gera minuta com valores econômicos da simulação aprovada (M1→M2)")
    void testGenerateFromApprovedSimulation() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(costSimulationRepository.findById(simulationId)).thenReturn(Optional.of(approvedSimulation));
        when(generatedContractRepository.findTopByClientIdOrderByVersionDesc(clientId))
                .thenReturn(Optional.empty());
        when(generatedContractRepository.save(any(GeneratedContract.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        GeneratedContractDTO result = service.generate(request());

        assertEquals("Vale S.A.", result.getClientName());
        assertEquals("33.000.167/0001-01", result.getClientCnpj());
        assertEquals(new BigDecimal("25995.80"), result.getMonthlyPrice());
        assertEquals(1, result.getVersion());
        assertEquals(GeneratedContractStatus.DRAFT, result.getStatus());
    }

    @Test
    @DisplayName("Minuta renderizada contém valores e todas as cláusulas obrigatórias")
    void testRenderedContentHasValuesAndClauses() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(costSimulationRepository.findById(simulationId)).thenReturn(Optional.of(approvedSimulation));
        when(generatedContractRepository.findTopByClientIdOrderByVersionDesc(clientId))
                .thenReturn(Optional.empty());
        when(generatedContractRepository.save(any(GeneratedContract.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<GeneratedContract> captor = ArgumentCaptor.forClass(GeneratedContract.class);
        service.generate(request());
        verify(generatedContractRepository).save(captor.capture());

        GeneratedContract saved = captor.getValue();

        // Corpo com valores do M1
        assertTrue(saved.getRenderedBody().contains("R$ 25.995,80"));
        assertTrue(saved.getRenderedBody().contains("4840"));
        assertTrue(saved.getRenderedBody().contains("R$ 1.181,63"));
        assertTrue(saved.getRenderedBody().contains("R$ 5,0974".replace("5,0974", "5,10"))); // arredondamento 2 casas
        // Sem placeholders residuais
        assertFalse(saved.getRenderedBody().contains("{{VALOR_MENSAL}}"));
        assertFalse(saved.getRenderedBody().contains("{{FRANQUIA_KM}}"));

        // Cláusulas obrigatórias (RF-02.2)
        String clauses = saved.getRenderedClauses();
        assertTrue(clauses.contains("IGP-M"));
        assertTrue(clauses.contains("5%"));                    // gatilho diesel
        assertTrue(clauses.contains("PMP"));                   // pagamento em dias parados
        assertTrue(clauses.contains("dia 20"));                // prazo de medição
        assertTrue(clauses.contains("3%"));                    // retenção de caução
        assertFalse(clauses.contains("{{RETENCAO_PCT}}"));
    }

    @Test
    @DisplayName("Bloqueia geração com simulação não aprovada")
    void testRejectsUnapprovedSimulation() {
        approvedSimulation.setStatus(CostSimulationStatus.DRAFT);
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(costSimulationRepository.findById(simulationId)).thenReturn(Optional.of(approvedSimulation));

        assertThrows(IllegalArgumentException.class, () -> service.generate(request()));
        verify(generatedContractRepository, never()).save(any(GeneratedContract.class));
    }

    @Test
    @DisplayName("Bloqueia geração sem simulação de custos")
    void testRequiresSimulation() {
        GeneratedContractDTO req = request();
        req.setCostSimulationId(null);
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));

        assertThrows(IllegalArgumentException.class, () -> service.generate(req));
    }

    @Test
    @DisplayName("Versionamento incremental por cliente (RF-02.3)")
    void testVersioning() {
        GeneratedContract previous = new GeneratedContract();
        previous.setVersion(3);
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(costSimulationRepository.findById(simulationId)).thenReturn(Optional.of(approvedSimulation));
        when(generatedContractRepository.findTopByClientIdOrderByVersionDesc(clientId))
                .thenReturn(Optional.of(previous));
        when(generatedContractRepository.save(any(GeneratedContract.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        GeneratedContractDTO result = service.generate(request());
        assertEquals(4, result.getVersion());
    }

    @Test
    @DisplayName("Fluxo de assinatura: DRAFT → SENT → SIGNED")
    void testSignatureFlow() {
        GeneratedContract existing = new GeneratedContract();
        existing.setId(UUID.randomUUID());
        existing.setStatus(GeneratedContractStatus.DRAFT);
        existing.setRenderedBody("corpo");
        when(generatedContractRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(generatedContractRepository.save(any(GeneratedContract.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        GeneratedContractDTO sent = service.markSent(existing.getId(), "Gov.br");
        assertEquals(GeneratedContractStatus.SENT, sent.getStatus());
        assertEquals("Gov.br", sent.getSignatureProvider());

        GeneratedContractDTO signed = service.markSigned(existing.getId());
        assertEquals(GeneratedContractStatus.SIGNED, signed.getStatus());
        assertNotNull(signed.getSignedAt());
    }

    @Test
    @DisplayName("PDF da minuta é gerado com conteúdo relevante")
    void testPdfGeneration() throws Exception {
        GeneratedContract existing = new GeneratedContract();
        existing.setId(UUID.randomUUID());
        existing.setTitle("Contrato de Teste");
        existing.setReferenceNumber("CTR-12345");
        existing.setVersion(2);
        existing.setStatus(GeneratedContractStatus.DRAFT);
        existing.setRenderedBody("CLÁUSULA 1ª — DO OBJETO\nServiços de transporte de funcionários.");
        existing.setRenderedClauses("CLÁUSULA — DO REAJUSTE ANUAL\nIGP-M.");
        existing.setContractorName("Transportadora Ltda");
        existing.setClientName("Vale S.A.");
        existing.setElectedForum("comarca de Belo Horizonte/MG");

        when(generatedContractRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        byte[] pdf = service.generatePdf(existing.getId());

        assertNotNull(pdf);
        assertTrue(pdf.length > 500);
        // Assinatura de PDF válida (%PDF-)
        assertEquals('%', pdf[0]);
        assertEquals('P', pdf[1]);
    }

    @Test
    @DisplayName("Template inexistente gera ResourceNotFoundException")
    void testTemplateNotFound() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.generate(request()));
    }
}
