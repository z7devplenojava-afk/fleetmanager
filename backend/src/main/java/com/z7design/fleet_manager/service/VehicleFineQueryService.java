package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.VehicleFineQueryRequestDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO.*;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.service.provider.InfosimplesFineQueryProvider;
import com.z7design.fleet_manager.service.provider.MockVehicleFineQueryProvider;
import com.z7design.fleet_manager.service.provider.VehicleFineQueryProvider;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleFineQueryService {

    private final List<VehicleFineQueryProvider> providers;
    private final InfosimplesFineQueryProvider infosimplesProvider;
    private final MockVehicleFineQueryProvider mockProvider;
    private final VehicleQueryCacheRepository cacheRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final FineRepository fineRepository;
    private final ParteDiariaFineMatcherService parteDiariaMatcherService;
    private final ObjectMapper objectMapper;

    /**
     * Realiza a consulta veicular (com cache de 24h), cruzamento de motorista e auto-sincronização.
     */
    @Transactional
    public VehicleFineQueryResponseDTO queryVehicleFines(VehicleFineQueryRequestDTO request, String username) {
        String cleanPlate = normalizePlate(request.getPlaca());
        log.info("Iniciando consulta veicular para a placa: {} por: {}", cleanPlate, username);

        // 1. Busca veículo no cadastro interno do sistema para complementar dados
        Optional<Vehicle> internalVehicleOpt = findVehicleInSystem(cleanPlate);
        
        // Se o renavam não veio na requisição, aproveita o do cadastro interno
        if ((request.getRenavam() == null || request.getRenavam().isBlank()) && internalVehicleOpt.isPresent()) {
            request.setRenavam(internalVehicleOpt.get().getRenavan());
        }

        // 2. Verificação de Cache (se forceRefresh não foi solicitado)
        if (request.getForceRefresh() == null || !request.getForceRefresh()) {
            List<VehicleQueryCache> caches = cacheRepository.findValidCacheByPlate(cleanPlate, LocalDateTime.now());
            if (!caches.isEmpty()) {
                VehicleQueryCache cache = caches.get(0);
                log.info("Retornando dados do CACHE para a placa: {} (criado em: {})", cleanPlate, cache.getCreatedAt());
                try {
                    VehicleFineQueryResponseDTO cachedResponse = objectMapper.readValue(
                            cache.getResponseJson(), VehicleFineQueryResponseDTO.class
                    );
                    cachedResponse.setOrigemDados("CACHE");
                    // Re-executa cruzamento com Parte Diária para garantir motoristas atualizados
                    enrichWithDriverMatchAndSystemStatus(cachedResponse, cleanPlate, internalVehicleOpt.orElse(null));
                    return cachedResponse;
                } catch (Exception e) {
                    log.warn("Falha ao desserializar cache, executando nova consulta externa: {}", e.getMessage());
                }
            }
        }

        // 3. Escolhe o provedor disponível (Infosimples se configurado, senão Mock/Sandbox)
        VehicleFineQueryProvider provider = selectProvider();
        log.info("Utilizando provedor: {}", provider.getProviderName());

        VehicleFineQueryResponseDTO response;
        try {
            response = provider.queryVehicleData(request);
        } catch (Exception e) {
            log.warn("Provedor {} falhou: {}. Alternando para Sandbox de contingência.", provider.getProviderName(), e.getMessage());
            response = mockProvider.queryVehicleData(request);
        }

        // 4. Complementa dados do veículo com o cadastro local
        if (internalVehicleOpt.isPresent()) {
            Vehicle v = internalVehicleOpt.get();
            if (response.getDadosVeiculo() == null) {
                response.setDadosVeiculo(new DadosVeiculoDTO());
            }
            response.getDadosVeiculo().setVehicleId(v.getId());
            if (response.getDadosVeiculo().getMarcaModelo() == null || response.getDadosVeiculo().getMarcaModelo().equals("N/D")) {
                response.getDadosVeiculo().setMarcaModelo(v.getBrand() + " " + v.getModel());
            }
            if (response.getDadosVeiculo().getAnoFabricacao() == null) {
                response.getDadosVeiculo().setAnoFabricacao(v.getYear());
            }
            if (response.getDadosVeiculo().getCor() == null) {
                response.getDadosVeiculo().setCor(v.getColor());
            }
            if (response.getDadosVeiculo().getRenavam() == null) {
                response.getDadosVeiculo().setRenavam(v.getRenavan());
            }
            if (response.getDadosVeiculo().getChassi() == null) {
                response.getDadosVeiculo().setChassi(v.getChassisNumber());
            }
        }

        // 5. Cruzamento Inteligente com a Parte Diária e verificação de multas já existentes
        try {
            enrichWithDriverMatchAndSystemStatus(response, cleanPlate, internalVehicleOpt.orElse(null));
        } catch (Exception e) {
            log.warn("Erro ao enriquecer dados com Parte Diária: {}", e.getMessage());
        }

        // 6. Auto-sincronização na tabela oficial de multas (Opção B)
        try {
            int importedCount = autoSyncNewFinesToSystem(response, internalVehicleOpt.orElse(null));
            response.setTotalImportadasSistema(importedCount);
        } catch (Exception e) {
            log.warn("Erro na auto-sincronização de multas: {}", e.getMessage());
        }

        // 7. Salva consulta no histórico/cache (validade 24 horas)
        try {
            saveToCache(cleanPlate, request, response, username);
        } catch (Exception e) {
            log.warn("Erro ao salvar cache: {}", e.getMessage());
        }

        return response;
    }


    /**
     * Importa manualmente multas selecionadas da consulta para o sistema.
     */
    @Transactional
    public int importSelectedFines(String plate, List<InfracaoDetalhadaDTO> infractionsToImport) {
        String cleanPlate = normalizePlate(plate);
        Optional<Vehicle> vehicleOpt = findVehicleInSystem(cleanPlate);
        if (vehicleOpt.isEmpty()) {
            throw new IllegalArgumentException("Veículo com a placa " + cleanPlate + " não está cadastrado no sistema.");
        }

        Vehicle vehicle = vehicleOpt.get();
        int count = 0;

        for (InfracaoDetalhadaDTO inf : infractionsToImport) {
            String auto = inf.getAutoInfracao();
            if (auto != null && !auto.isBlank()) {
                // Evita duplicatas
                List<Fine> existing = fineRepository.findByVehiclePlate(cleanPlate);
                boolean exists = existing.stream().anyMatch(f -> auto.equalsIgnoreCase(f.getInfractionNumber()));
                if (!exists) {
                    createFineEntityFromInfraction(inf, vehicle);
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * Enriquece as infrações com a identificação do motorista via Parte Diária e status do sistema.
     */
    private void enrichWithDriverMatchAndSystemStatus(VehicleFineQueryResponseDTO response, String cleanPlate, Vehicle vehicle) {
        if (response.getInfracoes() == null) {
            return;
        }

        List<Fine> existingFines = vehicle != null ? fineRepository.findByVehicleId(vehicle.getId()) : Collections.emptyList();

        for (InfracaoDetalhadaDTO inf : response.getInfracoes()) {
            // Verifica se já está cadastrada
            if (inf.getAutoInfracao() != null) {
                existingFines.stream()
                        .filter(f -> inf.getAutoInfracao().equalsIgnoreCase(f.getInfractionNumber()))
                        .findFirst()
                        .ifPresent(f -> {
                            inf.setJaCadastradaNoSistema(true);
                            inf.setFineId(f.getId());
                        });
            }

            // Cruzamento com a Parte Diária
            MotoristaApuradoDTO motorista = parteDiariaMatcherService.findMatchingDriver(cleanPlate, inf.getDataHora());
            if (motorista != null) {
                inf.setMotoristaApurado(motorista);
            }
        }
    }

    /**
     * Sincroniza automaticamente as novas multas no banco de dados (Opção B).
     */
    private int autoSyncNewFinesToSystem(VehicleFineQueryResponseDTO response, Vehicle vehicle) {
        if (vehicle == null || response.getInfracoes() == null || response.getInfracoes().isEmpty()) {
            return 0;
        }

        int count = 0;
        List<Fine> existingFines = fineRepository.findByVehicleId(vehicle.getId());

        for (InfracaoDetalhadaDTO inf : response.getInfracoes()) {
            String auto = inf.getAutoInfracao();
            boolean alreadyExists = existingFines.stream()
                    .anyMatch(f -> auto != null && auto.equalsIgnoreCase(f.getInfractionNumber()));

            if (!alreadyExists) {
                Fine savedFine = createFineEntityFromInfraction(inf, vehicle);
                inf.setJaCadastradaNoSistema(true);
                inf.setFineId(savedFine.getId());
                count++;
            }
        }

        return count;
    }

    private Fine createFineEntityFromInfraction(InfracaoDetalhadaDTO inf, Vehicle vehicle) {
        Fine fine = new Fine();
        fine.setVehicle(vehicle);
        fine.setInfractionNumber(inf.getAutoInfracao());
        fine.setInfractionCode(inf.getCodigoInfracao());
        fine.setIssuingAuthority(inf.getOrgaoAutuador());
        fine.setDescription(inf.getDescricao() != null ? inf.getDescricao() : "Infração de Trânsito");
        fine.setAmount(inf.getValor() != null ? inf.getValor() : BigDecimal.ZERO);
        fine.setLocation(inf.getLocal() != null ? inf.getLocal() : "Não informado");
        fine.setStatus(Fine.FineStatus.PENDING);
        fine.setSituation(inf.getSituacao() != null ? inf.getSituacao() : "AGUARDANDO PAGAMENTO");
        fine.setPoints(inf.getPontos() != null ? inf.getPontos() : 0);
        fine.setQueryOrigin("API_LIVE");

        // Parse de Data e Hora
        if (inf.getDataHora() != null && !inf.getDataHora().isBlank()) {
            try {
                if (inf.getDataHora().contains("T")) {
                    fine.setDate(LocalDate.parse(inf.getDataHora().substring(0, 10)));
                    fine.setInfractionTime(inf.getDataHora().substring(11, Math.min(16, inf.getDataHora().length())));
                } else {
                    fine.setDate(LocalDate.parse(inf.getDataHora().substring(0, 10)));
                }
            } catch (Exception e) {
                fine.setDate(LocalDate.now());
            }
        } else {
            fine.setDate(LocalDate.now());
        }

        // Data de Vencimento
        if (inf.getDataVencimento() != null && !inf.getDataVencimento().isBlank()) {
            try {
                fine.setDueDate(LocalDate.parse(inf.getDataVencimento().substring(0, 10)));
            } catch (Exception ignored) {}
        }

        // Vínculo do Motorista identificado pela Parte Diária
        if (inf.getMotoristaApurado() != null) {
            MotoristaApuradoDTO m = inf.getMotoristaApurado();
            fine.setSuggestedDriverName(m.getDriverName());
            fine.setParteDiariaId(m.getParteDiariaId());
            fine.setParteDiariaNumber(m.getParteDiariaNumber());
            fine.setDriverPhone(m.getDriverPhone());

            if (m.getDriverId() != null) {
                driverRepository.findById(m.getDriverId()).ifPresent(fine::setDriver);
            }
        }

        return fineRepository.save(fine);
    }

    private void saveToCache(String plate, VehicleFineQueryRequestDTO req, VehicleFineQueryResponseDTO res, String username) {
        try {
            String json = objectMapper.writeValueAsString(res);
            String restrictionsJson = res.getRestricoes() != null ? objectMapper.writeValueAsString(res.getRestricoes()) : null;

            UUID companyId = TenantContext.get();

            VehicleQueryCache cache = VehicleQueryCache.builder()
                    .companyId(companyId)
                    .plate(plate)
                    .renavam(req.getRenavam())
                    .uf(req.getUf())
                    .status(res.getStatus())
                    .vehicleBrandModel(res.getDadosVeiculo() != null ? res.getDadosVeiculo().getMarcaModelo() : null)
                    .vehicleYear(res.getDadosVeiculo() != null ? res.getDadosVeiculo().getAnoFabricacao() : null)
                    .vehicleColor(res.getDadosVeiculo() != null ? res.getDadosVeiculo().getCor() : null)
                    .vehicleCity(res.getDadosVeiculo() != null ? res.getDadosVeiculo().getMunicipio() : null)
                    .totalFines(res.getResumoDebitos() != null ? res.getResumoDebitos().getQuantidadeMultas() : 0)
                    .totalAmount(res.getResumoDebitos() != null ? res.getResumoDebitos().getValorTotal() : BigDecimal.ZERO)
                    .restrictionsJson(restrictionsJson)
                    .responseJson(json)
                    .origin(res.getOrigemDados())
                    .queriedBy(username)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();

            cacheRepository.save(cache);
        } catch (Exception e) {
            log.error("Erro ao salvar cache da consulta veicular: {}", e.getMessage());
        }
    }

    /**
     * Gera relatório em PDF do extrato de multas e restrições com identificação de motorista.
     */
    public byte[] generateExtratoPdf(VehicleFineQueryResponseDTO data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            DeviceRgb brandPrimary = new DeviceRgb(30, 41, 59); // Slate 800
            DeviceRgb brandAccent = new DeviceRgb(2, 132, 199); // Sky 600
            DeviceRgb bgGray = new DeviceRgb(241, 245, 249); // Slate 100

            // Cabeçalho
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}));
            headerTable.setWidth(UnitValue.createPercentValue(100));

            Cell titleCell = new Cell()
                    .add(new Paragraph("EXTRATO DE CONSULTA VEICULAR E MULTAS").setBold().setFontSize(14).setFontColor(brandPrimary))
                    .add(new Paragraph("Gestão de Frota • Verificação de Infrações e Restrições").setFontSize(9).setFontColor(ColorConstants.GRAY))
                    .setBorder(null);

            String dataConsulta = data.getConsultadoEm() != null ? 
                    data.getConsultadoEm().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

            Cell metaCell = new Cell()
                    .add(new Paragraph("Emissão: " + dataConsulta).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("Origem: " + (data.getOrigemDados() != null ? data.getOrigemDados() : "SISTEMA")).setFontSize(8).setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(null);

            headerTable.addCell(titleCell);
            headerTable.addCell(metaCell);
            document.add(headerTable);
            document.add(new Paragraph("").setMarginBottom(10));

            // Dados do Veículo
            if (data.getDadosVeiculo() != null) {
                DadosVeiculoDTO v = data.getDadosVeiculo();
                Table vehicleTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}));
                vehicleTable.setWidth(UnitValue.createPercentValue(100));
                vehicleTable.setBackgroundColor(bgGray);

                vehicleTable.addCell(createCell("PLACA:", v.getPlaca(), true));
                vehicleTable.addCell(createCell("RENAVAM:", v.getRenavam(), true));
                vehicleTable.addCell(createCell("CHASSI:", v.getChassi(), false));
                vehicleTable.addCell(createCell("UF / MUNICÍPIO:", (v.getUf() != null ? v.getUf() : "") + " - " + (v.getMunicipio() != null ? v.getMunicipio() : ""), false));
                vehicleTable.addCell(createCell("VEÍCULO / MODELO:", v.getMarcaModelo(), true));
                vehicleTable.addCell(createCell("ANO FAB/MOD:", (v.getAnoFabricacao() != null ? v.getAnoFabricacao() : "") + "/" + (v.getAnoModelo() != null ? v.getAnoModelo() : ""), false));
                vehicleTable.addCell(createCell("COR:", v.getCor(), false));
                vehicleTable.addCell(createCell("SITUAÇÃO:", v.getSituacaoVeiculo(), true));

                document.add(vehicleTable);
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Resumo Financeiro
            if (data.getResumoDebitos() != null) {
                ResumoDebitosDTO r = data.getResumoDebitos();
                Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
                summaryTable.setWidth(UnitValue.createPercentValue(100));
                
                Cell c1 = new Cell().add(new Paragraph("Total de Multas Identificadas: " + r.getQuantidadeMultas()).setBold().setFontSize(10));
                Cell c2 = new Cell().add(new Paragraph("Valor Total Acumulado: R$ " + (r.getValorTotal() != null ? String.format("%.2f", r.getValorTotal()) : "0,00"))
                        .setBold().setFontSize(10).setFontColor(new DeviceRgb(220, 38, 38)).setTextAlignment(TextAlignment.RIGHT));
                
                c1.setBorder(null);
                c2.setBorder(null);
                summaryTable.addCell(c1);
                summaryTable.addCell(c2);
                document.add(summaryTable);
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Tabela de Infrações
            if (data.getInfracoes() != null && !data.getInfracoes().isEmpty()) {
                document.add(new Paragraph("DISCRIMINAÇÃO DAS INFRAÇÕES & APURAÇÃO DE CONDUTOR").setBold().setFontSize(11).setFontColor(brandPrimary));

                Table table = new Table(UnitValue.createPercentArray(new float[]{15, 12, 23, 20, 15, 15}));
                table.setWidth(UnitValue.createPercentValue(100));

                // Headers
                table.addHeaderCell(new Cell().add(new Paragraph("Auto / Órgão").setBold().setFontSize(8)).setBackgroundColor(bgGray));
                table.addHeaderCell(new Cell().add(new Paragraph("Código").setBold().setFontSize(8)).setBackgroundColor(bgGray));
                table.addHeaderCell(new Cell().add(new Paragraph("Descrição").setBold().setFontSize(8)).setBackgroundColor(bgGray));
                table.addHeaderCell(new Cell().add(new Paragraph("Motorista Apurado").setBold().setFontSize(8)).setBackgroundColor(bgGray));
                table.addHeaderCell(new Cell().add(new Paragraph("Data / Local").setBold().setFontSize(8)).setBackgroundColor(bgGray));
                table.addHeaderCell(new Cell().add(new Paragraph("Valor / Venc.").setBold().setFontSize(8)).setBackgroundColor(bgGray));

                for (InfracaoDetalhadaDTO inf : data.getInfracoes()) {
                    // Col 1: Auto / Orgao
                    table.addCell(new Cell().add(new Paragraph(inf.getAutoInfracao() != null ? inf.getAutoInfracao() : "").setBold().setFontSize(8))
                            .add(new Paragraph(inf.getOrgaoAutuador() != null ? inf.getOrgaoAutuador() : "").setFontSize(7).setFontColor(ColorConstants.GRAY)));

                    // Col 2: Codigo / Pontos
                    table.addCell(new Cell().add(new Paragraph(inf.getCodigoInfracao() != null ? inf.getCodigoInfracao() : "").setFontSize(8))
                            .add(new Paragraph((inf.getPontos() != null ? inf.getPontos() + " pts" : "")).setFontSize(7).setFontColor(new DeviceRgb(220, 38, 38))));

                    // Col 3: Descricao
                    table.addCell(new Cell().add(new Paragraph(inf.getDescricao() != null ? inf.getDescricao() : "").setFontSize(8)));

                    // Col 4: Motorista Apurado (Parte Diária)
                    String motoristaText = "Não identificado";
                    String parteDiariaInfo = "";
                    if (inf.getMotoristaApurado() != null) {
                        MotoristaApuradoDTO m = inf.getMotoristaApurado();
                        motoristaText = m.getDriverName();
                        if (m.getParteDiariaNumber() != null) {
                            parteDiariaInfo = "Diária #" + m.getParteDiariaNumber() + " (" + (m.getObraNome() != null ? m.getObraNome() : "Em rota") + ")";
                        }
                    }
                    table.addCell(new Cell().add(new Paragraph(motoristaText).setBold().setFontSize(8).setFontColor(brandAccent))
                            .add(new Paragraph(parteDiariaInfo).setFontSize(7).setFontColor(ColorConstants.DARK_GRAY)));

                    // Col 5: Data e Local
                    table.addCell(new Cell().add(new Paragraph(inf.getDataHora() != null ? inf.getDataHora() : "").setFontSize(8))
                            .add(new Paragraph(inf.getLocal() != null ? inf.getLocal() : "").setFontSize(7).setFontColor(ColorConstants.GRAY)));

                    // Col 6: Valor e Vencimento
                    table.addCell(new Cell().add(new Paragraph("R$ " + (inf.getValor() != null ? String.format("%.2f", inf.getValor()) : "0,00")).setBold().setFontSize(8))
                            .add(new Paragraph("Venc: " + (inf.getDataVencimento() != null ? inf.getDataVencimento() : "N/D")).setFontSize(7).setFontColor(ColorConstants.GRAY)));
                }

                document.add(table);
            } else {
                document.add(new Paragraph("Nenhuma infração registrada para este veículo.").setFontSize(10).setItalic());
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF do extrato de multas: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF do extrato de multas: " + e.getMessage(), e);
        }
    }

    private Cell createCell(String label, String value, boolean highlight) {
        Paragraph p = new Paragraph()
                .add(new Paragraph(label + " ").setFontSize(7).setFontColor(ColorConstants.GRAY))
                .add(new Paragraph(value != null && !value.isBlank() ? value : "-").setFontSize(8).setBold());
        Cell cell = new Cell().add(p).setBorder(null);
        return cell;
    }

    private VehicleFineQueryProvider selectProvider() {
        if (infosimplesProvider != null && infosimplesProvider.isAvailable()) {
            return infosimplesProvider;
        }
        return mockProvider;
    }

    private String normalizePlate(String plate) {
        if (plate == null) return "";
        return plate.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
    }

    private Optional<Vehicle> findVehicleInSystem(String cleanPlate) {
        Optional<Vehicle> v = vehicleRepository.findByPlate(cleanPlate);
        if (v.isPresent()) return v;
        if (cleanPlate.length() == 7) {
            String formatted = cleanPlate.substring(0, 3) + "-" + cleanPlate.substring(3);
            return vehicleRepository.findByPlate(formatted);
        }
        return Optional.empty();
    }
}
