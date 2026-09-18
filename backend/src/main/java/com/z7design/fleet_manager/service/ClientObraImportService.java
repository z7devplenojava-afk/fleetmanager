package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.ContractType;
import com.z7design.fleet_manager.model.enums.WorkPostStatus;
import com.z7design.fleet_manager.model.enums.WorkPostType;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serviço de importação da planilha "QUADRO DE OBRAS"
 * Colunas esperadas:
 *   CLIENTE/OBRA | QUANTIDADE DE VEÍCULOS | DESCRIÇÃO (tipo de ônibus) | TIPOS DE SERVIÇOS | VALOR POR VEÍCULO | VALOR MENSAL | VIGÊNCIA
 *
 * A importação:
 *   1. Extrai Cliente e Obra do campo CLIENTE/OBRA
 *   2. Cria ou atualiza o Cliente (busca por nome)
 *   3. Cria o Contrato com obra, quantidade de veículos, valor unitário, valor mensal, tipo serviço e vigência/aditivos
 *   4. Cria o Posto de Trabalho (Obra) associado ao cliente e ao contrato
 *   5. Cria veículos alocados à obra e ao cliente
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientObraImportService {

    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final ContractRepository contractRepository;
    private final WorkPostRepository workPostRepository;
    private final PlatformTransactionManager transactionManager;
    private final UserCompanyResolver userCompanyResolver;
    private static final int BATCH_SIZE = 100;
    private final AtomicInteger plateSeq = new AtomicInteger(1000);
    private final AtomicInteger cnpjSeq = new AtomicInteger(10000);
    private final AtomicInteger contractSeq = new AtomicInteger(1000);
    private final AtomicInteger postCodeSeq = new AtomicInteger(1000);

    public ImportResultDto importFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de importação está vazio ou não foi enviado.");
        }

        long startTime = System.currentTimeMillis();
        ImportResultDto result = ImportResultDto.empty();
        log.info("📥 Iniciando importação otimizada de QUADRO DE OBRAS: {}", file.getOriginalFilename());

        UUID currentTenantCompanyId = userCompanyResolver.resolveCurrentCompanyId();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            // Pré-carregar clientes existentes por nome e CNPJs da empresa atual
            Map<String, Client> existingClientsByName = new HashMap<>();
            Set<String> usedCnpjs = new HashSet<>();
            try {
                List<Client> allClients = currentTenantCompanyId != null
                        ? clientRepository.findByCompanyId(currentTenantCompanyId)
                        : clientRepository.findAll();
                for (Client c : allClients) {
                    if (c.getName() != null) {
                        existingClientsByName.put(normalizeText(c.getName()), c);
                    }
                    if (c.getCnpj() != null) {
                        usedCnpjs.add(c.getCnpj().replaceAll("[^0-9]", ""));
                    }
                }
            } catch (Exception e) {
                log.warn("Aviso ao pré-carregar clientes: {}", e.getMessage());
            }

            // Pré-carregar placas existentes da empresa atual
            Set<String> usedPlates = new HashSet<>();
            try {
                List<Vehicle> allVehicles = currentTenantCompanyId != null
                        ? vehicleRepository.findByCompanyId(currentTenantCompanyId)
                        : vehicleRepository.findAll();
                for (Vehicle v : allVehicles) {
                    if (v.getPlate() != null) {
                        usedPlates.add(v.getPlate().toUpperCase().trim());
                    }
                }
            } catch (Exception e) {
                log.warn("Aviso ao pré-carregar veículos: {}", e.getMessage());
            }

            // Pré-carregar números de contrato existentes da empresa atual
            Set<String> usedContractNumbers = new HashSet<>();
            try {
                List<Contract> allContracts = currentTenantCompanyId != null
                        ? contractRepository.findByCompanyId(currentTenantCompanyId)
                        : contractRepository.findAll();
                for (Contract c : allContracts) {
                    if (c.getContractNumber() != null) {
                        usedContractNumbers.add(c.getContractNumber().toUpperCase().trim());
                    }
                }
            } catch (Exception e) {
                log.warn("Aviso ao pré-carregar contratos: {}", e.getMessage());
            }

            // Pré-carregar códigos de postos de trabalho existentes da empresa atual
            Set<String> usedPostCodes = new HashSet<>();
            try {
                List<WorkPost> allWorkPosts = currentTenantCompanyId != null
                        ? workPostRepository.findByCompanyId(currentTenantCompanyId)
                        : workPostRepository.findAll();
                for (WorkPost wp : allWorkPosts) {
                    if (wp.getPostCode() != null) {
                        usedPostCodes.add(wp.getPostCode().toUpperCase().trim());
                    }
                }
            } catch (Exception e) {
                log.warn("Aviso ao pré-carregar postos de trabalho: {}", e.getMessage());
            }

            log.info("Pré-carregamento concluído para Tenant [{}]: Clientes={}, Placas={}, CNPJs={}, Contratos={}, Postos={}",
                    currentTenantCompanyId, existingClientsByName.size(), usedPlates.size(), usedCnpjs.size(), usedContractNumbers.size(), usedPostCodes.size());

            List<Client> clientsToInsert = new ArrayList<>();
            List<Client> clientsToUpdate = new ArrayList<>();
            List<WorkPost> workPostsToInsert = new ArrayList<>();
            List<Vehicle> vehiclesToInsert = new ArrayList<>();
            List<Contract> contractsToInsert = new ArrayList<>();

            Set<String> processedClientNames = new HashSet<>();

            int numberOfSheets = workbook.getNumberOfSheets();
            for (int s = 0; s < numberOfSheets; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                if (workbook.isSheetHidden(s) || sheet.getPhysicalNumberOfRows() == 0) continue;

                processSheet(sheet, result, existingClientsByName, processedClientNames,
                        usedCnpjs, usedPlates, usedContractNumbers, usedPostCodes,
                        clientsToInsert, clientsToUpdate, workPostsToInsert, vehiclesToInsert, contractsToInsert);
            }

            // Persistir em lotes com transação otimizada
            if (!clientsToInsert.isEmpty() || !clientsToUpdate.isEmpty() ||
                    !contractsToInsert.isEmpty() || !workPostsToInsert.isEmpty() || !vehiclesToInsert.isEmpty()) {

                log.info("Persistindo em lote: {} clientes novos, {} atualizados, {} contratos, {} postos/obras, {} veículos",
                        clientsToInsert.size(), clientsToUpdate.size(),
                        contractsToInsert.size(), workPostsToInsert.size(), vehiclesToInsert.size());

                TransactionTemplate tt = new TransactionTemplate(transactionManager);
                tt.executeWithoutResult(status -> {
                    saveInChunks(clientsToInsert, clientRepository::saveAll);
                    saveInChunks(clientsToUpdate, clientRepository::saveAll);
                    saveInChunks(contractsToInsert, contractRepository::saveAll);
                    saveInChunks(workPostsToInsert, workPostRepository::saveAll);
                    saveInChunks(vehiclesToInsert, vehicleRepository::saveAll);
                });

                result.setInserted(clientsToInsert.size() + contractsToInsert.size() + workPostsToInsert.size() + vehiclesToInsert.size());
                result.setUpdated(clientsToUpdate.size());
            }

        } catch (Exception e) {
            log.error("Erro crítico ao ler planilha: ", e);
            result.getErrors().add("Falha ao ler arquivo: " + e.getMessage());
        }

        long elapsedTime = System.currentTimeMillis() - startTime;
        log.info("✅ Importação concluída em {} ms. Inseridos: {}, Atualizados: {}, Erros: {}",
                elapsedTime, result.getInserted(), result.getUpdated(), result.getErrors().size());

        return result;
    }

    private <T> void saveInChunks(List<T> items, java.util.function.Consumer<List<T>> saveFunction) {
        if (items == null || items.isEmpty()) return;
        for (int i = 0; i < items.size(); i += BATCH_SIZE) {
            List<T> chunk = items.subList(i, Math.min(i + BATCH_SIZE, items.size()));
            saveFunction.accept(chunk);
        }
    }

    private void processSheet(Sheet sheet, ImportResultDto result,
                               Map<String, Client> existingClientsByName,
                               Set<String> processedClientNames,
                               Set<String> usedCnpjs, Set<String> usedPlates, Set<String> usedContractNumbers, Set<String> usedPostCodes,
                               List<Client> clientsToInsert, List<Client> clientsToUpdate,
                               List<WorkPost> workPostsToInsert, List<Vehicle> vehiclesToInsert, List<Contract> contractsToInsert) {

        int lastRowNum = sheet.getLastRowNum();
        if (lastRowNum < 0) return;

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

        for (int r = headerRowIndex + 1; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) continue;

            result.setTotalRows(result.getTotalRows() + 1);

            try {
                processRow(row, r + 1, columnMap, existingClientsByName, processedClientNames,
                        usedCnpjs, usedPlates, usedContractNumbers, usedPostCodes,
                        clientsToInsert, clientsToUpdate, workPostsToInsert, vehiclesToInsert, contractsToInsert, result);
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
            } else if (normalized.contains("descri") || (normalized.contains("tipo") && normalized.contains("onibus"))) {
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
                            Set<String> usedCnpjs, Set<String> usedPlates, Set<String> usedContractNumbers, Set<String> usedPostCodes,
                            List<Client> clientsToInsert, List<Client> clientsToUpdate,
                            List<WorkPost> workPostsToInsert, List<Vehicle> vehiclesToInsert, List<Contract> contractsToInsert,
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

        if (clienteObra == null || clienteObra.isBlank()) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }

        // 1. Extrair Cliente e Obra
        String[] parsed = parseClientAndObraName(clienteObra);
        String clientName = parsed[0];
        String obraName = parsed[1];

        String normalizedClientName = normalizeText(clientName);
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();

        // 2. Criar ou reutilizar Cliente
        Client client = existingClientsByName.get(normalizedClientName);
        if (client == null) {
            client = new Client();
            client.setName(truncateString(clientName, 255));
            String tempCnpj = generateUniqueCnpj(clientName, usedCnpjs);
            client.setCnpj(tempCnpj);
            client.setStatus(ClientStatus.ACTIVE);
            if (companyId != null) client.setCompanyId(companyId);
            if (tipoServico != null) {
                client.setNotes("Serviços: " + truncateString(tipoServico, 500));
            }
            clientsToInsert.add(client);
            existingClientsByName.put(normalizedClientName, client);
        } else {
            boolean updated = false;
            if (client.getCompanyId() == null && companyId != null) {
                client.setCompanyId(companyId);
                updated = true;
            }
            if (tipoServico != null && client.getNotes() == null) {
                client.setNotes("Serviços: " + truncateString(tipoServico, 500));
                updated = true;
            }
            if (updated) {
                clientsToUpdate.add(client);
            }
        }

        int qty = (quantidade != null && quantidade > 0) ? Math.min(quantidade, 100) : 1;

        // 3. Criar Contrato para esta obra/linha
        Contract contract = new Contract();
        contract.setContractNumber(generateUniqueContractNumber(clientName + "-" + obraName, usedContractNumbers));
        contract.setObraName(truncateString(obraName, 255));
        contract.setDescription("Contrato de " + (tipoServico != null ? tipoServico : "Locação") + " - Obra: " + truncateString(obraName, 200));
        contract.setClient(client);
        
        if (tipoServico != null && tipoServico.toUpperCase().contains("FRETAMENTO")) {
            contract.setContractType(ContractType.PRESTACAO_SERVICOS);
        } else {
            contract.setContractType(ContractType.LOCACAO_VEICULOS);
        }
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setServiceType(tipoServico);
        contract.setVehicleDescription(descricao);
        contract.setVehicleQuantity(qty);
        contract.setUnitVehicleValue(valorPorVeiculo);

        if (valorMensal != null && valorMensal.compareTo(BigDecimal.ZERO) > 0) {
            contract.setValue(valorMensal);
        } else if (valorPorVeiculo != null && qty > 0) {
            contract.setValue(valorPorVeiculo.multiply(BigDecimal.valueOf(qty)));
        } else {
            contract.setValue(BigDecimal.ZERO);
        }

        contract.setVigenciaText(vigencia);
        LocalDate[] dates = parseVigencia(vigencia);
        if (dates[0] != null) contract.setStartDate(dates[0]);
        else contract.setStartDate(LocalDate.now());

        if (dates[1] != null) contract.setEndDate(dates[1]);

        if (vigencia != null && !vigencia.isBlank()) {
            contract.setNotes("Vigência: " + truncateString(vigencia, 950));
        }

        contractsToInsert.add(contract);

        // 4. Criar Posto de Trabalho (Obra) associado ao Cliente e Contrato
        WorkPost workPost = new WorkPost();
        workPost.setPostCode(generateUniquePostCode(obraName, usedPostCodes));
        workPost.setName(truncateString(obraName, 255));
        workPost.setDescription("Obra/Setor: " + truncateString(obraName, 100) + (descricao != null ? " - " + truncateString(descricao, 300) : ""));
        workPost.setType(WorkPostType.POSTO_24H);
        workPost.setStatus(WorkPostStatus.ATIVO);
        workPost.setAddress(truncateString(obraName, 255));
        workPost.setCity("A definir");
        workPost.setState("MG");
        workPost.setClient(client);
        workPost.setContract(contract);
        workPost.setRequiredVigilantes(1);
        workPost.setWorkSchedule("12x36");
        workPost.setShiftStart(LocalTime.of(7, 0));
        workPost.setShiftEnd(LocalTime.of(19, 0));
        workPost.setCars(qty);
        if (vigencia != null && !vigencia.isBlank()) {
            workPost.setObservations("Vigência: " + truncateString(vigencia, 900));
        }
        workPostsToInsert.add(workPost);

        // 5. Criar veículos alocados a esta Obra
        Vehicle.VehicleType vehicleType = mapDescriptionToVehicleType(descricao);
        Vehicle.BusType busType = mapDescriptionToBusType(descricao);

        for (int i = 0; i < qty; i++) {
            Vehicle vehicle = new Vehicle();
            String tempPlate = generateUniquePlate(usedPlates);
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
            vehicle.setClientName(truncateString(clientName, 200));
            vehicle.setWorkPostEntity(workPost);
            if (companyId != null) vehicle.setCompanyId(companyId);
            if (valorPorVeiculo != null) {
                vehicle.setMarketValue(valorPorVeiculo);
            }

            vehiclesToInsert.add(vehicle);
        }
    }

    /**
     * Separa Nome do Cliente e Nome da Obra a partir de strings como:
     * "CONSTRUTORA BARBOSA MELLO S.A. (CONGONHAS-MG)" -> ["CONSTRUTORA BARBOSA MELLO S.A.", "CONGONHAS-MG"]
     * "ATERPA (ITABIRITO-MG)" -> ["ATERPA", "ITABIRITO-MG"]
     * "FM2C SERVIÇOS DE MANUTENÇÃO LTDA - (BETIM X RIBEIRÃO DAS NEVES)" -> ["FM2C SERVIÇOS DE MANUTENÇÃO LTDA", "BETIM X RIBEIRÃO DAS NEVES"]
     */
    public static String[] parseClientAndObraName(String cellVal) {
        if (cellVal == null || cellVal.isBlank()) {
            return new String[]{"CLIENTE DESCONHECIDO", "MATRIZ"};
        }
        String str = cellVal.trim();
        // Matcher para Padrão: CLIENTE (OBRA) ou CLIENTE - (OBRA)
        Matcher m = Pattern.compile("^(.*?)\\s*(?:-\\s*)?\\(([^)]+)\\)\\s*$").matcher(str);
        if (m.matches()) {
            String client = m.group(1).replaceAll("^\\s*-\\s*", "").trim();
            String obra = m.group(2).trim();
            if (client.isEmpty()) client = obra;
            return new String[]{client, obra};
        }

        // Matcher para Padrão: CLIENTE - OBRA
        if (str.contains(" - ")) {
            String[] parts = str.split("\\s+-\\s+", 2);
            return new String[]{parts[0].trim(), parts[1].trim()};
        }

        return new String[]{str, "MATRIZ"};
    }

    private String generateUniquePostCode(String name, Set<String> usedPostCodes) {
        while (true) {
            int seq = postCodeSeq.incrementAndGet();
            String candidate = String.format("PST-%05d", seq);
            if (!usedPostCodes.contains(candidate)) {
                usedPostCodes.add(candidate);
                return candidate;
            }
        }
    }

    private String generateUniqueCnpj(String name, Set<String> usedCnpjs) {
        int hash = Math.abs(name.hashCode()) % 10000000;
        while (true) {
            int seq = cnpjSeq.incrementAndGet();
            String digits = String.format("99%07d%03d01", hash, seq % 1000);
            if (digits.length() > 14) digits = digits.substring(0, 14);

            String formatted = digits.substring(0, 2) + "." + digits.substring(2, 5) + "." +
                    digits.substring(5, 8) + "/" + digits.substring(8, 12) + "-" + digits.substring(12, 14);

            if (!usedCnpjs.contains(digits) && !usedCnpjs.contains(formatted)) {
                usedCnpjs.add(digits);
                usedCnpjs.add(formatted);
                return formatted;
            }
        }
    }

    private String generateUniquePlate(Set<String> usedPlates) {
        while (true) {
            int seq = plateSeq.incrementAndGet();
            String candidate;
            if (seq < 9999) {
                candidate = String.format("OBR%04d", seq);
            } else {
                candidate = String.format("OB%05d", seq % 100000);
            }
            candidate = candidate.toUpperCase();
            if (!usedPlates.contains(candidate)) {
                usedPlates.add(candidate);
                return candidate;
            }
        }
    }

    private String generateUniqueContractNumber(String name, Set<String> usedContractNumbers) {
        int year = LocalDate.now().getYear();
        while (true) {
            int seq = contractSeq.incrementAndGet();
            String candidate = String.format("QO-%d-%06d", year, seq);
            if (!usedContractNumbers.contains(candidate)) {
                usedContractNumbers.add(candidate);
                return candidate;
            }
        }
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
