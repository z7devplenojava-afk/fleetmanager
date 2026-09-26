package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.StockNfeParsedDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessRequestDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessResponseDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.StockCategory;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.repository.StockItemRepository;
import com.z7design.fleet_manager.repository.StockMovementRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockNfeService {

    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;
    private final InvoiceRepository invoiceRepository;
    private final StockService stockService;
    private final UserCompanyResolver userCompanyResolver;

    /**
     * Faz o parse seguro do XML da NF-e e analisa previamente os itens e financeiro
     */
    @Transactional(readOnly = true)
    public StockNfeParsedDTO parseXml(MultipartFile file, UUID companyId) {
        try (InputStream is = file.getInputStream()) {
            return parseXml(is, companyId);
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Erro ao realizar parse do arquivo XML da NF-e: {}", e.getMessage(), e);
            throw new BusinessException("Não foi possível processar o XML da NF-e: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public StockNfeParsedDTO parseXml(InputStream xmlStream, UUID companyId) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(xmlStream);
            doc.getDocumentElement().normalize();

            // Chave de acesso
            String accessKey = "";
            NodeList infNfeNodes = doc.getElementsByTagName("infNFe");
            if (infNfeNodes.getLength() > 0) {
                Element infNfe = (Element) infNfeNodes.item(0);
                String idAttr = infNfe.getAttribute("Id");
                accessKey = idAttr.replaceAll("[^0-9]", "");
            }

            // Identificação (ide)
            String nNf = getTagValue(doc, "nNF");
            String serie = getTagValue(doc, "serie");
            String dhEmi = getTagValue(doc, "dhEmi");
            if (dhEmi == null || dhEmi.isEmpty()) {
                dhEmi = getTagValue(doc, "dEmi");
            }
            LocalDate issueDate = LocalDate.now();
            if (dhEmi != null && dhEmi.length() >= 10) {
                try {
                    issueDate = LocalDate.parse(dhEmi.substring(0, 10));
                } catch (Exception ignored) {
                }
            }

            // Emitente (emit)
            String cnpj = "";
            String xNome = "";
            String xFant = "";
            String xLgr = "";
            String nro = "";
            String xBairro = "";
            String xMun = "";
            String uf = "";
            String cep = "";

            NodeList emitNodes = doc.getElementsByTagName("emit");
            if (emitNodes.getLength() > 0) {
                Element emitEl = (Element) emitNodes.item(0);
                cnpj = getTagValue(emitEl, "CNPJ");
                if (cnpj == null || cnpj.isEmpty()) {
                    cnpj = getTagValue(emitEl, "CPF");
                }
                xNome = getTagValue(emitEl, "xNome");
                xFant = getTagValue(emitEl, "xFant");

                NodeList enderNodes = emitEl.getElementsByTagName("enderEmit");
                if (enderNodes.getLength() > 0) {
                    Element enderEl = (Element) enderNodes.item(0);
                    xLgr = getTagValue(enderEl, "xLgr");
                    nro = getTagValue(enderEl, "nro");
                    xBairro = getTagValue(enderEl, "xBairro");
                    xMun = getTagValue(enderEl, "xMun");
                    uf = getTagValue(enderEl, "UF");
                    cep = getTagValue(enderEl, "CEP");
                }
            }

            // Totais
            BigDecimal vProd = parseDecimal(getTagValue(doc, "vProd"));
            BigDecimal vNF = parseDecimal(getTagValue(doc, "vNF"));
            BigDecimal vFrete = parseDecimal(getTagValue(doc, "vFrete"));
            BigDecimal vDesc = parseDecimal(getTagValue(doc, "vDesc"));

            // Verificar se o fornecedor já existe
            UUID existingSupplierId = null;
            if (cnpj != null && !cnpj.isBlank()) {
                String cleanCnpj = cnpj.replaceAll("[^0-9]", "");
                Optional<Supplier> optSupplier = supplierRepository.findByCnpj(cleanCnpj);
                if (optSupplier.isEmpty()) {
                    optSupplier = supplierRepository.findByCnpj(cnpj);
                }
                if (optSupplier.isPresent()) {
                    existingSupplierId = optSupplier.get().getId();
                }
            }

            // Verificar duplicidade da Nota Fiscal
            boolean alreadyImported = false;
            String duplicateWarning = null;

            if (accessKey != null && !accessKey.isBlank()) {
                // Verificar em invoices pelo notes contendo a chave
                List<Invoice> existingInvoices = invoiceRepository.findByInvoiceNumberContaining(nNf);
                for (Invoice inv : existingInvoices) {
                    if (inv.getNotes() != null && inv.getNotes().contains(accessKey)) {
                        alreadyImported = true;
                        duplicateWarning = "Atenção: A NF-e nº " + nNf + " (Chave " + accessKey + ") já foi lançada no financeiro anteriormente.";
                        break;
                    }
                }
            }

            StockNfeParsedDTO dto = StockNfeParsedDTO.builder()
                    .accessKey(accessKey)
                    .invoiceNumber(nNf)
                    .series(serie)
                    .issueDate(issueDate)
                    .totalProductsAmount(vProd)
                    .totalInvoiceAmount(vNF)
                    .shippingAmount(vFrete)
                    .discountAmount(vDesc)
                    .supplierCnpj(cnpj)
                    .supplierName(xNome)
                    .supplierTradeName(xFant)
                    .supplierAddress(xLgr + (nro != null && !nro.isBlank() ? ", " + nro : "") + (xBairro != null && !xBairro.isBlank() ? " - " + xBairro : ""))
                    .supplierCity(xMun)
                    .supplierState(uf)
                    .supplierZipCode(cep)
                    .existingSupplierId(existingSupplierId)
                    .alreadyImported(alreadyImported)
                    .duplicateWarning(duplicateWarning)
                    .items(new ArrayList<>())
                    .installments(new ArrayList<>())
                    .build();

            // Extrair Itens (det)
            NodeList detNodes = doc.getElementsByTagName("det");
            for (int i = 0; i < detNodes.getLength(); i++) {
                Element detEl = (Element) detNodes.item(i);
                NodeList prodNodes = detEl.getElementsByTagName("prod");
                if (prodNodes.getLength() > 0) {
                    Element prodEl = (Element) prodNodes.item(0);
                    String cProd = getTagValue(prodEl, "cProd");
                    String cEAN = getTagValue(prodEl, "cEAN");
                    String xProd = getTagValue(prodEl, "xProd");
                    String ncm = getTagValue(prodEl, "NCM");
                    String cfop = getTagValue(prodEl, "CFOP");
                    String uCom = getTagValue(prodEl, "uCom");
                    BigDecimal qCom = parseDecimal(getTagValue(prodEl, "qCom"));
                    BigDecimal vUnCom = parseDecimal(getTagValue(prodEl, "vUnCom"));
                    BigDecimal vProdItem = parseDecimal(getTagValue(prodEl, "vProd"));

                    // Detecção de bateria e pneu
                    boolean isBattery = detectBattery(xProd);
                    boolean isTire = detectTire(xProd);
                    StockCategory suggestedCategory = detectCategory(xProd, isBattery, isTire);

                    // Busca de correspondência de item já existente no estoque
                    UUID matchedId = null;
                    String matchedCode = null;
                    String matchedName = null;
                    Integer matchedQty = null;

                    if (cProd != null && !cProd.isBlank()) {
                        Optional<StockItem> optItem = stockItemRepository.findByCode(cProd.trim());
                        if (optItem.isPresent()) {
                            StockItem found = optItem.get();
                            matchedId = found.getId();
                            matchedCode = found.getCode();
                            matchedName = found.getName();
                            matchedQty = found.getCurrentQuantity();
                        }
                    }

                    if (matchedId == null && xProd != null && !xProd.isBlank()) {
                        String searchPrefix = xProd.length() > 15 ? xProd.substring(0, 15) : xProd;
                        List<StockItem> byName = stockItemRepository.findByNameContainingIgnoreCase(searchPrefix);
                        if (!byName.isEmpty()) {
                            StockItem found = byName.get(0);
                            matchedId = found.getId();
                            matchedCode = found.getCode();
                            matchedName = found.getName();
                            matchedQty = found.getCurrentQuantity();
                        }
                    }

                    dto.getItems().add(StockNfeParsedDTO.StockNfeItemDTO.builder()
                            .productCode(cProd)
                            .barcode("SEM GTIN".equalsIgnoreCase(cEAN) ? "" : cEAN)
                            .description(xProd)
                            .ncm(ncm)
                            .cfop(cfop)
                            .unitOfMeasure(uCom != null ? uCom.toUpperCase().trim() : "UN")
                            .quantity(qCom)
                            .unitPrice(vUnCom)
                            .totalPrice(vProdItem)
                            .matchedStockItemId(matchedId)
                            .matchedStockItemCode(matchedCode)
                            .matchedStockItemName(matchedName)
                            .matchedStockItemQuantity(matchedQty)
                            .suggestedCategory(suggestedCategory)
                            .isBattery(isBattery)
                            .isTire(isTire)
                            .build());
                }
            }

            // Extrair Cobrança / Parcelas (dup)
            NodeList dupNodes = doc.getElementsByTagName("dup");
            for (int i = 0; i < dupNodes.getLength(); i++) {
                Element dupEl = (Element) dupNodes.item(i);
                String nDup = getTagValue(dupEl, "nDup");
                String dVenc = getTagValue(dupEl, "dVenc");
                BigDecimal vDup = parseDecimal(getTagValue(dupEl, "vDup"));

                int seq = i + 1;
                try {
                    if (nDup != null && !nDup.isEmpty()) {
                        seq = Integer.parseInt(nDup.replaceAll("[^0-9]", ""));
                    }
                } catch (Exception ignored) {
                }

                LocalDate dueDate = issueDate.plusDays(30L * (i + 1));
                if (dVenc != null && dVenc.length() >= 10) {
                    try {
                        dueDate = LocalDate.parse(dVenc.substring(0, 10));
                    } catch (Exception ignored) {
                    }
                }

                dto.getInstallments().add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                        .installmentNumber(seq)
                        .dueDate(dueDate)
                        .amount(vDup)
                        .barcode("")
                        .build());
            }

            return dto;
        } catch (Exception e) {
            log.error("Erro no processamento do XML da NF-e: {}", e.getMessage(), e);
            throw new BusinessException("Erro ao extrair dados do XML da NF-e: " + e.getMessage());
        }
    }

    /**
     * Processa a importação dos itens para o estoque e parcelas para o financeiro
     */
    @Transactional
    public StockNfeProcessResponseDTO processNfe(StockNfeProcessRequestDTO request, User user) {
        log.info("Processando importação de NF-e nº {} - Fornecedor: {}", request.getInvoiceNumber(), request.getSupplierName());

        UUID companyId = (user != null && user.getCompanyId() != null) 
                ? user.getCompanyId() 
                : (user != null ? userCompanyResolver.resolveCompanyId(user) : TenantContext.get());

        // 1. Garantir cadastro do Fornecedor
        Supplier supplier = resolveOrCreateSupplier(request, companyId);

        int itemsCreated = 0;
        int itemsUpdated = 0;
        int batteriesCreated = 0;
        int tiresCreated = 0;
        int financialAccountsCreated = 0;
        List<String> details = new ArrayList<>();

        // 2. Processar cada item selecionado
        for (StockNfeProcessRequestDTO.ProcessItemDTO itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            int qty = itemReq.getQuantity().intValue();
            BigDecimal unitCost = itemReq.getUnitCost() != null ? itemReq.getUnitCost() : BigDecimal.ZERO;

            if ("LINK_EXISTING".equalsIgnoreCase(itemReq.getAction()) && itemReq.getStockItemId() != null) {
                // Atualizar item existente
                StockItem stockItem = stockItemRepository.findById(itemReq.getStockItemId())
                        .orElseThrow(() -> new BusinessException("Item de estoque não encontrado: " + itemReq.getStockItemId()));

                int prevQty = stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0;
                int newQty = prevQty + qty;
                stockItem.setCurrentQuantity(newQty);
                stockItem.setUnitCost(unitCost);
                stockItem.setSupplier(request.getSupplierName());
                stockItem.setInvoiceNumber(request.getInvoiceNumber());
                stockItem = stockItemRepository.save(stockItem);

                // Criar movimentação de entrada
                StockMovement movement = new StockMovement();
                movement.setStockItem(stockItem);
                movement.setUser(user);
                movement.setMovementType(MovementType.ENTRADA);
                movement.setReason(MovementReason.COMPRA);
                movement.setQuantity(qty);
                movement.setPreviousQuantity(prevQty);
                movement.setNewQuantity(newQty);
                movement.setDocumentNumber(request.getInvoiceNumber());
                movement.setSupplier(request.getSupplierName());
                movement.setUnitCost(unitCost);
                movement.setTotalCost(unitCost.multiply(BigDecimal.valueOf(qty)));
                movement.setMovementDate(LocalDateTime.now());
                movement.setNotes("Entrada por importação de XML NF-e nº " + request.getInvoiceNumber() + 
                                  (request.getAccessKey() != null ? " [Chave: " + request.getAccessKey() + "]" : ""));
                movement = stockMovementRepository.save(movement);

                // Sincronizar baterias e pneus
                stockService.syncBatteryAndTireInbound(stockItem, qty, request.getInvoiceNumber(), request.getSupplierName(), unitCost, movement.getId());

                if (stockService.isBatteryItem(stockItem)) batteriesCreated += qty;
                if (stockService.isTireItem(stockItem)) tiresCreated += qty;

                itemsUpdated++;
                details.add(String.format("Item '%s' atualizado (+%d un, saldo: %d)", stockItem.getName(), qty, newQty));

            } else {
                // Criar novo item no estoque
                String code = itemReq.getCode() != null && !itemReq.getCode().isBlank() 
                        ? itemReq.getCode().trim() 
                        : "NF" + request.getInvoiceNumber() + "-" + (itemsCreated + 1);

                // Garantir unicidade do código
                if (stockItemRepository.existsByCode(code)) {
                    code = code + "-" + (System.currentTimeMillis() % 1000);
                }

                StockItem newItem = new StockItem();
                newItem.setCode(code);
                newItem.setName(itemReq.getName() != null && !itemReq.getName().isBlank() ? itemReq.getName() : "Item " + code);
                newItem.setCategory(itemReq.getCategory() != null ? itemReq.getCategory() : StockCategory.PECAS_MECANICA);
                newItem.setCurrentQuantity(qty);
                newItem.setMinimumQuantity(itemReq.getMinimumQuantity() != null ? itemReq.getMinimumQuantity() : 0);
                newItem.setUnitCost(unitCost);
                newItem.setAverageCost(unitCost);
                newItem.setSupplier(request.getSupplierName());
                newItem.setInvoiceNumber(request.getInvoiceNumber());
                newItem.setBarcode(itemReq.getBarcode());
                newItem.setDescription(itemReq.getDescription());
                newItem.setCaNumber(itemReq.getCaNumber());
                newItem.setCompanyId(companyId);
                newItem.setActive(true);
                newItem = stockItemRepository.save(newItem);

                // Criar movimentação de entrada inicial
                StockMovement movement = new StockMovement();
                movement.setStockItem(newItem);
                movement.setUser(user);
                movement.setMovementType(MovementType.ENTRADA);
                movement.setReason(MovementReason.COMPRA);
                movement.setQuantity(qty);
                movement.setPreviousQuantity(0);
                movement.setNewQuantity(qty);
                movement.setDocumentNumber(request.getInvoiceNumber());
                movement.setSupplier(request.getSupplierName());
                movement.setUnitCost(unitCost);
                movement.setTotalCost(unitCost.multiply(BigDecimal.valueOf(qty)));
                movement.setMovementDate(LocalDateTime.now());
                movement.setNotes("Saldo inicial por XML NF-e nº " + request.getInvoiceNumber());
                movement = stockMovementRepository.save(movement);

                // Sincronizar baterias e pneus
                stockService.syncBatteryAndTireInbound(newItem, qty, request.getInvoiceNumber(), request.getSupplierName(), unitCost, movement.getId());

                if (stockService.isBatteryItem(newItem)) batteriesCreated += qty;
                if (stockService.isTireItem(newItem)) tiresCreated += qty;

                itemsCreated++;
                details.add(String.format("Novo item '%s' (cód %s) cadastrado com %d un", newItem.getName(), newItem.getCode(), qty));
            }
        }

        // 3. Processar Módulo Financeiro (Contas a Pagar / Invoices)
        if (request.isCreateFinancialAccounts() && request.getInstallments() != null && !request.getInstallments().isEmpty()) {
            int totalInst = request.getInstallments().size();
            for (StockNfeProcessRequestDTO.ProcessInstallmentDTO instReq : request.getInstallments()) {
                if (instReq.getAmount() == null || instReq.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                String generatedInvoiceNum = String.format("NF-%s/%02d", request.getInvoiceNumber(), instReq.getInstallmentNumber());
                // Evitar duplicidade de fatura
                if (invoiceRepository.findFirstByInvoiceNumber(generatedInvoiceNum).isPresent()) {
                    generatedInvoiceNum = String.format("NF-%s/%02d-%d", request.getInvoiceNumber(), instReq.getInstallmentNumber(), System.currentTimeMillis() % 1000);
                }

                Invoice inv = new Invoice();
                inv.setCompanyId(companyId);
                inv.setInvoiceNumber(generatedInvoiceNum);
                inv.setDescription(String.format("NF-e nº %s - Parcela %d/%d - %s", 
                        request.getInvoiceNumber(), instReq.getInstallmentNumber(), totalInst, request.getSupplierName()));
                inv.setAmount(instReq.getAmount());
                inv.setDueDate(instReq.getDueDate() != null ? instReq.getDueDate() : LocalDate.now().plusDays(30));
                inv.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now());
                inv.setType(ExpenseType.VARIAVEL);
                inv.setStatus(ExpenseStatus.PENDENTE);
                inv.setSupplier(supplier);
                inv.setSupplierName(request.getSupplierName());
                inv.setSupplierCode(supplier != null ? supplier.getId().toString() : "");
                inv.setBarcode(instReq.getBarcode());
                inv.setInstallmentSeq(instReq.getInstallmentNumber());
                inv.setCategory("ALMOXARIFADO / PEÇAS");
                inv.setNotes(String.format("Importado via XML NF-e nº %s | Chave: %s %s", 
                        request.getInvoiceNumber(), 
                        request.getAccessKey() != null ? request.getAccessKey() : "N/I",
                        instReq.getNotes() != null ? " | " + instReq.getNotes() : ""));

                invoiceRepository.save(inv);
                financialAccountsCreated++;
                details.add(String.format("Conta a Pagar '%s' criada no valor de R$ %s vencendo em %s", 
                        generatedInvoiceNum, instReq.getAmount().toString(), inv.getDueDate().toString()));
            }
        }

        return StockNfeProcessResponseDTO.builder()
                .success(true)
                .message("NF-e processada com sucesso no Estoque e no Financeiro.")
                .supplierId(supplier != null ? supplier.getId() : null)
                .supplierName(supplier != null ? supplier.getName() : request.getSupplierName())
                .itemsCreated(itemsCreated)
                .itemsUpdated(itemsUpdated)
                .batteriesCreated(batteriesCreated)
                .tiresCreated(tiresCreated)
                .financialAccountsCreated(financialAccountsCreated)
                .details(details)
                .build();
    }

    /**
     * Localiza o fornecedor por CNPJ ou cadastra automaticamente
     */
    private Supplier resolveOrCreateSupplier(StockNfeProcessRequestDTO request, UUID companyId) {
        if (request.getSupplierId() != null) {
            return supplierRepository.findById(request.getSupplierId()).orElse(null);
        }

        String rawCnpj = request.getSupplierCnpj();
        if (rawCnpj != null && !rawCnpj.isBlank()) {
            String cleanCnpj = rawCnpj.replaceAll("[^0-9]", "");
            Optional<Supplier> found = supplierRepository.findByCnpj(cleanCnpj);
            if (found.isEmpty()) {
                found = supplierRepository.findByCnpj(rawCnpj);
            }
            if (found.isPresent()) {
                return found.get();
            }
        }

        // Criar novo fornecedor automaticamente
        if (request.getSupplierName() != null && !request.getSupplierName().isBlank()) {
            try {
                Supplier newSupplier = new Supplier();
                newSupplier.setName(request.getSupplierName().trim());
                newSupplier.setTradeName(request.getSupplierTradeName() != null && !request.getSupplierTradeName().isBlank() 
                        ? request.getSupplierTradeName().trim() 
                        : request.getSupplierName().trim());
                newSupplier.setCnpj(rawCnpj != null ? rawCnpj.replaceAll("[^0-9]", "") : "");
                newSupplier.setAddress(request.getSupplierAddress());
                newSupplier.setCity(request.getSupplierCity());
                newSupplier.setState(request.getSupplierState());
                newSupplier.setZipCode(request.getSupplierZipCode());
                newSupplier.setCompanyId(companyId);
                newSupplier.setIsActive(true);
                Supplier saved = supplierRepository.save(newSupplier);
                log.info("🏢 Fornecedor '{}' (CNPJ: {}) cadastrado automaticamente via XML", saved.getName(), saved.getCnpj());
                return saved;
            } catch (Exception e) {
                log.warn("Não foi possível salvar novo fornecedor automaticamente: {}", e.getMessage());
            }
        }
        return null;
    }

    private boolean detectBattery(String description) {
        if (description == null) return false;
        String lower = description.toLowerCase();
        return lower.contains("bateria") || lower.contains("battery") || lower.contains("acumulador");
    }

    private boolean detectTire(String description) {
        if (description == null) return false;
        String lower = description.toLowerCase();
        if (lower.contains("camara") || lower.contains("câmara") || lower.contains("roda ") || lower.contains("valvula")) {
            return false;
        }
        return lower.contains("pneu") || lower.contains("tire") || lower.contains("pneumatico") || lower.contains("pneumático");
    }

    private StockCategory detectCategory(String description, boolean isBattery, boolean isTire) {
        if (isBattery) return StockCategory.PECAS_ELETRICA;
        if (isTire) return StockCategory.PNEUS_RODAS;
        if (description == null) return StockCategory.PECAS_MECANICA;

        String lower = description.toLowerCase();
        if (lower.contains("oleo") || lower.contains("óleo") || lower.contains("lubrific") || lower.contains("fluido") || lower.contains("aditivo")) {
            return StockCategory.LUBRIFICANTES_FLUIDOS;
        }
        if (lower.contains("freio") || lower.contains("pastilha") || lower.contains("disco") || lower.contains("suspens") || lower.contains("amortecedor")) {
            return StockCategory.SISTEMA_FREIOS;
        }
        if (lower.contains("ar condicionado") || lower.contains("compressor") || lower.contains("gas r134") || lower.contains("filtro cabine")) {
            return StockCategory.AR_CONDICIONADO;
        }
        if (lower.contains("limpeza") || lower.contains("detergente") || lower.contains("shampoo") || lower.contains("desengrax")) {
            return StockCategory.LIMPEZA_HIGIENIZACAO;
        }
        if (lower.contains("luva") || lower.contains("óculos") || lower.contains("oculos") || lower.contains("capacete") || lower.contains("protetor") || lower.contains("bota")) {
            return StockCategory.EPI;
        }
        return StockCategory.PECAS_MECANICA;
    }

    private String getTagValue(Document doc, String tagName) {
        NodeList list = doc.getElementsByTagName(tagName);
        if (list.getLength() > 0 && list.item(0).getFirstChild() != null) {
            return list.item(0).getFirstChild().getNodeValue();
        }
        return "";
    }

    private String getTagValue(Element element, String tagName) {
        NodeList list = element.getElementsByTagName(tagName);
        if (list.getLength() > 0 && list.item(0).getFirstChild() != null) {
            return list.item(0).getFirstChild().getNodeValue();
        }
        return "";
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.trim().replace(",", "."));
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }
}
