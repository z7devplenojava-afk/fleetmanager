package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeCreateRequest;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeItemRequest;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeItemResponse;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeResponse;
import com.z7design.fleet_manager.fiscal.FiscalCertificateMaterial;
import com.z7design.fleet_manager.fiscal.FiscalXmlValidator;
import com.z7design.fleet_manager.fiscal.NfeAccessKey;
import com.z7design.fleet_manager.fiscal.NfeResponseParser;
import com.z7design.fleet_manager.fiscal.NfeSefazClient;
import com.z7design.fleet_manager.fiscal.NfeXmlBuilder;
import com.z7design.fleet_manager.fiscal.SefazSoapClient;
import com.z7design.fleet_manager.fiscal.XmlSigner;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.ElectronicNfe;
import com.z7design.fleet_manager.model.ElectronicNfeItem;
import com.z7design.fleet_manager.model.FiscalCertificate;
import com.z7design.fleet_manager.model.FiscalDocument;
import com.z7design.fleet_manager.model.enums.FiscalDocumentStatus;
import com.z7design.fleet_manager.model.enums.FiscalDocumentType;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.ElectronicNfeRepository;
import com.z7design.fleet_manager.repository.FiscalDocumentRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Emissão real de NF-e modelo 55 (versão 4.00): monta o XML, assina com o certificado
 * A1 da empresa, valida contra o XSD oficial, transmite à SEFAZ via SOAP e registra
 * protocolo/espelho fiscal.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ElectronicNfeService {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int MAX_NUMBER_ATTEMPTS = 5;

    public static final String STATUS_DRAFT = "RASCUNHO";
    public static final String STATUS_SENDING = "PROCESSANDO";
    public static final String STATUS_ISSUED = "EMITIDA";
    public static final String STATUS_ERROR = "ERRO";
    public static final String STATUS_CANCELLED = "CANCELADA";

    private static final DeviceRgb HEADER = new DeviceRgb(31, 41, 55);
    private static final DeviceRgb HEADER_FG = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb LIGHT = new DeviceRgb(243, 244, 246);
    private static final DeviceRgb AMBER = new DeviceRgb(180, 130, 20);
    private static final DeviceRgb RED = new DeviceRgb(180, 30, 30);

    private final ElectronicNfeRepository nfeRepository;
    private final FiscalDocumentRepository fiscalDocumentRepository;
    private final CompanyRepository companyRepository;
    private final FiscalCertificateService certificateService;
    private final NfeXmlBuilder xmlBuilder;
    private final XmlSigner xmlSigner;
    private final FiscalXmlValidator schemaValidator;
    private final NfeSefazClient sefazClient;

    // ===================== Consultas =====================

    @Transactional(readOnly = true)
    public List<NfeResponse> list() {
        return nfeRepository.findByCompanyIdOrderByEmissionDateDesc(requireCompany()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NfeResponse get(UUID id) {
        return toResponse(load(id));
    }

    // ===================== Emissão =====================

    public NfeResponse emit(NfeCreateRequest request) {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        FiscalCertificate certificate = certificateService.requireActive(companyId);
        validateCertificateCompany(certificate, company);
        FiscalCertificateMaterial material = certificateService.material(companyId);
        validate(request, company);

        String series = normalizeSeries(request.series());
        ElectronicNfe nfe = reserve(request, company, certificate, series);

        try {
            String plainXml = xmlBuilder.build(nfe);
            String signedXml = xmlSigner.signElement(plainXml, NfeXmlBuilder.NFE_NAMESPACE,
                    "infNFe", "Id", material);
            List<String> problems = schemaValidator.validate("fiscal/xsd/nfe/", "nfe_v4.00.xsd", signedXml);
            if (FiscalXmlValidator.hasErrors(problems)) {
                String message = String.join(" | ", problems);
                markError(nfe, "XML", message);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O XML da NF-e não passou na validação do leiaute v4.00: " + message);
            }

            nfe.setSignedXml(signedXml);
            nfe.setStatus(STATUS_SENDING);
            nfe = nfeRepository.save(nfe);

            SefazSoapClient.SoapResponse response = sefazClient.recepcao(signedXml, material, environment());
            nfe.setResponseXml(response.body());
            NfeResponseParser.ParsedResponse parsed = NfeResponseParser.parse(response);

            if (!parsed.success()) {
                markError(nfe, parsed.statusCode(),
                        parsed.rejectionMessage() != null ? parsed.rejectionMessage()
                                : "A SEFAZ não autorizou a NF-e. HTTP " + response.status() + ".");
                return toResponse(nfe);
            }
            if (parsed.processing()) {
                nfe.setStatus(STATUS_SENDING);
                nfe.setProtocolMessage(firstNonBlank(parsed.message(), "NF-e em processamento na SEFAZ."));
                nfe.setRejectionCode(null);
                nfe.setRejectionMessage(null);
                nfe = nfeRepository.save(nfe);
                syncFiscalDocument(nfe, FiscalDocumentStatus.PENDING);
                return toResponse(nfe);
            }
            applySuccess(nfe, parsed);
            return toResponse(nfe);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            String message = e.getMessage() == null ? "Dados fiscais inválidos." : e.getMessage();
            markError(nfe, "DADOS", message);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message, e);
        } catch (Exception e) {
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            markError(nfe, "FALHA", message);
            log.error("Falha ao emitir NF-e para a empresa {} (chave {}): {}", companyId, nfe.getAccessKey(), message, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível concluir a emissão da NF-e: " + message, e);
        }
    }

    /** Reserva o next número local; colisões no índice único são retentadas. */
    private ElectronicNfe reserve(NfeCreateRequest request, Company company, FiscalCertificate certificate,
                                  String series) {
        for (int attempt = 1; ; attempt++) {
            Integer max = nfeRepository.findMaxNumber(company.getId(), series);
            String number = String.valueOf((max == null ? 0 : max) + 1);
            ElectronicNfe nfe = prepare(request, company, number, series);
            nfe.setCertificateId(certificate.getId());
            try {
                return nfeRepository.saveAndFlush(nfe);
            } catch (DataIntegrityViolationException e) {
                if (attempt >= MAX_NUMBER_ATTEMPTS) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Não foi possível reservar o número da NF-e após " + attempt
                                    + " tentativas. Tente novamente.", e);
                }
                log.warn("Colisão ao reservar NF-e {} série {} para a empresa {}; tentando novamente.",
                        number, nfe.getSeries(), company.getId());
            }
        }
    }

    // ===================== Consulta / cancelamento =====================

    public NfeResponse consultar(UUID id) {
        UUID companyId = requireCompany();
        ElectronicNfe nfe = load(id);
        if (blank(nfe.getAccessKey())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Esta NF-e ainda não possui chave de acesso para consulta.");
        }
        FiscalCertificateMaterial material = certificateService.material(companyId);
        SefazSoapClient.SoapResponse response;
        try {
            response = sefazClient.consultaSituacao(nfe.getAccessKey(), material, environment());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível consultar a NF-e na SEFAZ: " + e.getMessage(), e);
        }
        nfe.setResponseXml(response.body());
        NfeResponseParser.ParsedResponse parsed = NfeResponseParser.parse(response);

        if (parsed.success() && !parsed.processing()) {
            applySuccess(nfe, parsed);
            return toResponse(nfe);
        }
        if ("217".equals(parsed.statusCode()) || "135".equals(parsed.statusCode())) {
            nfe.setStatus(STATUS_CANCELLED);
            if (nfe.getCancelledAt() == null) {
                nfe.setCancelledAt(LocalDateTime.now(ZONE));
            }
            nfe = nfeRepository.save(nfe);
            syncFiscalDocument(nfe, FiscalDocumentStatus.CANCELLED);
            return toResponse(nfe);
        }
        nfe.setProtocolStatus(parsed.statusCode());
        nfe.setProtocolMessage(parsed.message());
        nfe.setProtocolNumber(firstNonBlank(parsed.protocolNumber(), nfe.getProtocolNumber()));
        if (!parsed.success()) {
            nfe.setStatus(STATUS_ERROR);
            nfe.setRejectionCode(parsed.rejectionCode());
            nfe.setRejectionMessage(parsed.rejectionMessage());
        }
        nfe = nfeRepository.save(nfe);
        return toResponse(nfe);
    }

    public NfeResponse cancelar(UUID id, String justificativa) {
        UUID companyId = requireCompany();
        ElectronicNfe nfe = load(id);
        if (!STATUS_ISSUED.equals(nfe.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Só é possível cancelar uma NF-e autorizada (status EMITIDA).");
        }
        if (blank(nfe.getProtocolNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A NF-e não possui protocolo de autorização; consulte-a antes de cancelar.");
        }
        String reason = justificativa == null ? "" : justificativa.trim();
        if (reason.length() < 15 || reason.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A justificativa do cancelamento deve ter entre 15 e 255 caracteres.");
        }

        FiscalCertificateMaterial material = certificateService.material(companyId);
        String eventXml = xmlBuilder.buildCancellationEvent(nfe, reason, 1);
        String signedEvent = xmlSigner.signElement(eventXml, NfeXmlBuilder.NFE_NAMESPACE,
                "infEvento", "Id", material);

        SefazSoapClient.SoapResponse response;
        try {
            response = sefazClient.cancelamento(signedEvent, material, environment());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível enviar o evento de cancelamento à SEFAZ: " + e.getMessage(), e);
        }
        nfe.setResponseXml(joinXml(nfe.getResponseXml(), signedEvent, response.body()));
        NfeResponseParser.ParsedResponse parsed = NfeResponseParser.parse(response);
        if (!parsed.success()) {
            nfe = nfeRepository.save(nfe);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A SEFAZ rejeitou o cancelamento: "
                            + firstNonBlank(parsed.rejectionMessage(), "sem detalhamento no retorno."));
        }
        nfe.setStatus(STATUS_CANCELLED);
        nfe.setCancelledAt(LocalDateTime.now(ZONE));
        nfe.setCancellationReason(reason);
        nfe.setProtocolNumber(firstNonBlank(parsed.protocolNumber(), nfe.getProtocolNumber()));
        nfe.setProtocolMessage(parsed.message());
        nfe = nfeRepository.save(nfe);
        syncFiscalDocument(nfe, FiscalDocumentStatus.CANCELLED);
        log.info("NF-e {} cancelada para a empresa {} (protocolo {}).", nfe.getNumber(), companyId,
                nfe.getProtocolNumber());
        return toResponse(nfe);
    }

    // ===================== Arquivos =====================

    @Transactional(readOnly = true)
    public GeneratedFiscalFile xml(UUID id) {
        ElectronicNfe nfe = load(id);
        String content = blank(nfe.getSignedXml()) ? xmlBuilder.build(nfe) : nfe.getSignedXml();
        String filename = "NFe-" + safeFilename(nfe.getNumber()) + "-serie-" + safeFilename(nfe.getSeries()) + ".xml";
        return new GeneratedFiscalFile(filename, content.getBytes(StandardCharsets.UTF_8), "application/xml");
    }

    @Transactional(readOnly = true)
    public GeneratedFiscalFile pdf(UUID id) {
        ElectronicNfe nfe = load(id);
        String filename = "DANFE-simplificada-" + safeFilename(nfe.getNumber()) + "-serie-"
                + safeFilename(nfe.getSeries()) + ".pdf";
        return new GeneratedFiscalFile(filename, buildPdf(nfe), "application/pdf");
    }

    // ===================== Preparação =====================

    private ElectronicNfe prepare(NfeCreateRequest request, Company company, String number, String series) {
        String environment = environment();
        LocalDateTime emission = LocalDateTime.now(ZONE);
        String taxId = digits(company.getCnpj(), 14);
        String state = firstNonBlank(upper(request.issuerState()), upper(company.getState()));
        String city = firstNonBlank(request.issuerCity(), company.getCity());
        String municipality = sevenDigitsOrNull(firstNonBlank(request.issuerMunicipalityCode(),
                company.getCodigoMunicipio()));
        if (municipality == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre o código IBGE do município (7 dígitos) nos dados fiscais da empresa ou informe-o no pedido.");
        }
        String zip = digits(firstNonBlank(request.issuerZip(), company.getZipCode()), 8);
        if (zip.length() != 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o CEP do emitente com 8 dígitos (cadastro da empresa ou pedido).");
        }
        if (state == null || !state.matches("[A-Z]{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre a UF do emitente (2 letras) nos dados da empresa ou informe-a no pedido.");
        }
        if (blank(city)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre a cidade do emitente nos dados da empresa ou informe-a no pedido.");
        }

        ElectronicNfe nfe = new ElectronicNfe();
        nfe.setCompanyId(company.getId());
        nfe.setNumber(number);
        nfe.setSeries(series);
        nfe.setStatus(STATUS_DRAFT);
        nfe.setEnvironment(environment);
        nfe.setEmissionDate(emission);
        nfe.setAccessKey(NfeAccessKey.generate(state, emission, taxId, series, number,
                firstNonBlank(request.tpEmis(), "1")));
        nfe.setNatureOperation(cut(firstNonBlank(request.natureOperation(),
                "VENDA DE MERCADORIA ADQUIRIDA/RECEBIDA DE TERCEIROS"), 60));
        nfe.setTpNf(firstNonBlank(request.tpNf(), "1"));
        nfe.setIdDest(firstNonBlank(request.idDest(), "1"));
        nfe.setTpImp(firstNonBlank(request.tpImp(), "1"));
        nfe.setTpEmis(firstNonBlank(request.tpEmis(), "1"));
        nfe.setFinNfe(firstNonBlank(request.finNfe(), "1"));
        nfe.setIndFinal(firstNonBlank(request.indFinal(), "1"));
        nfe.setIndPres(firstNonBlank(request.indPres(), "1"));
        nfe.setProcEmi(firstNonBlank(request.procEmi(), "0"));
        nfe.setVerProc(cut(firstNonBlank(request.verProc(), "FleetManager"), 20));

        nfe.setIssuerName(cut(company.getName(), 60));
        nfe.setIssuerTaxId(taxId);
        nfe.setIssuerStateRegistration(digits(firstNonBlank(request.issuerStateRegistration(),
                company.getInscricaoEstadual()), 14));
        nfe.setIssuerState(state);
        nfe.setIssuerCity(cut(city, 60));
        nfe.setIssuerMunicipalityCode(municipality);
        nfe.setIssuerAddress(cut(firstNonBlank(request.issuerAddress(), company.getEnderecoRua(),
                company.getAddress()), 60));
        nfe.setIssuerAddressNumber(cut(firstNonBlank(request.issuerAddressNumber(),
                company.getEnderecoNumero()), 60));
        nfe.setIssuerNeighborhood(cut(firstNonBlank(request.issuerNeighborhood(),
                company.getEnderecoBairro()), 60));
        nfe.setIssuerZip(zip);
        nfe.setIssuerPhone(digits(firstNonBlank(request.issuerPhone(), company.getPhone()), 14));
        nfe.setIssuerEmail(firstNonBlank(request.issuerEmail(), company.getEmail()));
        nfe.setIssuerCrt(firstNonBlank(request.issuerCrt(), crt(company.getRegimeTributario())));

        String recipientTaxId = digits(request.recipientTaxId(), 14);
        nfe.setRecipientName(request.recipientName() == null ? null : cut(request.recipientName(), 60));
        nfe.setRecipientTaxId(recipientTaxId);
        nfe.setRecipientStateRegistration(digits(request.recipientStateRegistration(), 14));
        String defaultIndIe = recipientTaxId.length() == 11 || blank(nfe.getRecipientStateRegistration())
                ? "9" : "1";
        nfe.setRecipientIndIeDest(firstNonBlank(request.recipientIndIeDest(), defaultIndIe));
        nfe.setRecipientEmail(request.recipientEmail());
        nfe.setRecipientAddress(cut(request.recipientAddress(), 60));
        nfe.setRecipientAddressNumber(cut(request.recipientAddressNumber(), 60));
        nfe.setRecipientNeighborhood(cut(request.recipientNeighborhood(), 60));
        nfe.setRecipientCity(cut(request.recipientCity(), 60));
        nfe.setRecipientState(upper(request.recipientState()));
        nfe.setRecipientZip(digits(request.recipientZip(), 8));
        nfe.setRecipientMunicipalityCode(sevenDigitsOrNull(request.recipientMunicipalityCode()));

        nfe.setPaymentType(firstNonBlank(request.paymentType(), "15"));
        nfe.setPaymentInd(firstNonBlank(request.paymentInd(), "0"));
        nfe.setFreightModality(firstNonBlank(request.freightModality(), "9"));
        nfe.setNotes(cut(request.notes(), 5000));
        nfe.setRespTechCnpj(digits(request.respTechCnpj(), 14));
        nfe.setRespTechContact(cut(request.respTechContact(), 60));
        nfe.setRespTechEmail(cut(request.respTechEmail(), 60));
        nfe.setRespTechPhone(digits(request.respTechPhone(), 14));

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal icmsTotal = BigDecimal.ZERO;
        BigDecimal pisTotal = BigDecimal.ZERO;
        BigDecimal cofinsTotal = BigDecimal.ZERO;
        int itemNumber = 0;
        if (request.items() != null) {
            for (NfeItemRequest item : request.items()) {
                if (item == null) {
                    continue;
                }
                itemNumber++;
                BigDecimal quantity = money(item.quantity(), 4);
                BigDecimal unitValue = money(item.unitValue(), 10);
                if (quantity.compareTo(BigDecimal.ZERO) <= 0 || unitValue.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Informe quantidade e valor unitário maiores que zero para todos os itens.");
                }
                BigDecimal itemTotal = quantity.multiply(unitValue).setScale(2, RoundingMode.HALF_UP);
                String cst = firstNonBlank(item.icmsCst(), "00");
                BigDecimal icmsRate = money(item.icmsRate(), 4);
                BigDecimal icmsValue = "00".equals(cst) || "101".equals(cst)
                        ? itemTotal.multiply(icmsRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO.setScale(2);
                BigDecimal icmsBase = "00".equals(cst) ? itemTotal : BigDecimal.ZERO.setScale(2);
                BigDecimal pisRate = money(item.pisRate(), 4);
                BigDecimal cofinsRate = money(item.cofinsRate(), 4);
                BigDecimal pisValue = itemTotal.multiply(pisRate)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                BigDecimal cofinsValue = itemTotal.multiply(cofinsRate)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                ElectronicNfeItem entity = new ElectronicNfeItem();
                entity.setItemNumber(itemNumber);
                entity.setCode(cut(firstNonBlank(item.code(), item.cfop()), 60));
                entity.setDescription(cut(item.description(), 120));
                entity.setNcm(digits(item.ncm(), 8));
                entity.setCfop(digits(item.cfop(), 4));
                entity.setUnit(cut(firstNonBlank(item.unit(), "UN"), 6));
                entity.setQuantity(quantity);
                entity.setUnitValue(unitValue);
                entity.setTotalValue(itemTotal);
                entity.setIcmsOrig(firstNonBlank(item.icmsOrig(), "0"));
                entity.setIcmsCst(cst);
                entity.setIcmsBase(icmsBase);
                entity.setIcmsRate(icmsRate);
                entity.setIcmsValue(icmsValue);
                entity.setPisCst(firstNonBlank(item.pisCst(), "01"));
                entity.setPisBase(itemTotal);
                entity.setPisRate(pisRate);
                entity.setPisValue(pisValue);
                entity.setCofinsCst(firstNonBlank(item.cofinsCst(), "01"));
                entity.setCofinsBase(itemTotal);
                entity.setCofinsRate(cofinsRate);
                entity.setCofinsValue(cofinsValue);
                nfe.addItem(entity);

                total = total.add(itemTotal);
                icmsTotal = icmsTotal.add(icmsValue);
                pisTotal = pisTotal.add(pisValue);
                cofinsTotal = cofinsTotal.add(cofinsValue);
            }
        }
        nfe.setTotalAmount(total);
        nfe.setIcmsBase(itemsBase(nfe));
        nfe.setIcmsValue(icmsTotal);
        nfe.setPisValue(pisTotal);
        nfe.setCofinsValue(cofinsTotal);
        return nfe;
    }

    private void validate(NfeCreateRequest request, Company company) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da NF-e não informados.");
        }
        if (digits(company.getCnpj(), 14).length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre o CNPJ da empresa (14 dígitos) antes de emitir a NF-e.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos um item da NF-e.");
        }
        String recipientTaxId = digits(request.recipientTaxId(), 14);
        if (recipientTaxId.length() != 11 && recipientTaxId.length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o CPF (11 dígitos) ou CNPJ (14 dígitos) do destinatário.");
        }
        if (blank(request.recipientName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do destinatário.");
        }
        if (blank(request.recipientState())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a UF do destinatário.");
        }
        if (blank(request.recipientCity())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a cidade do destinatário.");
        }
        if (blank(request.recipientAddress())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o logradouro do destinatário.");
        }
        if (digits(request.recipientZip(), 8).length() != 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o CEP do destinatário com 8 dígitos.");
        }
        if (sevenDigitsOrNull(request.recipientMunicipalityCode()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o código IBGE do município do destinatário (7 dígitos).");
        }
        for (NfeItemRequest item : request.items()) {
            if (item == null || blank(item.description())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Todos os itens da NF-e precisam de descrição.");
            }
            if (digits(item.ncm(), 8).length() != 2 && digits(item.ncm(), 8).length() != 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O NCM de cada item deve ter 2 ou 8 dígitos.");
            }
            if (!digits(item.cfop(), 4).matches("[123567][0-9]{3}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Informe um CFOP válido (4 dígitos) para cada item.");
            }
        }
    }

    // ===================== Resultado / espelho =====================

    private void applySuccess(ElectronicNfe nfe, NfeResponseParser.ParsedResponse parsed) {
        nfe.setStatus(STATUS_ISSUED);
        nfe.setProtocolNumber(parsed.protocolNumber() == null ? nfe.getProtocolNumber() : parsed.protocolNumber());
        nfe.setProtocolStatus(parsed.statusCode());
        nfe.setProtocolMessage(parsed.message());
        nfe.setRejectionCode(null);
        nfe.setRejectionMessage(null);
        nfe = nfeRepository.save(nfe);
        syncFiscalDocument(nfe, FiscalDocumentStatus.ISSUED);
        log.info("NF-e {} autorizada pela SEFAZ (chave {}, protocolo {}).", nfe.getNumber(),
                nfe.getAccessKey(), nfe.getProtocolNumber());
    }

    private void markError(ElectronicNfe nfe, String code, String message) {
        nfe.setStatus(STATUS_ERROR);
        nfe.setRejectionCode(cut(code, 20));
        nfe.setRejectionMessage(cut(message, 1900));
        nfe = nfeRepository.save(nfe);
        syncFiscalDocument(nfe, FiscalDocumentStatus.ERROR);
    }

    private void syncFiscalDocument(ElectronicNfe nfe, FiscalDocumentStatus status) {
        FiscalDocument document = null;
        if (nfe.getFiscalDocumentId() != null) {
            document = fiscalDocumentRepository.findById(nfe.getFiscalDocumentId()).orElse(null);
        }
        if (document == null) {
            document = new FiscalDocument();
        }
        document.setKey(nfe.getAccessKey());
        document.setNumber(nfe.getNumber());
        document.setSeries(nfe.getSeries());
        document.setType(FiscalDocumentType.NF_E);
        document.setStatus(status);
        document.setEmissionDate(nfe.getEmissionDate());
        document.setTotalAmount(nfe.getTotalAmount());
        document.setIssuerTaxId(nfe.getIssuerTaxId());
        document.setIssuerName(nfe.getIssuerName());
        document.setRecipientTaxId(nfe.getRecipientTaxId());
        document.setCompanyId(nfe.getCompanyId());
        document.setNotes("NF-e " + nfe.getNumber() + " — chave " + nfe.getAccessKey()
                + (blank(nfe.getProtocolNumber()) ? " (sem protocolo)" : " — protocolo " + nfe.getProtocolNumber()));
        document = fiscalDocumentRepository.save(document);
        nfe.setFiscalDocumentId(document.getId());
        nfeRepository.save(nfe);
    }

    // ===================== DANFE simplificada =====================

    private byte[] buildPdf(ElectronicNfe nfe) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            try (PdfDocument pdf = new PdfDocument(writer); Document document = new Document(pdf)) {
                document.add(new Paragraph("DANFE SIMPLIFICADA")
                        .setBold().setFontSize(16).setFontColor(AMBER)
                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(0));
                document.add(new Paragraph("Documento Auxiliar da Nota Fiscal Eletrônica — modelo 55")
                        .setFontSize(9).setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
                document.add(new Paragraph("DOCUMENTO AUXILIAR GERADO LOCALMENTE — SEM VALIDADE FISCAL. "
                        + "A autenticidade da NF-e deve ser consultada pela chave de acesso no site da SEFAZ.")
                        .setFontSize(7).setFontColor(RED).setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(10));

                document.add(new Paragraph(nfe.getIssuerName()).setBold().setFontSize(12)
                        .setTextAlignment(TextAlignment.CENTER));
                document.add(new Paragraph("CNPJ: " + value(nfe.getIssuerTaxId())
                        + "  •  IE: " + value(digits(nfe.getIssuerStateRegistration(), 14)))
                        .setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table id = grid(25, 25, 25, 25);
                id.addCell(info("Número", nfe.getNumber()));
                id.addCell(info("Série", nfe.getSeries()));
                id.addCell(info("Emissão", nfe.getEmissionDate() == null ? "-"
                        : nfe.getEmissionDate().format(DATE_TIME)));
                id.addCell(info("Situação", statusLabel(nfe.getStatus())));
                document.add(id);

                document.add(new Paragraph("Chave de acesso").setBold().setFontSize(8).setMarginBottom(0));
                document.add(new Paragraph(NfeAccessKey.grouped(nfe.getAccessKey()))
                        .setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginBottom(6));
                document.add(new Paragraph("Protocolo: " + value(nfe.getProtocolNumber())
                        + (blank(nfe.getProtocolMessage()) ? "" : " — " + nfe.getProtocolMessage()))
                        .setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table parties = grid(50, 50);
                parties.addCell(block("EMITENTE", nfe.getIssuerName(),
                        "CNPJ: " + value(nfe.getIssuerTaxId()),
                        address(nfe.getIssuerAddress(), nfe.getIssuerAddressNumber(), nfe.getIssuerCity(),
                                nfe.getIssuerState(), nfe.getIssuerZip())));
                parties.addCell(block("DESTINATÁRIO", value(nfe.getRecipientName()),
                        "CNPJ/CPF: " + value(nfe.getRecipientTaxId()),
                        "IE: " + value(digits(nfe.getRecipientStateRegistration(), 14)),
                        address(nfe.getRecipientAddress(), nfe.getRecipientAddressNumber(), nfe.getRecipientCity(),
                                nfe.getRecipientState(), nfe.getRecipientZip())));
                document.add(parties);

                document.add(new Paragraph("ITENS").setBold().setFontSize(9).setMarginTop(8).setMarginBottom(4));
                Table items = grid(8, 34, 14, 12, 16, 16);
                items.addHeaderCell(header("#"));
                items.addHeaderCell(header("Descrição"));
                items.addHeaderCell(header("NCM/CFOP"));
                items.addHeaderCell(header("Qtd."));
                items.addHeaderCell(headerRight("Vl. unit."));
                items.addHeaderCell(headerRight("Vl. total"));
                for (ElectronicNfeItem item : nfe.getItems()) {
                    items.addCell(body(String.valueOf(item.getItemNumber())));
                    items.addCell(body(value(item.getDescription())));
                    items.addCell(body(value(item.getNcm()) + "/" + value(item.getCfop())));
                    items.addCell(body(qty(item.getQuantity(), 4)));
                    items.addCell(bodyRight(currency(item.getUnitValue())));
                    items.addCell(bodyRight(currency(item.getTotalValue())));
                }
                document.add(items);

                Table totals = new Table(UnitValue.createPercentArray(new float[]{75, 25}))
                        .useAllAvailableWidth().setMarginTop(8).setMarginBottom(8);
                totals.addCell(label("Valor total dos produtos"));
                totals.addCell(valueCell(currency(nfe.getTotalAmount())));
                totals.addCell(label("ICMS"));
                totals.addCell(valueCell(currency(nfe.getIcmsValue())));
                totals.addCell(label("PIS"));
                totals.addCell(valueCell(currency(nfe.getPisValue())));
                totals.addCell(label("COFINS"));
                totals.addCell(valueCell(currency(nfe.getCofinsValue())));
                totals.addCell(labelBold("Valor total da NF-e"));
                totals.addCell(valueCellBold(currency(nfe.getTotalAmount())));
                document.add(totals);

                if (!blank(nfe.getNotes())) {
                    document.add(new Paragraph("Observações: " + nfe.getNotes()).setFontSize(8));
                }
                if (!blank(nfe.getRejectionMessage())) {
                    document.add(new Paragraph("Retorno da SEFAZ: " + nfe.getRejectionMessage())
                            .setFontSize(8).setFontColor(RED));
                }
                document.add(new Paragraph("Emitido por " + nfe.getVerProc() + " — ambiente "
                        + ("1".equals(nfe.getEnvironment()) ? "produção" : "homologação"))
                        .setFontSize(7).setTextAlignment(TextAlignment.CENTER).setMarginTop(12));
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar o PDF da NF-e.");
        }
    }

    // ===================== Auxiliares =====================

    private ElectronicNfe load(UUID id) {
        UUID companyId = requireCompany();
        return nfeRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NF-e não encontrada."));
    }

    private Company company(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Empresa do usuário não encontrada."));
    }

    public String environment() {
        return sefazClient.environment();
    }

    private static void validateCertificateCompany(FiscalCertificate certificate, Company company) {
        if (blank(certificate.getCnpj())) {
            return;
        }
        String certificateCnpj = digits(certificate.getCnpj(), 14);
        String companyCnpj = digits(company.getCnpj(), 14);
        if (!certificateCnpj.equals(companyCnpj)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O certificado A1 ativo pertence ao CNPJ " + certificateCnpj
                            + ", diferente do CNPJ da empresa (" + companyCnpj + ").");
        }
    }

    private static String crt(String regime) {
        return switch (regime == null ? "" : regime.trim()) {
            case "2" -> "4"; // MEI
            case "3" -> "1"; // ME/EPP optante pelo Simples
            default -> "3";  // Regime Normal
        };
    }

    private static BigDecimal itemsBase(ElectronicNfe nfe) {
        BigDecimal total = BigDecimal.ZERO;
        for (ElectronicNfeItem item : nfe.getItems()) {
            total = total.add(item.getIcmsBase() == null ? BigDecimal.ZERO : item.getIcmsBase());
        }
        return total;
    }

    private NfeResponse toResponse(ElectronicNfe nfe) {
        List<NfeItemResponse> items = nfe.getItems() == null ? List.of() : nfe.getItems().stream()
                .map(item -> new NfeItemResponse(item.getItemNumber(), item.getCode(), item.getDescription(),
                        item.getNcm(), item.getCfop(), item.getQuantity(), item.getUnitValue(),
                        item.getTotalValue(), item.getIcmsCst()))
                .toList();
        return new NfeResponse(
                nfe.getId(), nfe.getFiscalDocumentId(), nfe.getNumber(), nfe.getSeries(), nfe.getAccessKey(),
                nfe.getProtocolNumber(), nfe.getProtocolStatus(), nfe.getProtocolMessage(), nfe.getEmissionDate(),
                nfe.getEnvironment(), nfe.getNatureOperation(), nfe.getIssuerName(), nfe.getIssuerTaxId(),
                nfe.getRecipientName(), nfe.getRecipientTaxId(), nfe.getTotalAmount(), nfe.getIcmsValue(),
                nfe.getPisValue(), nfe.getCofinsValue(), nfe.getStatus(), nfe.getRejectionCode(),
                nfe.getRejectionMessage(), nfe.getCancelledAt(), nfe.getCancellationReason(), items);
    }

    private static UUID requireCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empresa do usuário não identificada.");
        }
        return companyId;
    }

    private static String normalizeSeries(String value) {
        String digits = digits(value, 3);
        return digits.isBlank() ? "1" : digits;
    }

    private static boolean hasErrors(List<String> messages) {
        return FiscalXmlValidator.hasErrors(messages);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (!blank(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static String digits(String value, int max) {
        return NfeAccessKey.digits(value, max);
    }

    private static String upper(String value) {
        return blank(value) ? null : value.trim().toUpperCase();
    }

    private static String sevenDigitsOrNull(String value) {
        if (blank(value)) {
            return null;
        }
        String digits = digits(value, 7);
        return digits.length() == 7 ? digits : null;
    }

    private static String cut(String value, int max) {
        if (blank(value)) {
            return null;
        }
        String text = value.trim();
        return text.length() > max ? text.substring(0, max) : text;
    }

    private static BigDecimal money(BigDecimal value, int scale) {
        return (value == null ? BigDecimal.ZERO : value).setScale(scale, RoundingMode.HALF_UP);
    }

    private static String qty(BigDecimal value, int scale) {
        return money(value, scale).toPlainString();
    }

    private static String currency(BigDecimal value) {
        return "R$ " + money(value, 2).toPlainString().replace('.', ',');
    }

    private static String joinXml(String... parts) {
        StringBuilder out = new StringBuilder();
        for (String part : parts) {
            if (!blank(part)) {
                if (out.length() > 0) {
                    out.append("\n");
                }
                out.append(part.trim());
            }
        }
        return out.toString();
    }

    private static String statusLabel(String status) {
        return switch (status == null ? "" : status) {
            case STATUS_ISSUED -> "Emitida";
            case STATUS_CANCELLED -> "Cancelada";
            case STATUS_ERROR -> "Erro";
            case STATUS_SENDING -> "Em processamento";
            case STATUS_DRAFT -> "Rascunho";
            default -> status;
        };
    }

    private static String safeFilename(String value) {
        return blank(value) ? "sem-numero" : value.replaceAll("[^0-9A-Za-z_-]", "");
    }

    private static String value(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? "-" : text;
    }

    private static String address(String street, String number, String city, String state, String zip) {
        StringBuilder line = new StringBuilder();
        if (!blank(street)) line.append(street);
        if (!blank(number)) {
            if (!line.isEmpty()) line.append(", ");
            line.append(number);
        }
        if (!blank(city)) {
            if (!line.isEmpty()) line.append(" — ");
            line.append(city);
        }
        if (!blank(state)) line.append('/').append(state);
        if (!blank(zip)) line.append("  CEP ").append(zip);
        return line.isEmpty() ? "-" : line.toString();
    }

    private static Table grid(float... widths) {
        return new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth().setMarginBottom(8);
    }

    private static Cell info(String label, String value) {
        Cell cell = new Cell().setPadding(5).setBackgroundColor(LIGHT);
        cell.add(new Paragraph(label).setBold().setFontSize(7));
        cell.add(new Paragraph(value(value)).setFontSize(9));
        return cell;
    }

    private static Cell block(String title, String... lines) {
        Cell cell = new Cell().setPadding(6);
        cell.add(new Paragraph(title).setBold().setFontSize(8).setFontColor(AMBER));
        for (String line : lines) {
            cell.add(new Paragraph(value(line)).setFontSize(8));
        }
        return cell;
    }

    private static Cell header(String text) {
        return new Cell().setBackgroundColor(HEADER).setPadding(4)
                .add(new Paragraph(text).setBold().setFontSize(8).setFontColor(HEADER_FG));
    }

    private static Cell headerRight(String text) {
        return new Cell().setBackgroundColor(HEADER).setPadding(4)
                .add(new Paragraph(text).setBold().setFontSize(8).setFontColor(HEADER_FG)
                        .setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell body(String text) {
        return new Cell().setPadding(4).add(new Paragraph(value(text)).setFontSize(8));
    }

    private static Cell bodyRight(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell label(String text) {
        return new Cell().setPadding(4).setBackgroundColor(LIGHT).add(new Paragraph(text).setFontSize(8));
    }

    private static Cell labelBold(String text) {
        return new Cell().setPadding(4).setBackgroundColor(LIGHT).add(new Paragraph(text).setBold().setFontSize(9));
    }

    private static Cell valueCell(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell valueCellBold(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setBold().setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT));
    }
}
