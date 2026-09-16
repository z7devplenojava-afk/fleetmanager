package com.z7design.fleet_manager.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.z7design.fleet_manager.dto.GeneratedContractDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.ContractTemplate;
import com.z7design.fleet_manager.model.GeneratedContract;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.model.enums.GeneratedContractStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractTemplateRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import com.z7design.fleet_manager.repository.GeneratedContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 2: geração formal de minutas contratuais a partir da
 * precificação aprovada no Módulo 1 (M1 → M2), com inserção automática das
 * cláusulas obrigatórias do RF-02.2 e saída em PDF pronta para assinatura.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractGenerationService {

    private final ContractTemplateRepository templateRepository;
    private final GeneratedContractRepository generatedContractRepository;
    private final ClientRepository clientRepository;
    private final CostSimulationRepository costSimulationRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale PT_BR = new Locale("pt", "BR");

    // ===== Listagem de templates =====

    @Transactional(readOnly = true)
    public List<ContractTemplate> listTemplates() {
        return templateRepository.findAll();
    }

    @Transactional
    public ContractTemplate saveTemplate(ContractTemplate template) {
        return templateRepository.save(template);
    }

    // ===== Geração de minutas =====

    /**
     * Gera a minuta contratual preenchendo o template com os dados do cliente e
     * com os valores econômicos da simulação de custos aprovada (Módulo 1).
     */
    @Transactional
    public GeneratedContractDTO generate(GeneratedContractDTO request) {
        log.info("Gerando minuta contratual: template={}, cliente={}", request.getTemplateId(), request.getClientId());

        ContractTemplate template = templateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com ID: " + request.getTemplateId()));

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + request.getClientId()));

        // M1 → M2: exige simulação de custos aprovada pela Diretoria
        if (request.getCostSimulationId() == null) {
            throw new IllegalArgumentException("Simulação de custos (Módulo 1) é obrigatória para gerar o contrato");
        }
        CostSimulation simulation = costSimulationRepository.findById(request.getCostSimulationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Simulação de custos não encontrada com ID: " + request.getCostSimulationId()));
        if (simulation.getStatus() != CostSimulationStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Somente simulações APROVADAS pela Diretoria podem gerar contratos. Status atual: "
                            + simulation.getStatus());
        }

        GeneratedContract contract = new GeneratedContract();
        contract.setTemplate(template);
        contract.setClient(client);
        contract.setCostSimulation(simulation);
        contract.setTitle(request.getTitle() != null ? request.getTitle() : template.getName());
        contract.setReferenceNumber(request.getReferenceNumber() != null
                ? request.getReferenceNumber()
                : "CTR-" + System.currentTimeMillis() % 1000000);

        // Qualificação das partes
        contract.setContractorName(request.getContractorName() != null ? request.getContractorName() : "CONTRATADA");
        contract.setContractorCnpj(request.getContractorCnpj());
        contract.setContractorAddress(request.getContractorAddress());
        contract.setClientName(client.getName());
        contract.setClientCnpj(client.getCnpj());
        contract.setClientAddress(client.getAddress());
        contract.setElectedForum(request.getElectedForum() != null
                ? request.getElectedForum()
                : "comarca de Belo Horizonte/MG");

        // Dados econômicos (M1) + parâmetros padrão do template
        BigDecimal retentionPct = request.getRetentionPct() != null
                ? request.getRetentionPct()
                : template.getDefaultRetentionPct();
        String index = request.getAdjustmentIndex() != null
                ? request.getAdjustmentIndex()
                : template.getDefaultAdjustmentIndex();
        Integer paymentDays = request.getPaymentDays() != null
                ? request.getPaymentDays()
                : template.getDefaultPaymentDays();

        contract.setMonthlyPrice(simulation.getMonthlyPrice());
        contract.setFranchiseKm(simulation.getFranchiseKm());
        contract.setExcessKmRate(simulation.getExcessKmRate());
        contract.setDailyRate(simulation.getDailyRate());
        contract.setExtraTripRate(simulation.getExtraTripRate());
        contract.setRetentionPct(retentionPct);
        contract.setAdjustmentIndex(index);

        // ===== Renderização =====
        Map<String, String> vars = buildVariables(contract, retentionPct, index, paymentDays);
        contract.setRenderedBody(render(template.getBody(), vars));
        contract.setRenderedClauses(renderClauses(template, vars));

        // ===== Versionamento (RF-02.3) =====
        Integer nextVersion = generatedContractRepository
                .findTopByClientIdOrderByVersionDesc(client.getId())
                .map(c -> c.getVersion() + 1)
                .orElse(1);
        contract.setVersion(nextVersion);
        contract.setStatus(GeneratedContractStatus.DRAFT);

        GeneratedContract saved = generatedContractRepository.save(contract);
        log.info("Minuta contratual gerada: {} v{} (ref. {})", saved.getTitle(), saved.getVersion(),
                saved.getReferenceNumber());
        return GeneratedContractDTO.fromEntity(saved);
    }

    /** Lista minutas geradas por cliente. */
    @Transactional(readOnly = true)
    public List<GeneratedContractDTO> listByClient(UUID clientId) {
        return generatedContractRepository.findByClientIdOrderByVersionDesc(clientId).stream()
                .map(GeneratedContractDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /** Lista minutas geradas por simulação de custos. */
    @Transactional(readOnly = true)
    public List<GeneratedContractDTO> listBySimulation(UUID costSimulationId) {
        return generatedContractRepository.findByCostSimulationIdOrderByVersionDesc(costSimulationId).stream()
                .map(GeneratedContractDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GeneratedContractDTO getById(UUID id) {
        return GeneratedContractDTO.fromEntity(findEntity(id));
    }

    /** RF-02.3: envio para assinatura digital (DocuSign/Gov.br). */
    @Transactional
    public GeneratedContractDTO markSent(UUID id, String signatureProvider) {
        GeneratedContract contract = findEntity(id);
        contract.setStatus(GeneratedContractStatus.SENT);
        if (signatureProvider != null && !signatureProvider.isBlank()) {
            contract.setSignatureProvider(signatureProvider);
        }
        return GeneratedContractDTO.fromEntity(generatedContractRepository.save(contract));
    }

    /** RF-02.3: registro de assinatura concluída. */
    @Transactional
    public GeneratedContractDTO markSigned(UUID id) {
        GeneratedContract contract = findEntity(id);
        contract.setStatus(GeneratedContractStatus.SIGNED);
        contract.setSignedAt(LocalDateTime.now());
        return GeneratedContractDTO.fromEntity(generatedContractRepository.save(contract));
    }

    @Transactional
    public void delete(UUID id) {
        if (!generatedContractRepository.existsById(id)) {
            throw new ResourceNotFoundException("Minuta não encontrada com ID: " + id);
        }
        generatedContractRepository.deleteById(id);
    }

    // ===== PDF (saída PRD: minuta pronta para assinatura) =====

    /**
     * Gera o PDF da minuta contratual com qualificação completa das partes,
     * cláusulas obrigatórias e foro eleito.
     */
    public byte[] generatePdf(UUID id) {
        GeneratedContract contract = findEntity(id);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Título
            document.add(new Paragraph(contract.getTitle().toUpperCase())
                    .setFont(bold).setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4));
            document.add(new Paragraph(String.format("Minuta v%d — Ref. %s — Status: %s",
                            contract.getVersion(), contract.getReferenceNumber(), contract.getStatus()))
                    .setFontSize(9).setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(12));

            // Corpo
            addJustifiedParagraphs(document, contract.getRenderedBody(), regular, 9.5f);

            // Cláusulas obrigatórias
            if (contract.getRenderedClauses() != null && !contract.getRenderedClauses().isBlank()) {
                document.add(new Paragraph("CLÁUSULAS OBRIGATÓRIAS")
                        .setFont(bold).setFontSize(11)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(10).setMarginBottom(6));
                addJustifiedParagraphs(document, contract.getRenderedClauses(), regular, 9.5f);
            }

            // Foro e assinaturas
            document.add(new Paragraph(String.format(
                            "CLÁUSULA — DO FORO: fica eleito o foro da %s para dirimir quaisquer controvérsias.",
                            contract.getElectedForum()))
                    .setFont(regular).setFontSize(9.5f)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginTop(6));

            document.add(new Paragraph("_____________________________        _____________________________")
                    .setFont(regular).setFontSize(9.5f)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(24));
            document.add(new Paragraph(String.format("%s                                    %s",
                            contract.getContractorName(), contract.getClientName()))
                    .setFont(regular).setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da minuta {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF da minuta contratual", e);
        }
    }

    // ===== Helpers =====

    private void addJustifiedParagraphs(Document document, String text, PdfFont font, float size) {
        if (text == null) {
            return;
        }
        for (String paragraph : text.split("\n")) {
            if (paragraph.isBlank()) {
                continue;
            }
            document.add(new Paragraph(paragraph.trim())
                    .setFont(font).setFontSize(size)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(4));
        }
    }

    private Map<String, String> buildVariables(GeneratedContract c, BigDecimal retentionPct,
                                               String index, Integer paymentDays) {
        BigDecimal triggerPct = c.getTemplate() != null && c.getTemplate().getDieselTriggerPct() != null
                ? c.getTemplate().getDieselTriggerPct()
                : new BigDecimal("0.0500");

        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("TITULO", nvl(c.getTitle()));
        vars.put("CONTRATADA_NOME", nvl(c.getContractorName()));
        vars.put("CONTRATADA_CNPJ", nvl(c.getContractorCnpj()));
        vars.put("CONTRATADA_ENDERECO", nvl(c.getContractorAddress()));
        vars.put("CLIENTE_NOME", nvl(c.getClientName()));
        vars.put("CLIENTE_CNPJ", nvl(c.getClientCnpj()));
        vars.put("CLIENTE_ENDERECO", nvl(c.getClientAddress()));
        vars.put("VALOR_MENSAL", money(c.getMonthlyPrice()));
        vars.put("VALOR_MENSAL_EXTENSO", "valor mensal contratado");
        vars.put("FRANQUIA_KM", number(c.getFranchiseKm()));
        vars.put("VALOR_DIARIA", money(c.getDailyRate()));
        vars.put("TARIFA_KM_EXCEDENTE", money(c.getExcessKmRate()));
        vars.put("VALOR_VIAGEM_EXTRA", money(c.getExtraTripRate()));
        vars.put("RETENCAO_PCT", pct(retentionPct));
        vars.put("INDICE_REAJUSTE", nvl(index));
        vars.put("DIAS_PAGAMENTO", String.valueOf(paymentDays));
        vars.put("GATILHO_DIESEL", number(triggerPct.multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)));
        vars.put("GATILHO_DIESEL_PCT", pct(triggerPct));
        return vars;
    }

    private String renderClauses(ContractTemplate template, Map<String, String> vars) {
        return List.of(
                render(template.getAdjustmentClause(), vars),
                render(template.getDieselTriggerClause(), vars),
                render(template.getPmpPaymentClause(), vars),
                render(template.getMeasurementClause(), vars),
                render(template.getRetentionClause(), vars)
        ).stream()
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining("\n\n"));
    }

    /** Substitui placeholders {{NOME}}; variável ausente mantém o placeholder visível. */
    private String render(String text, Map<String, String> vars) {
        if (text == null) {
            return "";
        }
        String out = text;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            out = out.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return out;
    }

    private GeneratedContract findEntity(UUID id) {
        return generatedContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Minuta contratual não encontrada com ID: " + id));
    }

    private static String nvl(String s) {
        return s != null ? s : "";
    }

    private static String money(BigDecimal v) {
        if (v == null) {
            return "R$ 0,00";
        }
        String formatted = v.setScale(2, RoundingMode.HALF_UP)
                .toPlainString();
        int dot = formatted.indexOf('.');
        String intPart = dot >= 0 ? formatted.substring(0, dot) : formatted;
        String decPart = dot >= 0 ? formatted.substring(dot + 1) : "00";
        // Agrupa milhares no padrão pt-BR (1.234.567,89)
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < intPart.length(); i++) {
            char ch = intPart.charAt(i);
            int remaining = intPart.length() - i - 1;
            sb.append(ch);
            if (remaining > 0 && remaining % 3 == 0) {
                sb.append('.');
            }
        }
        return "R$ " + sb + "," + decPart;
    }

    private static String number(BigDecimal v) {
        if (v == null) {
            return "0";
        }
        String s = v.setScale(2, RoundingMode.HALF_UP).toPlainString();
        return s.endsWith(".00") ? s.substring(0, s.length() - 3) : s;
    }

    private static String pct(BigDecimal v) {
        if (v == null) {
            return "0%";
        }
        return v.multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
                .stripTrailingZeros()
                .toPlainString() + "%";
    }
}
