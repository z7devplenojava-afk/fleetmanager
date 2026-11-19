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
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.FiscalCertificateResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseConfigRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseConfigResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseCreateRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseIbscbsRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseItemRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfsePreviewResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseResponse;
import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseCancelRequest;
import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseEventResponse;
import com.z7design.fleet_manager.fiscal.FiscalCertificateMaterial;
import com.z7design.fleet_manager.fiscal.FiscalXmlValidator;
import com.z7design.fleet_manager.fiscal.NfseDpsId;
import com.z7design.fleet_manager.fiscal.NfseEventBuilder;
import com.z7design.fleet_manager.fiscal.NfseEventParser;
import com.z7design.fleet_manager.fiscal.NfseIbscbsData;
import com.z7design.fleet_manager.fiscal.NfseResponseParser;
import com.z7design.fleet_manager.fiscal.NfseSchemaValidator;
import com.z7design.fleet_manager.fiscal.NfseSefinClient;
import com.z7design.fleet_manager.fiscal.NfseXmlBuilder;
import com.z7design.fleet_manager.fiscal.XmlSigner;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.FiscalCertificate;
import com.z7design.fleet_manager.model.FiscalDocument;
import com.z7design.fleet_manager.model.ServiceInvoice;
import com.z7design.fleet_manager.model.ServiceInvoiceItem;
import com.z7design.fleet_manager.model.enums.FiscalDocumentStatus;
import com.z7design.fleet_manager.model.enums.FiscalDocumentType;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.FiscalDocumentRepository;
import com.z7design.fleet_manager.repository.ServiceInvoiceRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Orquestra a emissão da NFS-e Nacional: monta a DPS, assina com o A1 da empresa,
 * valida o leiaute, envia à SEFIN e mantém o histórico/espelho fiscal.
 */
@Service
@Slf4j
public class NfseEmissionService {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int MAX_NUMBER_ATTEMPTS = 5;
    /** DPS recém-enviadas não são consultadas para não competir com a requisição em andamento. */
    private static final Duration PENDING_GRACE = Duration.ofMinutes(2);
    private static final DeviceRgb HEADER = new DeviceRgb(31, 41, 55);
    private static final DeviceRgb HEADER_FG = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb LIGHT = new DeviceRgb(243, 244, 246);
    private static final DeviceRgb AMBER = new DeviceRgb(180, 130, 20);

    public static final String STATUS_DRAFT = "RASCUNHO";
    public static final String STATUS_SENDING = "PROCESSANDO";
    public static final String STATUS_ISSUED = "EMITIDA";
    public static final String STATUS_CANCELLED = "CANCELADA";
    public static final String STATUS_ERROR = "ERRO";

    private static final String XSD_BASE = "fiscal/xsd/v1.01/";

    private final ServiceInvoiceRepository invoiceRepository;
    private final CompanyRepository companyRepository;
    private final FiscalDocumentRepository fiscalDocumentRepository;
    private final FiscalCertificateService certificateService;
    private final NfseXmlBuilder xmlBuilder;
    private final XmlSigner xmlSigner;
    private final NfseSchemaValidator schemaValidator;
    private final FiscalXmlValidator fiscalXmlValidator;
    private final NfseSefinClient sefinClient;

    private final String configuredEnvironment;

    public NfseEmissionService(
            ServiceInvoiceRepository invoiceRepository,
            CompanyRepository companyRepository,
            FiscalDocumentRepository fiscalDocumentRepository,
            FiscalCertificateService certificateService,
            NfseXmlBuilder xmlBuilder,
            XmlSigner xmlSigner,
            NfseSchemaValidator schemaValidator,
            FiscalXmlValidator fiscalXmlValidator,
            NfseSefinClient sefinClient,
            @Value("${fiscal.nfse.environment:2}") String configuredEnvironment) {
        this.invoiceRepository = invoiceRepository;
        this.companyRepository = companyRepository;
        this.fiscalDocumentRepository = fiscalDocumentRepository;
        this.certificateService = certificateService;
        this.xmlBuilder = xmlBuilder;
        this.xmlSigner = xmlSigner;
        this.schemaValidator = schemaValidator;
        this.fiscalXmlValidator = fiscalXmlValidator;
        this.sefinClient = sefinClient;
        this.configuredEnvironment = configuredEnvironment;
    }

    // ===================== Consultas =====================

    public List<NfseResponse> list() {
        UUID companyId = requireCompany();
        return invoiceRepository.findByCompanyIdOrderByEmissionDateDesc(companyId).stream()
                .map(this::toResponse)
                .toList();
    }

    public NfseResponse get(UUID id) {
        return toResponse(load(id));
    }

    public NfsePreviewResponse preview(NfseCreateRequest request) {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        String series = normalizeSeries(request == null ? null : request.series());
        long dpsNumber = nextDpsNumber(companyId, series);
        Prepared prepared = prepare(request, company, series, dpsNumber);
        String xml;
        List<String> messages;
        try {
            xml = xmlBuilder.build(prepared.invoice(), company, ibscbs(prepared.invoice()));
            messages = schemaValidator.validate(xml);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
        return new NfsePreviewResponse(
                prepared.invoice().getDpsId(),
                xml,
                !hasErrors(messages),
                messages,
                prepared.gross(),
                prepared.issAmount(),
                prepared.net());
    }

    // ===================== Emissão =====================

    public NfseResponse emit(NfseCreateRequest request) {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        FiscalCertificate certificate = certificateService.requireActive(companyId);
        FiscalCertificateMaterial material = certificateService.material(companyId);
        validateCertificateCompany(certificate, company);

        // Antes de consumir um novo número, resolve eventuais DPS que ficaram em processamento
        // (ex.: timeout na resposta da SEFIN) para não gerar uma segunda NFS-e para o mesmo serviço.
        resolvePending(companyId, company, material);

        String series = normalizeSeries(request == null ? null : request.series());
        ServiceInvoice invoice = reserveDps(request, company, series, certificate);

        try {
            String plainXml = xmlBuilder.build(invoice, company, ibscbs(invoice));
            String signedXml = xmlSigner.signDps(plainXml, material);
            List<String> problems = schemaValidator.validate(signedXml);
            if (hasErrors(problems)) {
                String message = String.join(" | ", problems);
                markError(invoice, company, "XML", message);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O XML da DPS não passou na validação do leiaute: " + message);
            }

            invoice.setSignedXml(signedXml);
            invoice.setStatus(STATUS_SENDING);
            invoice = invoiceRepository.save(invoice);

            NfseSefinClient.SefinResponse response = sefinClient.enviarDps(signedXml, material, environment());
            invoice.setResponseXml(response.body());
            NfseResponseParser.ParsedResponse parsed = NfseResponseParser.parse(response);

            if (parsed.success()) {
                applySuccess(invoice, company, parsed, response.body());
            } else {
                invoice.setStatus(STATUS_ERROR);
                invoice.setRejectionCode(parsed.rejectionCode());
                invoice.setRejectionMessage(firstNonBlank(parsed.rejectionMessage(),
                        "A SEFIN não retornou a NFS-e. HTTP " + response.status() + "."));
                invoice = invoiceRepository.save(invoice);
                syncFiscalDocument(invoice, company, FiscalDocumentStatus.ERROR);
                log.warn("NFS-e rejeitada para a empresa {} (DPS {}): {} {}", companyId, invoice.getDpsId(),
                        invoice.getRejectionCode(), invoice.getRejectionMessage());
            }
            return toResponse(invoice);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            String message = e.getMessage() == null ? "Dados fiscais inválidos." : e.getMessage();
            markError(invoice, company, "DADOS", message);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message, e);
        } catch (Exception e) {
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            markError(invoice, company, "FALHA", message);
            log.error("Falha ao emitir NFS-e para a empresa {} (DPS {}): {}", companyId, invoice.getDpsId(), message, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível concluir a emissão da NFS-e: " + message, e);
        }
    }

    // ===================== Reserva de numeração =====================

    /**
     * Reserva o próximo número de DPS e persiste a nota em rascunho. A numeração é calculada
     * localmente; a colisão entre emissões simultâneas é detectada pelo índice único
     * (company_id, series, dps_number) e refeita com o próximo número.
     */
    private ServiceInvoice reserveDps(NfseCreateRequest request, Company company, String series,
                                      FiscalCertificate certificate) {
        for (int attempt = 1; ; attempt++) {
            long dpsNumber = nextDpsNumber(company.getId(), series);
            Prepared prepared = prepare(request, company, series, dpsNumber);
            ServiceInvoice invoice = prepared.invoice();
            invoice.setCertificateId(certificate.getId());
            try {
                return invoiceRepository.saveAndFlush(invoice);
            } catch (DataIntegrityViolationException e) {
                if (attempt >= MAX_NUMBER_ATTEMPTS) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Não foi possível reservar um número de DPS após " + attempt
                                    + " tentativas. Tente novamente.", e);
                }
                log.warn("Colisão ao reservar DPS {} série {} para a empresa {}; tentando novamente.",
                        dpsNumber, series, company.getId());
            }
        }
    }

    /**
     * Reprocessa notas que ficaram em PROCESSANDO (normalmente por timeout na SEFIN).
     * Se a DPS foi autorizada, a nota é conciliada; se não existe na SEFIN, é marcada como ERRO.
     * Se a SEFIN estiver indisponível, a emissão é interrompida para evitar duplicidade fiscal.
     */
    private void resolvePending(UUID companyId, Company company, FiscalCertificateMaterial material) {
        List<ServiceInvoice> pending =
                invoiceRepository.findByCompanyIdAndStatusOrderByEmissionDateAsc(companyId, STATUS_SENDING);
        if (pending.isEmpty()) {
            return;
        }
        LocalDateTime limit = LocalDateTime.now(ZONE).minus(PENDING_GRACE);
        for (ServiceInvoice invoice : pending) {
            if (invoice.getEmissionDate() != null && invoice.getEmissionDate().isAfter(limit)) {
                continue; // ainda em andamento nesta instância
            }
            if (blank(invoice.getDpsId()) && blank(invoice.getNfseKey())) {
                continue;
            }
            NfseSefinClient.SefinResponse response;
            try {
                response = blank(invoice.getNfseKey())
                        ? sefinClient.consultarDps(invoice.getDpsId(), material, environment())
                        : sefinClient.consultarNfse(invoice.getNfseKey(), material, environment());
            } catch (RuntimeException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Existe uma DPS em processamento (" + invoice.getDpsId()
                                + ") que não pôde ser confirmada na SEFIN. Consulte-a antes de emitir uma nova.", e);
            }
            invoice.setResponseXml(response.body());
            NfseResponseParser.ParsedResponse parsed = NfseResponseParser.parse(response);
            if (parsed.success()) {
                applySuccess(invoice, company, parsed, response.body());
                log.info("DPS {} conciliada: NFS-e {} autorizada.", invoice.getDpsId(), invoice.getNumber());
            } else if (response.status() == 404) {
                invoice.setStatus(STATUS_ERROR);
                invoice.setRejectionCode(parsed.rejectionCode());
                invoice.setRejectionMessage(firstNonBlank(parsed.rejectionMessage(),
                        "DPS não localizada na SEFIN. A transmissão anterior não foi concluída."));
                invoice = invoiceRepository.save(invoice);
                syncFiscalDocument(invoice, company, FiscalDocumentStatus.ERROR);
                log.warn("DPS {} não localizada na SEFIN; marcada como ERRO.", invoice.getDpsId());
            } else if (response.status() >= 500) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A SEFIN está indisponível para confirmar a DPS " + invoice.getDpsId()
                                + " (HTTP " + response.status() + "). Tente novamente em instantes.");
            }
        }
    }

    public NfseResponse consultar(UUID id) {
        UUID companyId = requireCompany();
        ServiceInvoice invoice = load(id);
        if (blank(invoice.getNfseKey()) && blank(invoice.getDpsId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Esta DPS ainda não possui chave de NFS-e nem identificador para consulta.");
        }
        FiscalCertificateMaterial material = certificateService.material(companyId);
        NfseSefinClient.SefinResponse response = blank(invoice.getNfseKey())
                ? sefinClient.consultarDps(invoice.getDpsId(), material, environment())
                : sefinClient.consultarNfse(invoice.getNfseKey(), material, environment());
        invoice.setResponseXml(response.body());
        NfseResponseParser.ParsedResponse parsed = NfseResponseParser.parse(response);
        if (parsed.success()) {
            applySuccess(invoice, company(companyId), parsed, response.body());
        } else {
            invoice.setRejectionCode(parsed.rejectionCode());
            invoice.setRejectionMessage(parsed.rejectionMessage());
            if (STATUS_SENDING.equals(invoice.getStatus()) && blank(invoice.getNfseKey())
                    && response.status() == 404) {
                invoice.setStatus(STATUS_ERROR);
                invoice.setRejectionMessage(firstNonBlank(parsed.rejectionMessage(),
                        "DPS não localizada na SEFIN. A transmissão anterior não foi concluída; "
                                + "a nota pode ser emitida novamente."));
            }
            invoice = invoiceRepository.save(invoice);
        }
        return toResponse(invoice);
    }

    // ===================== Arquivos =====================

    public GeneratedFiscalFile xml(UUID id) {
        ServiceInvoice invoice = load(id);
        boolean signed = !blank(invoice.getSignedXml());
        String content;
        if (signed) {
            content = invoice.getSignedXml();
        } else {
            try {
                content = xmlBuilder.build(invoice, company(invoice.getCompanyId()), ibscbs(invoice));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
            }
        }
        String prefix = signed ? "NFS-e-" : "DPS-nao-assinada-";
        String filename = prefix + safeFilename(invoice.getNumber()) + "-serie-" + invoice.getSeries() + ".xml";
        return new GeneratedFiscalFile(filename,
                content.getBytes(java.nio.charset.StandardCharsets.UTF_8), "application/xml");
    }

    public GeneratedFiscalFile pdf(UUID id) {
        ServiceInvoice invoice = load(id);
        String filename = "DANFSE-" + safeFilename(invoice.getNumber()) + "-serie-" + invoice.getSeries() + ".pdf";
        return new GeneratedFiscalFile(filename, buildPdf(invoice), "application/pdf");
    }

    // ===================== Configuração fiscal =====================

    public NfseConfigResponse config() {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        FiscalCertificateResponse active = certificateService.list().stream()
                .filter(FiscalCertificateResponse::active)
                .findFirst()
                .orElse(null);
        return new NfseConfigResponse(
                company.getId(),
                company.getName(),
                company.getCnpj(),
                company.getInscricaoEstadual(),
                company.getInscricaoMunicipal(),
                company.getCodigoMunicipio(),
                company.getRegimeTributario(),
                firstNonBlank(company.getEnderecoRua(), company.getAddress()),
                company.getEnderecoNumero(),
                company.getEnderecoBairro(),
                company.getCity(),
                company.getState(),
                company.getZipCode(),
                company.getPhone(),
                company.getEmail(),
                active != null,
                active == null ? null : active.validUntil());
    }

    public NfseConfigResponse updateConfig(NfseConfigRequest request) {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados fiscais não informados.");
        }
        String municipality = trimToNull(request.codigoMunicipio());
        if (municipality != null && NfseDpsId.digits(municipality).length() != 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O código IBGE do município deve ter 7 dígitos.");
        }
        String regime = trimToNull(request.regimeTributario());
        if (regime != null && !List.of("1", "2", "3").contains(regime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Regime tributário inválido. Use 1 (não optante), 2 (MEI) ou 3 (ME/EPP).");
        }
        company.setInscricaoEstadual(trimToNull(request.inscricaoEstadual()));
        company.setInscricaoMunicipal(trimToNull(request.inscricaoMunicipal()));
        company.setCodigoMunicipio(municipality == null ? null : NfseDpsId.digits(municipality));
        company.setRegimeTributario(regime);
        companyRepository.save(company);
        return config();
    }

    // ===================== Preparação da DPS =====================

    private Prepared prepare(NfseCreateRequest request, Company company, String series, long dpsNumber) {
        validateRequest(request, company);

        String municipality = firstNonBlank(
                digitsOrNull(request.municipalityCode()),
                digitsOrNull(company.getCodigoMunicipio()));
        if (municipality == null || municipality.length() != 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre o código IBGE do município (7 dígitos) nos dados fiscais da empresa.");
        }
        String serviceLocation = firstNonBlank(digitsOrNull(request.serviceLocationCode()), municipality);
        String competence = normalizeCompetence(request.competence());

        BigDecimal gross = resolveGross(request);
        BigDecimal deduction = money(request.deductionAmount());
        if (deduction.compareTo(gross) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A dedução não pode ser maior que o valor bruto do serviço.");
        }
        BigDecimal issRate = request.issRate() == null ? BigDecimal.ZERO : request.issRate();
        if (issRate.compareTo(BigDecimal.ZERO) < 0 || issRate.compareTo(new BigDecimal("10")) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A alíquota do ISS deve estar entre 0 e 9,99%.");
        }
        BigDecimal issBase = gross.subtract(deduction);
        BigDecimal issAmount = issBase.multiply(issRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        String withholdingType = trimToNull(request.issWithholdingType());
        if (withholdingType == null) {
            withholdingType = Boolean.TRUE.equals(request.issWithheld()) ? "2" : "1";
        }
        if (!List.of("1", "2", "3").contains(withholdingType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tipo de retenção do ISS inválido. Use 1 (não retido), 2 (tomador) ou 3 (intermediário).");
        }
        // Quando o cliente sinaliza retenção pelo tomador, o XML precisa refletir a mesma decisão.
        if (Boolean.TRUE.equals(request.issWithheld()) && "1".equals(withholdingType)) {
            withholdingType = "2";
        }
        boolean withheld = !"1".equals(withholdingType);
        BigDecimal issRetained = withheld ? issAmount : BigDecimal.ZERO;
        BigDecimal inss = money(request.inssAmount());
        BigDecimal irrf = money(request.irrfAmount());
        BigDecimal csll = money(request.csllAmount());
        BigDecimal net = gross.subtract(issRetained).subtract(inss).subtract(irrf).subtract(csll);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }

        ServiceInvoice invoice = new ServiceInvoice();
        invoice.setCompanyId(company.getId());
        invoice.setNumber("DPS" + dpsNumber);
        invoice.setSeries(series);
        invoice.setVerificationCode("DPS" + dpsNumber);
        invoice.setStatus(STATUS_DRAFT);
        invoice.setEmissionDate(LocalDateTime.now(ZONE));
        invoice.setCompetence(competence);
        invoice.setClientId(request.clientId());
        invoice.setIssuerName(company.getName());
        invoice.setIssuerTaxId(company.getCnpj());
        invoice.setIssuerAddress(firstNonBlank(company.getEnderecoRua(), company.getAddress()));
        invoice.setIssuerCity(company.getCity());
        invoice.setIssuerState(company.getState());
        invoice.setIssuerZip(company.getZipCode());
        invoice.setIssuerPhone(company.getPhone());
        invoice.setIssuerEmail(company.getEmail());
        invoice.setIssuerMunicipalRegistration(firstNonBlank(
                trimToNull(request.issuerMunicipalRegistration()), company.getInscricaoMunicipal()));

        invoice.setTakerName(request.takerName().trim());
        invoice.setTakerTaxId(NfseDpsId.digits(request.takerTaxId()));
        invoice.setTakerMunicipalRegistration(trimToNull(request.takerMunicipalRegistration()));
        invoice.setTakerAddress(trimToNull(request.takerAddress()));
        invoice.setTakerAddressNumber(trimToNull(request.takerAddressNumber()));
        invoice.setTakerNeighborhood(trimToNull(request.takerNeighborhood()));
        invoice.setTakerMunicipalityCode(digitsOrNull(request.takerMunicipalityCode()));
        invoice.setTakerCity(trimToNull(request.takerCity()));
        invoice.setTakerState(upper(request.takerState()));
        invoice.setTakerZip(trimToNull(request.takerZip()));
        invoice.setTakerEmail(trimToNull(request.takerEmail()));

        invoice.setServiceCode(NfseDpsId.digits(request.serviceCode()));
        invoice.setServiceDescription(request.serviceDescription().trim());
        invoice.setDiscrimination(trimToNull(request.discrimination()));
        invoice.setMunicipalTaxCode(trimToNull(request.municipalTaxCode()));
        invoice.setNbsCode(digitsOrNull(request.nbsCode()));
        invoice.setNotes(trimToNull(request.notes()));
        invoice.setDueDate(request.dueDate());
        applyIbscbsRequest(invoice, request.ibscbs());

        invoice.setGrossAmount(gross);
        invoice.setDeductionAmount(deduction);
        invoice.setIssRate(issRate.setScale(4, RoundingMode.HALF_UP));
        invoice.setIssAmount(issAmount);
        invoice.setIssWithheld(withheld);
        invoice.setIssRetainedAmount(issRetained);
        invoice.setIssTaxation(firstNonBlank(trimToNull(request.issTaxation()), "1"));
        invoice.setIssWithholdingType(withholdingType);
        invoice.setInssAmount(inss);
        invoice.setIrrfAmount(irrf);
        invoice.setCsllAmount(csll);
        invoice.setNetAmount(net);

        String opSimpNac = firstNonBlank(trimToNull(request.opSimpNac()),
                trimToNull(company.getRegimeTributario()), "1");
        invoice.setOpSimpNac(opSimpNac);
        invoice.setRegEspTrib(firstNonBlank(trimToNull(request.regEspTrib()), "0"));

        invoice.setEnvironment(environment());
        invoice.setMunicipalityCode(municipality);
        invoice.setServiceLocationCode(serviceLocation);
        invoice.setDpsNumber(dpsNumber);
        invoice.setDpsId(NfseDpsId.build(municipality, company.getCnpj(), series, dpsNumber));

        if (request.items() != null) {
            for (NfseItemRequest item : request.items()) {
                if (item == null || blank(item.description())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Todos os itens da NFS-e precisam de descrição.");
                }
                BigDecimal quantity = item.quantity() == null ? BigDecimal.ONE : item.quantity();
                BigDecimal unit = money(item.unitValue());
                ServiceInvoiceItem entity = new ServiceInvoiceItem();
                entity.setDescription(item.description().trim());
                entity.setQuantity(quantity);
                entity.setUnitValue(unit);
                entity.setTotalValue(quantity.multiply(unit).setScale(2, RoundingMode.HALF_UP));
                invoice.addItem(entity);
            }
        }

        return new Prepared(invoice, gross, issAmount, net);
    }

    private void validateRequest(NfseCreateRequest request, Company company) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da NFS-e não informados.");
        }
        if (blank(company.getCnpj()) || NfseDpsId.digits(company.getCnpj()).length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cadastre o CNPJ da empresa (14 dígitos) antes de emitir a NFS-e.");
        }
        require(request.takerName(), "Informe o nome/razão social do tomador.");
        String takerTaxId = NfseDpsId.digits(request.takerTaxId());
        if (takerTaxId.length() != 11 && takerTaxId.length() != 14) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o CPF (11 dígitos) ou CNPJ (14 dígitos) do tomador.");
        }
        require(request.serviceDescription(), "Informe a descrição do serviço.");
        if (NfseDpsId.digits(request.serviceCode()).length() != 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O código de tributação nacional (cTribNac) deve ter 6 dígitos.");
        }
    }

    private BigDecimal resolveGross(NfseCreateRequest request) {
        BigDecimal gross = request.grossAmount();
        if (gross == null || gross.compareTo(BigDecimal.ZERO) <= 0) {
            if (request.items() == null || request.items().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Informe o valor bruto do serviço ou ao menos um item.");
            }
            gross = BigDecimal.ZERO;
            for (NfseItemRequest item : request.items()) {
                if (item == null) {
                    continue;
                }
                BigDecimal quantity = item.quantity() == null ? BigDecimal.ONE : item.quantity();
                gross = gross.add(quantity.multiply(money(item.unitValue())));
            }
        }
        gross = money(gross);
        if (gross.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O valor bruto do serviço deve ser maior que zero.");
        }
        return gross;
    }

    // ===================== Resultado da SEFIN =====================

    private void applySuccess(ServiceInvoice invoice, Company company, NfseResponseParser.ParsedResponse parsed,
                              String responseXml) {
        invoice.setNfseKey(parsed.nfseKey());
        if (!blank(parsed.number())) {
            invoice.setNumber(parsed.number());
            invoice.setVerificationCode(parsed.number());
        } else if (!blank(parsed.nfseKey())) {
            invoice.setVerificationCode(parsed.nfseKey());
        }
        applyIbscbsTotals(invoice, NfseResponseParser.parseIbscbs(responseXml));
        invoice.setStatus(STATUS_ISSUED);
        invoice.setRejectionCode(null);
        invoice.setRejectionMessage(null);
        invoice = invoiceRepository.save(invoice);
        syncFiscalDocument(invoice, company, FiscalDocumentStatus.ISSUED);
        log.info("NFS-e {} emitida para a empresa {} (DPS {}).", invoice.getNumber(), company.getId(),
                invoice.getDpsId());
    }

    private void markError(ServiceInvoice invoice, Company company, String code, String message) {
        invoice.setStatus(STATUS_ERROR);
        invoice.setRejectionCode(code);
        invoice.setRejectionMessage(message);
        invoice = invoiceRepository.save(invoice);
        syncFiscalDocument(invoice, company, FiscalDocumentStatus.ERROR);
    }

    // ===================== IBS/CBS =====================

    private static void applyIbscbsRequest(ServiceInvoice invoice, NfseIbscbsRequest request) {
        if (request == null) {
            return;
        }
        invoice.setIbscbsFinNfse(trimToNull(request.finNFSe()));
        invoice.setIbscbsIndFinal(trimToNull(request.indFinal()));
        invoice.setIbscbscIndOp(trimToNull(request.cIndOp()));
        invoice.setIbscbsTpOper(trimToNull(request.tpOper()));
        invoice.setIbscbsTpEnteGov(trimToNull(request.tpEnteGov()));
        invoice.setIbscbsIndDest(trimToNull(request.indDest()));
        invoice.setIbscbsCst(trimToNull(request.cst()));
        invoice.setIbscbsCClassTrib(trimToNull(request.cClassTrib()));
        invoice.setIbscbsCCredPres(trimToNull(request.cCredPres()));
    }

    /** Reconstrói a classificação IBS/CBS persistida para gerar novamente a DPS. */
    private static NfseIbscbsData ibscbs(ServiceInvoice invoice) {
        if (blank(invoice.getIbscbsFinNfse()) && blank(invoice.getIbscbscIndOp())
                && blank(invoice.getIbscbsCst()) && blank(invoice.getIbscbsCClassTrib())) {
            return null;
        }
        return new NfseIbscbsData(
                invoice.getIbscbsFinNfse(), invoice.getIbscbsIndFinal(), invoice.getIbscbscIndOp(),
                invoice.getIbscbsTpOper(), invoice.getIbscbsTpEnteGov(), invoice.getIbscbsIndDest(),
                invoice.getIbscbsCst(), invoice.getIbscbsCClassTrib(), invoice.getIbscbsCCredPres(),
                invoice.getIbscbsVbc(), null, null, invoice.getIbscbsPIbsUf(), null, null,
                invoice.getIbscbsPIbsMun(), null, null, invoice.getIbscbsPCbs(), null, null,
                invoice.getIbscbsVTotNf(), null, invoice.getIbscbsVIbs(), invoice.getIbscbsVIbs(),
                invoice.getIbscbsVCbs());
    }

    /** Dos totais publicados na NFS-e autorizada, guarda os valores exibidos no DANFSE. */
    private static void applyIbscbsTotals(ServiceInvoice invoice, NfseResponseParser.IbscbsTotals totals) {
        if (totals == null) {
            return;
        }
        invoice.setIbscbsVbc(totals.vBC());
        invoice.setIbscbsPIbsUf(totals.pAliqEfetUF() != null ? totals.pAliqEfetUF() : totals.pIBSUF());
        invoice.setIbscbsPIbsMun(totals.pAliqEfetMun() != null ? totals.pAliqEfetMun() : totals.pIBSMun());
        invoice.setIbscbsPCbs(totals.pAliqEfetCBS() != null ? totals.pAliqEfetCBS() : totals.pCBS());
        invoice.setIbscbsVIbs(totals.vIBSTot() != null ? totals.vIBSTot() : totals.vIBSUF());
        invoice.setIbscbsVCbs(totals.vCBS());
        invoice.setIbscbsVTotNf(totals.vTotNF());
    }

    // ===================== Eventos (cancelamento) =====================

    /**
     * Registra o evento de cancelamento (e101101) da NFS-e autorizada.
     */
    public NfseEventResponse cancelar(UUID id, NfseCancelRequest request) {
        UUID companyId = requireCompany();
        ServiceInvoice invoice = load(id);
        if (!STATUS_ISSUED.equals(invoice.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Somente NFS-e emitida pode ser cancelada. Situação atual: " + statusLabel(invoice.getStatus()) + ".");
        }
        if (blank(invoice.getNfseKey())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Esta NFS-e não possui chave de acesso para vincular o evento.");
        }
        Company company = company(companyId);
        FiscalCertificateMaterial material = certificateService.material(companyId);

        String eventXml;
        String signedXml;
        try {
            eventXml = NfseEventBuilder.buildCancelamento(invoice.getNfseKey(), company.getCnpj(),
                    environment(), request);
            List<String> pedRegProblems = fiscalXmlValidator.validate(XSD_BASE,
                    "pedRegEvento_v1.01.xsd", NfseEventBuilder.extractPedRegEvento(eventXml));
            if (FiscalXmlValidator.hasErrors(pedRegProblems)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O pedido de evento não passou no leiaute: " + String.join(" | ", pedRegProblems));
            }
            signedXml = xmlSigner.signElement(eventXml, XmlSigner.NFSE_NAMESPACE, "infEvento", "Id", material);
            List<String> eventProblems = fiscalXmlValidator.validate(XSD_BASE, "evento_v1.01.xsd", signedXml);
            if (FiscalXmlValidator.hasErrors(eventProblems)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O evento assinado não passou no leiaute: " + String.join(" | ", eventProblems));
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível preparar o evento de cancelamento: " + e.getMessage(), e);
        }

        NfseSefinClient.SefinResponse response = sefinClient.enviarEvento(signedXml, material, environment());
        NfseEventResponse result = NfseEventParser.parse(response);
        invoice.setEventXml(signedXml);
        invoice.setEventResponseXml(response.body());
        if (!result.success()) {
            invoice = invoiceRepository.save(invoice);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A SEFIN não registrou o cancelamento: " + firstNonBlank(result.message(),
                            "HTTP " + response.status() + "."));
        }
        invoice.setEventId(result.id());
        invoice.setEventProtocol(result.protocol());
        invoice.setStatus(STATUS_CANCELLED);
        invoice.setCancelledAt(LocalDateTime.now(ZONE));
        invoice.setCancellationReason(firstNonBlank(request == null ? null : request.justification(),
                "Cancelamento registrado na SEFIN."));
        invoice = invoiceRepository.save(invoice);
        syncFiscalDocument(invoice, company, FiscalDocumentStatus.CANCELLED);
        log.info("NFS-e {} cancelada na SEFIN (evento {}).", invoice.getNumber(), invoice.getEventId());
        return result;
    }

    private void syncFiscalDocument(ServiceInvoice invoice, Company company, FiscalDocumentStatus status) {
        FiscalDocument document = null;
        if (invoice.getFiscalDocumentId() != null) {
            document = fiscalDocumentRepository.findById(invoice.getFiscalDocumentId()).orElse(null);
        }
        if (document == null) {
            document = new FiscalDocument();
        }
        document.setKey(blank(invoice.getNfseKey()) ? null : invoice.getNfseKey());
        document.setNumber(invoice.getNumber());
        document.setSeries(invoice.getSeries());
        document.setType(FiscalDocumentType.NFS_E);
        document.setStatus(status);
        document.setEmissionDate(invoice.getEmissionDate());
        document.setTotalAmount(invoice.getGrossAmount());
        document.setIssuerTaxId(NfseDpsId.digits(company.getCnpj()));
        document.setIssuerName(company.getName());
        document.setRecipientTaxId(invoice.getTakerTaxId());
        document.setCompanyId(invoice.getCompanyId());
        document.setNotes("NFS-e " + invoice.getNumber() + " — competência "
                + NfseDpsId.competenceLabel(invoice.getCompetence())
                + (blank(invoice.getNfseKey()) ? " (sem autorização)" : ""));
        document = fiscalDocumentRepository.save(document);
        invoice.setFiscalDocumentId(document.getId());
        invoiceRepository.save(invoice);
    }

    // ===================== PDF =====================

    private byte[] buildPdf(ServiceInvoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            try (PdfDocument pdf = new PdfDocument(writer);
                 Document document = new Document(pdf)) {
                boolean authorized = STATUS_ISSUED.equals(invoice.getStatus());

                document.add(new Paragraph("DANFSE")
                        .setBold().setFontSize(16).setFontColor(AMBER)
                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(0));
                document.add(new Paragraph("Documento Auxiliar da Nota Fiscal de Serviço Eletrônica")
                        .setFontSize(9).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                document.add(new Paragraph(invoice.getIssuerName()).setBold().setFontSize(12)
                        .setTextAlignment(TextAlignment.CENTER));
                document.add(new Paragraph("CNPJ: " + invoice.getIssuerTaxId()
                        + (blank(invoice.getIssuerMunicipalRegistration()) ? ""
                        : "  •  IM: " + invoice.getIssuerMunicipalRegistration()))
                        .setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
                document.add(new Paragraph("Competência: " + NfseDpsId.competenceLabel(invoice.getCompetence())
                        + "  •  Ambiente: " + ("1".equals(invoice.getEnvironment()) ? "Produção" : "Homologação"))
                        .setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table id = grid(25, 25, 25, 25);
                id.addCell(info("Número", invoice.getNumber()));
                id.addCell(info("Série", invoice.getSeries()));
                id.addCell(info("Emissão", invoice.getEmissionDate().format(DATE_TIME)));
                id.addCell(info("Situação", statusLabel(invoice.getStatus())));
                document.add(id);

                document.add(new Paragraph("Chave de acesso").setBold().setFontSize(8).setMarginBottom(0));
                document.add(new Paragraph(blank(invoice.getNfseKey()) ? "—" : grouped(invoice.getNfseKey()))
                        .setFontSize(11).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table parties = grid(50, 50);
                parties.addCell(block("PRESTADOR", invoice.getIssuerName(),
                        "CNPJ: " + invoice.getIssuerTaxId(),
                        "IM: " + value(invoice.getIssuerMunicipalRegistration()),
                        address(invoice.getIssuerAddress(), invoice.getIssuerCity(),
                                invoice.getIssuerState(), invoice.getIssuerZip())));
                parties.addCell(block("TOMADOR", invoice.getTakerName(),
                        "CNPJ/CPF: " + value(invoice.getTakerTaxId()),
                        "IM: " + value(invoice.getTakerMunicipalRegistration()),
                        address(invoice.getTakerAddress(), invoice.getTakerCity(),
                                invoice.getTakerState(), invoice.getTakerZip())));
                document.add(parties);

                Table service = grid(70, 30);
                service.addCell(block("SERVIÇO PRESTADO", invoice.getServiceDescription(),
                        "cTribNac: " + value(invoice.getServiceCode())
                                + (blank(invoice.getMunicipalTaxCode()) ? "" : "  •  cTribMun: " + invoice.getMunicipalTaxCode())
                                + (blank(invoice.getNbsCode()) ? "" : "  •  NBS: " + invoice.getNbsCode())));
                service.addCell(block("DPS", "Nº " + value(invoice.getDpsNumber() == null ? null : invoice.getDpsNumber().toString()),
                        "Série " + invoice.getSeries(),
                        invoice.getDpsId() == null ? "—" : invoice.getDpsId()));
                document.add(service);

                document.add(new Paragraph("VALORES").setBold().setFontSize(9).setMarginTop(8).setMarginBottom(4));
                Table values = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                        .useAllAvailableWidth().setMarginBottom(8);
                values.addCell(label("Valor bruto do serviço"));
                values.addCell(valueCell(currency(invoice.getGrossAmount())));
                values.addCell(label("Dedução"));
                values.addCell(valueCell(currency(invoice.getDeductionAmount())));
                values.addCell(label("Alíquota ISS"));
                values.addCell(valueCell(invoice.getIssRate().setScale(2, RoundingMode.HALF_UP).toPlainString() + "%"));
                values.addCell(label("ISS"));
                values.addCell(valueCell(currency(invoice.getIssAmount())));
                if (invoice.isIssWithheld()) {
                    values.addCell(label("ISS retido"));
                    values.addCell(valueCell(currency(invoice.getIssRetainedAmount())));
                }
                if (positive(invoice.getInssAmount())) {
                    values.addCell(label("INSS retido"));
                    values.addCell(valueCell(currency(invoice.getInssAmount())));
                }
                if (positive(invoice.getIrrfAmount())) {
                    values.addCell(label("IRRF retido"));
                    values.addCell(valueCell(currency(invoice.getIrrfAmount())));
                }
                if (positive(invoice.getCsllAmount())) {
                    values.addCell(label("CSLL retida"));
                    values.addCell(valueCell(currency(invoice.getCsllAmount())));
                }
                values.addCell(labelBold("Valor líquido"));
                values.addCell(valueCellBold(currency(invoice.getNetAmount())));
                if (invoice.getIbscbsVTotNf() != null) {
                    values.addCell(label("IBS"));
                    values.addCell(valueCell(currency(invoice.getIbscbsVIbs())));
                    values.addCell(label("CBS"));
                    values.addCell(valueCell(currency(invoice.getIbscbsVCbs())));
                    values.addCell(labelBold("Total com IBS/CBS"));
                    values.addCell(valueCellBold(currency(invoice.getIbscbsVTotNf())));
                }
                document.add(values);

                if (!blank(invoice.getDiscrimination())) {
                    document.add(new Paragraph("Discriminação: " + invoice.getDiscrimination()).setFontSize(8));
                }
                if (!blank(invoice.getRejectionMessage())) {
                    document.add(new Paragraph("Retorno da SEFIN: " + invoice.getRejectionMessage())
                            .setFontSize(8).setFontColor(new DeviceRgb(180, 30, 30)));
                }
                document.add(new Paragraph(authorized
                        ? "Documento autorizado pela SEFIN Nacional. Consulte a autenticidade pela chave de acesso."
                        : "DOCUMENTO SEM VALIDADE FISCAL — emissão não autorizada pela SEFIN.")
                        .setFontSize(7).setTextAlignment(TextAlignment.CENTER).setMarginTop(12));
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar o PDF da NFS-e.", e);
        }
    }

    // ===================== Auxiliares =====================

    public String environment() {
        return "1".equals(configuredEnvironment == null ? "" : configuredEnvironment.trim()) ? "1" : "2";
    }

    private ServiceInvoice load(UUID id) {
        UUID companyId = requireCompany();
        return invoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NFS-e não encontrada."));
    }

    private Company company(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Empresa do usuário não encontrada."));
    }

    private long nextDpsNumber(UUID companyId, String series) {
        Long max = invoiceRepository.findMaxDpsNumber(companyId, series);
        return max == null ? 1L : max + 1;
    }

    private static String normalizeSeries(String value) {
        String digits = NfseDpsId.digits(value);
        if (digits.isBlank()) {
            return "1";
        }
        if (digits.length() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A série da DPS deve ter até 5 dígitos.");
        }
        return digits;
    }

    private static String normalizeCompetence(String value) {
        if (blank(value)) {
            return YearMonth.now(ZONE).toString();
        }
        String trimmed = value.trim();
        if (trimmed.length() >= 7 && trimmed.charAt(4) == '-') {
            return trimmed.substring(0, 7);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Competência inválida. Use o formato AAAA-MM.");
    }

    private static void validateCertificateCompany(FiscalCertificate certificate, Company company) {
        if (blank(certificate.getCnpj())) {
            return;
        }
        String certificateCnpj = NfseDpsId.digits(certificate.getCnpj());
        String companyCnpj = NfseDpsId.digits(company.getCnpj());
        if (!certificateCnpj.equals(companyCnpj)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O certificado A1 ativo pertence ao CNPJ " + certificateCnpj
                            + ", diferente do CNPJ da empresa (" + companyCnpj + ").");
        }
    }

    private NfseResponse toResponse(ServiceInvoice invoice) {
        return new NfseResponse(
                invoice.getId(),
                invoice.getFiscalDocumentId(),
                invoice.getDpsNumber(),
                invoice.getDpsId(),
                invoice.getNfseKey(),
                invoice.getNumber(),
                invoice.getSeries(),
                invoice.getVerificationCode(),
                invoice.getEmissionDate(),
                invoice.getCompetence(),
                NfseDpsId.competenceLabel(invoice.getCompetence()),
                invoice.getEnvironment(),
                invoice.getTakerName(),
                invoice.getTakerTaxId(),
                invoice.getGrossAmount(),
                invoice.getIssAmount(),
                invoice.getIssRetainedAmount(),
                invoice.getInssAmount(),
                invoice.getNetAmount(),
                invoice.getStatus(),
                invoice.getRejectionCode(),
                invoice.getRejectionMessage(),
                invoice.getIbscbsVTotNf(),
                invoice.getIbscbsVIbs(),
                invoice.getIbscbsVCbs());
    }

    private static boolean hasErrors(List<String> messages) {
        if (messages == null || messages.isEmpty()) {
            return false;
        }
        for (String message : messages) {
            if (message == null) {
                continue;
            }
            if (message.startsWith("Erro") || message.startsWith("Falha") || message.startsWith("Erro grave")) {
                return true;
            }
        }
        return false;
    }

    private static UUID requireCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empresa do usuário não identificada.");
        }
        return companyId;
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

    private static String grouped(String key) {
        String digits = NfseDpsId.digits(key);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < digits.length(); i++) {
            if (i > 0 && i % 4 == 0) {
                out.append(' ');
            }
            out.append(digits.charAt(i));
        }
        return out.toString();
    }

    private static String safeFilename(String value) {
        return blank(value) ? "sem-numero" : value.replaceAll("[^0-9A-Za-z_-]", "");
    }

    private static boolean positive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static String currency(BigDecimal value) {
        return "R$ " + money(value).toPlainString().replace('.', ',');
    }

    private static String digitsOrNull(String value) {
        if (blank(value)) {
            return null;
        }
        String digits = NfseDpsId.digits(value);
        return digits.isBlank() ? null : digits;
    }

    private static String trimToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private static String upper(String value) {
        return blank(value) ? null : value.trim().toUpperCase();
    }

    private static String value(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? "-" : text;
    }

    private static void require(String value, String message) {
        if (blank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (!blank(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
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
        return new Cell().setPadding(4).add(new Paragraph(text).setBold().setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
    }

    private static String address(String street, String city, String state, String zip) {
        StringBuilder line = new StringBuilder();
        if (!blank(street)) {
            line.append(street);
        }
        if (!blank(city)) {
            if (!line.isEmpty()) {
                line.append(" — ");
            }
            line.append(city);
        }
        if (!blank(state)) {
            line.append('/').append(state);
        }
        if (!blank(zip)) {
            line.append("  CEP ").append(zip);
        }
        return line.isEmpty() ? "-" : line.toString();
    }

    private record Prepared(ServiceInvoice invoice, BigDecimal gross, BigDecimal issAmount, BigDecimal net) {
    }
}
