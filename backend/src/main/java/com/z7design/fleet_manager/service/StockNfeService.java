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

            // Totais
            BigDecimal vProd = parseDecimal(getTagValue(doc, "vProd"));
            BigDecimal vNF = parseDecimal(getTagValue(doc, "vNF"));
            BigDecimal vFrete = parseDecimal(getTagValue(doc, "vFrete"));
            BigDecimal vDesc = parseDecimal(getTagValue(doc, "vDesc"));

            // Verificar se o fornecedor já existe
            UUID existingSupplierId = findExistingSupplierId(cnpj);

            // Verificar duplicidade da Nota Fiscal
            DuplicateCheck duplicateCheck = checkAlreadyImported(nNf, accessKey);
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

                    Optional<StockItem> matchedItem = matchExistingItem(cProd, xProd);
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
        try (InputStream is = file.getInputStream(); PDDocument document = PDDocument.load(is)) {
            if (document.isEncrypted()) {
                throw new BusinessException("O PDF da NF-e está protegido por senha. Gere o DANFE sem senha e tente novamente.");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null || text.isBlank()) {
                throw new BusinessException("Não foi possível extrair texto do PDF. Se o DANFE for uma imagem digitalizada, envie o XML da NF-e.");
            }
            return parseDanfeText(text, companyId);
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Erro ao realizar parse do PDF da NF-e: {}", e.getMessage(), e);
            throw new BusinessException("Não foi possível processar o PDF da NF-e: " + e.getMessage());
        }
    }

    /**
     * Extrai as informações do DANFE a partir do texto do PDF e monta o DTO de conferência prévia.
     */
    private StockNfeParsedDTO parseDanfeText(String rawText, UUID companyId) {
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

            // Chave de acesso (44 dígitos, frequentemente agrupados de 4 em 4)
            String accessKey = extractAccessKey(flat);

            // Número e série da NF-e
            String nNf = extractInvoiceNumber(flat);
            String serie = extractMatch(flat, "(?i)S[ÉE]RIE\\s*\\.?\\s*(\\d{1,3})");

            // Data de emissão
            LocalDate issueDate = extractIssueDate(lines, flat);

            // Emitente (nome, CNPJ e endereço)
            SupplierInfo supplierInfo = extractSupplier(lines);

            // Cobrança / duplicatas
            List<StockNfeParsedDTO.StockNfeInstallmentDTO> installments = extractInstallments(lines);

            // Itens da NF
            List<StockNfeParsedDTO.StockNfeItemDTO> items = extractItems(lines);

            if (items.isEmpty()) {
                throw new BusinessException("Não foi possível extrair os itens do PDF da NF-e. Gere o DANFE em texto (não imagem) ou importe o XML da NF-e.");
            }

            // Totais
            BigDecimal vProd = extractMoney(flat, "(?i)VALOR TOTAL DOS PRODUTOS|VALOR DOS PRODUTOS");
            BigDecimal vNF = extractMoney(flat, "(?i)VALOR TOTAL DA NOTA|VALOR TOTAL DA NF|TOTAL DA NOTA");
            BigDecimal vFrete = extractMoney(flat, "(?i)VALOR DO FRETE|TOTAL DO FRETE");
            BigDecimal vDesc = extractMoney(flat, "(?i)VALOR DO DESCONTO|TOTAL DO DESCONTO");

            BigDecimal itemsSum = items.stream()
                    .map(i -> i.getTotalPrice() != null ? i.getTotalPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (vProd == null || vProd.compareTo(BigDecimal.ZERO) == 0) {
                vProd = itemsSum;
            }
            if (vNF == null || vNF.compareTo(BigDecimal.ZERO) == 0) {
                vNF = itemsSum.compareTo(BigDecimal.ZERO) > 0 ? itemsSum : vProd;
            }

            UUID existingSupplierId = findExistingSupplierId(supplierInfo.cnpj);
            DuplicateCheck duplicateCheck = checkAlreadyImported(nNf, accessKey);

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

    private String extractAccessKey(String flat) {
        Matcher matcher = Pattern.compile("\\d(?:[\\s.]*\\d){43,70}").matcher(flat);
        while (matcher.find()) {
            String digits = matcher.group().replaceAll("\\D", "");
            if (digits.length() >= 44) {
                return digits.substring(0, 44);
            }
        }
        return "";
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
        SupplierInfo info = new SupplierInfo();
        int cnpjIdx = -1;
        for (int i = 0; i < lines.size(); i++) {
            Matcher matcher = Pattern.compile("(?i)CNPJ\\s*[:.]?\\s*([\\d./-]{11,20})").matcher(lines.get(i));
            if (matcher.find()) {
                info.cnpj = matcher.group(1).trim();
                cnpjIdx = i;
                break;
            }
        }
        if (cnpjIdx < 0) {
            return info;
        }

        // Nome/razão social: linha imediatamente acima do CNPJ (padrão DANFE)
        for (int i = cnpjIdx - 1; i >= 0 && i >= cnpjIdx - 4; i--) {
            String candidate = lines.get(i);
            if (isDanfeLabel(candidate)) {
                continue;
            }
            if (containsLetters(candidate)) {
                info.name = candidate;
                info.tradeName = candidate;
                break;
            }
        }

        // Endereço, cidade/UF e CEP: linhas imediatamente abaixo do CNPJ
        for (int i = cnpjIdx + 1; i < Math.min(lines.size(), cnpjIdx + 6); i++) {
            String candidate = lines.get(i);
            if (isDanfeLabel(candidate)) {
                continue;
            }
            Matcher cityMatcher = Pattern.compile("(?i)([\\p{L} .]{2,40})\\s*/\\s*([A-Za-z]{2})(?:\\s*CEP\\s*[:.]?\\s*([\\d-]{8,9}))?")
                    .matcher(candidate);
            if (cityMatcher.find()) {
                info.city = cityMatcher.group(1).trim();
                info.state = cityMatcher.group(2).toUpperCase();
                if (cityMatcher.group(3) != null) {
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

    private boolean containsLetters(String value) {
        return value != null && value.matches(".*\\p{L}.*");
    }

    private List<StockNfeParsedDTO.StockNfeItemDTO> extractItems(List<String> lines) {
        List<StockNfeParsedDTO.StockNfeItemDTO> items = new ArrayList<>();

        int start = -1;
        int end = lines.size();
        for (int i = 0; i < lines.size(); i++) {
            String upper = lines.get(i).toUpperCase();
            if (start < 0 && (upper.contains("DADOS DOS PRODUTOS") || upper.contains("DADOS DOS SERVICOS")
                    || (upper.contains("CÓDIGO") && upper.contains("DESCRIÇÃO")))) {
                start = i + 1;
                continue;
            }
            if (start >= 0 && (upper.contains("DADOS ADICIONAIS") || upper.contains("CÁLCULO DO IMPOSTO")
                    || upper.contains("CALCULO DO IMPOSTO") || upper.contains("DADOS DO TRANSPORTE"))) {
                end = i;
                break;
            }
        }
        if (start < 0) {
            start = 0;
        }

        // Padrões de linha de item: código + descrição | NCM/CFOP | UN | qtd | total | unitário
        Pattern fullSlash = Pattern.compile("^(.*?)\\s+(\\d{4,8})\\s*/\\s*(\\d{4})\\s+([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)");
        Pattern fullSplit = Pattern.compile("^(.*?)\\s+(\\d{4,8})\\s+(\\d{4})\\s+([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)");
        Pattern fullNoNcm = Pattern.compile("^(.*?)\\s+([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s*$");
        // Linhas somente com as colunas numéricas (descrição na linha anterior)
        Pattern colsSlash = Pattern.compile("^(\\d{4,8})\\s*/\\s*(\\d{4})\\s+([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)");
        Pattern colsSplit = Pattern.compile("^(\\d{4,8})\\s+(\\d{4})\\s+([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)");
        Pattern colsBare = Pattern.compile("^([A-Za-z/]{1,5})\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s+(\\d[\\d.,]*)\\s*$");
        // Código + descrição sem colunas numéricas
        Pattern codeDesc = Pattern.compile("^(\\S+)\\s+(.*\\p{L}.*)$");

        List<ParsedItemRow> rows = new ArrayList<>();
        String pendingCode = null;
        String pendingDesc = null;

        for (int i = start; i < end; i++) {
            String line = lines.get(i);
            String upper = line.toUpperCase();
            if (upper.contains("CÓDIGO") && upper.contains("DESCRIÇÃO")) {
                continue;
            }

            String description = null;
            String ncm = "";
            String cfop = "";
            String unit = "";
            BigDecimal qty = null;
            BigDecimal total = null;
            BigDecimal unitPrice = null;
            boolean fromPending = false;

            Matcher matcher = fullSlash.matcher(line);
            if (matcher.find()) {
                description = matcher.group(1).trim();
                ncm = matcher.group(2);
                cfop = matcher.group(3);
                unit = matcher.group(4);
                qty = parsePtBrNumber(matcher.group(5));
                total = parsePtBrNumber(matcher.group(6));
                unitPrice = parsePtBrNumber(matcher.group(7));
            } else if ((matcher = fullSplit.matcher(line)).find()) {
                description = matcher.group(1).trim();
                ncm = matcher.group(2);
                cfop = matcher.group(3);
                unit = matcher.group(4);
                qty = parsePtBrNumber(matcher.group(5));
                total = parsePtBrNumber(matcher.group(6));
                unitPrice = parsePtBrNumber(matcher.group(7));
            } else if ((matcher = fullNoNcm.matcher(line)).find()) {
                description = matcher.group(1).trim();
                unit = matcher.group(2);
                qty = parsePtBrNumber(matcher.group(3));
                total = parsePtBrNumber(matcher.group(4));
                unitPrice = parsePtBrNumber(matcher.group(5));
            } else if ((matcher = colsSlash.matcher(line)).find()) {
                if (pendingCode == null) {
                    continue;
                }
                description = (pendingCode + " " + (pendingDesc != null ? pendingDesc : "")).trim();
                ncm = matcher.group(1);
                cfop = matcher.group(2);
                unit = matcher.group(3);
                qty = parsePtBrNumber(matcher.group(4));
                total = parsePtBrNumber(matcher.group(5));
                unitPrice = parsePtBrNumber(matcher.group(6));
                fromPending = true;
            } else if ((matcher = colsSplit.matcher(line)).find()) {
                if (pendingCode == null) {
                    continue;
                }
                description = (pendingCode + " " + (pendingDesc != null ? pendingDesc : "")).trim();
                ncm = matcher.group(1);
                cfop = matcher.group(2);
                unit = matcher.group(3);
                qty = parsePtBrNumber(matcher.group(4));
                total = parsePtBrNumber(matcher.group(5));
                unitPrice = parsePtBrNumber(matcher.group(6));
                fromPending = true;
            } else if ((matcher = colsBare.matcher(line)).find()) {
                if (pendingCode == null) {
                    continue;
                }
                description = (pendingCode + " " + (pendingDesc != null ? pendingDesc : "")).trim();
                unit = matcher.group(1);
                qty = parsePtBrNumber(matcher.group(2));
                total = parsePtBrNumber(matcher.group(3));
                unitPrice = parsePtBrNumber(matcher.group(4));
                fromPending = true;
            } else {
                Matcher codeMatcher = codeDesc.matcher(line);
                if (codeMatcher.find() && pendingCode == null && line.length() > 3 && !line.matches(".*\\d{2}/\\d{2}/\\d{4}.*")) {
                    pendingCode = codeMatcher.group(1).trim();
                    pendingDesc = codeMatcher.group(2).trim();
                } else if (pendingDesc != null) {
                    pendingDesc = (pendingDesc + " " + line).trim();
                } else if (!rows.isEmpty() && containsLetters(line) && line.length() > 3
                        && !line.matches(".*\\d{2}/\\d{2}/\\d{4}.*")) {
                    ParsedItemRow previous = rows.get(rows.size() - 1);
                    String merged = (previous.description + " " + line).trim();
                    previous.description = merged.length() > 250 ? merged.substring(0, 250) : merged;
                }
                continue;
            }

            if (fromPending) {
                pendingCode = null;
                pendingDesc = null;
            }

            // Separa código do produto da descrição (primeira palavra = código)
            String[] parts = description.split("\\s+", 2);
            String code = parts[0];
            String desc = parts.length > 1 ? parts[1] : parts[0];
            if (desc.isBlank()) {
                desc = code;
            }

            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) == 0) {
                unitPrice = total != null ? total.divide(qty, 4, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
            }
            if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
                total = unitPrice.multiply(qty);
            }

            ParsedItemRow row = new ParsedItemRow();
            row.code = code;
            row.description = desc;
            row.ncm = ncm;
            row.cfop = cfop;
            row.unit = unit;
            row.qty = qty;
            row.total = total;
            row.unitPrice = unitPrice;
            rows.add(row);
        }

        for (ParsedItemRow row : rows) {
            String desc = row.description;
            boolean isBattery = detectBattery(desc);
            boolean isTire = detectTire(desc);
            StockCategory suggestedCategory = detectCategory(desc, isBattery, isTire);
            Optional<StockItem> matchedItem = matchExistingItem(row.code, desc);

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

    private List<StockNfeParsedDTO.StockNfeInstallmentDTO> extractInstallments(List<String> lines) {
        List<StockNfeParsedDTO.StockNfeInstallmentDTO> installments = new ArrayList<>();

        int start = -1;
        int end = lines.size();
        for (int i = 0; i < lines.size(); i++) {
            String upper = lines.get(i).toUpperCase();
            if (start < 0 && (upper.contains("DADOS DAS DUPLICATAS") || upper.contains("DUPLICATA"))) {
                start = i + 1;
                continue;
            }
            if (start >= 0 && (upper.contains("DADOS ADICIONAIS") || upper.contains("OUTRAS DEDUCOES")
                    || upper.contains("OUTRAS DEDUÇÕES") || upper.contains("CALCULO DO IMPOSTO")
                    || upper.contains("CÁLCULO DO IMPOSTO"))) {
                end = i;
                break;
            }
        }
        if (start < 0) {
            return installments;
        }

        Pattern rowPattern = Pattern.compile("(\\d{1,6})\\s+(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s+(\\d{2}/\\d{2}/\\d{4})");
        for (int i = start; i < end; i++) {
            Matcher matcher = rowPattern.matcher(lines.get(i));
            if (matcher.find()) {
                BigDecimal amount = parsePtBrNumber(matcher.group(2));
                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                int seq;
                try {
                    seq = Integer.parseInt(matcher.group(1).replaceAll("\\D", ""));
                } catch (Exception ex) {
                    seq = installments.size() + 1;
                }
                installments.add(StockNfeParsedDTO.StockNfeInstallmentDTO.builder()
                        .installmentNumber(seq > 0 ? seq : installments.size() + 1)
                        .dueDate(parsePtBrDate(matcher.group(3)))
                        .amount(amount)
                        .barcode("")
                        .build());
            }
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
    private Optional<StockItem> matchExistingItem(String cProd, String xProd) {
        if (cProd != null && !cProd.isBlank()) {
            Optional<StockItem> byCode = stockItemRepository.findByCode(cProd.trim());
            if (byCode.isPresent()) {
                return byCode;
            }
        }
        if (xProd != null && !xProd.isBlank()) {
            String searchPrefix = xProd.length() > 15 ? xProd.substring(0, 15) : xProd;
            List<StockItem> byName = stockItemRepository.findByNameContainingIgnoreCase(searchPrefix);
            if (!byName.isEmpty()) {
                return Optional.of(byName.get(0));
            }
        }
        return Optional.empty();
    }

    /**
     * Localiza um fornecedor já cadastrado pelo CNPJ.
     */
    private UUID findExistingSupplierId(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) {
            return null;
        }
        String cleanCnpj = cnpj.replaceAll("[^0-9]", "");
        Optional<Supplier> optSupplier = supplierRepository.findByCnpj(cleanCnpj);
        if (optSupplier.isEmpty()) {
            optSupplier = supplierRepository.findByCnpj(cnpj);
        }
        return optSupplier.map(Supplier::getId).orElse(null);
    }

    /**
     * Verifica se a NF-e (pela chave de acesso) já foi lançada no financeiro.
     */
    private DuplicateCheck checkAlreadyImported(String nNf, String accessKey) {
        if (accessKey == null || accessKey.isBlank() || nNf == null || nNf.isBlank()) {
            return new DuplicateCheck(false, null);
        }
        List<Invoice> existingInvoices = invoiceRepository.findByInvoiceNumberContaining(nNf);
        for (Invoice inv : existingInvoices) {
            if (inv.getNotes() != null && inv.getNotes().contains(accessKey)) {
                return new DuplicateCheck(true,
                        "Atenção: A NF-e nº " + nNf + " (Chave " + accessKey + ") já foi lançada no financeiro anteriormente.");
            }
        }
        return new DuplicateCheck(false, null);
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
                while (invoiceRepository.existsByInvoiceNumberNative(generatedInvoiceNum)) {
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
        String cleanCnpj = (rawCnpj != null) ? rawCnpj.replaceAll("[^0-9]", "") : "";

        if (!cleanCnpj.isBlank()) {
            try {
                Optional<Supplier> found = supplierRepository.findByCleanCnpjNative(cleanCnpj);
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
