package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.TransportGuideDTO;
import com.z7design.fleet_manager.model.TransportGuide;
import com.z7design.fleet_manager.model.enums.TransportGuideStatus;
import com.z7design.fleet_manager.repository.TransportGuideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransportGuideService {

    private final TransportGuideRepository transportGuideRepository;
    private static final String UPLOAD_DIR = "uploads/transport-guides/";

    @Transactional(readOnly = true)
    public List<TransportGuideDTO> getAllTransportGuides() {
        log.info("Buscando todas as guias de transporte");
        return transportGuideRepository.findAll().stream()
                .map(TransportGuideDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransportGuideDTO getTransportGuideById(Long id) {
        log.info("Buscando guia de transporte por ID: {}", id);
        TransportGuide guide = transportGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guia de transporte nÃ£o encontrada"));
        return new TransportGuideDTO(guide);
    }

    @Transactional
    public TransportGuideDTO createTransportGuide(TransportGuideDTO dto, MultipartFile arquivo, String username) {
        log.info("Criando nova guia de transporte para empresa: {}", dto.getEmpresa());
        
        TransportGuide entity = dto.toEntity();
        entity.setCreatedBy(username);
        entity.setStatus(TransportGuideStatus.DRAFT);
        
        if (arquivo != null && !arquivo.isEmpty()) {
            String filePath = saveFile(arquivo);
            entity.setArquivoGuiaPath(filePath);
        }
        
        TransportGuide saved = transportGuideRepository.save(entity);
        log.info("âœ… Guia de transporte criada com ID: {}", saved.getId());
        return new TransportGuideDTO(saved);
    }

    @Transactional
    public TransportGuideDTO updateTransportGuide(Long id, TransportGuideDTO dto, MultipartFile arquivo) {
        log.info("Atualizando guia de transporte ID: {}", id);
        TransportGuide existing = transportGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guia de transporte nÃ£o encontrada"));

        existing.setCnpj(dto.getCnpj());
        existing.setEmpresa(dto.getEmpresa());
        existing.setNumeroColete(dto.getNumeroColete());
        existing.setNumeroArma(dto.getNumeroArma());
        existing.setCalibre(dto.getCalibre());
        existing.setQtdMunicoes(dto.getQtdMunicoes());
        existing.setOrigem(dto.getOrigem());
        existing.setDestino(dto.getDestino());
        existing.setTrajeto(dto.getTrajeto());
        existing.setMotivo(dto.getMotivo());
        
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        
        if (arquivo != null && !arquivo.isEmpty()) {
            // Deletar arquivo antigo se existir
            if (existing.getArquivoGuiaPath() != null) {
                deleteFile(existing.getArquivoGuiaPath());
            }
            String filePath = saveFile(arquivo);
            existing.setArquivoGuiaPath(filePath);
        }
        
        TransportGuide updated = transportGuideRepository.save(existing);
        log.info("âœ… Guia de transporte ID {} atualizada com sucesso", id);
        return new TransportGuideDTO(updated);
    }

    @Transactional
    public void deleteTransportGuide(Long id) {
        log.info("Excluindo guia de transporte ID: {}", id);
        TransportGuide guide = transportGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guia de transporte nÃ£o encontrada"));
        
        // Deletar arquivo associado se existir
        if (guide.getArquivoGuiaPath() != null) {
            deleteFile(guide.getArquivoGuiaPath());
        }
        
        transportGuideRepository.deleteById(id);
        log.info("âœ… Guia de transporte ID {} excluÃ­da com sucesso", id);
    }

    @Transactional
    public TransportGuideDTO approveTransportGuide(Long id, String supervisorId) {
        log.info("Aprovando guia de transporte ID: {} por supervisor: {}", id, supervisorId);
        TransportGuide guide = transportGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guia de transporte nÃ£o encontrada"));
        
        guide.setStatus(TransportGuideStatus.APPROVED);
        guide.setApprovedBy(supervisorId);
        guide.setApprovedAt(LocalDateTime.now());
        
        TransportGuide approved = transportGuideRepository.save(guide);
        log.info("âœ… Guia de transporte ID {} aprovada com sucesso", id);
        return new TransportGuideDTO(approved);
    }

    @Transactional
    public TransportGuideDTO rejectTransportGuide(Long id, String supervisorId, String reason) {
        log.info("Rejeitando guia de transporte ID: {} por supervisor: {}", id, supervisorId);
        TransportGuide guide = transportGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guia de transporte nÃ£o encontrada"));
        
        guide.setStatus(TransportGuideStatus.REJECTED);
        guide.setRejectedBy(supervisorId);
        guide.setRejectedAt(LocalDateTime.now());
        guide.setRejectionReason(reason);
        
        TransportGuide rejected = transportGuideRepository.save(guide);
        log.info("âœ… Guia de transporte ID {} rejeitada com sucesso", id);
        return new TransportGuideDTO(rejected);
    }

    @Transactional(readOnly = true)
    public List<TransportGuideDTO> getTransportGuidesByFilters(TransportGuideStatus status, String empresa, String cnpj) {
        log.info("Buscando guias com filtros - Status: {}, Empresa: {}, CNPJ: {}", status, empresa, cnpj);
        
        List<TransportGuide> guides;
        
        if (status != null) {
            guides = transportGuideRepository.findByStatus(status);
        } else if (empresa != null) {
            guides = transportGuideRepository.findByEmpresa(empresa);
        } else if (cnpj != null) {
            guides = transportGuideRepository.findByCnpj(cnpj);
        } else {
            guides = transportGuideRepository.findAll();
        }
        
        return guides.stream()
                .map(TransportGuideDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] generatePDFReport(TransportGuideStatus status, String empresa, String startDate) throws IOException {
        log.info("Gerando relatÃ³rio PDF de guias de transporte - Status: {}, Empresa: {}, Data: {}", status, empresa, startDate);
        
        // Buscar guias com filtros
        List<TransportGuide> guides;
        if (status != null) {
            guides = transportGuideRepository.findByStatus(status);
        } else if (empresa != null) {
            guides = transportGuideRepository.findByEmpresa(empresa);
        } else {
            guides = transportGuideRepository.findAll();
        }
        
        // Filtrar por data se fornecida
        if (startDate != null && !startDate.isEmpty()) {
            LocalDate filterDate = LocalDate.parse(startDate);
            guides = guides.stream()
                    .filter(guide -> guide.getCreatedAt() != null && 
                            guide.getCreatedAt().toLocalDate().equals(filterDate))
                    .collect(Collectors.toList());
        }
        
        log.info("Gerando PDF com {} guias de transporte", guides.size());
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;
        
        try {
            writer = new PdfWriter(baos);
            pdfDoc = new PdfDocument(writer);
            document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);
            
            // CabeÃ§alho da empresa
            Paragraph companyHeader = new Paragraph("PROMOVER VIGILÃ‚NCIA PATRIMONIAL LTDA")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(5);
            document.add(companyHeader);
            
            Paragraph companyInfo = new Paragraph("CNPJ: 43.576.260/0001-12")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(10)
                    .setMarginBottom(20);
            document.add(companyInfo);
            
            // TÃ­tulo
            Paragraph title = new Paragraph("RELATÃ“RIO DE GUIAS DE TRANSPORTE")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18)
                    .setBold()
                    .setMarginTop(10)
                    .setMarginBottom(20);
            document.add(title);
            
            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);
            
            // Filtros aplicados
            if (status != null || empresa != null || startDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);
                
                if (status != null) {
                    document.add(new Paragraph("Status: " + status).setFontSize(10).setMarginBottom(2));
                }
                if (empresa != null) {
                    document.add(new Paragraph("Empresa: " + empresa).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null) {
                    document.add(new Paragraph("Data: " + startDate).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // Total de guias
            Paragraph totalInfo = new Paragraph("Total de guias: " + guides.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);
            
            // Tabela de guias
            if (guides.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma guia encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(6).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Empresa"));
                table.addHeaderCell(createHeaderCell("CNPJ"));
                table.addHeaderCell(createHeaderCell("Arma"));
                table.addHeaderCell(createHeaderCell("Calibre"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Data"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (TransportGuide guide : guides) {
                    table.addCell(createCell(guide.getEmpresa() != null ? guide.getEmpresa() : ""));
                    table.addCell(createCell(guide.getCnpj() != null ? guide.getCnpj() : ""));
                    table.addCell(createCell(guide.getNumeroArma() != null ? guide.getNumeroArma() : ""));
                    table.addCell(createCell(guide.getCalibre() != null ? guide.getCalibre() : ""));
                    table.addCell(createCell(guide.getStatus() != null ? guide.getStatus().toString() : ""));
                    String dateStr = guide.getCreatedAt() != null ? 
                            guide.getCreatedAt().format(dateFormatter) : "";
                    table.addCell(createCell(dateStr));
                }
                
                document.add(table);
            }
            
            // RodapÃ©
            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema FluxBus")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de guias de transporte: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        } finally {
            if (document != null) {
                document.close();
            }
            if (pdfDoc != null) {
                pdfDoc.close();
            }
            if (writer != null) {
                writer.close();
            }
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de guias de transporte gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }
    
    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }
    
    private Cell createCell(String text) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT);
    }

    private String saveFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("âœ… Arquivo salvo: {}", filePath.toString());
            return filePath.toString();
        } catch (IOException e) {
            log.error("âŒ Erro ao salvar arquivo", e);
            throw new RuntimeException("Erro ao salvar arquivo", e);
        }
    }

    private void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("âœ… Arquivo deletado: {}", filePath);
            }
        } catch (IOException e) {
            log.warn("âš ï¸ Erro ao deletar arquivo: {}", filePath, e);
        }
    }
}

















