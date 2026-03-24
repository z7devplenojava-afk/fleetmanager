package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Vehicle.VehicleStatus;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleReportService {
    
    private final VehicleRepository vehicleRepository;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;
    
    @Transactional(readOnly = true)
    public byte[] generateVehicleReportPDF(String statusFilter, java.util.UUID companyIdOverride) throws IOException {
        log.info("Gerando relatÃ³rio PDF de veÃ­culos com layout padrÃ£o - Filtro: {}, Empresa: {}", statusFilter, companyIdOverride);
        
        try {
            // Buscar veÃ­culos com filtro de status
            List<Vehicle> vehicles = getVehiclesFiltered(statusFilter);
            log.info("Dados obtidos: {} veÃ­culos", vehicles.size());
            
            // Usar diretamente iText com layout padrÃ£o (nÃ£o usar JasperReports)
            // O layout padrÃ£o inclui: gradiente, logo da empresa, cabeÃ§alho, rodapÃ© e marca d'Ã¡gua
            return generateVehicleReportPDFWithIText(vehicles, statusFilter, companyIdOverride);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de veÃ­culos", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatÃ³rio PDF de veÃ­culos: " + e.getMessage(), e);
        }
    }
    
    private byte[] generateVehicleReportPDFWithIText(List<Vehicle> vehicles, String statusFilter, java.util.UUID companyIdOverride) throws IOException {
        log.info("Gerando relatÃ³rio PDF de veÃ­culos com iText - {} veÃ­culos", vehicles.size());
        
        // Determinar companyId - usar seleÃ§Ã£o explÃ­cita se informada
        java.util.UUID companyId = companyIdOverride;
        if (!vehicles.isEmpty()) {
            // Tentar encontrar um veÃ­culo com companyId nÃ£o nulo
            for (Vehicle vehicle : vehicles) {
                if (vehicle.getCompanyId() != null) {
                    if (companyId == null) {
                        companyId = vehicle.getCompanyId();
                        log.info("Usando empresa do veÃ­culo {}: {}", vehicle.getPlate(), companyId);
                    }
                    if (companyIdOverride != null) {
                        break;
                    }
                }
            }
        }
        
        // Fallback: usar primeira empresa ativa se nenhum veÃ­culo tiver companyId
        if (companyId == null) {
            log.warn("Nenhum veÃ­culo possui empresa associada. Buscando primeira empresa ativa como fallback...");
            List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
            if (activeCompanies != null && !activeCompanies.isEmpty()) {
                companyId = activeCompanies.get(0).getId();
                log.info("Usando primeira empresa ativa como fallback: {} (ID: {})", 
                        activeCompanies.get(0).getName(), companyId);
            } else {
                // Ãšltimo recurso: usar qualquer empresa
                List<Company> allCompanies = companyRepository.findAll();
                if (allCompanies != null && !allCompanies.isEmpty()) {
                    companyId = allCompanies.get(0).getId();
                    log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                            allCompanies.get(0).getName(), companyId);
                } else {
                    throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                            "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
                }
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE VEÃCULOS")
                .topMargin(120f)  // EspaÃ§o para cabeÃ§alho
                .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                .leftMargin(50f)
                .rightMargin(50f)
                .build();
            
            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();
            
            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);
            
            // Filtro aplicado
            if (statusFilter != null && !statusFilter.isEmpty()) {
                String filterText = getFilterStatusText(statusFilter);
                document.add(new Paragraph("Filtro aplicado: " + filterText).setFontSize(10).setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            long activeVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.ACTIVE).count();
            long maintenanceVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.MAINTENANCE).count();
            long inactiveVehicles = vehicles.stream().filter(v -> v.getStatus() == VehicleStatus.INACTIVE).count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de veÃ­culos: %d | Ativos: %d | Em ManutenÃ§Ã£o: %d | Inativos: %d",
                    vehicles.size(), activeVehicles, maintenanceVehicles, inactiveVehicles))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela de veÃ­culos
            if (vehicles.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhum veÃ­culo encontrado com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(8).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Placa"));
                table.addHeaderCell(createHeaderCell("Marca/Modelo"));
                table.addHeaderCell(createHeaderCell("Ano"));
                table.addHeaderCell(createHeaderCell("CombustÃ­vel"));
                table.addHeaderCell(createHeaderCell("Quilometragem"));
                table.addHeaderCell(createHeaderCell("Capacidade"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Data Cadastro"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Vehicle vehicle : vehicles) {
                    table.addCell(createCell(vehicle.getPlate() != null ? vehicle.getPlate() : ""));
                    String brandModel = (vehicle.getBrand() != null ? vehicle.getBrand() : "") + 
                                      (vehicle.getModel() != null ? " / " + vehicle.getModel() : "");
                    table.addCell(createCell(brandModel));
                    table.addCell(createCell(vehicle.getYear() != null ? vehicle.getYear().toString() : ""));
                    table.addCell(createCell(vehicle.getFuelType() != null ? getFuelTypeLabel(vehicle.getFuelType().toString()) : ""));
                    
                    // Formatar quilometragem (ex: 216.000 km)
                    String mileage = vehicle.getCurrentMileage() != null ? 
                            String.format("%,d km", vehicle.getCurrentMileage()).replace(",", ".") : "";
                    table.addCell(createCell(mileage));
                    
                    table.addCell(createCell(vehicle.getCapacity() != null ? vehicle.getCapacity().toString() + " L" : ""));
                    table.addCell(createCell(vehicle.getStatus() != null ? getStatusLabel(vehicle.getStatus()) : ""));
                    table.addCell(createCell(vehicle.getCreatedAt() != null ? 
                            vehicle.getCreatedAt().format(dateFormatter) : ""));
                }
                
                document.add(table);
            }
            
            // Finalizar layout (adicionar header/footer em todas as pÃ¡ginas)
            // IMPORTANTE: Deve ser chamado ANTES de fechar o documento
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            // Fechar documento (fecha automaticamente o PdfDocument e PdfWriter)
            document.close();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de veÃ­culos com iText: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de veÃ­culos gerado com sucesso usando layout padrÃ£o, tamanho: {} bytes", result.length);
        return result;
    }
    
    private String getFilterStatusText(String statusFilter) {
        if (statusFilter == null || statusFilter.isEmpty()) {
            return "Todos os veÃ­culos";
        }
        switch (statusFilter.toUpperCase()) {
            case "ACTIVE": return "Apenas veÃ­culos ativos";
            case "MAINTENANCE": return "Apenas veÃ­culos em manutenÃ§Ã£o";
            case "INACTIVE": return "Apenas veÃ­culos inativos";
            default: return "Todos os veÃ­culos";
        }
    }
    
    private String getStatusLabel(VehicleStatus status) {
        if (status == null) return "";
        switch (status) {
            case ACTIVE: return "Ativo";
            case MAINTENANCE: return "Em ManutenÃ§Ã£o";
            case INACTIVE: return "Inativo";
            default: return status.toString();
        }
    }
    
    private String getFuelTypeLabel(String fuelType) {
        if (fuelType == null) return "";
        switch (fuelType.toUpperCase()) {
            case "GASOLINE": return "Gasolina";
            case "ETHANOL": return "Etanol";
            case "DIESEL": return "Diesel";
            case "FLEX": return "Flex";
            default: return fuelType;
        }
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
    
    private List<Vehicle> getVehiclesFiltered(String statusFilter) {
        log.debug("Aplicando filtro de status: {}", statusFilter);
        
        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                VehicleStatus status = VehicleStatus.valueOf(statusFilter.toUpperCase());
                return vehicleRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Status invÃ¡lido fornecido: {}. Retornando todos os veÃ­culos.", statusFilter);
                return vehicleRepository.findAll();
            }
        } else {
            return vehicleRepository.findAll();
        }
    }
}

