package com.z7design.fleet_manager.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.ComplianceDossier;
import com.z7design.fleet_manager.model.OpacityTest;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ComplianceDossierRepository;
import com.z7design.fleet_manager.repository.OpacityTestRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 4 (RF-04.4): Geração Automática do Dossiê de Faturamento.
 * Compila com 1 clique o pacote mensal exigido pela contratante:
 * folha analítica/resumo, comprovantes de depósito e benefícios, guias de
 * FGTS e GPS/INSS, certidões CNDT/CND FGTS/CND União e laudos de fumaça preta.
 * Anexo mandatório ao Boletim de Medição (M4 → M7).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplianceDossierService {

    private final ComplianceDossierRepository dossierRepository;
    private final ClientRepository clientRepository;
    private final OpacityTestRepositoryHolder opacityHolder;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MM/yyyy");

    @Transactional(readOnly = true)
    public List<ComplianceDossier> findAll() {
        return dossierRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ComplianceDossier> findByClient(UUID clientId) {
        return dossierRepository.findByClientIdOrderByReferenceMonthDesc(clientId);
    }

    @Transactional(readOnly = true)
    public ComplianceDossier findById(UUID id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossiê não encontrado com ID: " + id));
    }

    /**
     * Cria ou retorna o dossiê do mês/cliente. Folha de referência = mês anterior.
     */
    @Transactional
    public ComplianceDossier createOrGet(String referenceMonth, UUID clientId) {
        return dossierRepository.findByReferenceMonthAndClientId(referenceMonth, clientId)
                .orElseGet(() -> {
                    ComplianceDossier dossier = new ComplianceDossier();
                    dossier.setReferenceMonth(referenceMonth);
                    dossier.setClient(clientRepository.findById(clientId)
                            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado: " + clientId)));
                    return dossierRepository.save(dossier);
                });
    }

    /**
     * Atualiza o checklist do dossiê. RF-04.4: a opacidade é verificada
     * automaticamente contra os laudos de fumaça preta do mês.
     */
    @Transactional
    public ComplianceDossier updateChecklist(ComplianceDossier input) {
        ComplianceDossier dossier = findById(input.getId());

        dossier.setPayrollSummaryOk(Boolean.TRUE.equals(input.getPayrollSummaryOk()));
        dossier.setPayrollDepositOk(Boolean.TRUE.equals(input.getPayrollDepositOk()));
        dossier.setBenefitsProofOk(Boolean.TRUE.equals(input.getBenefitsProofOk()));
        dossier.setFgtsGuideOk(Boolean.TRUE.equals(input.getFgtsGuideOk()));
        dossier.setInssGuideOk(Boolean.TRUE.equals(input.getInssGuideOk()));
        dossier.setCndtOk(Boolean.TRUE.equals(input.getCndtOk()));
        dossier.setCndFgtsOk(Boolean.TRUE.equals(input.getCndFgtsOk()));
        dossier.setCndUnionOk(Boolean.TRUE.equals(input.getCndUnionOk()));
        dossier.setCndtValidUntil(input.getCndtValidUntil());
        dossier.setCndFgtsValidUntil(input.getCndFgtsValidUntil());
        dossier.setCndUnionValidUntil(input.getCndUnionValidUntil());
        dossier.setAttachments(input.getAttachments());
        dossier.setNotes(input.getNotes());

        // Item de fumaça preta: validação automática (100% da frota no mês)
        YearMonth month = YearMonth.parse(dossier.getReferenceMonth());
        boolean opacityComplete = isOpacityCoverageComplete(month, dossier.getClient() != null
                ? dossier.getClient().getId()
                : null);
        dossier.setOpacityTestsOk(opacityComplete);

        // Status derivado
        if (dossier.isComplete()) {
            dossier.setStatus(ComplianceDossier.STATUS_COMPLETE);
        } else if (ComplianceDossier.STATUS_COMPLETE.equals(dossier.getStatus())) {
            dossier.setStatus(ComplianceDossier.STATUS_DRAFT);
        }

        return dossierRepository.save(dossier);
    }

    /**
     * Verifica se todos os veículos com placa registrada têm laudo no mês.
     * Usa a frota ativa como base (RF-04.3: 100% dos veículos em operação).
     */
    private boolean isOpacityCoverageComplete(YearMonth month, UUID clientId) {
        Map<String, Object> coverage = opacityHolder.getMonthlyCoverage(month);
        Number pending = (Number) coverage.getOrDefault("pendingCount", 0);
        return pending.intValue() == 0;
    }

    /**
     * Marca o dossiê como gerado (1-clique) e pronto para anexo ao BM.
     * Bloqueia a geração se o kit estiver incompleto.
     */
    @Transactional
    public ComplianceDossier generate(UUID id, String generatedBy) {
        ComplianceDossier dossier = findById(id);
        if (!dossier.isComplete()) {
            List<String> missing = missingItems(dossier);
            throw new IllegalArgumentException(
                    "Kit de conformidade incompleto. Itens pendentes: " + String.join(", ", missing));
        }
        dossier.setGeneratedAt(java.time.LocalDateTime.now());
        dossier.setGeneratedBy(generatedBy);
        dossier.setStatus(ComplianceDossier.STATUS_ATTACHED_TO_BM);
        log.info("Dossiê de conformidade {} gerado por {} — pronto para anexo ao BM", id, generatedBy);
        return dossierRepository.save(dossier);
    }

    /** Itens pendentes do kit (para feedback no frontend). */
    public List<String> missingItems(ComplianceDossier d) {
        List<Map.Entry<String, Boolean>> items = List.of(
                Map.entry("Folha analítica/resumo", Boolean.TRUE.equals(d.getPayrollSummaryOk())),
                Map.entry("Comprovantes de depósito", Boolean.TRUE.equals(d.getPayrollDepositOk())),
                Map.entry("Benefícios (Ticket/Plano)", Boolean.TRUE.equals(d.getBenefitsProofOk())),
                Map.entry("Guia FGTS + comprovante", Boolean.TRUE.equals(d.getFgtsGuideOk())),
                Map.entry("Guia GPS/INSS + comprovante", Boolean.TRUE.equals(d.getInssGuideOk())),
                Map.entry("Certidão CNDT", Boolean.TRUE.equals(d.getCndtOk())),
                Map.entry("CND FGTS", Boolean.TRUE.equals(d.getCndFgtsOk())),
                Map.entry("CND Conjunta da União", Boolean.TRUE.equals(d.getCndUnionOk())),
                Map.entry("Laudos de fumaça preta", Boolean.TRUE.equals(d.getOpacityTestsOk()))
        );
        return items.stream().filter(e -> !e.getValue()).map(Map.Entry::getKey).collect(Collectors.toList());
    }

    // ===== PDF: Dossiê Mensal consolidado =====

    /**
     * Gera o PDF do Dossiê Mensal de Conformidade Trabalhista e SST.
     */
    public byte[] generatePdf(UUID id) {
        ComplianceDossier d = findById(id);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            document.add(new Paragraph("DOSSIÊ MENSAL DE CONFORMIDADE TRABALHISTA E SST")
                    .setFont(bold).setFontSize(13)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4));
            document.add(new Paragraph(String.format("Referência: %s — Cliente: %s",
                            YearMonth.parse(d.getReferenceMonth()).format(MONTH_FMT),
                            d.getClient() != null ? d.getClient().getName() : "—"))
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(14));

            document.add(new Paragraph("CHECKLIST DO KIT MANDATÓRIO (RF-04.4)")
                    .setFont(bold).setFontSize(11).setMarginBottom(6));

            addCheckItem(document, bold, "Folha analítica e resumo do mês anterior", d.getPayrollSummaryOk());
            addCheckItem(document, bold, "Comprovantes de depósito de salários", d.getPayrollDepositOk());
            addCheckItem(document, bold, "Comprovantes de benefícios (Ticket/Plano de Saúde)", d.getBenefitsProofOk());
            addCheckItem(document, bold, "Guia de FGTS + comprovante de pagamento", d.getFgtsGuideOk());
            addCheckItem(document, bold, "Guia de GPS/INSS + comprovante de pagamento", d.getInssGuideOk());
            addCheckItem(document, bold, "Certidão CNDT válida", d.getCndtOk());
            addCheckItem(document, bold, "Certidão CND FGTS válida", d.getCndFgtsOk());
            addCheckItem(document, bold, "CND Conjunta da União válida", d.getCndUnionOk());
            addCheckItem(document, bold, "Laudos de Fumaça Preta do mês (100% frota)", d.getOpacityTestsOk());

            // Validade das certidões
            document.add(new Paragraph("VALIDADE DAS CERTIDÕES")
                    .setFont(bold).setFontSize(11).setMarginTop(12).setMarginBottom(4));
            document.add(new Paragraph(String.format("CNDT válida até: %s",
                            d.getCndtValidUntil() != null ? d.getCndtValidUntil().format(DATE_FMT) : "—"))
                    .setFont(regular).setFontSize(9.5f));
            document.add(new Paragraph(String.format("CND FGTS válida até: %s",
                            d.getCndFgtsValidUntil() != null ? d.getCndFgtsValidUntil().format(DATE_FMT) : "—"))
                    .setFont(regular).setFontSize(9.5f));
            document.add(new Paragraph(String.format("CND União válida até: %s",
                            d.getCndUnionValidUntil() != null ? d.getCndUnionValidUntil().format(DATE_FMT) : "—"))
                    .setFont(regular).setFontSize(9.5f));

            // Status final
            document.add(new Paragraph(d.isComplete()
                            ? "SITUAÇÃO: KIT COMPLETO — LIBERADO PARA ANEXO AO BOLETIM DE MEDIÇÃO"
                            : "SITUAÇÃO: KIT INCOMPLETO — PENDÊNCIAS: " + String.join(", ", missingItems(d)))
                    .setFont(bold).setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(16));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF do dossiê {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF do dossiê de conformidade", e);
        }
    }

    private void addCheckItem(Document document, PdfFont bold, String label, Boolean ok) {
        document.add(new Paragraph(String.format("[%s] %s",
                        Boolean.TRUE.equals(ok) ? "✓" : " ", label))
                .setFont(bold).setFontSize(9.5f).setMarginBottom(3));
    }

    /**
     * Holder para evitar dependência circular com OpacityTestService.
     */
    @org.springframework.stereotype.Component
    public static class OpacityTestRepositoryHolder {
        private final OpacityTestRepository opacityTestRepository;
        private final VehicleRepository vehicleRepository;

        public OpacityTestRepositoryHolder(OpacityTestRepository opacityTestRepository,
                                           VehicleRepository vehicleRepository) {
            this.opacityTestRepository = opacityTestRepository;
            this.vehicleRepository = vehicleRepository;
        }

        public Map<String, Object> getMonthlyCoverage(YearMonth month) {
            LocalDate start = month.atDay(1);
            LocalDate end = month.atEndOfMonth();

            List<Vehicle> activeVehicles = vehicleRepository.findAll();
            List<UUID> tested = opacityTestRepository.findByTestDateBetweenOrderByTestDateAsc(start, end).stream()
                    .map(OpacityTest::getVehicle)
                    .filter(v -> v != null)
                    .map(Vehicle::getId)
                    .collect(Collectors.toList());

            List<Vehicle> pending = activeVehicles.stream()
                    .filter(v -> !tested.contains(v.getId()))
                    .collect(Collectors.toList());

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("referenceMonth", month.toString());
            result.put("activeVehicles", activeVehicles.size());
            result.put("testedVehicles", activeVehicles.size() - pending.size());
            result.put("pendingCount", pending.size());
            return result;
        }
    }
}
