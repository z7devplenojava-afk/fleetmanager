package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.StockNfeParsedDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessRequestDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessResponseDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.model.Unit;
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
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockNfeService {

    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;
    private final InvoiceRepository invoiceRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final StockService stockService;
    private final UserCompanyResolver userCompanyResolver;
    private final TesseractService tesseractService;

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
            String emitFone = "";
            String emitEmail = "";

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
                    emitFone = getTagValue(enderEl, "fone");
                }
                emitEmail = getTagValue(emitEl, "email");
            }

            // Destinatário / Cliente (dest)
            String destCnpj = "";
            String destNome = "";
            String destLgr = "";
            String destNro = "";
            String destBairro = "";
            String destMun = "";
            String destUf = "";
            String destCep = "";
            String destFone = "";

            NodeList destNodes = doc.getElementsByTagName("dest");
            if (destNodes.getLength() > 0) {
                Element destEl = (Element) destNodes.item(0);
                destCnpj = getTagValue(destEl, "CNPJ");
                if (destCnpj == null || destCnpj.isEmpty()) {
                    destCnpj = getTagValue(destEl, "CPF");
                }
                destNome = getTagValue(destEl, "xNome");

                NodeList enderDestNodes = destEl.getElementsByTagName("enderDest");
                if (enderDestNodes.getLength() > 0) {
                    Element enderDestEl = (Element) enderDestNodes.item(0);
                    destLgr = getTagValue(enderDestEl, "xLgr");
                    destNro = getTagValue(enderDestEl, "nro");
                    destBairro = getTagValue(enderDestEl, "xBairro");
                    destMun = getTagValue(enderDestEl, "xMun");
                    destUf = getTagValue(enderDestEl, "UF");
                    destCep = getTagValue(enderDestEl, "CEP");
                    destFone = getTagValue(enderDestEl, "fone");
                }
            }

            // Totais
            BigDecimal vProd = parseDecimal(getTagValue(doc, "vProd"));
            BigDecimal vNF = parseDecimal(getTagValue(doc, "vNF"));
            BigDecimal vFrete = parseDecimal(getTagValue(doc, "vFrete"));
            BigDecimal vDesc = parseDecimal(getTagValue(doc, "vDesc"));

            // Verificar se o fornecedor já existe
            UUID existingSupplierId = findExistingSupplierId(cnpj, companyId);

            // Verificar duplicidade da Nota Fiscal
            DuplicateCheck duplicateCheck = checkAlreadyImported(nNf, accessKey, cnpj, xNome, companyId);
            boolean alreadyImported = duplicateCheck.alreadyImported;
            String duplicateWarning = duplicateCheck.warning;

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
                    .supplierPhone(emitFone != null && !emitFone.isBlank() ? emitFone : null)
                    .supplierEmail(emitEmail != null && !emitEmail.isBlank() ? emitEmail : null)
                    .existingSupplierId(existingSupplierId)
                    .customerCnpj(destCnpj)
                    .customerName(destNome)
                    .customerAddress((destLgr != null ? destLgr : "") + (destNro != null && !destNro.isBlank() ? ", " + destNro : "") + (destBairro != null && !destBairro.isBlank() ? " - " + destBairro : ""))
                    .customerCity(destMun)
                    .customerState(destUf)
                    .customerZipCode(destCep)
                    .customerPhone(destFone != null && !destFone.isBlank() ? destFone : null)
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

                    Optional<StockItem> matchedItem = matchExistingItem(cProd, xProd, companyId);
                    if (matchedItem.isPresent()) {
                        StockItem found = matchedItem.get();
                        matchedId = found.getId();
                        matchedCode = found.getCode();
                        matchedName = found.getName();
                        matchedQty = found.getCurrentQuantity();
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
     * Faz o parse do PDF (DANFE) da NF-e, extraindo todos os dados disponíveis:
     * emitente, numeração, totais, itens (código do produto, descrição, NCM, CFOP,
     * quantidade e valores) e duplicatas.
     */
    @Transactional(readOnly = true)
    public StockNfeParsedDTO parsePdf(MultipartFile file, UUID companyId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Nenhum arquivo PDF foi fornecido para importação.");
        }
        try {
            byte[] fileBytes = file.getBytes();
            try (PDDocument document = PDDocument.load(fileBytes)) {
                if (document.isEncrypted()) {
                    throw new BusinessException("O PDF da NF-e está protegido por senha. Gere o DANFE sem senha e tente novamente.");
                }
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                String text = stripper.getText(document);

                // Se o PDF não contém texto nativo ou é uma digitalização / imagem
                if (text == null || text.isBlank() || text.trim().length() < 30) {
                    if (tesseractService != null && tesseractService.isAvailable()) {
                        log.info("PDF da NF-e sem texto nativo suficiente (tamanho: {}). Executando OCR via Tesseract...",
                                text != null ? text.trim().length() : 0);
                        try {
                            String ocrText = tesseractService.extractTextFromPdf(file);
                            if (ocrText != null && !ocrText.isBlank() && ocrText.trim().length() > (text != null ? text.trim().length() : 0)) {
                                text = ocrText;
                                log.info("OCR concluído com sucesso. Texto extraído: {} caracteres", text.length());
                            }
                        } catch (Exception ocrEx) {
                            log.warn("Tentativa de OCR Tesseract no PDF falhou: {}", ocrEx.getMessage());
                        }
                    }
                }

                if (text == null || text.isBlank() || text.trim().length() < 10) {
                    throw new BusinessException("Não foi possível extrair o texto deste PDF (o arquivo pode ser uma imagem digitalizada sem texto legível). Para maior precisão, importe o arquivo XML da NF-e.");
                }

                return parseDanfeText(text, companyId, file.getOriginalFilename());
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Erro ao realizar parse do PDF da NF-e: {}", e.getMessage(), e);
            throw new BusinessException("Não foi possível processar o PDF da NF-e: " + e.getMessage() + ". Para maior precisão, importe o arquivo XML da NF-e.");
        }
    }

    /**
     * Extrai as informações do DANFE a partir do texto do PDF e monta o DTO de conferência prévia.
     */
    public StockNfeParsedDTO parseDanfeText(String rawText, UUID companyId) {
        return parseDanfeText(rawText, companyId, null);
    }

    public StockNfeParsedDTO parseDanfeText(String rawText, UUID companyId, String filename) {
        try {
            String normalized = rawText.replace("\r\n", "\n").replace('\r', '\n');
            List<String> lines = new ArrayList<>();
            for (String line : normalized.split("\n")) {
                String trimmed = line.replaceAll("[\\s\u00A0]+$", "").trim();
                if (!trimmed.isEmpty()) {
                    lines.add(trimmed);
                }
            }
            String flat = String.join(" | ", lines);

            // Chave de acesso (44 dígitos) - extraída do nome do arquivo ou do texto do PDF
            String accessKey = extractAccessKey(flat, filename);

            // Número e série da NF-e
            String nNf = extractInvoiceNumber(flat);
            String serie = extractMatch(flat, "(?i)S[ÉE]RIE\\s*\\.?\\s*(\\d{1,3})");

            // Auto-recuperação autoritativa a partir da Chave de Acesso de 44 dígitos
            String keyCnpj = null;
            if (accessKey != null && accessKey.length() == 44) {
                // Dígitos 25-33: Número da NF (9 dígitos)
                try {
                    String rawNum = accessKey.substring(25, 34).replaceFirst("^0+(?!$)", "");
                    if (!rawNum.isEmpty()) {
                        nNf = rawNum;
                        log.info("Número da NF-e definido autoritativamente a partir da chave de acesso: {}", nNf);
                    }
                } catch (Exception ignored) {}

                // Dígitos 22-24: Série da NF (3 dígitos)
                try {
                    String rawSerie = accessKey.substring(22, 25).replaceFirst("^0+(?!$)", "");
                    if (!rawSerie.isEmpty()) {
                        serie = rawSerie;
                    }
                } catch (Exception ignored) {}

                // Dígitos 6-19: CNPJ do emitente (14 dígitos)
                try {
                    String rawCnpj = accessKey.substring(6, 20);
                    keyCnpj = formatCnpj(rawCnpj);
                } catch (Exception ignored) {}
            }

            // Emitente (nome, CNPJ e endereço) - consulta banco de dados se CNPJ for conhecido
            SupplierInfo supplierInfo = extractSupplier(lines, accessKey, companyId);
            if ((supplierInfo.cnpj == null || supplierInfo.cnpj.isBlank()) && keyCnpj != null) {
                supplierInfo.cnpj = keyCnpj;
            }

            // Data de emissão
            LocalDate issueDate = extractIssueDate(lines, flat);
            if (accessKey != null && accessKey.length() == 44) {
                try {
                    int keyYear = 2000 + Integer.parseInt(accessKey.substring(2, 4));
                    int keyMonth = Integer.parseInt(accessKey.substring(4, 6));
                    if (issueDate == null || issueDate.getYear() != keyYear || issueDate.getMonthValue() != keyMonth) {
                        int day = (issueDate != null) ? Math.min(issueDate.getDayOfMonth(), 28) : 1;
                        issueDate = LocalDate.of(keyYear, keyMonth, day);
                    }
                } catch (Exception ignored) {}
            }

            // Destinatário / Cliente
            CustomerInfo customerInfo = extractCustomer(lines);

            // Totais
            BigDecimal vProd = extractMoney(flat, "(?i)VALOR TOTAL DOS PRODUTOS|VALOR DOS PRODUTOS");
            BigDecimal vNF = extractMoney(flat, "(?i)V(?:ALOR)?\\.?\\s*TOTAL\\s*DA\\s*NOTA|V(?:ALOR)?\\.?\\s*TOTAL\\s*DA\\s*NF|TOTAL\\s*DA\\s*NOTA|VALOR\\s+L[ÍI]QUIDO|VLR\\.?\\s*TOTAL");
            BigDecimal vFrete = extractMoney(flat, "(?i)VALOR DO FRETE|TOTAL DO FRETE");
            BigDecimal vDesc = extractMoney(flat, "(?i)VALOR DO DESCONTO|TOTAL DO DESCONTO");

            // Itens da NF
            List<StockNfeParsedDTO.StockNfeItemDTO> items = extractItems(lines, companyId, vNF, flat, nNf, supplierInfo);

            BigDecimal itemsSum = items.stream()
                    .map(i -> i.getTotalPrice() != null ? i.getTotalPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (vProd == null || vProd.compareTo(BigDecimal.ZERO) == 0) {
                vProd = itemsSum;
            }
            if (vNF == null || vNF.compareTo(BigDecimal.ZERO) == 0) {
                vNF = itemsSum.compareTo(BigDecimal.ZERO) > 0 ? itemsSum : vProd;
            }

            // Cobrança / duplicatas (passa issueDate e vNF como fallback se não houver seção de duplicatas)
            List<StockNfeParsedDTO.StockNfeInstallmentDTO> installments = extractInstallments(lines, issueDate, vNF);

            UUID existingSupplierId = findExistingSupplierId(supplierInfo.cnpj, companyId);
            DuplicateCheck duplicateCheck = checkAlreadyImported(nNf, accessKey, supplierInfo.cnpj, supplierInfo.name, companyId);

            return StockNfeParsedDTO.builder()
                    .accessKey(accessKey)
                    .invoiceNumber(nNf)
                    .series(serie)
                    .issueDate(issueDate)
                    .totalProductsAmount(vProd)
                    .totalInvoiceAmount(vNF)
                    .shippingAmount(vFrete != null ? vFrete : BigDecimal.ZERO)
                    .discountAmount(vDesc != null ? vDesc : BigDecimal.ZERO)
                    .supplierCnpj(supplierInfo.cnpj)
                    .supplierName(supplierInfo.name)
                    .supplierTradeName(supplierInfo.tradeName)
                    .supplierAddress(supplierInfo.address)
                    .supplierCity(supplierInfo.city)
                    .supplierState(supplierInfo.state)
                    .supplierZipCode(supplierInfo.zipCode)
                    .supplierPhone(supplierInfo.phone != null && !supplierInfo.phone.isBlank() ? supplierInfo.phone : null)
                    .supplierEmail(supplierInfo.email != null && !supplierInfo.email.isBlank() ? supplierInfo.email : null)
                    .existingSupplierId(existingSupplierId)
                    .customerCnpj(customerInfo.cnpj)
                    .customerName(customerInfo.name)
                    .customerAddress(customerInfo.address)
                    .customerCity(customerInfo.city)
                    .customerState(customerInfo.state)
                    .customerZipCode(customerInfo.zipCode)
                    .customerPhone(customerInfo.phone != null && !customerInfo.phone.isBlank() ? customerInfo.phone : null)
                    .alreadyImported(duplicateCheck.alreadyImported)
                    .duplicateWarning(duplicateCheck.warning)
                    .items(items)
                    .installments(installments)
                    .build();
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Erro no processamento do PDF da NF-e: {}", e.getMessage(), e);
            throw new BusinessException("Erro ao extrair dados do PDF da NF-e: " + e.getMessage());
        }
    }

    private static final Set<Integer> VALID_UF_CODES = Set.of(
            11, 12, 13, 14, 15, 16, 17,
            21, 22, 23, 24, 25, 26, 27, 28, 29,
            31, 32, 33, 35,
            41, 42, 43,
            50, 51, 52, 53
    );

    private String extractAccessKey(String flat) {
        return extractAccessKey(flat, null);
    }

    private String extractAccessKey(String flat, String filename) {
        // 1. Verificar primeiro o nome do arquivo (arquivos baixados de ERPs/SEFAZ costumam conter a chave)
        if (filename != null && !filename.isBlank()) {
            String digitsInName = filename.replaceAll("\\D", "");
            String keyFromName = findValid44DigitKey(digitsInName);
            if (keyFromName != null) {
                log.info("Chave de acesso de 44 dígitos extraída com sucesso do nome do arquivo ({}): {}", filename, keyFromName);
                return keyFromName;
            }
        }

        if (flat == null || flat.isBlank()) {
            return "";
        }

        // 2. Procura chave rotulada explicitamente (com suporte a espaçamentos ou rótulo variado)
        Matcher labeled = Pattern.compile("(?i)CHAVE\\s+DE\\s+ACESSO[^0-9]{0,45}([0-9\\s.]{44,70})").matcher(flat);
        if (labeled.find()) {
            String digits = labeled.group(1).replaceAll("\\D", "");
            String key = findValid44DigitKey(digits);
            if (key != null) {
                return key;
            }
        }

        // 3. Procura blocos de 4 dígitos agrupados (padrão clássico de DANFE: 4444 4444 4444 ...)
        Matcher grouped = Pattern.compile("(?:\\b\\d{4}[\\s.-]+){10}\\d{4}\\b").matcher(flat);
        if (grouped.find()) {
            String digits = grouped.group().replaceAll("\\D", "");
            String key = findValid44DigitKey(digits);
            if (key != null) {
                return key;
            }
        }

        // 4. Procura sequências contínuas ou com separadores de 44+ dígitos
        Matcher matcher = Pattern.compile("(?<!\\d)(\\d(?:[\\s.]*\\d){43,70})(?!\\d)").matcher(flat);
        while (matcher.find()) {
            String digits = matcher.group(1).replaceAll("\\D", "");
            String key = findValid44DigitKey(digits);
            if (key != null) {
                return key;
            }
        }

        // 5. Varredura com janela deslizante de 44 dígitos sobre todos os números do texto
        String allDigits = flat.replaceAll("[^0-9]", "");
        String keyFromAll = findValid44DigitKey(allDigits);
        if (keyFromAll != null) {
            return keyFromAll;
        }

        return "";
    }

    private String findValid44DigitKey(String digits) {
        if (digits == null || digits.length() < 44) {
            return null;
        }
        for (int i = 0; i <= digits.length() - 44; i++) {
            String sub = digits.substring(i, i + 44);
            try {
                int uf = Integer.parseInt(sub.substring(0, 2));
                if (!VALID_UF_CODES.contains(uf)) {
                    continue;
                }
                int month = Integer.parseInt(sub.substring(4, 6));
                if (month < 1 || month > 12) {
                    continue;
                }
                String model = sub.substring(20, 22);
                if ("55".equals(model) || "65".equals(model)) {
                    return sub;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String formatCnpj(String digits) {
        if (digits == null || digits.length() != 14) return digits;
        return String.format("%s.%s.%s/%s-%s",
                digits.substring(0, 2),
                digits.substring(2, 5),
                digits.substring(5, 8),
                digits.substring(8, 12),
                digits.substring(12, 14));
    }

    private CustomerInfo extractCustomer(List<String> lines) {
        CustomerInfo info = new CustomerInfo();
        int destHeaderIdx = -1;
        for (int i = 0; i < lines.size(); i++) {
            String clean = removeAccents(lines.get(i).toUpperCase()).replaceAll("[^A-Z0-9/ ]", " ").trim();
            if (clean.contains("DESTINATARIO") || clean.contains("DESTINATARIO / REMETENTE") || clean.contains("DESTINATARIO/REMETENTE")) {
                destHeaderIdx = i;
                break;
            }
        }

        if (destHeaderIdx >= 0) {
            for (int i = destHeaderIdx + 1; i < Math.min(lines.size(), destHeaderIdx + 14); i++) {
                String line = lines.get(i);
                String upper = removeAccents(line.toUpperCase());
                if (upper.contains("CALCULO DO IMPOSTO") || upper.contains("FATURA") || upper.contains("DUPLICATA") 
                        || upper.contains("DADOS DO PRODUTO") || upper.contains("DADOS DAS DUPLICATAS")) {
                    break;
                }

                // CNPJ ou CPF do destinatário
                if (info.cnpj == null || info.cnpj.isBlank()) {
                    Matcher matcher = Pattern.compile("(?i)(?:CNPJ|CPF)\\s*[:.]?\\s*([\\d./-]{11,20})").matcher(line);
                    if (matcher.find()) {
                        info.cnpj = matcher.group(1).trim();
                    } else {
                        Matcher directCnpj = Pattern.compile("(?<!\\d)(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})(?!\\d)").matcher(line);
                        if (directCnpj.find()) {
                            info.cnpj = directCnpj.group(1).trim();
                        }
                    }
                }

                // Nome / Razão Social do cliente/destinatário
                if ((info.name == null || info.name.isBlank()) && containsLetters(line) && !isDanfeLabel(line) && line.length() > 3) {
                    if (!line.toUpperCase().contains("RUA ") && !line.toUpperCase().contains("AV ") && !line.toUpperCase().contains("AVENIDA") 
                            && !line.toUpperCase().contains("RODOVIA") && !line.matches(".*[A-Z]{2}\\s*CEP.*")) {
                        info.name = line.replaceAll("(?i)^NOME\\s*/\\s*RAZ[ÃA]O\\s+SOCIAL\\s*[:.]?\\s*", "").trim();
                    }
                }

                // Cidade / UF / CEP
                Matcher cityMatcher = Pattern.compile("(?i)([\\p{L} .]{2,40})\\s*/\\s*([A-Za-z]{2})(?:\\s*CEP\\s*[:.]?\\s*([\\d-]{8,9}))?").matcher(line);
                if (cityMatcher.find()) {
                    if (info.city == null || info.city.isBlank()) info.city = cityMatcher.group(1).trim();
                    if (info.state == null || info.state.isBlank()) info.state = cityMatcher.group(2).toUpperCase();
                    if (cityMatcher.group(3) != null && (info.zipCode == null || info.zipCode.isBlank())) {
                        info.zipCode = cityMatcher.group(3);
                    }
                }

                Matcher cepMatcher = Pattern.compile("(?i)CEP\\s*[:.]?\\s*([\\d-]{8,9})").matcher(line);
                if (cepMatcher.find() && (info.zipCode == null || info.zipCode.isBlank())) {
                    info.zipCode = cepMatcher.group(1);
                }

                Matcher foneMatcher = Pattern.compile("(?i)(?:FONE|TELEFONE|TEL\\.?)\\s*[:.]?\\s*([\\d().\\s/-]{7,25})").matcher(line);
                if (foneMatcher.find() && (info.phone == null || info.phone.isBlank())) {
                    info.phone = foneMatcher.group(1).trim();
                }

                if ((info.address == null || info.address.isBlank()) && (line.toUpperCase().contains("RUA ") || line.toUpperCase().contains("AV ") 
                        || line.toUpperCase().contains("AVENIDA") || line.toUpperCase().contains("RODOVIA") || line.toUpperCase().contains("ESTRADA"))) {
                    info.address = line.replaceAll("(?i)^ENDERE[ÇC]O\\s*[:.]?\\s*", "").trim();
                }
            }
        }
        return info;
    }

    private String extractInvoiceNumber(String flat) {
        String[] patterns = {
                "(?i)NF-?E?[^0-9]{0,10}N[º°O]\\s*\\.?\\s*([\\d.]{1,15})",
                "(?i)N[º°O]\\s*\\.?\\s*([\\d.]{1,15})"
        };
        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(flat);
            if (matcher.find()) {
                String digits = matcher.group(1).replaceAll("\\D", "");
                if (!digits.isEmpty()) {
                    String stripped = digits.replaceFirst("^0+(?!$)", "");
                    if (stripped.length() >= 1) {
                        return stripped;
                    }
                }
            }
        }
        return "";
    }

    private String extractMatch(String flat, String pattern) {
        Matcher matcher = Pattern.compile(pattern).matcher(flat);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private LocalDate extractIssueDate(List<String> lines, String flat) {
        Pattern datePattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})");
        for (int i = 0; i < lines.size(); i++) {
            String lower = lines.get(i).toLowerCase();
            if (lower.contains("miss") || lower.contains("data de emiss") || lower.contains("emissa")) {
                Matcher matcher = datePattern.matcher(lines.get(i));
                if (matcher.find()) {
                    return parsePtBrDate(matcher.group(1));
                }
                // rótulo sem valor na mesma linha: verifica as próximas 2 linhas
                for (int j = i + 1; j < Math.min(lines.size(), i + 3); j++) {
                    Matcher next = datePattern.matcher(lines.get(j));
                    if (next.find()) {
                        return parsePtBrDate(next.group(1));
                    }
                }
            }
        }
        Matcher first = datePattern.matcher(flat);
        if (first.find()) {
            return parsePtBrDate(first.group(1));
        }
        return LocalDate.now();
    }

    private LocalDate parsePtBrDate(String value) {
        try {
            return LocalDate.parse(value, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception ignored) {
            return LocalDate.now();
        }
    }

    private SupplierInfo extractSupplier(List<String> lines) {
        return extractSupplier(lines, null, null);
    }

    private SupplierInfo extractSupplier(List<String> lines, String accessKey, UUID companyId) {
        SupplierInfo info = new SupplierInfo();
        int cnpjIdx = -1;

        // 1. Procurar nas primeiras 35 linhas (bloco do emitente, antes do cabeçalho do destinatário)
        for (int i = 0; i < Math.min(lines.size(), 35); i++) {
            String line = lines.get(i);
            String norm = removeAccents(line).toUpperCase();
            if (norm.contains("DESTINATARIO") || norm.contains("REMETENTE")) {
                break;
            }

            Matcher matcher = Pattern.compile("(?i)CNPJ(?:\\s*/\\s*CPF)?\\s*[:.]?\\s*([\\d./-]{14,20})").matcher(line);
            if (matcher.find()) {
                info.cnpj = matcher.group(1).trim();
                cnpjIdx = i;
                break;
            }

            Matcher directCnpj = Pattern.compile("(?<!\\d)(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})(?!\\d)").matcher(line);
            if (directCnpj.find()) {
                info.cnpj = directCnpj.group(1).trim();
                cnpjIdx = i;
                break;
            }
        }

        // 2. Se não encontrou CNPJ nas linhas, mas temos a chave de acesso de 44 dígitos
        if ((info.cnpj == null || info.cnpj.isBlank()) && accessKey != null && accessKey.length() == 44) {
            try {
                String rawCnpj = accessKey.substring(6, 20);
                info.cnpj = formatCnpj(rawCnpj);
                log.info("CNPJ do emitente recuperado a partir da chave de acesso: {}", info.cnpj);
            } catch (Exception ignored) {}
        }

        // 3. Se temos o CNPJ, verificar se o fornecedor já existe no banco de dados para recuperar nome e dados oficiais
        if (info.cnpj != null && !info.cnpj.isBlank()) {
            try {
                Optional<Supplier> existing = findExistingSupplier(info.cnpj, companyId);
                if (existing.isPresent()) {
                    Supplier s = existing.get();
                    info.name = s.getName();
                    info.tradeName = s.getTradeName() != null ? s.getTradeName() : s.getName();
                    info.address = s.getAddress() != null ? s.getAddress() : "";
                    info.city = s.getCity() != null ? s.getCity() : "";
                    info.state = s.getState() != null ? s.getState() : "";
                    info.zipCode = s.getZipCode() != null ? s.getZipCode() : "";
                    info.phone = s.getPhone() != null ? s.getPhone() : "";
                    info.email = s.getEmail() != null ? s.getEmail() : "";
                    log.info("Fornecedor existente '{}' recuperado por CNPJ {}", info.name, info.cnpj);
                    return info;
                }
            } catch (Exception ex) {
                log.warn("Erro ao buscar fornecedor existente por CNPJ {}: {}", info.cnpj, ex.getMessage());
            }
        }

        // 4. Razão social / Nome do emitente a partir do texto
        if (cnpjIdx >= 0) {
            // Linhas acima do CNPJ, ignorando títulos, labels e endereços
            for (int i = cnpjIdx - 1; i >= 0 && i >= cnpjIdx - 5; i--) {
                String candidate = lines.get(i);
                if (isDanfeLabel(candidate) || isDocumentTitle(candidate) || isAddressLine(candidate)) {
                    if (isAddressLine(candidate) && info.address.isEmpty()) {
                        info.address = candidate;
                    }
                    continue;
                }
                String cleaned = cleanSupplierCandidate(candidate);
                if (!cleaned.isEmpty() && containsLetters(cleaned) && cleaned.length() >= 3) {
                    info.name = cleaned;
                    info.tradeName = cleaned;
                    break;
                }
            }
        }

        // Se ainda não encontrou o nome, busca nas primeiras 15 linhas (ignorando endereços)
        if (info.name == null || info.name.isBlank() || info.name.length() < 3) {
            for (int i = 0; i < Math.min(lines.size(), 15); i++) {
                String candidate = lines.get(i);
                if (isDanfeLabel(candidate) || isDocumentTitle(candidate) || isAddressLine(candidate)) {
                    continue;
                }
                String cleaned = cleanSupplierCandidate(candidate);
                if (!cleaned.isEmpty() && containsLetters(cleaned) && cleaned.length() >= 3) {
                    info.name = cleaned;
                    info.tradeName = cleaned;
                    break;
                }
            }
        }

        // Endereço, cidade/UF e CEP
        int addrStart = (cnpjIdx >= 0) ? cnpjIdx + 1 : 1;
        for (int i = addrStart; i < Math.min(lines.size(), addrStart + 8); i++) {
            String candidate = lines.get(i);
            if (isDanfeLabel(candidate)) {
                continue;
            }
            String norm = removeAccents(candidate).toUpperCase();
            if (norm.contains("DESTINATARIO") || norm.contains("REMETENTE")) {
                break;
            }
            Matcher cityMatcher = Pattern.compile("(?i)([\\p{L} .]{2,40})\\s*/\\s*([A-Za-z]{2})(?:\\s*CEP\\s*[:.]?\\s*([\\d-]{8,9}))?")
                    .matcher(candidate);
            if (cityMatcher.find()) {
                if (info.city.isEmpty()) info.city = cityMatcher.group(1).trim();
                if (info.state.isEmpty()) info.state = cityMatcher.group(2).toUpperCase();
                if (cityMatcher.group(3) != null && info.zipCode.isEmpty()) {
                    info.zipCode = cityMatcher.group(3);
                }
                continue;
            }
            Matcher cepMatcher = Pattern.compile("(?i)CEP\\s*[:.]?\\s*([\\d-]{8,9})").matcher(candidate);
            if (cepMatcher.find() && info.zipCode.isEmpty()) {
                info.zipCode = cepMatcher.group(1);
            }
            if (info.phone.isEmpty()) {
                Matcher foneMatcher = Pattern.compile("(?i)(?:FONE|FONE\\\\?/FAX|TELEFONE|TEL\\.?)\\s*[:.]?\\s*([\\d().\\s/-]{7,25})").matcher(candidate);
                if (foneMatcher.find()) {
                    info.phone = foneMatcher.group(1).trim();
                }
            }
            if (info.email.isEmpty()) {
                Matcher emailMatcher = Pattern.compile("(?i)([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})").matcher(candidate);
                if (emailMatcher.find()) {
                    info.email = emailMatcher.group(1);
                }
            }
            if (info.address.isEmpty() && containsLetters(candidate) && candidate.length() > 5) {
                info.address = candidate;
            }
        }

        return info;
    }

    private String cleanSupplierCandidate(String candidate) {
        if (candidate == null) return "";
        return candidate
                .replaceAll("(?i)^.*?NATUREZA\\s+DE\\s+OPERA[ÇC][ÃA]O", "")
                .replaceAll("(?i)INSCRI[ÇC][ÃA]O\\s+ESTADUAL.*$", "")
                .replaceAll("(?i)INSC\\.?\\s*EST\\.?.*$", "")
                .replaceAll("(?i)CHAVE\\s+DE\\s+ACESSO.*$", "")
                .replaceAll("(?i)SUBST\\.?\\s*TRIBUT[ÁA]RI[AO].*$", "")
                .replaceAll("(?i)PROTOCOLO.*$", "")
                .replaceAll("(?i)DANFE.*$", "")
                .replaceAll("(?i)DOCUMENTO\\s+AUXILIAR.*$", "")
                .trim();
    }

    private boolean isDocumentTitle(String line) {
        String upper = removeAccents(line.toUpperCase()).trim();
        return upper.contains("DOCUMENTO AUXILIAR") || upper.contains("NOTA FISCAL ELETRONICA")
                || upper.contains("ENTRADA") || upper.contains("SAIDA")
                || upper.matches("^[0-9\\s.-]+$");
    }

    private boolean isDanfeLabel(String line) {
        String upper = line.toUpperCase()
                .replaceAll("[^A-ZÀ-Ü0-9/ ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        Set<String> labels = Set.of(
                "EMITENTE", "DANFE", "NOTA FISCAL ELETRONICA", "N F E", "NFe",
                "DESTINATARIO", "REMETENTE", "EXPEDIDOR", "RECEBEDOR",
                "NUMERO", "SERIE", "DATA DA EMISSAO", "DATA DE EMISSAO",
                "CNPJ", "CPF", "INSC EST", "INSCRICAO ESTADUAL", "FONE",
                "DADOS DO PRODUTO", "DADOS DOS PRODUTOS", "DADOS DOS SERVICOS",
                "CALCULO DO IMPOSTO", "TRANSPORTADOR", "DADOS ADICIONAIS",
                "VALOR TOTAL", "BASE DE CALCULO", "PAGAMENTO", "FOLHA"
        );
        return upper.isEmpty() || labels.contains(upper);
    }

    private boolean isAddressLine(String line) {
        if (line == null) return false;
        String upper = removeAccents(line.toUpperCase()).trim();
        return upper.contains("RUA ") || upper.contains("AV ") || upper.contains("AVENIDA")
                || upper.contains("RODOVIA") || upper.contains("ESTRADA") || upper.contains("TRAVESSA")
                || upper.contains("ALAMEDA") || upper.contains("BAIRRO") || upper.contains("CENTRO")
                || upper.matches(".*\\bCEP\\b.*") || upper.matches(".*\\b[A-Z]{2}\\s*-\\s*BRASIL.*")
                || upper.matches(".*[A-Za-z]+/[A-Z]{2}\\b.*") || upper.matches(".*\\bKM\\s*\\d+.*");
    }

    private boolean containsLetters(String value) {
        return value != null && value.matches(".*\\p{L}.*");
    }

    private String removeAccents(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    private void assignItemValues(ParsedItemRow row, BigDecimal n1, BigDecimal n2, BigDecimal n3) {
        if (n1 == null || n1.compareTo(BigDecimal.ZERO) <= 0) {
            n1 = BigDecimal.ONE;
        }
        if (n2 == null) n2 = BigDecimal.ZERO;
        if (n3 == null) n3 = BigDecimal.ZERO;

        BigDecimal diff1 = n1.multiply(n2).subtract(n3).abs();
        BigDecimal diff2 = n1.multiply(n3).subtract(n2).abs();

        if (diff1.compareTo(diff2) <= 0) {
            // n1 * n2 ≈ n3 -> n1 = qty, n2 = unitPrice, n3 = total
            row.qty = n1;
            row.unitPrice = n2;
            row.total = n3.compareTo(BigDecimal.ZERO) > 0 ? n3 : n1.multiply(n2);
        } else {
            // n1 * n3 ≈ n2 -> n1 = qty, n3 = unitPrice, n2 = total
            row.qty = n1;
            row.unitPrice = n3;
            row.total = n2.compareTo(BigDecimal.ZERO) > 0 ? n2 : n1.multiply(n3);
        }
    }

    private List<StockNfeParsedDTO.StockNfeItemDTO> extractItems(List<String> lines, UUID companyId) {
        return extractItems(lines, companyId, BigDecimal.ZERO, String.join(" | ", lines), "", new SupplierInfo());
    }

    private List<StockNfeParsedDTO.StockNfeItemDTO> extractItems(
            List<String> lines,
            UUID companyId,
            BigDecimal totalInvoiceAmount,
            String flat,
            String nNf,
            SupplierInfo supplierInfo) {
        List<ParsedItemRow> rows = new ArrayList<>();

        // 1. Delimitar o bloco de itens (entre cabeçalho de produtos e início de cálculo de imposto/dados adicionais)
        int start = -1;
        int end = lines.size();
        for (int i = 0; i < lines.size(); i++) {
            String norm = removeAccents(lines.get(i)).toUpperCase();
            if (start < 0 && (norm.contains("DADOS DO PRODUTO") || norm.contains("DADOS DOS PRODUTOS") 
                    || norm.contains("DADOS DOS SERVICOS") || norm.contains("DADOS DO SERVICO")
                    || norm.contains("PRODUTO / SERVICO") || norm.contains("PRODUTOS / SERVICOS")
                    || (norm.contains("CODIGO") && (norm.contains("DESCRICAO") || norm.contains("PRODUTO"))))) {
                start = i + 1;
                continue;
            }
            if (start >= 0 && (norm.contains("DADOS ADICIONAIS") || norm.contains("INFORMACOES COMPLEMENTARES")
                    || norm.contains("CALCULO DO ISSQN") || norm.contains("RESERVADO AO FISCO")
                    || norm.contains("CONTINUACAO DOS DADOS"))) {
                end = i;
                break;
            }
        }
        if (start < 0) {
            start = 0;
        }

        Pattern ncmPattern = Pattern.compile("(?<!\\d)(\\d{4}\\.?\\d{2}\\.?\\d{2}|\\d{8})(?!\\d)");
        Pattern cfopPattern = Pattern.compile("(?<!\\d)([123567]\\d{3})(?!\\d)");
        Pattern unitPattern = Pattern.compile("(?i)\\b(UN|PC|P[ÇC]|CX|KG|LT|L|M|JG|PAR|CJ|TON|RL|MT|KIT|FD|MIL|RO|TB|PACOTE|PECA|PE[ÇC]A)\\b");
        Pattern moneyPattern = Pattern.compile("(?<!\\d)(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+[.,]\\d{2})(?!\\d)");

        // Padrões de linha única completos
        Pattern fullWithCode = Pattern.compile("^(\\S+)\\s+(\\S.*?)\\s+([\\d.]{6,10})(?:\\s+(\\d{2,4}))?\\s+([123567]\\d{3})\\s+([A-Za-z/]{1,6})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)(?:\\s+(\\d[\\d.,]*))?");
        Pattern fullSplit = Pattern.compile("^(?:\\d{1,3}\\s+)?(\\S.*?)\\s+([\\d.]{6,10})(?:\\s+(\\d{2,4}))?\\s+([123567]\\d{3})\\s+([A-Za-z/]{1,6})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)(?:\\s+(\\d[\\d.,]*))?");

        String pendingCode = null;
        String pendingDesc = null;

        for (int i = start; i < end; i++) {
            String line = lines.get(i).trim();
            if (line.isEmpty()) continue;
            String norm = removeAccents(line).toUpperCase();
            if (norm.contains("CODIGO") && (norm.contains("DESCRICAO") || norm.contains("PRODUTO"))) {
                continue;
            }

            ParsedItemRow rowCandidate = new ParsedItemRow();
            boolean matched = false;

            // Tentativa 1: Linha única completa com código
            Matcher mFull = fullWithCode.matcher(line);
            if (mFull.find()) {
                rowCandidate.code = mFull.group(1).trim();
                rowCandidate.description = mFull.group(2).trim();
                rowCandidate.ncm = mFull.group(3).replaceAll("\\.", "");
                rowCandidate.cfop = mFull.group(5);
                rowCandidate.unit = mFull.group(6);
                BigDecimal n1 = parsePtBrNumber(mFull.group(7));
                BigDecimal n2 = parsePtBrNumber(mFull.group(8));
                BigDecimal n3 = mFull.group(9) != null ? parsePtBrNumber(mFull.group(9)) : null;
                assignItemValues(rowCandidate, n1, n2, n3);
                matched = true;
            } else {
                // Tentativa 2: Linha única completa sem código explícito
                Matcher mSplit = fullSplit.matcher(line);
                if (mSplit.find()) {
                    rowCandidate.description = mSplit.group(1).trim();
                    rowCandidate.ncm = mSplit.group(2).replaceAll("\\.", "");
                    rowCandidate.cfop = mSplit.group(4);
                    rowCandidate.unit = mSplit.group(5);
                    BigDecimal n1 = parsePtBrNumber(mSplit.group(6));
                    BigDecimal n2 = parsePtBrNumber(mSplit.group(7));
                    BigDecimal n3 = mSplit.group(8) != null ? parsePtBrNumber(mSplit.group(8)) : null;
                    assignItemValues(rowCandidate, n1, n2, n3);
                    matched = true;
                }
            }

            // Tentativa 3: Anchor matching por NCM (8 dígitos) + CFOP (4 dígitos)
            if (!matched) {
                Matcher mNcm = ncmPattern.matcher(line);
                Matcher mCfop = cfopPattern.matcher(line);
                if (mNcm.find() && mCfop.find()) {
                    String foundNcm = mNcm.group(1).replaceAll("\\.", "");
                    String foundCfop = mCfop.group(1);

                    // Evita falsos positivos com CNPJ ou chaves
                    if (foundNcm.length() == 8 && !line.contains("/") && !line.contains("-")) {
                        rowCandidate.ncm = foundNcm;
                        rowCandidate.cfop = foundCfop;

                        Matcher mUnit = unitPattern.matcher(line);
                        rowCandidate.unit = mUnit.find() ? mUnit.group(1).toUpperCase() : "UN";

                        List<BigDecimal> values = new ArrayList<>();
                        Matcher mVal = moneyPattern.matcher(line);
                        while (mVal.find()) {
                            BigDecimal v = parsePtBrNumber(mVal.group(1));
                            if (v.compareTo(BigDecimal.ZERO) > 0) {
                                values.add(v);
                            }
                        }

                        if (!values.isEmpty()) {
                            if (values.size() == 1) {
                                rowCandidate.qty = BigDecimal.ONE;
                                rowCandidate.unitPrice = values.get(0);
                                rowCandidate.total = values.get(0);
                            } else if (values.size() == 2) {
                                assignItemValues(rowCandidate, values.get(0), values.get(1), values.get(0).multiply(values.get(1)));
                            } else {
                                assignItemValues(rowCandidate, values.get(0), values.get(1), values.get(2));
                            }
                        }

                        // Descrição na mesma linha (antes do NCM) ou de linhas anteriores
                        int ncmPos = line.indexOf(mNcm.group(1));
                        String beforeNcm = ncmPos > 0 ? line.substring(0, ncmPos).trim() : "";
                        if (beforeNcm.matches(".*\\p{L}.*") && beforeNcm.length() > 3) {
                            rowCandidate.description = beforeNcm;
                        } else if (pendingDesc != null && !pendingDesc.isBlank()) {
                            rowCandidate.code = pendingCode;
                            rowCandidate.description = pendingDesc;
                            pendingCode = null;
                            pendingDesc = null;
                        } else {
                            // Buscar descrição na linha anterior
                            for (int prev = i - 1; prev >= Math.max(start, i - 3); prev--) {
                                String prevLine = lines.get(prev).trim();
                                if (prevLine.matches(".*\\p{L}.*") && !isDanfeLabel(prevLine) && prevLine.length() > 3) {
                                    rowCandidate.description = prevLine;
                                    break;
                                }
                            }
                        }
                        matched = true;
                    }
                }
            }

            if (matched) {
                if (rowCandidate.code == null || rowCandidate.code.isBlank()) {
                    String fullDesc = rowCandidate.description != null ? rowCandidate.description.trim() : "";
                    String[] parts = fullDesc.split("\\s+", 2);
                    boolean looksLikeCode = parts.length > 1 && (parts[0].matches(".*\\d.*") || parts[0].contains("-") || parts[0].contains("_"));
                    if (looksLikeCode) {
                        rowCandidate.code = parts[0];
                        rowCandidate.description = parts[1];
                    } else {
                        rowCandidate.code = (nNf != null && !nNf.isBlank()) ? "NF" + nNf + "-" + (rows.size() + 1) : "ITEM-" + (rows.size() + 1);
                    }
                } else if (rowCandidate.code.matches("^\\d{1,3}$") && rowCandidate.description != null) {
                    String[] parts = rowCandidate.description.trim().split("\\s+", 2);
                    boolean looksLikeCode = parts.length > 1 && (parts[0].matches(".*\\d.*") || parts[0].contains("-") || parts[0].contains("_")) && parts[0].length() >= 3;
                    if (looksLikeCode) {
                        rowCandidate.code = parts[0];
                        rowCandidate.description = parts[1];
                    }
                }
                if (rowCandidate.description == null || rowCandidate.description.isBlank()) {
                    rowCandidate.description = rowCandidate.code;
                }
                if (rowCandidate.ncm != null) {
                    rowCandidate.ncm = rowCandidate.ncm.replaceAll("\\D", "");
                }
                if (rowCandidate.cfop != null) {
                    rowCandidate.cfop = rowCandidate.cfop.replaceAll("\\D", "");
                }
                if (rowCandidate.qty == null || rowCandidate.qty.compareTo(BigDecimal.ZERO) <= 0) {
                    rowCandidate.qty = BigDecimal.ONE;
                }
                if (rowCandidate.unitPrice == null || rowCandidate.unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    rowCandidate.unitPrice = rowCandidate.total != null ? rowCandidate.total : BigDecimal.ZERO;
                }
                if (rowCandidate.total == null || rowCandidate.total.compareTo(BigDecimal.ZERO) <= 0) {
                    rowCandidate.total = rowCandidate.qty.multiply(rowCandidate.unitPrice);
                }
                rows.add(rowCandidate);
                pendingCode = null;
                pendingDesc = null;
            } else {
                // Linha de texto candidata a código/descrição de item
                if (containsLetters(line) && line.length() > 3 && !line.matches(".*\\d{2}/\\d{2}/\\d{4}.*") && !isDanfeLabel(line)) {
                    if (pendingDesc == null) {
                        String[] parts = line.split("\\s+", 2);
                        boolean looksLikeCode = parts.length > 1 && (parts[0].matches(".*\\d.*") || parts[0].contains("-") || parts[0].contains("_"));
                        if (looksLikeCode) {
                            pendingCode = parts[0].trim();
                            pendingDesc = parts[1].trim();
                        } else {
                            pendingDesc = line;
                        }
                    } else {
                        pendingDesc = (pendingDesc + " " + line).trim();
                    }
                }
            }
        }

        // Se nenhum item foi extraído pelas tabelas tabuladas, realizar varredura heurística profunda no documento
        if (rows.isEmpty()) {
            BigDecimal amount = (totalInvoiceAmount != null && totalInvoiceAmount.compareTo(BigDecimal.ZERO) > 0)
                    ? totalInvoiceAmount
                    : BigDecimal.ZERO;

            String extractedNcm = "";
            String extractedCfop = "";
            String extractedUnit = "UN";
            String extractedDesc = "";

            // 1. Procurar NCM no documento (8 dígitos) - excluindo CNPJ do fornecedor ou cliente
            String cleanSupplierCnpj = supplierInfo != null && supplierInfo.cnpj != null ? supplierInfo.cnpj.replaceAll("\\D", "") : "";
            Matcher mDocNcm = Pattern.compile("(?<!\\d)(\\d{4}\\.?\\d{2}\\.?\\d{2}|\\d{8})(?!\\d)").matcher(flat);
            while (mDocNcm.find()) {
                String candidate = mDocNcm.group(1).replaceAll("\\.", "");
                if (candidate.length() == 8 && (cleanSupplierCnpj.isEmpty() || !cleanSupplierCnpj.contains(candidate))) {
                    extractedNcm = candidate;
                    break;
                }
            }

            // 2. Procurar CFOP no documento (4 dígitos iniciando em 1, 2, 3, 5, 6, 7)
            Matcher mDocCfop = Pattern.compile("(?<!\\d)([123567]\\d{3})(?!\\d)").matcher(flat);
            if (mDocCfop.find()) {
                extractedCfop = mDocCfop.group(1);
            }

            // 3. Procurar Unidade de Medida
            Matcher mDocUnit = unitPattern.matcher(flat);
            if (mDocUnit.find()) {
                extractedUnit = mDocUnit.group(1).toUpperCase();
            }

            // 4. Procurar descrição candidata entre start e end
            for (int i = start; i < end; i++) {
                String candidateLine = lines.get(i).trim();
                if (containsLetters(candidateLine) && !isDanfeLabel(candidateLine) && !isDocumentTitle(candidateLine) && candidateLine.length() > 3) {
                    extractedDesc = candidateLine;
                    break;
                }
            }

            if (extractedDesc.isBlank()) {
                extractedDesc = "Item da NF-e " + (nNf != null && !nNf.isBlank() ? nNf : "")
                        + (supplierInfo != null && supplierInfo.name != null && !supplierInfo.name.isBlank() ? " - " + supplierInfo.name : "");
            }

            String itemCode = (nNf != null && !nNf.isBlank()) ? "NF" + nNf + "-1" : "ITEM-1";

            ParsedItemRow fallbackRow = new ParsedItemRow();
            fallbackRow.code = itemCode;
            fallbackRow.description = extractedDesc;
            fallbackRow.ncm = extractedNcm;
            fallbackRow.cfop = extractedCfop;
            fallbackRow.unit = extractedUnit;
            fallbackRow.qty = BigDecimal.ONE;
            fallbackRow.unitPrice = amount;
            fallbackRow.total = amount;
            rows.add(fallbackRow);
            log.info("PDF da NF-e nº {}: gerado item recuperado (cód: {}, desc: '{}', NCM: {}, CFOP: {}, valor: R$ {})",
                    nNf, itemCode, extractedDesc, extractedNcm, extractedCfop, amount);
        }

        List<StockNfeParsedDTO.StockNfeItemDTO> items = new ArrayList<>();
        for (ParsedItemRow row : rows) {
            String desc = row.description;
            boolean isBattery = detectBattery(desc, row.ncm);
            boolean isTire = detectTire(desc, row.ncm);
            StockCategory suggestedCategory = detectCategory(desc, isBattery, isTire);
            Optional<StockItem> matchedItem = matchExistingItem(row.code, desc, companyId);

            items.add(StockNfeParsedDTO.StockNfeItemDTO.builder()
                    .productCode(row.code)
                    .barcode("")
                    .description(desc)
                    .ncm(row.ncm)
                    .cfop(row.cfop)
                    .unitOfMeasure(row.unit != null && !row.unit.isBlank() ? row.unit.toUpperCase() : "UN")
                    .quantity(row.qty)
                    .unitPrice(row.unitPrice)
                    .totalPrice(row.total)
                    .matchedStockItemId(matchedItem.map(StockItem::getId).orElse(null))
                    .matchedStockItemCode(matchedItem.map(StockItem::getCode).orElse(null))
                    .matchedStockItemName(matchedItem.map(StockItem::getName).orElse(null))
                    .matchedStockItemQuantity(matchedItem.map(StockItem::getCurrentQuantity).orElse(null))
                    .suggestedCategory(suggestedCategory)
                    .isBattery(isBattery)
                    .isTire(isTire)
                    .build());
        }
        return items;
    }

    private static final class ParsedItemRow {
        String code;
        String description;
        String ncm;
        String cfop;
        String unit;
        BigDecimal qty;
        BigDecimal total;
        BigDecimal unitPrice;
    }

    private List<StockNfeParsedDTO.StockNfeInstallmentDTO> extractInstallments(List<String> lines, LocalDate issueDate, BigDecimal totalInvoiceAmount) {
        List<StockNfeParsedDTO.StockNfeInstallmentDTO> installments = new ArrayList<>();

        int start = -1;
        int end = lines.size();
        for (int i = 0; i < lines.size(); i++) {
            String upper = removeAccents(lines.get(i).toUpperCase());
            if (start < 0 && (upper.contains("FATURA") || upper.contains("DUPLICATA") || upper.contains("COBRANCA") || upper.contains("PAGAMENTO"))) {
                start = i + 1;
                continue;
            }
            if (start >= 0 && (upper.contains("DADOS ADICIONAIS") || upper.contains("OUTRAS DEDUCOES")
                    || upper.contains("OUTRAS DEDUÇÕES") || upper.contains("CALCULO DO ISSQN")
                    || upper.contains("DADOS DO PRODUTO") || upper.contains("TRANSPORTADOR")
                    || upper.contains("INFORMACOES COMPLEMENTARES"))) {
                end = i;
                break;
            }
        }

        // Padrão 1: Padrão DANFE SEFAZ (NÚMERO VENCIMENTO VALOR) ex: "001 25/05/2024 1.250,00" ou "001 25/05/2024 R$ 1.250,00"
        Pattern p1 = Pattern.compile("([0-9A-Za-z/-]{1,15})\\s+(\\d{2}/\\d{2}/\\d{4})\\s+(?:R\\$\\s*)?([\\d.,]+)");
        // Padrão 2: Formato alternativo (NÚMERO VALOR VENCIMENTO) ex: "001 1.250,00 25/05/2024"
        Pattern p2 = Pattern.compile("([0-9A-Za-z/-]{1,15})\\s+(?:R\\$\\s*)?([\\d.,]+)\\s+(\\d{2}/\\d{2}/\\d{4})");
        // Padrão 3: Rotulado ex: "Dup: 001 Venc: 25/05/2024 Valor: 1.250,00"
        Pattern p3 = Pattern.compile("(?i)(?:DUP|PARC|FAT|N[º°O]?)?\\s*[:.]?\\s*([0-9A-Za-z/-]{1,10})?\\s*(?:VENC|DATA)?\\s*[:.]?\\s*(\\d{2}/\\d{2}/\\d{4})\\s*(?:VALOR|VLR|R\\$)?\\s*[:.]?\\s*([\\d.,]+)");

        int searchStart = start >= 0 ? start : 0;
        int searchEnd = start >= 0 ? end : lines.size();

        for (int i = searchStart; i < searchEnd; i++) {
            String line = lines.get(i);
            if (isDanfeLabel(line) || line.toUpperCase().contains("BASE DE CALCULO") || line.toUpperCase().contains("VALOR DO ICMS")) {
                continue;
            }

            Matcher m1 = p1.matcher(line);
            while (m1.find()) {
                BigDecimal amount = parsePtBrNumber(m1.group(3));
                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                    int seq = installments.size() + 1;
                    try {
                        seq = Integer.parseInt(m1.group(1).replaceAll("\\D", ""));
                    } catch (Exception ignored) {}
                    installments.add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                            .installmentNumber(seq > 0 ? seq : installments.size() + 1)
                            .dueDate(parsePtBrDate(m1.group(2)))
                            .amount(amount)
                            .barcode("")
                            .build());
                }
            }

            if (installments.isEmpty()) {
                Matcher m2 = p2.matcher(line);
                while (m2.find()) {
                    BigDecimal amount = parsePtBrNumber(m2.group(2));
                    if (amount.compareTo(BigDecimal.ZERO) > 0) {
                        int seq = installments.size() + 1;
                        try {
                            seq = Integer.parseInt(m2.group(1).replaceAll("\\D", ""));
                        } catch (Exception ignored) {}
                        installments.add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                                .installmentNumber(seq > 0 ? seq : installments.size() + 1)
                                .dueDate(parsePtBrDate(m2.group(3)))
                                .amount(amount)
                                .barcode("")
                                .build());
                    }
                }
            }

            if (installments.isEmpty()) {
                Matcher m3 = p3.matcher(line);
                while (m3.find()) {
                    BigDecimal amount = parsePtBrNumber(m3.group(3));
                    if (amount.compareTo(BigDecimal.ZERO) > 0) {
                        int seq = installments.size() + 1;
                        if (m3.group(1) != null) {
                            try {
                                seq = Integer.parseInt(m3.group(1).replaceAll("\\D", ""));
                            } catch (Exception ignored) {}
                        }
                        installments.add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                                .installmentNumber(seq > 0 ? seq : installments.size() + 1)
                                .dueDate(parsePtBrDate(m3.group(2)))
                                .amount(amount)
                                .barcode("")
                                .build());
                    }
                }
            }
        }

        // Se nenhuma parcela foi extraída mas o total da nota é válido, gerar parcela única no vencimento padrão (30 dias)
        if (installments.isEmpty() && totalInvoiceAmount != null && totalInvoiceAmount.compareTo(BigDecimal.ZERO) > 0) {
            LocalDate defaultDue = (issueDate != null) ? issueDate.plusDays(30) : LocalDate.now().plusDays(30);
            installments.add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                    .installmentNumber(1)
                    .dueDate(defaultDue)
                    .amount(totalInvoiceAmount)
                    .barcode("")
                    .build());
            log.info("PDF da NF-e: sem duplicatas explícitas. Gerada parcela única de R$ {} com vencimento em {}", totalInvoiceAmount, defaultDue);
        }

        return installments;
    }

    /**
     * Converte números no formato brasileiro (1.234,56) para BigDecimal.
     * Sem vírgula, pontos são tratados como separador de milhar (ex.: 1.000 = mil).
     */
    private BigDecimal parsePtBrNumber(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        String cleaned = value.trim().replaceAll("[\\s\u00A0]", "");
        if (cleaned.contains(",")) {
            cleaned = cleaned.replace(".", "").replace(",", ".");
        } else if (cleaned.matches("\\d{1,3}(?:\\.\\d{3})+")) {
            cleaned = cleaned.replace(".", "");
        }
        try {
            return new BigDecimal(cleaned);
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal extractMoney(String flat, String labelPattern) {
        Matcher matcher = Pattern.compile(labelPattern + "[^0-9]{0,40}(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+[.,]\\d{2})")
                .matcher(flat);
        if (matcher.find()) {
            return parsePtBrNumber(matcher.group(1));
        }
        return BigDecimal.ZERO;
    }

    /**
     * Procura um item de estoque existente pelo código do produto ou, na falta, pelo nome.
     */
    private Optional<StockItem> matchExistingItem(String cProd, String xProd, UUID companyId) {
        try {
            if (cProd != null && !cProd.isBlank()) {
                String cleanCode = cProd.trim();
                if (companyId != null) {
                    Optional<StockItem> byCompany = stockItemRepository.findFirstByCompanyIdAndCode(companyId, cleanCode);
                    if (byCompany.isPresent()) {
                        return byCompany;
                    }
                }
                Optional<StockItem> byCode = stockItemRepository.findFirstByCode(cleanCode);
                if (byCode.isPresent()) {
                    return byCode;
                }
            }
            if (xProd != null && !xProd.isBlank()) {
                String searchPrefix = xProd.length() > 15 ? xProd.substring(0, 15) : xProd;
                List<StockItem> byName = stockItemRepository.findByNameContainingIgnoreCase(searchPrefix);
                if (companyId != null) {
                    Optional<StockItem> companyMatch = byName.stream()
                            .filter(item -> companyId.equals(item.getCompanyId()))
                            .findFirst();
                    if (companyMatch.isPresent()) {
                        return companyMatch;
                    }
                }
                if (!byName.isEmpty()) {
                    return Optional.of(byName.get(0));
                }
            }
        } catch (Exception e) {
            log.warn("Falha ao buscar item correspondente no estoque (cProd={}, xProd={}): {}", cProd, xProd, e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Localiza um fornecedor já cadastrado pelo CNPJ.
     */
    public Optional<Supplier> findExistingSupplier(String cnpj, UUID companyId) {
        if (cnpj == null || cnpj.isBlank()) {
            return Optional.empty();
        }
        try {
            String cleanCnpj = cnpj.replaceAll("[^0-9]", "");
            Optional<Supplier> optSupplier = Optional.empty();
            if (companyId != null) {
                optSupplier = supplierRepository.findByCleanCnpjNativeScoped(cleanCnpj, companyId);
                if (optSupplier.isEmpty()) {
                    optSupplier = supplierRepository.findFirstByCompanyIdAndCnpj(companyId, cleanCnpj);
                }
                if (optSupplier.isEmpty()) {
                    optSupplier = supplierRepository.findFirstByCompanyIdAndCnpj(companyId, cnpj);
                }
            }
            if (optSupplier.isEmpty()) {
                optSupplier = supplierRepository.findByCleanCnpjNativeScoped(cleanCnpj, null);
            }
            if (optSupplier.isEmpty()) {
                optSupplier = supplierRepository.findFirstByCnpj(cleanCnpj);
            }
            if (optSupplier.isEmpty()) {
                optSupplier = supplierRepository.findFirstByCnpj(cnpj);
            }
            return optSupplier;
        } catch (Exception e) {
            log.warn("Falha ao buscar fornecedor existente por CNPJ {}: {}", cnpj, e.getMessage());
            return Optional.empty();
        }
    }

    private UUID findExistingSupplierId(String cnpj, UUID companyId) {
        return findExistingSupplier(cnpj, companyId).map(Supplier::getId).orElse(null);
    }

    /**
     * Verifica se a NF-e já foi importada anteriormente no sistema (seja via XML ou via PDF),
     * tanto no módulo Financeiro (invoices) quanto no Estoque (stock_movements e stock_items).
     */
    private DuplicateCheck checkAlreadyImported(String nNf, String accessKey, String supplierCnpj, String supplierName, UUID companyId) {
        String cleanAccessKey = (accessKey != null) ? accessKey.replaceAll("\\D", "") : "";
        String cleanNf = (nNf != null) ? nNf.replaceAll("\\D", "").replaceFirst("^0+(?!$)", "") : "";
        String cleanCnpj = (supplierCnpj != null) ? supplierCnpj.replaceAll("\\D", "") : "";
        String cleanSuppName = (supplierName != null) ? removeAccents(supplierName.trim().toUpperCase()) : "";

        if (cleanAccessKey.isEmpty() && cleanNf.isEmpty()) {
            return new DuplicateCheck(false, null);
        }

        boolean foundInFinance = false;
        boolean foundInStock = false;
        String matchDetail = "";

        // 1. Checagem por Chave de Acesso (44 dígitos)
        if (cleanAccessKey.length() == 44) {
            // Checar em Faturas/Contas a Pagar
            List<Invoice> invoicesByKey = invoiceRepository.findByNotesContaining(cleanAccessKey);
            if (invoicesByKey.isEmpty()) {
                invoicesByKey = invoiceRepository.findByNotesContainingOrDescriptionContaining(cleanAccessKey, cleanAccessKey);
            }
            if (!invoicesByKey.isEmpty()) {
                foundInFinance = true;
                Invoice sample = invoicesByKey.get(0);
                matchDetail = String.format("Fatura nº %s", sample.getInvoiceNumber() != null ? sample.getInvoiceNumber() : sample.getId());
            }

            // Checar em Movimentações de Estoque
            List<StockMovement> movementsByKey = stockMovementRepository.findByNotesContaining(cleanAccessKey);
            if (!movementsByKey.isEmpty()) {
                foundInStock = true;
                StockMovement sample = movementsByKey.get(0);
                if (matchDetail.isEmpty()) {
                    matchDetail = String.format("Movimentação de Entrada nº %s", sample.getDocumentNumber() != null ? sample.getDocumentNumber() : sample.getId());
                }
            }
        }

        // 2. Checagem por Número da NF-e + Fornecedor
        if (!cleanNf.isEmpty()) {
            // Checar em Movimentações de Estoque
            List<StockMovement> movementsByDoc = stockMovementRepository.findByDocumentNumber(cleanNf);
            if (movementsByDoc.isEmpty()) {
                movementsByDoc = stockMovementRepository.findByDocumentNumber("NF-" + cleanNf);
            }
            for (StockMovement sm : movementsByDoc) {
                if (isSupplierMatching(sm.getSupplier(), cleanCnpj, cleanSuppName)) {
                    foundInStock = true;
                    if (matchDetail.isEmpty()) {
                        matchDetail = String.format("Movimentação de Entrada doc nº %s", sm.getDocumentNumber());
                    }
                    break;
                }
            }

            // Checar em Faturas / Invoices
            List<Invoice> existingInvoices = invoiceRepository.findByInvoiceNumberContaining(cleanNf);
            for (Invoice inv : existingInvoices) {
                String invNumClean = (inv.getInvoiceNumber() != null) ? inv.getInvoiceNumber().replaceAll("\\D", "").replaceFirst("^0+(?!$)", "") : "";
                if (invNumClean.contains(cleanNf)) {
                    String invSupplier = (inv.getSupplier() != null && inv.getSupplier().getName() != null) 
                            ? inv.getSupplier().getName() 
                            : (inv.getSupplierName() != null ? inv.getSupplierName() : "");
                    String invCnpj = (inv.getSupplier() != null && inv.getSupplier().getCnpj() != null) 
                            ? inv.getSupplier().getCnpj().replaceAll("\\D", "") 
                            : "";

                    if (isSupplierMatching(invSupplier, cleanCnpj, cleanSuppName) || 
                        (!cleanCnpj.isEmpty() && cleanCnpj.equals(invCnpj))) {
                        foundInFinance = true;
                        if (matchDetail.isEmpty()) {
                            matchDetail = String.format("Fatura nº %s", inv.getInvoiceNumber());
                        }
                        break;
                    }
                }
            }

            // Checar em Itens de Estoque por invoiceNumber
            List<StockItem> itemsByInvoice = stockItemRepository.findByInvoiceNumber(cleanNf);
            if (itemsByInvoice.isEmpty()) {
                itemsByInvoice = stockItemRepository.findByInvoiceNumber("NF-" + cleanNf);
            }
            if (!itemsByInvoice.isEmpty()) {
                for (StockItem si : itemsByInvoice) {
                    if (isSupplierMatching(si.getSupplier(), cleanCnpj, cleanSuppName)) {
                        foundInStock = true;
                        if (matchDetail.isEmpty()) {
                            matchDetail = String.format("Item de Estoque '%s' (NF %s)", si.getName(), si.getInvoiceNumber());
                        }
                        break;
                    }
                }
            }
        }

        if (foundInFinance || foundInStock) {
            String modules;
            if (foundInFinance && foundInStock) {
                modules = "Estoque e Financeiro";
            } else if (foundInFinance) {
                modules = "Financeiro (Contas a Pagar)";
            } else {
                modules = "Estoque (Almoxarifado)";
            }

            String supplierDisplay = (supplierName != null && !supplierName.isBlank()) ? " do fornecedor " + supplierName : "";
            String warning = String.format("Atenção: A Nota Fiscal nº %s%s já foi importada anteriormente no sistema (registrada no %s: %s).",
                    nNf, supplierDisplay, modules, matchDetail);

            log.warn("Detecção de duplicidade de NF-e: {}", warning);
            return new DuplicateCheck(true, warning);
        }

        return new DuplicateCheck(false, null);
    }

    private boolean isSupplierMatching(String entitySupplier, String targetCnpj, String targetName) {
        if (entitySupplier == null || entitySupplier.isBlank()) {
            return false;
        }
        String cleanEntity = removeAccents(entitySupplier.trim().toUpperCase());
        if (!targetName.isEmpty()) {
            if (cleanEntity.contains(targetName) || targetName.contains(cleanEntity)) {
                return true;
            }
            String[] parts = targetName.split("\\s+");
            if (parts.length >= 2 && cleanEntity.contains(parts[0] + " " + parts[1])) {
                return true;
            }
        }
        return false;
    }

    private static final class DuplicateCheck {
        final boolean alreadyImported;
        final String warning;

        DuplicateCheck(boolean alreadyImported, String warning) {
            this.alreadyImported = alreadyImported;
            this.warning = warning;
        }
    }

    private static final class SupplierInfo {
        String cnpj = "";
        String name = "";
        String tradeName = "";
        String address = "";
        String city = "";
        String state = "";
        String zipCode = "";
        String phone = "";
        String email = "";
    }

    private static final class CustomerInfo {
        String cnpj = "";
        String name = "";
        String address = "";
        String city = "";
        String state = "";
        String zipCode = "";
        String phone = "";
    }

    /**
     * Resolve uma unidade válida para associar às faturas e movimentações
     */
    private Unit resolveFallbackUnit(UUID companyId) {
        try {
            return unitRepository.findAll().stream().findFirst()
                    .orElseGet(() -> {
                        Unit unit = new Unit();
                        unit.setName("Matriz Principal");
                        unit.setAddress("Endereço Principal");
                        return unitRepository.save(unit);
                    });
        } catch (Exception e) {
            log.warn("Erro ao buscar unidade padrão para NF-e: {}", e.getMessage());
            Unit unit = new Unit();
            unit.setName("Matriz Principal");
            unit.setAddress("Endereço Principal");
            return unitRepository.save(unit);
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

        // Unidade padrão obrigatória para faturas e movimentações
        Unit fallbackUnit = resolveFallbackUnit(companyId);

        // Verificar se a nota fiscal já foi importada anteriormente (bloqueia duplicação acidental)
        DuplicateCheck duplicate = checkAlreadyImported(
                request.getInvoiceNumber(),
                request.getAccessKey(),
                request.getSupplierCnpj(),
                request.getSupplierName(),
                companyId);
        if (duplicate.alreadyImported && !request.isForceImport()) {
            log.warn("Tentativa de importar NF-e já existente sem forçar importação: {}", duplicate.warning);
            throw new BusinessException(duplicate.warning + " Para prosseguir mesmo assim e duplicar os lançamentos no sistema, marque a opção 'Forçar reimportação'.");
        }

        // Usuário gerenciado pelo JPA
        User managedUser = (user != null && user.getId() != null) 
                ? userRepository.findById(user.getId()).orElse(null) 
                : null;
        String userName = (managedUser != null && managedUser.getName() != null) 
                ? managedUser.getName() 
                : (user != null && user.getName() != null ? user.getName() : "Sistema");

        // 1. Garantir cadastro do Fornecedor
        Supplier supplier = resolveOrCreateSupplier(request, companyId);

        int itemsCreated = 0;
        int itemsUpdated = 0;
        int batteriesCreated = 0;
        int tiresCreated = 0;
        int financialAccountsCreated = 0;
        List<String> details = new ArrayList<>();
        Set<String> usedCodesInBatch = new HashSet<>();

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
                if (stockItem.getUnit() == null) {
                    stockItem.setUnit(fallbackUnit);
                }
                stockItem = stockItemRepository.save(stockItem);

                // Criar movimentação de entrada
                StockMovement movement = new StockMovement();
                movement.setStockItem(stockItem);
                movement.setUser(managedUser);
                movement.setUserName(userName);
                movement.setUnit(fallbackUnit);
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
                movement.setNotes(String.format("Entrada NF-e nº %s | Fornecedor: %s | Chave: %s", 
                        request.getInvoiceNumber(), 
                        request.getSupplierName(), 
                        request.getAccessKey() != null && !request.getAccessKey().isBlank() ? request.getAccessKey() : "N/I"));
                movement = stockMovementRepository.save(movement);

                // Sincronizar baterias e pneus
                stockService.syncBatteryAndTireInbound(stockItem, qty, request.getInvoiceNumber(), request.getSupplierName(), unitCost, movement.getId());

                if (stockService.isBatteryItem(stockItem)) batteriesCreated += qty;
                if (stockService.isTireItem(stockItem)) tiresCreated += qty;

                itemsUpdated++;
                details.add(String.format("Item '%s' atualizado (+%d un, saldo: %d)", stockItem.getName(), qty, newQty));

            } else {
                // Criar novo item no estoque com código seguro e único
                String baseCode = itemReq.getCode() != null && !itemReq.getCode().isBlank() 
                        ? itemReq.getCode().trim() 
                        : "NF" + (request.getInvoiceNumber() != null ? request.getInvoiceNumber() : "0") + "-" + (itemsCreated + 1);

                if (baseCode.length() > 35) {
                    baseCode = baseCode.substring(0, 35);
                }

                String code = baseCode;
                int codeAttempt = 1;
                while (usedCodesInBatch.contains(code) || 
                       stockItemRepository.existsByCompanyIdAndCodeNative(companyId, code)) {
                    code = baseCode + "-" + (codeAttempt++);
                    if (code.length() > 50) {
                        code = baseCode.substring(0, Math.min(baseCode.length(), 40)) + "-" + codeAttempt;
                    }
                }
                usedCodesInBatch.add(code);

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
                newItem.setUnit(fallbackUnit);
                newItem.setActive(true);
                newItem = stockItemRepository.save(newItem);

                // Criar movimentação de entrada inicial
                StockMovement movement = new StockMovement();
                movement.setStockItem(newItem);
                movement.setUser(managedUser);
                movement.setUserName(userName);
                movement.setUnit(fallbackUnit);
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
                movement.setNotes(String.format("Entrada NF-e nº %s | Fornecedor: %s | Chave: %s", 
                        request.getInvoiceNumber(), 
                        request.getSupplierName(), 
                        request.getAccessKey() != null && !request.getAccessKey().isBlank() ? request.getAccessKey() : "N/I"));
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
            String cleanDocNum = (request.getInvoiceNumber() != null && !request.getInvoiceNumber().isBlank())
                    ? request.getInvoiceNumber().trim()
                    : "S-N";
            if (cleanDocNum.length() > 30) {
                cleanDocNum = cleanDocNum.substring(0, 30);
            }

            for (StockNfeProcessRequestDTO.ProcessInstallmentDTO instReq : request.getInstallments()) {
                if (instReq.getAmount() == null || instReq.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                String generatedInvoiceNum = String.format("NF-%s/%02d", cleanDocNum, instReq.getInstallmentNumber());
                int invAttempt = 1;
                while (invoiceRepository.existsByInvoiceNumberNativeScoped(generatedInvoiceNum, companyId)) {
                    generatedInvoiceNum = String.format("NF-%s/%02d-%d", cleanDocNum, instReq.getInstallmentNumber(), invAttempt++);
                    if (generatedInvoiceNum.length() > 50) {
                        generatedInvoiceNum = generatedInvoiceNum.substring(0, 50);
                    }
                }

                Invoice inv = new Invoice();
                inv.setCompanyId(companyId);
                inv.setUnit(fallbackUnit);
                inv.setCompanySigla("CI");
                inv.setCentroCusto("ALMOXARIFADO");
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
                inv.setNotes(String.format("Importado NF-e nº %s | Fornecedor: %s | Chave: %s%s", 
                        request.getInvoiceNumber(), 
                        request.getSupplierName(), 
                        request.getAccessKey() != null && !request.getAccessKey().isBlank() ? request.getAccessKey() : "N/I",
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
        String cleanCnpj = (rawCnpj != null) ? rawCnpj.replaceAll("[^0-9]", "") : "";

        if (!cleanCnpj.isBlank()) {
            try {
                Optional<Supplier> found = supplierRepository.findByCleanCnpjNativeScoped(cleanCnpj, companyId);
                if (found.isPresent()) {
                    return found.get();
                }
            } catch (Exception e) {
                log.debug("Consulta nativa por CNPJ falhou: {}", e.getMessage());
            }

            Optional<Supplier> found = supplierRepository.findByCnpj(cleanCnpj);
            if (found.isEmpty() && rawCnpj != null) {
                found = supplierRepository.findByCnpj(rawCnpj);
            }
            if (found.isPresent()) {
                return found.get();
            }
        }

        // Tentar buscar por nome exato para evitar duplicidade de fornecedor sem CNPJ
        if (request.getSupplierName() != null && !request.getSupplierName().isBlank()) {
            Optional<Supplier> byName = supplierRepository.findFirstByNameIgnoreCase(request.getSupplierName().trim());
            if (byName.isPresent()) {
                return byName.get();
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

                // CNPJ nunca pode ser nulo ou vazio no PostgreSQL ("" colide com UNIQUE)
                String safeCnpj = (!cleanCnpj.isBlank())
                        ? (cleanCnpj.length() > 18 ? cleanCnpj.substring(0, 18) : cleanCnpj)
                        : "ISENTO-" + (System.currentTimeMillis() % 100000);
                String formattedCnpj = SupplierService.formatCpfCnpj(safeCnpj);
                newSupplier.setCnpj(formattedCnpj != null && !formattedCnpj.isBlank() ? formattedCnpj : safeCnpj);

                newSupplier.setAddress(request.getSupplierAddress());
                newSupplier.setCity(request.getSupplierCity());
                newSupplier.setState(request.getSupplierState());
                newSupplier.setZipCode(request.getSupplierZipCode());
                if (request.getSupplierPhone() != null && !request.getSupplierPhone().isBlank()) {
                    newSupplier.setPhone(request.getSupplierPhone().trim());
                }
                if (request.getSupplierEmail() != null && !request.getSupplierEmail().isBlank()) {
                    newSupplier.setEmail(request.getSupplierEmail().trim());
                }
                if (request.getSupplierCnpj() != null && !request.getSupplierCnpj().isBlank()) {
                    String digits = request.getSupplierCnpj().replaceAll("[^0-9]", "");
                    newSupplier.setDocumentType(digits.length() <= 11 ? "CPF" : "CNPJ");
                }
                newSupplier.setCompanyId(companyId);
                newSupplier.setIsActive(true);
                Supplier saved = supplierRepository.save(newSupplier);
                log.info("🏢 Fornecedor '{}' (CNPJ: {}) cadastrado automaticamente via XML", saved.getName(), saved.getCnpj());
                return saved;
            } catch (Exception e) {
                log.warn("Não foi possível salvar novo fornecedor automaticamente: {}. Tentando recuperar existente...", e.getMessage());
                if (request.getSupplierName() != null) {
                    return supplierRepository.findFirstByNameIgnoreCase(request.getSupplierName().trim()).orElse(null);
                }
            }
        }
        return null;
    }

    private boolean detectBattery(String description) {
        return detectBattery(description, null);
    }

    private boolean detectBattery(String description, String ncm) {
        if (ncm != null && ncm.replaceAll("\\D", "").startsWith("8507")) {
            return true;
        }
        if (description == null) return false;
        String lower = description.toLowerCase();
        return lower.contains("bateria") || lower.contains("battery") || lower.contains("acumulador");
    }

    private boolean detectTire(String description) {
        return detectTire(description, null);
    }

    private boolean detectTire(String description, String ncm) {
        if (ncm != null && ncm.replaceAll("\\D", "").startsWith("4011")) {
            return true;
        }
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
