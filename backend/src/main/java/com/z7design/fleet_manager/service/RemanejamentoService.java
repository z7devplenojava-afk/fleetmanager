package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.RemanejamentoDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.RemanejamentoRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class RemanejamentoService {
    @Autowired
    private RemanejamentoRepository remanejamentoRepository;
    
    @Autowired
    private RemanejamentoHistoricoService historicoService;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private WorkPostRepository workPostRepository;
    
    @Autowired
    private UnitRepository unitRepository;

    /**
     * Cria um novo remanejamento e registra no histÃ³rico
     */
    public Remanejamento create(Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao) {
        Remanejamento saved = remanejamentoRepository.save(remanejamento);
        
        // Registrar no histÃ³rico
        historicoService.registrarAcao(
            saved, 
            AcaoHistorico.CRIACAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "CriaÃ§Ã£o de remanejamento"
        );
        
        return saved;
    }

    /**
     * Atualiza um remanejamento existente e registra no histÃ³rico
     */
    public Remanejamento update(UUID id, Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao) {
        // Buscar dados anteriores para comparaÃ§Ã£o
        Optional<Remanejamento> existingOpt = remanejamentoRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Remanejamento nÃ£o encontrado");
        }
        
        Remanejamento existing = existingOpt.get();
        remanejamento.setId(id);
        Remanejamento updated = remanejamentoRepository.save(remanejamento);
        
        // Registrar no histÃ³rico com dados anteriores
        historicoService.registrarAcao(
            updated, 
            AcaoHistorico.EDICAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "EdiÃ§Ã£o de remanejamento",
            existing,
            null // IP serÃ¡ capturado pelo controller
        );
        
        return updated;
    }

    /**
     * Exclui um remanejamento e registra no histÃ³rico
     */
    public void delete(UUID id, User usuarioQueExecutou, String motivoAlteracao) {
        Optional<Remanejamento> existingOpt = remanejamentoRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Remanejamento nÃ£o encontrado");
        }
        
        Remanejamento existing = existingOpt.get();
        
        // Registrar no histÃ³rico antes de deletar
        historicoService.registrarAcao(
            existing, 
            AcaoHistorico.EXCLUSAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "ExclusÃ£o de remanejamento"
        );
        
        remanejamentoRepository.deleteById(id);
    }

    /**
     * MÃ©todos de consulta (nÃ£o modificam dados, nÃ£o registram histÃ³rico)
     */
    public Optional<Remanejamento> findById(UUID id) {
        return remanejamentoRepository.findById(id);
    }

    public List<Remanejamento> findAll() {
        return remanejamentoRepository.findAll();
    }

    public List<Remanejamento> findByEmployeeId(UUID employeeId) {
        return remanejamentoRepository.findByEmployeeId(employeeId);
    }
    
    /**
     * MÃ©todos de conveniÃªncia para compatibilidade com cÃ³digo existente
     */
    public Remanejamento create(Remanejamento remanejamento) {
        // Usar um usuÃ¡rio padrÃ£o ou null para compatibilidade
        return create(remanejamento, null, "CriaÃ§Ã£o automÃ¡tica");
    }

    public Remanejamento update(UUID id, Remanejamento remanejamento) {
        // Usar um usuÃ¡rio padrÃ£o ou null para compatibilidade
        return update(id, remanejamento, null, "EdiÃ§Ã£o automÃ¡tica");
    }

    public void delete(UUID id) {
        // Usar um usuÃ¡rio padrÃ£o ou null para compatibilidade
        delete(id, null, "ExclusÃ£o automÃ¡tica");
    }
    
    // ============== MÃ‰TODOS COM DTO ==============
    
    public RemanejamentoDTO createFromDTO(RemanejamentoDTO dto, User usuarioQueExecutou, String motivoAlteracao) {
        Remanejamento remanejamento = new Remanejamento();
        mapDTOToEntity(dto, remanejamento);
        
        Remanejamento saved = remanejamentoRepository.save(remanejamento);
        
        // Registrar no histÃ³rico
        historicoService.registrarAcao(
            saved, 
            AcaoHistorico.CRIACAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "CriaÃ§Ã£o de remanejamento"
        );
        
        return convertToDTO(saved);
    }
    
    public RemanejamentoDTO updateFromDTO(UUID id, RemanejamentoDTO dto, User usuarioQueExecutou, String motivoAlteracao) {
        Optional<Remanejamento> existingOpt = remanejamentoRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Remanejamento nÃ£o encontrado");
        }
        
        Remanejamento existing = existingOpt.get();
        mapDTOToEntity(dto, existing);
        existing.setId(id);
        
        Remanejamento updated = remanejamentoRepository.save(existing);
        
        // Registrar no histÃ³rico
        historicoService.registrarAcao(
            updated, 
            AcaoHistorico.EDICAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "EdiÃ§Ã£o de remanejamento"
        );
        
        return convertToDTO(updated);
    }
    
    public List<RemanejamentoDTO> findAllAsDTO() {
        // Usar mÃ©todo com JOIN FETCH para garantir que o employee seja carregado
        return remanejamentoRepository.findAllWithEmployee().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<RemanejamentoDTO> findByIdAsDTO(UUID id) {
        return remanejamentoRepository.findByIdWithRelations(id)
                .map(this::convertToDTO);
    }
    
    public List<RemanejamentoDTO> findByEmployeeIdAsDTO(UUID employeeId) {
        return remanejamentoRepository.findByEmployeeIdWithRelations(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private void mapDTOToEntity(RemanejamentoDTO dto, Remanejamento entity) {
        if (dto.getEmployeeId() == null) {
            throw new RuntimeException("ID do funcionÃ¡rio Ã© obrigatÃ³rio");
        }
        
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado com ID: " + dto.getEmployeeId()));
        entity.setEmployee(employee);
        
        if (dto.getTipo() == null) {
            throw new RuntimeException("Tipo de remanejamento Ã© obrigatÃ³rio");
        }
        entity.setTipo(dto.getTipo());
        
        entity.setOrigem(dto.getOrigem() != null ? dto.getOrigem() : "");
        entity.setDestino(dto.getDestino() != null ? dto.getDestino() : "");
        
        // Aceitar tanto dataRemanejamento quanto remanejamentoDate (compatibilidade com frontend)
        if (dto.getDataRemanejamento() != null) {
            entity.setDataRemanejamento(dto.getDataRemanejamento());
        } else if (dto.getRemanejamentoDate() != null) {
            entity.setDataRemanejamento(dto.getRemanejamentoDate());
        } else {
            throw new RuntimeException("Data do remanejamento Ã© obrigatÃ³ria");
        }
        
        // Aceitar tanto observacao quanto notes (compatibilidade com frontend)
        if (dto.getObservacao() != null) {
            entity.setObservacao(dto.getObservacao());
        } else if (dto.getNotes() != null) {
            entity.setObservacao(dto.getNotes());
        } else {
            entity.setObservacao(null);
        }
        
        // Mapear postos de trabalho
        if (dto.getOriginWorkstationId() != null) {
            WorkPost originWorkstation = workPostRepository.findById(dto.getOriginWorkstationId())
                    .orElse(null);
            entity.setOriginWorkstation(originWorkstation);
        } else {
            entity.setOriginWorkstation(null);
        }
        
        if (dto.getDestinationWorkstationId() != null) {
            WorkPost destinationWorkstation = workPostRepository.findById(dto.getDestinationWorkstationId())
                    .orElse(null);
            entity.setDestinationWorkstation(destinationWorkstation);
        } else {
            entity.setDestinationWorkstation(null);
        }
    }
    
    private RemanejamentoDTO convertToDTO(Remanejamento entity) {
        RemanejamentoDTO dto = new RemanejamentoDTO();
        dto.setId(entity.getId());
        
        // ForÃ§ar inicializaÃ§Ã£o do employee (LAZY loading)
        if (entity.getEmployee() != null) {
            try {
                org.hibernate.Hibernate.initialize(entity.getEmployee());
                dto.setEmployeeId(entity.getEmployee().getId());
                dto.setEmployeeName(entity.getEmployee().getName());
            } catch (Exception e) {
                System.err.println("[WARNING] Erro ao carregar employee: " + e.getMessage());
                dto.setEmployeeId(null);
                dto.setEmployeeName(null);
            }
        }
        
        dto.setTipo(entity.getTipo());
        
        // Resolver origem e destino para nomes das unidades se forem UUIDs
        dto.setOrigem(resolveUnitName(entity.getOrigem()));
        dto.setDestino(resolveUnitName(entity.getDestino()));
        
        dto.setDataRemanejamento(entity.getDataRemanejamento());
        dto.setObservacao(entity.getObservacao());
        
        // Mapear postos de trabalho
        try {
            if (entity.getOriginWorkstation() != null) {
                // Se jÃ¡ foi carregado via JOIN FETCH, nÃ£o precisa de initialize
                dto.setOriginWorkstationId(entity.getOriginWorkstation().getId());
                log.debug("OriginWorkstation ID mapeado: {}", entity.getOriginWorkstation().getId());
            } else {
                dto.setOriginWorkstationId(null);
                log.debug("OriginWorkstation Ã© null");
            }
        } catch (Exception e) {
            log.warn("Erro ao mapear originWorkstation: " + e.getMessage());
            dto.setOriginWorkstationId(null);
        }
        
        try {
            if (entity.getDestinationWorkstation() != null) {
                // Se jÃ¡ foi carregado via JOIN FETCH, nÃ£o precisa de initialize
                dto.setDestinationWorkstationId(entity.getDestinationWorkstation().getId());
                log.debug("DestinationWorkstation ID mapeado: {}", entity.getDestinationWorkstation().getId());
            } else {
                dto.setDestinationWorkstationId(null);
                log.debug("DestinationWorkstation Ã© null");
            }
        } catch (Exception e) {
            log.warn("Erro ao mapear destinationWorkstation: " + e.getMessage());
            dto.setDestinationWorkstationId(null);
        }
        
        return dto;
    }
    
    @Transactional(readOnly = true)
    public byte[] generatePDFReport(UUID employeeId, RemanejamentoTipo tipo, String origem, String destino,
                                    LocalDate startDate, LocalDate endDate) throws IOException {
        log.info("Gerando relatÃ³rio PDF de remanejamentos - EmployeeId: {}, Tipo: {}, Origem: {}, Destino: {}, StartDate: {}, EndDate: {}",
                employeeId, tipo, origem, destino, startDate, endDate);

        List<Remanejamento> remanejamentos = getRemanejamentosFiltered(employeeId, tipo, origem, destino, startDate, endDate);
        log.info("Total de remanejamentos encontrados para o relatÃ³rio: {}", remanejamentos.size());

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
            Paragraph title = new Paragraph("RELATÃ“RIO DE REMANEJAMENTOS")
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
            if (employeeId != null || tipo != null || startDate != null || endDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

                if (employeeId != null) {
                    Employee employee = employeeRepository.findById(employeeId).orElse(null);
                    String employeeName = employee != null ? employee.getName() : "ID: " + employeeId;
                    document.add(new Paragraph("FuncionÃ¡rio: " + employeeName).setFontSize(10).setMarginBottom(2));
                }
                if (tipo != null) {
                    document.add(new Paragraph("Tipo: " + getTipoLabel(tipo)).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Total de remanejamentos
            Paragraph totalInfo = new Paragraph("Total de remanejamentos: " + remanejamentos.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);

            // Tabela de remanejamentos
            if (remanejamentos.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhum remanejamento encontrado com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(6).setWidth(UnitValue.createPercentValue(100));

                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("FuncionÃ¡rio"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("Posto de Origem"));
                table.addHeaderCell(createHeaderCell("Posto de Destino"));
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("ObservaÃ§Ã£o"));

                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Remanejamento remanejamento : remanejamentos) {
                    table.addCell(createCell(remanejamento.getEmployee() != null ? remanejamento.getEmployee().getName() : ""));
                    table.addCell(createCell(remanejamento.getTipo() != null ? getTipoLabel(remanejamento.getTipo()) : ""));
                    
                    // Posto de Origem
                    String postoOrigem = "-";
                    try {
                        if (remanejamento.getOriginWorkstation() != null) {
                            org.hibernate.Hibernate.initialize(remanejamento.getOriginWorkstation());
                            WorkPost originPost = remanejamento.getOriginWorkstation();
                            postoOrigem = (originPost.getPostCode() != null ? originPost.getPostCode() + " - " : "") + 
                                         (originPost.getName() != null ? originPost.getName() : "");
                        }
                    } catch (Exception e) {
                        log.debug("Erro ao carregar posto de origem: {}", e.getMessage());
                    }
                    table.addCell(createCell(postoOrigem));
                    
                    // Posto de Destino
                    String postoDestino = "-";
                    try {
                        if (remanejamento.getDestinationWorkstation() != null) {
                            org.hibernate.Hibernate.initialize(remanejamento.getDestinationWorkstation());
                            WorkPost destinationPost = remanejamento.getDestinationWorkstation();
                            postoDestino = (destinationPost.getPostCode() != null ? destinationPost.getPostCode() + " - " : "") + 
                                         (destinationPost.getName() != null ? destinationPost.getName() : "");
                        }
                    } catch (Exception e) {
                        log.debug("Erro ao carregar posto de destino: {}", e.getMessage());
                    }
                    table.addCell(createCell(postoDestino));
                    
                    table.addCell(createCell(remanejamento.getDataRemanejamento() != null ? 
                            remanejamento.getDataRemanejamento().format(dateFormatter) : ""));
                    
                    // ObservaÃ§Ã£o (truncar se muito longa)
                    String obs = remanejamento.getObservacao() != null ? remanejamento.getObservacao() : "";
                    if (obs.length() > 50) {
                        obs = obs.substring(0, 47) + "...";
                    }
                    table.addCell(createCell(obs));
                }

                document.add(table);
            }

            // RodapÃ©
            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema Secured Guard")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de remanejamentos: {}", e.getMessage(), e);
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
        log.info("PDF de remanejamentos gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    private List<Remanejamento> getRemanejamentosFiltered(UUID employeeId, RemanejamentoTipo tipo, String origem, String destino,
                                                           LocalDate startDate, LocalDate endDate) {
        log.debug("Aplicando filtros - employeeId: {}, tipo: {}, origem: {}, destino: {}, startDate: {}, endDate: {}",
                employeeId, tipo, origem, destino, startDate, endDate);

        try {
            List<Remanejamento> remanejamentos = remanejamentoRepository.findAllWithEmployee();

            // Aplicar filtros
            if (employeeId != null) {
                remanejamentos = remanejamentos.stream()
                        .filter(r -> r.getEmployee() != null && r.getEmployee().getId().equals(employeeId))
                        .collect(Collectors.toList());
            }

            if (tipo != null) {
                remanejamentos = remanejamentos.stream()
                        .filter(r -> r.getTipo() == tipo)
                        .collect(Collectors.toList());
            }

            // Filtros de origem e destino removidos - campos nÃ£o sÃ£o mais usados no formulÃ¡rio

            if (startDate != null) {
                remanejamentos = remanejamentos.stream()
                        .filter(r -> r.getDataRemanejamento() != null && !r.getDataRemanejamento().isBefore(startDate))
                        .collect(Collectors.toList());
            }

            if (endDate != null) {
                remanejamentos = remanejamentos.stream()
                        .filter(r -> r.getDataRemanejamento() != null && !r.getDataRemanejamento().isAfter(endDate))
                        .collect(Collectors.toList());
            }

            log.info("Filtros aplicados. {} remanejamentos encontrados", remanejamentos.size());
            return remanejamentos;

        } catch (Exception e) {
            log.error("Erro ao aplicar filtros nos remanejamentos", e);
            throw new RuntimeException("Erro ao buscar remanejamentos: " + e.getMessage(), e);
        }
    }

    private String getTipoLabel(RemanejamentoTipo tipo) {
        if (tipo == null) return "";
        switch (tipo) {
            case TRANSFERENCIA_UNIDADE: return "TransferÃªncia de Unidade";
            case TRANSFERENCIA_POSTO_TRABALHO: return "TransferÃªncia de Posto de Trabalho";
            case TROCA_FUNCAO: return "Troca de FunÃ§Ã£o";
            case PROMOCAO: return "PromoÃ§Ã£o";
            case COBRIR_FERIAS: return "Cobrir FÃ©rias";
            case COBRIR_FALTA: return "Cobrir Falta";
            case PLANTAO: return "PlantÃ£o";
            case OUTROS: return "Outros";
            default: return tipo.toString();
        }
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(8))
                .setTextAlignment(TextAlignment.LEFT);
    }
    
    /**
     * Resolve o nome da unidade a partir de um valor que pode ser UUID ou nome direto
     */
    private String resolveUnitName(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }
        
        try {
            UUID unitUUID = UUID.fromString(value);
            Optional<Unit> unit = unitRepository.findById(unitUUID);
            if (unit.isPresent()) {
                return unit.get().getName();
            }
        } catch (IllegalArgumentException e) {
            // NÃ£o Ã© UUID, retornar valor original (pode ser nome direto)
        }
        
        return value;
    }
} 
