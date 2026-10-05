package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.warehouse.WarehouseInboundCheckPayload;
import com.z7design.fleet_manager.dto.warehouse.WarehouseInboundParsedXmlDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseInboundService {

    private final WarehouseInboundDocumentRepository inboundDocumentRepository;
    private final WarehouseInboundItemRepository inboundItemRepository;
    private final WarehouseProductRepository productRepository;
    private final WarehouseLocationRepository locationRepository;
    private final WarehouseStockLevelRepository stockLevelRepository;
    private final WarehouseMovementRepository movementRepository;
    private final TireRepository tireRepository;
    private final VehicleBatteryRepository vehicleBatteryRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Efetua o parsing seguro do arquivo XML de NF-e (modelo 55) extraindo dados cadastrais, itens e duplicatas.
     */
    public WarehouseInboundParsedXmlDTO parseNfeXml(InputStream xmlStream) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Prevenção contra XXE (XML External Entity)
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(xmlStream);
            doc.getDocumentElement().normalize();

            // Chave de acesso (atributo Id da tag infNFe)
            String accessKey = "";
            NodeList infNfeNodes = doc.getElementsByTagName("infNFe");
            if (infNfeNodes.getLength() > 0) {
                Element infNfe = (Element) infNfeNodes.item(0);
                String idAttr = infNfe.getAttribute("Id");
                accessKey = idAttr.replaceAll("[^0-9]", "");
            }

            // Dados da identificação da NF-e (ide)
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
                } catch (Exception ex) {
                    log.warn("Erro ao fazer parse da data de emissão: {}", dhEmi);
                }
            }

            // Dados do Emitente (emit)
            String cnpj = "";
            String xNome = "";
            NodeList emitNodes = doc.getElementsByTagName("emit");
            if (emitNodes.getLength() > 0) {
                Element emitEl = (Element) emitNodes.item(0);
                cnpj = getTagValue(emitEl, "CNPJ");
                if (cnpj == null || cnpj.isEmpty()) {
                    cnpj = getTagValue(emitEl, "CPF");
                }
                xNome = getTagValue(emitEl, "xNome");
            }

            // Totais
            BigDecimal vProd = parseDecimal(getTagValue(doc, "vProd"));
            BigDecimal vNF = parseDecimal(getTagValue(doc, "vNF"));

            WarehouseInboundParsedXmlDTO result = WarehouseInboundParsedXmlDTO.builder()
                    .accessKey(accessKey)
                    .documentNumber(nNf)
                    .series(serie)
                    .supplierCnpj(cnpj)
                    .supplierName(xNome)
                    .issueDate(issueDate)
                    .totalProductsValue(vProd)
                    .totalInvoiceValue(vNF)
                    .items(new ArrayList<>())
                    .installments(new ArrayList<>())
                    .build();

            // Itens (det)
            NodeList detNodes = doc.getElementsByTagName("det");
            for (int i = 0; i < detNodes.getLength(); i++) {
                Element detEl = (Element) detNodes.item(i);
                NodeList prodNodes = detEl.getElementsByTagName("prod");
                if (prodNodes.getLength() > 0) {
                    Element prodEl = (Element) prodNodes.item(0);
                    String cProd = getTagValue(prodEl, "cProd");
                    String xProd = getTagValue(prodEl, "xProd");
                    String ncm = getTagValue(prodEl, "NCM");
                    String cfop = getTagValue(prodEl, "CFOP");
                    String uCom = getTagValue(prodEl, "uCom");
                    BigDecimal qCom = parseDecimal(getTagValue(prodEl, "qCom"));
                    BigDecimal vUnCom = parseDecimal(getTagValue(prodEl, "vUnCom"));
                    BigDecimal vProdItem = parseDecimal(getTagValue(prodEl, "vProd"));

                    result.getItems().add(WarehouseInboundParsedXmlDTO.ParsedItemDTO.builder()
                            .productCode(cProd)
                            .description(xProd)
                            .ncm(ncm)
                            .cfop(cfop)
                            .unitMeasure(uCom != null ? uCom.toUpperCase() : "UN")
                            .quantity(qCom)
                            .unitPrice(vUnCom)
                            .totalPrice(vProdItem)
                            .build());
                }
            }

            // Duplicatas / Parcelas (dup)
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

                LocalDate dueDate = issueDate.plusDays(30 * (i + 1));
                if (dVenc != null && dVenc.length() >= 10) {
                    try {
                        dueDate = LocalDate.parse(dVenc.substring(0, 10));
                    } catch (Exception ignored) {
                    }
                }

                result.getInstallments().add(WarehouseInboundParsedXmlDTO.ParsedInstallmentDTO.builder()
                        .installmentNumber(seq)
                        .dueDate(dueDate)
                        .amount(vDup)
                        .build());
            }

            // Se não houver duplicatas na tag dup, cria uma parcela única com o valor total
            if (result.getInstallments().isEmpty() && vNF.compareTo(BigDecimal.ZERO) > 0) {
                result.getInstallments().add(WarehouseInboundParsedXmlDTO.ParsedInstallmentDTO.builder()
                        .installmentNumber(1)
                        .dueDate(issueDate.plusDays(30))
                        .amount(vNF)
                        .build());
            }

            return result;
        } catch (Exception e) {
            log.error("Falha ao processar arquivo XML da NF-e: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar o XML da NF-e: " + e.getMessage(), e);
        }
    }

    /**
     * Persiste o Documento de Entrada com base nos dados do XML verificado.
     */
    @Transactional
    public WarehouseInboundDocument createDocumentFromParsedXml(UUID companyId, UUID receiverUserId, WarehouseInboundParsedXmlDTO dto) {
        if (dto.getAccessKey() != null && !dto.getAccessKey().isEmpty()) {
            Optional<WarehouseInboundDocument> existing = inboundDocumentRepository.findByCompanyIdAndAccessKey(companyId, dto.getAccessKey());
            if (existing.isPresent()) {
                throw new IllegalStateException("Esta NF-e (chave " + dto.getAccessKey() + ") já foi cadastrada anteriormente no almoxarifado.");
            }
        }

        WarehouseInboundDocument document = WarehouseInboundDocument.builder()
                .companyId(companyId)
                .documentNumber(dto.getDocumentNumber() != null ? dto.getDocumentNumber() : "S/N")
                .series(dto.getSeries())
                .accessKey(dto.getAccessKey())
                .supplierCnpj(dto.getSupplierCnpj() != null ? dto.getSupplierCnpj() : "")
                .supplierName(dto.getSupplierName() != null ? dto.getSupplierName() : "Fornecedor Desconhecido")
                .issueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now())
                .arrivalDate(LocalDateTime.now())
                .totalProductsValue(dto.getTotalProductsValue() != null ? dto.getTotalProductsValue() : BigDecimal.ZERO)
                .totalInvoiceValue(dto.getTotalInvoiceValue() != null ? dto.getTotalInvoiceValue() : BigDecimal.ZERO)
                .status(WarehouseInboundStatus.RECEBIDA)
                .receiverUserId(receiverUserId)
                .build();

        List<WarehouseInboundItem> items = new ArrayList<>();
        if (dto.getItems() != null) {
            for (WarehouseInboundParsedXmlDTO.ParsedItemDTO itemDto : dto.getItems()) {
                // Tenta associar com produto existente pelo código ou código de barras
                WarehouseProduct matchedProduct = null;
                if (itemDto.getProductCode() != null) {
                    matchedProduct = productRepository.findByCompanyIdAndCode(companyId, itemDto.getProductCode())
                            .orElse(null);
                }

                WarehouseInboundItem item = WarehouseInboundItem.builder()
                        .inboundDocument(document)
                        .product(matchedProduct)
                        .productCodeInvoice(itemDto.getProductCode() != null ? itemDto.getProductCode() : "")
                        .productDescriptionInvoice(itemDto.getDescription() != null ? itemDto.getDescription() : "")
                        .ncm(itemDto.getNcm())
                        .unitMeasure(itemDto.getUnitMeasure() != null ? itemDto.getUnitMeasure() : "UN")
                        .quantityInvoiced(itemDto.getQuantity() != null ? itemDto.getQuantity() : BigDecimal.ONE)
                        .quantityChecked(BigDecimal.ZERO)
                        .unitPrice(itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO)
                        .totalPrice(itemDto.getTotalPrice() != null ? itemDto.getTotalPrice() : BigDecimal.ZERO)
                        .build();
                items.add(item);
            }
        }
        document.setItems(items);

        List<WarehouseInboundInstallment> installments = new ArrayList<>();
        if (dto.getInstallments() != null) {
            for (WarehouseInboundParsedXmlDTO.ParsedInstallmentDTO instDto : dto.getInstallments()) {
                WarehouseInboundInstallment inst = WarehouseInboundInstallment.builder()
                        .inboundDocument(document)
                        .installmentNumber(instDto.getInstallmentNumber() != null ? instDto.getInstallmentNumber() : 1)
                        .dueDate(instDto.getDueDate() != null ? instDto.getDueDate() : LocalDate.now().plusDays(30))
                        .amount(instDto.getAmount() != null ? instDto.getAmount() : BigDecimal.ZERO)
                        .barcode(instDto.getBarcode())
                        .build();
                installments.add(inst);
            }
        }
        document.setInstallments(installments);

        return inboundDocumentRepository.save(document);
    }

    /**
     * Inicia a etapa de conferência física da carga.
     */
    @Transactional
    public WarehouseInboundDocument startConference(UUID documentId) {
        WarehouseInboundDocument doc = getDocumentOrThrow(documentId);
        if (doc.getStatus() != WarehouseInboundStatus.RECEBIDA && doc.getStatus() != WarehouseInboundStatus.DIVERGENTE) {
            throw new IllegalStateException("O documento não pode iniciar conferência no status atual: " + doc.getStatus());
        }
        doc.setStatus(WarehouseInboundStatus.EM_CONFERENCIA);
        return inboundDocumentRepository.save(doc);
    }

    /**
     * Registra os dados da conferência física dos itens e apura divergências.
     */
    @Transactional
    public WarehouseInboundDocument checkConferenceItems(UUID documentId, WarehouseInboundCheckPayload payload) {
        WarehouseInboundDocument doc = getDocumentOrThrow(documentId);
        boolean hasDivergence = false;

        Map<UUID, WarehouseInboundCheckPayload.ItemCheckDTO> checkMap = new HashMap<>();
        if (payload.getItems() != null) {
            for (WarehouseInboundCheckPayload.ItemCheckDTO itemCheck : payload.getItems()) {
                if (itemCheck.getItemId() != null) {
                    checkMap.put(itemCheck.getItemId(), itemCheck);
                }
            }
        }

        for (WarehouseInboundItem item : doc.getItems()) {
            WarehouseInboundCheckPayload.ItemCheckDTO check = checkMap.get(item.getId());
            if (check != null) {
                BigDecimal checked = check.getQuantityChecked() != null ? check.getQuantityChecked() : BigDecimal.ZERO;
                item.setQuantityChecked(checked);
                item.setLotNumber(check.getLotNumber());

                if (check.getMatchedProductId() != null) {
                    productRepository.findById(check.getMatchedProductId()).ifPresent(item::setProduct);
                }

                if (item.getQuantityInvoiced().compareTo(checked) != 0) {
                    hasDivergence = true;
                }
            } else {
                hasDivergence = true;
            }
        }

        doc.setCheckedUserId(payload.getCheckedUserId());
        doc.setCheckedAt(LocalDateTime.now());
        if (payload.getNotes() != null) {
            doc.setNotes(payload.getNotes());
        }

        doc.setStatus(hasDivergence ? WarehouseInboundStatus.DIVERGENTE : WarehouseInboundStatus.CONFERIDA);
        return inboundDocumentRepository.save(doc);
    }

    /**
     * Lança a entrada de saldo no estoque e instancia itens rastreáveis (pneus e baterias).
     */
    @Transactional
    public WarehouseInboundDocument processStock(UUID documentId, UUID defaultLocationId) {
        WarehouseInboundDocument doc = getDocumentOrThrow(documentId);
        if (doc.getStatus() != WarehouseInboundStatus.CONFERIDA) {
            throw new IllegalStateException("Para processar o estoque o documento precisa estar CONFERIDA. Status atual: " + doc.getStatus());
        }

        WarehouseLocation location = null;
        if (defaultLocationId != null) {
            location = locationRepository.findById(defaultLocationId).orElse(null);
        }

        for (WarehouseInboundItem item : doc.getItems()) {
            WarehouseProduct product = item.getProduct();
            if (product == null) {
                throw new IllegalStateException("Item '" + item.getProductDescriptionInvoice() + "' precisa ser vinculado a um Produto do catálogo antes da entrada.");
            }

            BigDecimal qty = item.getQuantityChecked() != null && item.getQuantityChecked().compareTo(BigDecimal.ZERO) > 0
                    ? item.getQuantityChecked() : item.getQuantityInvoiced();

            WarehouseLocation itemLocation = location != null ? location : product.getDefaultLocation();
            if (itemLocation == null) {
                List<WarehouseLocation> locations = locationRepository.findByCompanyIdAndActiveTrueOrderByFullCodeAsc(doc.getCompanyId());
                if (!locations.isEmpty()) {
                    itemLocation = locations.get(0);
                } else {
                    itemLocation = locationRepository.save(WarehouseLocation.builder()
                            .companyId(doc.getCompanyId())
                            .warehouseName("Almoxarifado Central")
                            .aisle("A")
                            .shelf("01")
                            .level("01")
                            .fullCode("ALM-A-01-01")
                            .active(true)
                            .build());
                }
            }

            // Atualiza ou cria saldo no local
            WarehouseStockLevel stockLevel = stockLevelRepository
                    .findByCompanyIdAndProductIdAndLocationId(doc.getCompanyId(), product.getId(), itemLocation.getId())
                    .orElse(WarehouseStockLevel.builder()
                            .companyId(doc.getCompanyId())
                            .product(product)
                            .location(itemLocation)
                            .quantityPhysical(BigDecimal.ZERO)
                            .quantityReserved(BigDecimal.ZERO)
                            .build());

            stockLevel.setQuantityPhysical(stockLevel.getQuantityPhysical().add(qty));
            stockLevelRepository.save(stockLevel);

            // Registra movimentação no ledger
            WarehouseMovement movement = WarehouseMovement.builder()
                    .companyId(doc.getCompanyId())
                    .product(product)
                    .location(itemLocation)
                    .movementType(WarehouseMovementType.ENTRADA_COMPRA)
                    .quantity(qty)
                    .unitCost(item.getUnitPrice())
                    .totalCost(item.getTotalPrice())
                    .inboundDocument(doc)
                    .batchNumber(item.getLotNumber())
                    .performedByUserId(doc.getReceiverUserId())
                    .notes("Entrada por NF-e " + doc.getDocumentNumber() + " - Fornecedor: " + doc.getSupplierName())
                    .build();
            movementRepository.save(movement);

            // Atualiza preço médio e último preço de compra no produto
            product.setLastPurchasePrice(item.getUnitPrice());
            productRepository.save(product);

            // Tratamento especializado para PNEUS
            if (product.getTrackingType() == WarehouseTrackingType.INDIVIDUAL_TIRE) {
                int count = qty.intValue();
                for (int i = 0; i < count; i++) {
                    String generatedSerial = "PN-" + doc.getDocumentNumber() + "-" + (i + 1) + "-" + System.currentTimeMillis() % 10000;
                    Tire tire = new Tire();
                    tire.setCompanyId(doc.getCompanyId());
                    tire.setSerialNumber(generatedSerial);
                    tire.setDot("DOT-" + LocalDate.now().getYear());
                    tire.setBrand(doc.getSupplierName());
                    tire.setModel(product.getName());
                    tire.setSize("295/80 R22.5");
                    tire.setStatus(TireStatus.AVAILABLE);
                    tire.setCurrentMileage(0);
                    tire.setRecapCount(0);
                    tire.setProduct(product);
                    tire.setInboundItem(item);
                    tire.setAcquisitionCost(item.getUnitPrice());
                    tire.setInitialTreadDepth(new BigDecimal("15.00"));
                    tire.setCurrentTreadDepth(new BigDecimal("15.00"));
                    tireRepository.save(tire);
                }
            }

            // Tratamento especializado para BATERIAS
            if (product.getTrackingType() == WarehouseTrackingType.INDIVIDUAL_BATTERY) {
                int count = qty.intValue();
                for (int i = 0; i < count; i++) {
                    String generatedSerial = "BAT-" + doc.getDocumentNumber() + "-" + (i + 1) + "-" + System.currentTimeMillis() % 10000;
                    VehicleBattery battery = VehicleBattery.builder()
                            .companyId(doc.getCompanyId())
                            .serialNumber(generatedSerial)
                            .batteryCode(generatedSerial)
                            .brand(doc.getSupplierName())
                            .model(product.getName())
                            .voltage("12V")
                            .capacity("150Ah")
                            .status(VehicleBattery.BatteryStatus.ACTIVE)
                            .cost(item.getUnitPrice())
                            .product(product)
                            .inboundItem(item)
                            .warrantyExpiryDate(LocalDate.now().plusMonths(18))
                            .notes("Entrada por NF-e " + doc.getDocumentNumber())
                            .build();
                    vehicleBatteryRepository.save(battery);
                }
            }
        }

        doc.setStatus(WarehouseInboundStatus.ESTOQUE_PROCESSADO);
        return inboundDocumentRepository.save(doc);
    }

    /**
     * Integra as parcelas da NF-e ao módulo de Contas a Pagar / Financeiro.
     */
    @Transactional
    public WarehouseInboundDocument processFinancial(UUID documentId) {
        WarehouseInboundDocument doc = getDocumentOrThrow(documentId);
        if (doc.getStatus() != WarehouseInboundStatus.ESTOQUE_PROCESSADO) {
            throw new IllegalStateException("O estoque precisa estar processado antes do financeiro. Status atual: " + doc.getStatus());
        }

        for (WarehouseInboundInstallment inst : doc.getInstallments()) {
            String invNum = "NFE-" + doc.getDocumentNumber() + "-" + inst.getInstallmentNumber();

            Invoice invoice = new Invoice();
            invoice.setCompanyId(doc.getCompanyId());
            invoice.setInvoiceNumber(invNum);
            invoice.setDescription("NF-e " + doc.getDocumentNumber() + " - " + doc.getSupplierName() + " (Parc. " + inst.getInstallmentNumber() + ")");
            invoice.setAmount(inst.getAmount());
            invoice.setType(ExpenseType.VARIAVEL);
            invoice.setStatus(ExpenseStatus.PENDENTE);
            invoice.setDueDate(inst.getDueDate());
            invoice.setIssueDate(doc.getIssueDate());
            invoice.setBarcode(inst.getBarcode());
            invoice.setCategory("ALMOXARIFADO");
            invoice.setSupplierName(doc.getSupplierName());
            invoice.setNotes("Gerado automaticamente pelo Almoxarifado via Documento de Entrada.");

            Invoice savedInvoice = invoiceRepository.save(invoice);
            inst.setAccountPayableId(savedInvoice.getId());
        }

        doc.setStatus(WarehouseInboundStatus.FINALIZADA);
        return inboundDocumentRepository.save(doc);
    }

    public Page<WarehouseInboundDocument> findAll(UUID companyId, Pageable pageable) {
        return inboundDocumentRepository.findByCompanyIdOrderByArrivalDateDesc(companyId, pageable);
    }

    public WarehouseInboundDocument findById(UUID id) {
        return getDocumentOrThrow(id);
    }

    private WarehouseInboundDocument getDocumentOrThrow(UUID id) {
        return inboundDocumentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Documento de Entrada não encontrado com ID: " + id));
    }

    private String getTagValue(Element parent, String tagName) {
        NodeList nl = parent.getElementsByTagName(tagName);
        if (nl != null && nl.getLength() > 0) {
            return nl.item(0).getTextContent().trim();
        }
        return null;
    }

    private String getTagValue(Document doc, String tagName) {
        NodeList nl = doc.getElementsByTagName(tagName);
        if (nl != null && nl.getLength() > 0) {
            return nl.item(0).getTextContent().trim();
        }
        return null;
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
