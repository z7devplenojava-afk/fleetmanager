package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.MobilizationInspection;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.MobilizationInspectionRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.3): Laudo de Vistoria de Mobilização.
 * Checklist digital assinado em conjunto com o cliente.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MobilizationInspectionService {

    private final MobilizationInspectionRepository repository;
    private final VehicleRepository vehicleRepository;
    private final ClientRepository clientRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional(readOnly = true)
    public List<MobilizationInspection> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public MobilizationInspection findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vistoria de mobilização não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<MobilizationInspection> findByVehicle(UUID vehicleId) {
        return repository.findByVehicleIdOrderByInspectionDateDesc(vehicleId);
    }

    @Transactional(readOnly = true)
    public List<MobilizationInspection> findByClient(UUID clientId) {
        return repository.findByClientIdOrderByInspectionDateDesc(clientId);
    }

    /**
     * Registra a vistoria de mobilização com checklist completo.
     */
    @Transactional
    public MobilizationInspection create(MobilizationInspection inspection) {
        // Vincula veículo e cliente
        if (inspection.getVehicle() != null && inspection.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(inspection.getVehicle().getId()).orElse(null);
            inspection.setVehicle(vehicle);
            if (vehicle != null) {
                inspection.setVehiclePlate(vehicle.getPlate());
                if (inspection.getCurrentMileage() == null && vehicle.getCurrentMileage() != null) {
                    inspection.setCurrentMileage(vehicle.getCurrentMileage());
                }
            }
        }
        if (inspection.getClient() != null && inspection.getClient().getId() != null) {
            Client client = clientRepository.findById(inspection.getClient().getId()).orElse(null);
            inspection.setClient(client);
            if (client != null && inspection.getClientName() == null) {
                inspection.setClientName(client.getName());
            }
        }

        // Nº de laudo sequencial
        inspection.setRegistryNumber(generateRegistryNumber());
        if (inspection.getInspectionDate() == null) {
            inspection.setInspectionDate(LocalDate.now());
        }

        // Consistência do checklist: exige CRLV anexado e todas assinaturas para aprovar
        if (Boolean.TRUE.equals(inspection.getApproved())) {
            validateChecklist(inspection);
        }

        MobilizationInspection saved = repository.save(inspection);
        log.info("Vistoria de mobilização {} registrada para o veículo {} — aprovada: {}",
                saved.getRegistryNumber(), saved.getVehiclePlate(), saved.getApproved());
        return saved;
    }

    /**
     * Aprova a vistoria após verificação do checklist e das assinaturas.
     */
    @Transactional
    public MobilizationInspection approve(UUID id) {
        MobilizationInspection inspection = findById(id);
        validateChecklist(inspection);
        inspection.setApproved(true);
        return repository.save(inspection);
    }

    /**
     * RF-03.3: a mobilização só é liberada com checklist completo e assinaturas
     * conjuntas (vistoriador + representante do cliente).
     */
    private void validateChecklist(MobilizationInspection inspection) {
        Map<String, Boolean> checks = Map.of(
                "Estado da lataria", Boolean.TRUE.equals(inspection.getBodyworkOk()),
                "Pneus", Boolean.TRUE.equals(inspection.getTiresOk()),
                "Tacógrafo", Boolean.TRUE.equals(inspection.getTachographOk()),
                "Triângulo", Boolean.TRUE.equals(inspection.getWarningTriangleOk()),
                "Chave de roda", Boolean.TRUE.equals(inspection.getWheelWrenchOk()),
                "Alarme de ré", Boolean.TRUE.equals(inspection.getReverseAlarmOk()),
                "CRLV anexado", Boolean.TRUE.equals(inspection.getCrlvAttached())
        );
        List<String> failed = checks.entrySet().stream()
                .filter(e -> !e.getValue())
                .map(Map.Entry::getKey)
                .toList();
        if (!failed.isEmpty()) {
            throw new IllegalArgumentException("Checklist incompleto: " + String.join(", ", failed));
        }
        if (inspection.getInspectorName() == null || inspection.getInspectorName().isBlank()) {
            throw new IllegalArgumentException("Vistoriador responsável é obrigatório");
        }
        if (inspection.getClientRepresentativeName() == null || inspection.getClientRepresentativeName().isBlank()) {
            throw new IllegalArgumentException("Representante do cliente é obrigatório (assinatura conjunta)");
        }
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Vistoria de mobilização não encontrada com ID: " + id);
        }
        repository.deleteById(id);
    }

    private String generateRegistryNumber() {
        return "VIST-MOB-" + LocalDate.now().getYear() + "-" + String.format("%05d",
                (repository.findAll().size() + 1) % 100000);
    }

    // ===== PDF (saída PRD: Termo de Vistoria e Mobilização assinado) =====

    /**
     * Gera o PDF do Termo de Vistoria e Mobilização.
     */
    public byte[] generatePdf(UUID id) {
        MobilizationInspection inspection = findById(id);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            document.add(new Paragraph("TERMO DE VISTORIA E MOBILIZAÇÃO")
                    .setFont(bold).setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6));
            document.add(new Paragraph("Laudo nº " + inspection.getRegistryNumber()
                            + " — " + inspection.getInspectionDate().format(DATE_FMT))
                    .setFontSize(9).setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(12));

            // Identificação
            document.add(new Paragraph("VEÍCULO")
                    .setFont(bold).setFontSize(11).setMarginBottom(4));
            document.add(new Paragraph(String.format("Placa: %s    Odômetro: %s km",
                            inspection.getVehiclePlate(),
                            inspection.getCurrentMileage() != null ? inspection.getCurrentMileage() : "—"))
                    .setFont(regular).setFontSize(9.5f).setMarginBottom(2));
            document.add(new Paragraph(String.format("Cliente: %s    Contrato: %s",
                            inspection.getClientName() != null ? inspection.getClientName() : "—",
                            inspection.getContractNumber() != null ? inspection.getContractNumber() : "—"))
                    .setFont(regular).setFontSize(9.5f).setMarginBottom(10));

            // Checklist
            document.add(new Paragraph("CHECKLIST DE VISTORIA")
                    .setFont(bold).setFontSize(11).setMarginBottom(4));
            addChecklistRow(document, bold, "Estado da lataria", inspection.getBodyworkOk(), inspection.getBodyworkNotes());
            addChecklistRow(document, bold, "Pneus", inspection.getTiresOk(), inspection.getTiresNotes());
            addChecklistRow(document, bold, "Tacógrafo", inspection.getTachographOk(), null);
            addChecklistRow(document, bold, "Triângulo", inspection.getWarningTriangleOk(), null);
            addChecklistRow(document, bold, "Chave de roda", inspection.getWheelWrenchOk(), null);
            addChecklistRow(document, bold, "Alarme de ré", inspection.getReverseAlarmOk(), null);
            addChecklistRow(document, bold, "Cópia do CRLV anexada", inspection.getCrlvAttached(), null);

            if (inspection.getPhotosUrls() != null && !inspection.getPhotosUrls().isBlank()) {
                document.add(new Paragraph("Fotos anexas: " + inspection.getPhotosUrls())
                        .setFont(regular).setFontSize(8).setMarginTop(6));
            }
            if (inspection.getGeneralNotes() != null && !inspection.getGeneralNotes().isBlank()) {
                document.add(new Paragraph("Observações: " + inspection.getGeneralNotes())
                        .setFont(regular).setFontSize(9.5f).setMarginTop(6));
            }

            // Resultado
            document.add(new Paragraph(inspection.getApproved()
                            ? "RESULTADO: VISTORIA APROVADA — MOBILIZAÇÃO LIBERADA"
                            : "RESULTADO: PENDENTE DE APROVAÇÃO")
                    .setFont(bold).setFontSize(10)
                    .setTextAlignment(inspection.getApproved() ? TextAlignment.CENTER : TextAlignment.CENTER)
                    .setMarginTop(12).setMarginBottom(20));

            // Assinaturas conjuntas
            document.add(new Paragraph("_____________________________        _____________________________")
                    .setFont(regular).setFontSize(9.5f).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(String.format("Vistoriador: %s                 Cliente: %s",
                            inspection.getInspectorName() != null ? inspection.getInspectorName() : "—",
                            inspection.getClientRepresentativeName() != null ? inspection.getClientRepresentativeName() : "—"))
                    .setFont(regular).setFontSize(9).setTextAlignment(TextAlignment.CENTER));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da vistoria {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF da vistoria de mobilização", e);
        }
    }

    private void addChecklistRow(Document document, PdfFont bold, String label, Boolean ok, String notes) {
        document.add(new Paragraph(String.format("[%s] %s%s",
                        Boolean.TRUE.equals(ok) ? "OK" : "NÃO CONFERE", label,
                        notes != null && !notes.isBlank() ? " — " + notes : ""))
                .setFont(ok != null && ok ? bold : bold)
                .setFontSize(9.5f)
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(3));
    }
}
