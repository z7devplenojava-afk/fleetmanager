package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.ContractType;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serviço de importação da planilha "QUADRO DE OBRAS"
 * Colunas esperadas:
 *   CLIENTE/OBRA | QUANTIDADE DE VEÍCULOS | DESCRIÇÃO (tipo de ônibus) | TIPOS DE SERVIÇOS | VALOR POR VEÍCULO | VALOR MENSAL | VIGÊNCIA
 *
 * A importação:
 *   1. Cria ou atualiza o Cliente (busca por nome)
 *   2. Cria veículos alocados ao cliente (quantidade informada)
 *   3. Cria Contrato com valor mensal e vigência
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientObraImportService {

    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final ContractRepository contractRepository;
    private final PlatformTransactionManager transactionManager;

    public ImportResultDto importFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de importação está vazio ou não foi enviado.");
        }

        ImportResultDto result = ImportResultDto.empty();
        log.info("📥 Iniciando importação de QUADRO DE OBRAS: {}", file.getOriginalFilename());

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            // Pré-carregar clientes existentes por nome
            Map<String, Client> existingClientsByName = new HashMap<>();
            List<Client> allClients = clientRepository.findAll();
            for (Client c : allClients) {
                if (c.getName() != null) {
                    existingClientsByName.put(normalizeText(c.getName()), c);
                }
            }
            log.info("Pré-carregados {} clientes existentes.", existingClientsByName.size());

            // Pré-carregar veículos existentes por placa
            Map<String, Vehicle> existingVehiclesByPlate = new HashMap<>();
            try {
                List<Vehicle> allVehicles = vehicleRepository.findAll();
                for (Vehicle v : allVehicles) {
                    if (v.getPlate() != null) {
                        existingVehiclesByPlate.put(v.getPlate().toUpperCase(), v);
                    }
                }
            } catch (Exception e) {
                log.warn("Não foi possível pré-carregar veículos: {}", e.getMessage());
            }

            List<Client> clientsToInsert = new ArrayList<>();
            List<Client> clientsToUpdate = new ArrayList<>();
            List<Vehicle> vehiclesToInsert = new ArrayList<>();
            List<Contract> contractsToInsert = new ArrayList<>();

            Set<String> processedClientNames = new HashSet<>();

            int numberOfSheets = workbook.getNumberOfSheets();
            log.info("Processando arquivo com {} aba(s)", numberOfSheets);

            for (int s = 0; s < numberOfSheets; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                if (workbook.isSheetHidden(s) || sheet.getPhysicalNumberOfRows() == 0) continue;

                log.info("Processando aba '{}'", sheet.getSheetName());
                processSheet(sheet, result, existingClientsByName, processedClientNames,
                        clientsToInsert, clientsToUpdate, vehiclesToInsert, contractsToInsert);
            }

            // Persistir em lote
            if (!clientsToInsert.isEmpty() || !clientsToUpdate.isEmpty() ||
                    !vehiclesToInsert.isEmpty() || !contractsToInsert.isEmpty()) {

                log.info("Persistindo: {} clientes novos, {} atualizados, {} veículos, {} contratos",
                        clientsToInsert.size(), clientsToUpdate.size(),
                        vehiclesToInsert.size(), contractsToInsert.size());

                TransactionTemplate tt = new TransactionTemplate(transactionManager);
                tt.execute(status -> {
                    if (!clientsToInsert.isEmpty()) {
                        clientRepository.saveAll(clientsToInsert);
                    }
                    if (!clientsToUpdate.isEmpty()) {
                        clientRepository.saveAll(clientsToUpdate);
                    }
                    if (!vehiclesToInsert.isEmpty()) {
                        vehicleRepository.saveAll(vehiclesToInsert);
                    }
                    if (!contractsToInsert.isEmpty()) {
                        contractRepository.saveAll(contractsToInsert);
                    }
                    return null;
                });

                result.setInserted(clientsToInsert.size() + vehiclesToInsert.size() + contractsToInsert.size());
                result.setUpdated(clientsToUpdate.size());
            }

        } catch (Exception e) {
            log.error("Erro crítico ao ler planilha: ", e);
            result.getErrors().add("Falha ao ler arquivo: " + e.getMessage());
        }

        log.info("✅ Importação concluída. Inseridos: {}, Atualizados: {}, Erros: {}",
                result.getInserted(), result.getUpdated(), result.getErrors().size());

        return result;
    }

    private void processSheet(Sheet sheet, ImportResultDto result,
                              Map<String, Client> existingClientsByName,
                              Set<String> processedClientNames,
                              List<Client> clientsToInsert, List<Client> clientsToUpdate,
                              List<Vehicle> vehiclesToInsert, List<Contract> contractsToInsert) {

        int lastRowNum = sheet.getLastRowNum();
        if (lastRowNum < 0) return;

        // Encontrar linha de cabeçalho
        int headerRowIndex = -1;
        Map<Integer, String> columnMap = new HashMap<>();

        for (int r = sheet.getFirstRowNum(); r <= Math.min(sheet.getFirstRowNum() + 15, lastRowNum); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            Map<Integer, String> tempMap = mapHeaders(row);
            if (tempMap.size() >= 2) {
                headerRowIndex = r;
                columnMap = tempMap;
                break;
            }
        }

        if (headerRowIndex == -1 || columnMap.isEmpty()) {
            log.warn("Nenhum cabeçalho válido encontrado na aba '{}'", sheet.getSheetName());
            result.getErrors().add("Aba '" + sheet.getSheetName() + "': cabeçalho não encontrado");
            return;
        }

        log.info("Cabeçalho encontrado na linha {}. Colunas: {}", headerRowIndex + 1, columnMap.values());

        for (int r = headerRowIndex + 1; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) continue;

            result.setTotalRows(result.getTotalRows() + 1);

            try {
                processRow(row, r + 1, columnMap, existingClientsByName, processedClientNames,
                        clientsToInsert, clientsToUpdate, vehiclesToInsert, contractsToInsert, result);
            } catch (Exception e) {
                log.error("Erro na linha {}: ", r + 1, e);
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors().add(String.format("Linha %d: %s", r + 1, e.getMessage()));
            }
        }
    }

    private Map<Integer, String> mapHeaders(Row headerRow) {
        Map<Integer, String> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = getCellValueAsString(cell);
            if (val == null || val.isBlank()) continue;

            String normalized = normalizeText(val);

            if (normalized.contains("cliente") || normalized.contains("obra") || normalized.contains("client")) {
                map.put(cell.getColumnIndex(), "CLIENTE_OBRA");
            } else if (normalized.contains("quantidade") || normalized.contains("qtd") || normalized.contains("veiculo")) {
                map.put(cell.getColumnIndex(), "QUANTIDADE");
            } else if (normalized.contains("descri") || normalized.contains("tipo") && normalized.contains("onibus")) {
                map.put(cell.getColumnIndex(), "DESCRICAO");
            } else if (normalized.contains("servico") || normalized.contains("servi")) {
                map.put(cell.getColumnIndex(), "TIPO_SERVICO");
            } else if (normalized.contains("valor") && normalized.contains("veiculo")) {
                map.put(cell.getColumnIndex(), "VALOR_VEICULO");
            } else if (normalized.contains("valor") && normalized.contains("mensal")) {
                map.put(cell.getColumnIndex(), "VALOR_MENSAL");
            } else if (normalized.contains("vigencia") || normalized.contains("vigência") || normalized.contains("periodo")) {
                map.put(cell.getColumnIndex(), "VIGENCIA");
            }
        }
        return map;
    }

    private void processRow(Row row, int rowNum, Map<Integer, String> columnMap,
                            Map<String, Client> existingClientsByName,
                            Set<String> processedClientNames,
                            List<Client> clientsToInsert, List<Client> clientsToUpdate,
                            List<Vehicle> vehiclesToInsert, List<Contract> contractsToInsert,
                            ImportResultDto result) {

        String clienteObra = null;
        Integer quantidade = null;
        String descricao = null;
        String tipoServico = null;
        BigDecimal valorPorVeiculo = null;
        BigDecimal valorMensal = null;
        String vigencia = null;

        for (Map.Entry<Integer, String> entry : columnMap.entrySet()) {
            Cell cell = row.getCell(entry.getKey());
            String val = getCellValueAsString(cell);
            if (val == null || val.isBlank()) continue;

            switch (entry.getValue()) {
                case "CLIENTE_OBRA": clienteObra = val.trim(); break;
                case "QUANTIDADE": quantidade = parseInteger(val); break;
                case "DESCRICAO": descricao = val.trim(); break;
                case "TIPO_SERVICO": tipoServico = val.trim(); break;
                case "VALOR_VEICULO": valorPorVeiculo = parseBigDecimal(val); break;
                case "VALOR_MENSAL": valorMensal = parseBigDecimal(val); break;
                case "VIGENCIA": vigencia = val.trim(); break;
            }
        }

        // Validar campo obrigatório
        if (clienteObra == null || clienteObra.isBlank()) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }

        String normalizedName = normalizeText(clienteObra);

        // Evitar duplicatas no arquivo
        if (processedClientNames.contains(normalizedName)) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }
        processedClientNames.add(normalizedName);

        UUID companyId = TenantContext.get();

        // 1. Criar ou atualizar Cliente
        Client client = existingClientsByName.get(normalizedName);
        if (client == null) {
            client = new Client();
            client.setName(truncateString(clienteObra, 255));
            // CNPJ temporário baseado no nome (será atualizado depois)
            String tempCnpj = generateTempCnpj(clienteObra);
            client.setCnpj(tempCnpj);
            client.setStatus(ClientStatus.ACTIVE);
            if (companyId != null) client.setCompanyId(companyId);
            if (tipoServico != null) {
                client.setNotes("Serviços: " + truncateString(tipoServico, 500));
            }
            clientsToInsert.add(client);
            existingClientsByName.put(normalizedName, client);
            log.info("Novo cliente: {}", clienteObra);
        } else {
            // Atualizar notas se tem tipo de serviço
            if (tipoServico != null && client.getNotes() == null) {
                client.setNotes("Serviços: " + truncateString(tipoServico, 500));
                clientsToUpdate.add(client);
            }
        }

        // 2. Determinar tipo de veículo baseado na descrição
        Vehicle.VehicleType vehicleType = mapDescriptionToVehicleType(descricao);
        Vehicle.BusType busType = mapDescriptionToBusType(descricao);

        // 3. Criar veículos alocados
        int qty = (quantidade != null && quantidade > 0) ? quantidade : 1;
        for (int i = 0; i < qty; i++) {
            Vehicle vehicle = new Vehicle();
            // Gerar placa temporária única
            String tempPlate = generateTempPlate(clienteObra, i);
            vehicle.setPlate(tempPlate);
            vehicle.setModel(descricao != null ? truncateString(descricao, 50) : "Não especificado");
            vehicle.setBrand("A definir");
            vehicle.setYear(LocalDate.now().getYear());
            vehicle.setColor("A definir");
            vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE);
            vehicle.setFuelType(Vehicle.FuelType.DIESEL);
            vehicle.setVehicleType(vehicleType);
            vehicle.setBusType(busType);
            vehicle.setCapacity(44);
            vehicle.setCurrentMileage(0);
            vehicle.setClientName(truncateString(clienteObra, 200));
            if (companyId != null) vehicle.setCompanyId(companyId);

            // Alocar valor por veículo como marketValue
            if (valorPorVeiculo != null) {
                vehicle.setMarketValue(valorPorVeiculo);
            }

            vehiclesToInsert.add(vehicle);
        }

        // 4. Criar Contrato
        Contract contract = new Contract();
        contract.setContractNumber(generateContractNumber(clienteObra));
        contract.setDescription("Contrato de prestação de serviços - " + truncateString(clienteObra, 450));
        contract.setClient(client);
        contract.setContractType(ContractType.LOCACAO_VEICULOS);
        contract.setStatus(ContractStatus.ACTIVE);

        // Valor do contrato = valor mensal ou (valorPorVeiculo * quantidade)
        if (valorMensal != null && valorMensal.compareTo(BigDecimal.ZERO) > 0) {
            contract.setValue(valorMensal);
        } else if (valorPorVeiculo != null && qty > 0) {
            contract.setValue(valorPorVeiculo.multiply(BigDecimal.valueOf(qty)));
        } else {
            contract.setValue(BigDecimal.ZERO);
        }

        // Parse vigência
        LocalDate[] dates = parseVigencia(vigencia);
        if (dates[0] != null) contract.setStartDate(dates[0]);
        if (dates[1] != null) contract.setEndDate(dates[1]);

        if (tipoServico != null) {
            contract.setNotes("Serviços: " + truncateString(tipoServico, 500));
        }

        contractsToInsert.add(contract);

        result.setTotalRows(result.getTotalRows());
        log.info("Linha {}: Cliente={}, Qtd={}, Tipo={}, Valor/Mês={}",
                rowNum, clienteObra, qty, vehicleType, contract.getValue());
    }

    /**
     * Mapeia a descrição da planilha para o VehicleType
     */
    private Vehicle.VehicleType mapDescriptionToVehicleType(String descricao) {
        if (descricao == null) return Vehicle.VehicleType.OTHER;

        String norm = normalizeText(descricao);

        if (norm.contains("rodoviario") || norm.contains("rodoviário") || norm.contains("intermunicipal")) {
            return Vehicle.VehicleType.BUS_ROAD;
        }
        if (norm.contains("luxo") || norm.contains("turismo") || norm.contains("double decker") || norm.contains("dd")) {
            return Vehicle.VehicleType.BUS_LUXURY_TOURISM;
        }
        if (norm.contains("urbano") || norm.contains("cidade") || norm.contains("municipal")) {
            return Vehicle.VehicleType.BUS_URBAN;
        }
        if (norm.contains("micro") || norm.contains("minibus")) {
            return Vehicle.VehicleType.MINIBUS;
        }
        if (norm.contains("van")) {
            return Vehicle.VehicleType.VAN;
        }
        if (norm.contains("utilitario") || norm.contains("utilitário")) {
            return Vehicle.VehicleType.CAR_UTILITY;
        }
        if (norm.contains("carro") || norm.contains("sedan") || norm.contains("hatch")) {
            return Vehicle.VehicleType.CAR;
        }
        if (norm.contains("caminhao") || norm.contains("caminhão")) {
            return Vehicle.VehicleType.TRUCK;
        }
        if (norm.contains("moto")) {
            return Vehicle.VehicleType.MOTORCYCLE;
        }
        if (norm.contains("pickup")) {
            return Vehicle.VehicleType.PICKUP;
        }
        if (norm.contains("suv")) {
            return Vehicle.VehicleType.SUV;
        }

        return Vehicle.VehicleType.BUS_ROAD; // Default para frota de ônibus
    }

    /**
     * Mapeia a descrição para o BusType
     */
    private Vehicle.BusType mapDescriptionToBusType(String descricao) {
        if (descricao == null) return null;

        String norm = normalizeText(descricao);

        if (norm.contains("rodoviario") || norm.contains("rodoviário")) {
            return Vehicle.BusType.RODOVIARIO;
        }
        if (norm.contains("luxo") || norm.contains("turismo")) {
            return Vehicle.BusType.LUXO_TURISMO;
        }
        if (norm.contains("double decker") || norm.contains("dd")) {
            return Vehicle.BusType.DOUBLE_DECKER;
        }
        if (norm.contains("urbano")) {
            return Vehicle.BusType.URBANO;
        }
        if (norm.contains("articulado")) {
            return Vehicle.BusType.ARTICULADO;
        }
        if (norm.contains("micro")) {
            return Vehicle.BusType.MICRO_ONIBUS;
        }
        if (norm.contains("escolar")) {
            return Vehicle.BusType.ESCOLA;
        }
        if (norm.contains("fretado")) {
            return Vehicle.BusType.FRETADO;
        }

        return null;
    }

    /**
     * Gera CNPJ temporário baseado no hash do nome
     */
    private String generateTempCnpj(String name) {
        int hash = Math.abs(name.hashCode());
        String digits = String.format("%014d", hash % 10000000000000L);
        // Formatar como XX.XXX.XXX/XXXX-XX
        return digits.substring(0, 2) + "." + digits.substring(2, 5) + "." + digits.substring(5, 8) +
                "/" + digits.substring(8, 12) + "-" + digits.substring(12, 14);
    }

    /**
     * Gera placa temporária única: OBR + hash
     */
    private String generateTempPlate(String clientName, int index) {
        int hash = Math.abs((clientName + index).hashCode());
        String suffix = String.format("%04d", hash % 10000);
        return "OBR" + suffix;
    }

    /**
     * Gera número de contrato
     */
    private String generateContractNumber(String clientName) {
        int hash = Math.abs(clientName.hashCode());
        return "QO-" + LocalDate.now().getYear() + "-" + String.format("%06d", hash % 1000000);
    }

    /**
     * Parse da vigência (pode ser "MM/YYYY a MM/YYYY", "DD/MM/YYYY a DD/MM/YYYY", etc.)
     */
    private LocalDate[] parseVigencia(String vigencia) {
        LocalDate start = null;
        LocalDate end = null;

        if (vigencia == null || vigencia.isBlank()) return new LocalDate[]{start, end};

        String[] separators = {" a ", " - ", " até ", " ~ ", " to ", "/"};
        String[] parts = null;

        for (String sep : separators) {
            if (vigencia.toLowerCase().contains(sep.toLowerCase())) {
                parts = vigencia.split("(?i)" + Pattern.quote(sep), 2);
                break;
            }
        }

        if (parts != null && parts.length == 2) {
            start = parseDate(parts[0].trim());
            end = parseDate(parts[1].trim());
        } else {
            // Tentar parsear como data única
            start = parseDate(vigencia.trim());
        }

        return new LocalDate[]{start, end};
    }

    /**
     * Tenta parsear data em vários formatos
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;

        String[] patterns = {
                "dd/MM/yyyy", "MM/yyyy", "yyyy-MM-dd", "dd-MM-yyyy",
                "dd/MM/yy", "MM/yy", "MMMM/yyyy", "MMM/yyyy"
        };

        for (String pattern : patterns) {
            try {
                if (pattern.equals("MM/yyyy") || pattern.equals("MM/yy") || pattern.equals("MMMM/yyyy") || pattern.equals("MMM/yyyy")) {
                    // Para meses, usar dia 1
                    DateTimeFormatter fmt = DateTimeFormatter.ofPattern(pattern, new Locale("pt", "BR"));
                    LocalDate date = LocalDate.parse("01/" + dateStr, DateTimeFormatter.ofPattern("dd/" + pattern, new Locale("pt", "BR")));
                    return date;
                }
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern(pattern, new Locale("pt", "BR"));
                return LocalDate.parse(dateStr, fmt);
            } catch (DateTimeParseException ignored) {}
        }

        // Último recurso: tentar extrair mês/ano
        Matcher m = Pattern.compile("(\\d{1,2})[/-](\\d{4})").matcher(dateStr);
        if (m.find()) {
            try {
                int month = Integer.parseInt(m.group(1));
                int year = Integer.parseInt(m.group(2));
                if (month >= 1 && month <= 12) {
                    return LocalDate.of(year, month, 1);
                }
            } catch (Exception ignored) {}
        }

        return null;
    }

    private BigDecimal parseBigDecimal(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            String cleaned = val.trim().replaceAll("[^0-9,.-]", "").replace(",", ".");
            if (cleaned.isBlank()) return null;
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInteger(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            String cleaned = val.trim().replaceAll("[^0-9]", "");
            if (cleaned.isBlank()) return null;
            return Integer.parseInt(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private String truncateString(String str, int maxLen) {
        if (str == null) return null;
        return str.length() > maxLen ? str.substring(0, maxLen) : str;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase().trim();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        switch (type) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) return String.format("%.0f", num);
                return String.valueOf(num);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellValueAsString(cell);
                if (val != null && !val.isBlank()) return false;
            }
        }
        return true;
    }
}
