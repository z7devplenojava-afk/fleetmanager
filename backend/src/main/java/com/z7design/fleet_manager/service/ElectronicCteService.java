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
import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteEmissionRequest;
import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteFiscalContext;
import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteTransmission;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.CteCreateRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.CteResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.fiscal.CteAccessKey;
import com.z7design.fleet_manager.fiscal.CteResponseParser;
import com.z7design.fleet_manager.fiscal.CteResponseParser.ParsedResponse;
import com.z7design.fleet_manager.fiscal.CteSefazClient;
import com.z7design.fleet_manager.fiscal.CteXmlBuilder;
import com.z7design.fleet_manager.fiscal.FiscalCertificateMaterial;
import com.z7design.fleet_manager.fiscal.FiscalXmlValidator;
import com.z7design.fleet_manager.fiscal.SefazSoapClient.SoapResponse;
import com.z7design.fleet_manager.fiscal.XmlSigner;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.ElectronicCte;
import com.z7design.fleet_manager.model.FiscalDocument;
import com.z7design.fleet_manager.model.enums.FiscalDocumentStatus;
import com.z7design.fleet_manager.model.enums.FiscalDocumentType;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.ElectronicCteRepository;
import com.z7design.fleet_manager.repository.FiscalDocumentRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Emissão real de CT-e (modelo 57, versão 4.00): reserva de numeração,
 * geração do XML, assinatura A1, validação XSD, transmissão SOAP à SEFAZ e
 * persistência do protocolo/retorno.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ElectronicCteService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final int MAX_NUMBER_ATTEMPTS = 5;
    private static final Set<String> UFS = Set.of(
            "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SP", "SE", "TO");

    private static final DeviceRgb HEADER = new DeviceRgb(31, 41, 55);
    private static final DeviceRgb HEADER_FG = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb LIGHT = new DeviceRgb(243, 244, 246);
    private static final DeviceRgb AMBER = new DeviceRgb(180, 130, 20);

    public static final String STATUS_DRAFT = "RASCUNHO";
    public static final String STATUS_SENDING = "PROCESSANDO";
    public static final String STATUS_ISSUED = "EMITIDA";
    public static final String STATUS_ERROR = "ERRO";

    private final ElectronicCteRepository cteRepository;
    private final FiscalDocumentRepository fiscalDocumentRepository;
    private final CompanyRepository companyRepository;
    private final FiscalCertificateService certificateService;
    private final CteXmlBuilder xmlBuilder;
    private final XmlSigner xmlSigner;
    private final FiscalXmlValidator xmlValidator;
    private final CteSefazClient sefazClient;
    private final JdbcTemplate jdbc;
    private final PlatformTransactionManager transactionManager;

    // ===================== Consultas =====================

    @Transactional(readOnly = true)
    public List<CteResponse> list() {
        return cteRepository.findByCompanyIdOrderByEmissionDateDesc(requireCompany()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CteResponse get(UUID id) {
        return toResponse(load(id));
    }

    // ===================== Emissão =====================

    /** Alias de compatibilidade: também transmite de verdade, sem simular autorização. */
    @Transactional
    public CteResponse create(CteCreateRequest request) {
        return emit(CteEmissionRequest.from(request));
    }

    @Transactional
    public CteResponse emit(CteCreateRequest request) {
        return emit(CteEmissionRequest.from(request));
    }

    @Transactional
    public CteResponse emit(CteEmissionRequest request) {
        UUID companyId = requireCompany();
        Company company = company(companyId);
        validate(request, company);

        // Exige certificado antes de consumir um número da numeração.
        certificateService.requireActive(companyId);
        FiscalCertificateMaterial material = certificateService.material(companyId);

        String series = normalizeSeries(request.series());
        String environment = sefazClient.environment();
        CteFiscalContext context = fiscalContext(request, company, environment);
        Prepared prepared = reserveNumber(request, company, series);
        ElectronicCte cte = prepared.cte();

        try {
            String plainXml = xmlBuilder.build(cte, context);
            String signedXml = xmlSigner.signElement(
                    plainXml, CteXmlBuilder.NAMESPACE, "infCte", "Id", material);

            // Guarda o XML assinado já nesta etapa para que download e auditoria
            // funcionem mesmo se a transmissão falhar.
            storeTransmission(cte.getId(), null, signedXml, null, null, environment, null);

            List<String> problems = xmlValidator.validate(
                    "fiscal/xsd/cte/", "cte_v4.00.xsd", signedXml);
            if (FiscalXmlValidator.hasErrors(problems)) {
                String message = String.join(" | ", problems);
                markError(cte, company, "XML", message, environment);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O XML do CT-e não passou na validação do leiaute 4.00: " + message);
            }

            cte.setStatus(STATUS_SENDING);
            cte = cteRepository.save(cte);

            SoapResponse response;
            try {
                response = sefazClient.recepcao(signedXml, material);
            } catch (IllegalStateException e) {
                markError(cte, company, "WEBSERVICE", e.getMessage(), environment);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage(), e);
            }
            ParsedResponse parsed = CteResponseParser.parse(response);

            if (parsed.authorized() && !blank(parsed.protocolNumber())) {
                return applySuccess(cte, company, parsed, signedXml, response.body(), environment);
            }

            String code = blank(parsed.statusCode()) ? "SEFAZ" : parsed.statusCode();
            String message = firstNonBlank(parsed.message(),
                    "A SEFAZ não autorizou o CT-e (HTTP " + response.status() + ").");
            cte.setStatus(STATUS_ERROR);
            cte = cteRepository.save(cte);
            storeTransmission(cte.getId(), null, signedXml, response.body(), code, environment, message);
            syncFiscalDocument(cte, company, FiscalDocumentStatus.ERROR);
            log.warn("CT-e {} rejeitado pela SEFAZ: {} {}", cte.getAccessKey(), code, message);
            return toResponse(cte);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            String message = e.getMessage() == null ? "Dados fiscais inválidos." : e.getMessage();
            markError(cte, company, "DADOS", message, environment);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message, e);
        } catch (Exception e) {
            String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            markError(cte, company, "FALHA", message, environment);
            log.error("Falha ao emitir CT-e para a empresa {} (chave {}): {}", companyId,
                    cte.getAccessKey(), message, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível concluir a emissão do CT-e: " + message, e);
        }
    }

    @Transactional
    public CteResponse consultar(UUID id) {
        ElectronicCte cte = load(id);
        FiscalCertificateMaterial material = certificateService.material(cte.getCompanyId());
        String environment = sefazClient.environment();
        try {
            SoapResponse response = sefazClient.consultaSituacao(cte.getAccessKey(), material);
            ParsedResponse parsed = CteResponseParser.parse(response);
            CteTransmission current = transmission(cte.getId(), cte.getCompanyId());
            String signedXml = current == null ? null : current.signedXml();

            if (parsed.authorized() && !blank(parsed.protocolNumber())) {
                return applySuccess(cte, company(cte.getCompanyId()), parsed, signedXml,
                        response.body(), environment);
            }
            String code = blank(parsed.statusCode()) ? "CONSULTA" : parsed.statusCode();
            storeTransmission(cte.getId(), parsed.protocolNumber(), signedXml, response.body(),
                    code, environment, parsed.message());
            cte = cteRepository.save(cte);
            return toResponse(cte);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage(), e);
        }
    }

    @Transactional
    public CteResponse cancelar(UUID id, String motivo) {
        ElectronicCte cte = load(id);
        CteTransmission current = transmission(cte.getId(), cte.getCompanyId());
        if (!STATUS_ISSUED.equals(cte.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Somente CT-e autorizado pode ser cancelado. Situação atual: " + cte.getStatus() + ".");
        }
        if (current != null && current.cancelledAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Este CT-e já foi cancelado em "
                            + current.cancelledAt().format(DATE_TIME) + ".");
        }
        if (current == null || blank(current.protocolNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "CT-e sem protocolo de autorização; não é possível cancelar.");
        }

        FiscalCertificateMaterial material = certificateService.material(cte.getCompanyId());
        String environment = sefazClient.environment();
        String eventXml = xmlBuilder.buildCancellationEvent(cte.getAccessKey(),
                current.protocolNumber(), motivo, environment, cte.getIssuerTaxId());
        String signedEvent = xmlSigner.signElement(
                eventXml, CteXmlBuilder.NAMESPACE, "infEvento", "Id", material);
        List<String> problems = xmlValidator.validate(
                "fiscal/xsd/cte/", "eventoCTe_v4.00.xsd", signedEvent);
        if (FiscalXmlValidator.hasErrors(problems)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O XML do evento de cancelamento não passou na validação: "
                            + String.join(" | ", problems));
        }

        SoapResponse response = sefazClient.cancelamento(signedEvent, material);
        ParsedResponse parsed = CteResponseParser.parse(response);
        if (!parsed.success()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A SEFAZ não aceitou o cancelamento: "
                            + firstNonBlank(parsed.message(), "HTTP " + response.status()));
        }
        jdbc.update("update electronic_ctes set cancellation_reason = ?, cancelled_at = ?, "
                        + "response_xml = ?, rejection_code = null, rejection_message = null where id = ?",
                trimToNull(motivo), Timestamp.valueOf(LocalDateTime.now(ZONE)), response.body(), cte.getId());
        syncFiscalDocument(cte, company(cte.getCompanyId()), FiscalDocumentStatus.CANCELLED);
        log.info("CT-e {} cancelado na SEFAZ. Protocolo do evento: {}",
                cte.getAccessKey(), parsed.protocolNumber());
        return toResponse(cte);
    }

    // ===================== Arquivos =====================

    @Transactional(readOnly = true)
    public GeneratedFiscalFile xml(UUID id) {
        ElectronicCte cte = load(id);
        CteTransmission current = transmission(cte.getId(), cte.getCompanyId());
        if (current == null || !current.hasSignedXml()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Este CT-e ainda não foi assinado; não há XML fiscal para download.");
        }
        String filename = "CTe-" + safeFilename(cte.getNumber()) + "-serie-" + cte.getSeries() + ".xml";
        return new GeneratedFiscalFile(filename,
                current.signedXml().getBytes(StandardCharsets.UTF_8), "application/xml");
    }

    @Transactional(readOnly = true)
    public GeneratedFiscalFile pdf(UUID id) {
        ElectronicCte cte = load(id);
        String filename = "DACTE-" + safeFilename(cte.getNumber()) + "-serie-" + cte.getSeries() + ".pdf";
        return new GeneratedFiscalFile(filename, buildPdf(cte), "application/pdf");
    }

    // ===================== Reserva de numeração =====================

    /**
     * Reserva o próximo número em transação independente. Colisões no índice
     * único (company_id, series, number) são refeitas com o número seguinte.
     */
    private Prepared reserveNumber(CteEmissionRequest request, Company company, String series) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        for (int attempt = 1; ; attempt++) {
            Integer max = cteRepository.findMaxNumber(company.getId(), series);
            String number = String.valueOf((max == null ? 0 : max) + 1);
            if (number.length() > 9) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Não há mais números disponíveis para a série " + series + ".");
            }
            LocalDateTime emission = LocalDateTime.now(ZONE);
            ElectronicCte cte = newDoc(request, company, series, number, emission);
            try {
                ElectronicCte saved = template.execute(status -> cteRepository.saveAndFlush(cte));
                if (saved == null) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Não foi possível reservar o número do CT-e.");
                }
                return new Prepared(saved, null);
            } catch (DataIntegrityViolationException e) {
                if (attempt >= MAX_NUMBER_ATTEMPTS) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Não foi possível reservar um número de CT-e após " + attempt
                                    + " tentativas. Tente novamente.", e);
                }
                log.warn("Colisão ao reservar CT-e {}/{} para a empresa {}; tentando novamente.",
                        series, number, company.getId());
            }
        }
    }

    private ElectronicCte newDoc(CteEmissionRequest request, Company company, String series,
                                 String number, LocalDateTime emission) {
        BigDecimal freight = money(request.freightValue());
        BigDecimal rate = request.icmsRate() == null ? BigDecimal.ZERO : request.icmsRate();
        BigDecimal icmsBase = rate.compareTo(BigDecimal.ZERO) > 0 ? freight : BigDecimal.ZERO;
        BigDecimal icmsValue = icmsBase.multiply(rate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        String originState = request.originState().trim().toUpperCase();
        String destinationState = request.destinationState().trim().toUpperCase();
        String cfop = blank(request.cfop())
                ? (originState.equals(destinationState) ? "5353" : "6353")
                : CteAccessKey.digits(request.cfop(), 4);

        ElectronicCte cte = new ElectronicCte();
        cte.setCompanyId(company.getId());
        cte.setNumber(number);
        cte.setSeries(series);
        cte.setAccessKey(CteAccessKey.generate(company.getState(), emission, company.getCnpj(), series, number));
        cte.setStatus(STATUS_DRAFT);
        cte.setEmissionDate(emission);
        cte.setCfop(cfop);
        cte.setNatureOperation(text(request.natureOperation(), "PRESTACAO DE SERVICO DE TRANSPORTE"));
        cte.setServiceTaker(normalizeTaker(request.serviceTaker()));
        cte.setIssuerName(company.getName());
        cte.setIssuerTaxId(CteAccessKey.digits(company.getCnpj(), 14));
        cte.setIssuerAddress(companyAddress(company));
        cte.setIssuerCity(company.getCity());
        cte.setIssuerState(upper(company.getState()));
        cte.setIssuerZip(company.getZipCode());
        cte.setIssuerPhone(company.getPhone());
        cte.setIssuerEmail(company.getEmail());
        cte.setIssuerStateRegistration(firstNonBlank(
                trimToNull(request.issuerStateRegistration()), trimToNull(company.getInscricaoEstadual())));
        cte.setSenderName(request.senderName().trim());
        cte.setSenderTaxId(CteAccessKey.digits(request.senderTaxId(), 14));
        cte.setSenderAddress(trimToNull(request.senderAddress()));
        cte.setSenderCity(request.senderCity().trim());
        cte.setSenderState(firstNonBlank(upper(request.senderState()), originState));
        cte.setSenderZip(trimToNull(request.senderZip()));
        cte.setSenderStateRegistration(trimToNull(request.senderStateRegistration()));
        cte.setRecipientName(request.recipientName().trim());
        cte.setRecipientTaxId(CteAccessKey.digits(request.recipientTaxId(), 14));
        cte.setRecipientAddress(trimToNull(request.recipientAddress()));
        cte.setRecipientCity(request.recipientCity().trim());
        cte.setRecipientState(firstNonBlank(upper(request.recipientState()), destinationState));
        cte.setRecipientZip(trimToNull(request.recipientZip()));
        cte.setRecipientStateRegistration(trimToNull(request.recipientStateRegistration()));
        cte.setOriginCity(request.originCity().trim());
        cte.setOriginState(originState);
        cte.setDestinationCity(request.destinationCity().trim());
        cte.setDestinationState(destinationState);
        cte.setVehiclePlate(upper(request.vehiclePlate()));
        cte.setRntrc(trimToNull(request.rntrc()));
        cte.setCargoDescription(request.cargoDescription().trim());
        cte.setCargoWeight(request.cargoWeight().setScale(3, RoundingMode.HALF_UP));
        cte.setCargoValue(money(request.cargoValue()));
        cte.setFreightValue(freight);
        cte.setIcmsBase(icmsBase);
        cte.setIcmsRate(rate.setScale(4, RoundingMode.HALF_UP));
        cte.setIcmsValue(icmsValue);
        cte.setNotes(trimToNull(request.notes()));
        cte.setClientId(request.clientId());
        return cte;
    }

    // ===================== Resultado / persistência =====================

    private CteResponse applySuccess(ElectronicCte cte, Company company, ParsedResponse parsed,
                                     String signedXml, String responseBody, String environment) {
        if (!blank(parsed.accessKey()) && parsed.accessKey().length() == 44) {
            cte.setAccessKey(parsed.accessKey());
        }
        cte.setStatus(STATUS_ISSUED);
        cte = cteRepository.save(cte);
        storeTransmission(cte.getId(), parsed.protocolNumber(), signedXml, responseBody,
                null, environment, null);
        syncFiscalDocument(cte, company, FiscalDocumentStatus.ISSUED);
        log.info("CT-e {} autorizado pela SEFAZ. Protocolo {}.", cte.getAccessKey(), parsed.protocolNumber());
        return toResponse(cte);
    }

    private void markError(ElectronicCte cte, Company company, String code,
                           String message, String environment) {
        cte.setStatus(STATUS_ERROR);
        cte = cteRepository.save(cte);
        CteTransmission current = transmission(cte.getId(), cte.getCompanyId());
        storeTransmission(cte.getId(), null,
                current == null ? null : current.signedXml(), null, code, environment, message);
        syncFiscalDocument(cte, company, FiscalDocumentStatus.ERROR);
    }

    /** Persiste as colunas adicionadas pela V4718 (a entidade é fixa, por contrato). */
    private void storeTransmission(UUID id, String protocol, String signedXml, String responseXml,
                                   String rejectionCode, String environment, String rejectionMessage) {
        jdbc.update("update electronic_ctes set protocol_number = ?, signed_xml = ?, response_xml = ?, "
                        + "rejection_code = ?, environment = ?, rejection_message = ? where id = ?",
                trimToNull(protocol), signedXml, responseXml, trimToNull(rejectionCode),
                environment, truncate(rejectionMessage, 1900), id);
    }

    private CteTransmission transmission(UUID id, UUID companyId) {
        return jdbc.query("select protocol_number, response_xml, rejection_code, rejection_message, "
                        + "environment, cancellation_reason, cancelled_at, signed_xml "
                        + "from electronic_ctes where id = ? and company_id = ?",
                rs -> {
                    if (!rs.next()) {
                        return null;
                    }
                    Timestamp cancelled = rs.getTimestamp("cancelled_at");
                    return new CteTransmission(
                            rs.getString("protocol_number"),
                            rs.getString("response_xml"),
                            rs.getString("rejection_code"),
                            rs.getString("rejection_message"),
                            rs.getString("environment"),
                            rs.getString("cancellation_reason"),
                            cancelled == null ? null : cancelled.toLocalDateTime(),
                            rs.getString("signed_xml"));
                }, id, companyId);
    }

    private void syncFiscalDocument(ElectronicCte cte, Company company, FiscalDocumentStatus status) {
        FiscalDocument document = null;
        if (cte.getFiscalDocumentId() != null) {
            document = fiscalDocumentRepository.findById(cte.getFiscalDocumentId()).orElse(null);
        }
        if (document == null) {
            document = new FiscalDocument();
        }
        document.setKey(cte.getAccessKey());
        document.setNumber(cte.getNumber());
        document.setSeries(cte.getSeries());
        document.setType(FiscalDocumentType.CT_E);
        document.setStatus(status);
        document.setEmissionDate(cte.getEmissionDate());
        document.setTotalAmount(cte.getFreightValue());
        document.setIssuerTaxId(cte.getIssuerTaxId());
        document.setIssuerName(company.getName());
        document.setRecipientTaxId(cte.getRecipientTaxId());
        document.setCompanyId(cte.getCompanyId());
        document.setNotes("CT-e " + cte.getNumber() + " — " + cte.getOriginCity() + "/" + cte.getOriginState()
                + " → " + cte.getDestinationCity() + "/" + cte.getDestinationState()
                + " — " + status.name());
        document = fiscalDocumentRepository.save(document);
        if (!document.getId().equals(cte.getFiscalDocumentId())) {
            cte.setFiscalDocumentId(document.getId());
            cteRepository.save(cte);
        }
    }

    // ===================== Validação =====================

    private void validate(CteEmissionRequest request, Company company) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados do CT-e não informados.");
        }
        require(company.getCnpj(), "Cadastre o CNPJ da empresa antes de emitir o CT-e.");
        require(company.getName(), "Cadastre a razão social da empresa antes de emitir o CT-e.");
        require(companyAddress(company), "Cadastre o endereço da empresa antes de emitir o CT-e.");
        require(company.getCity(), "Cadastre a cidade da empresa antes de emitir o CT-e.");
        require(company.getState(), "Cadastre a UF da empresa antes de emitir o CT-e.");
        require(blank(request.issuerStateRegistration()) ? company.getInscricaoEstadual()
                        : request.issuerStateRegistration(),
                "Informe a inscrição estadual do emitente (ou ISENTO).");

        require(request.senderName(), "Informe o remetente.");
        require(request.senderTaxId(), "Informe o CNPJ/CPF do remetente.");
        require(request.senderAddress(), "Informe o endereço do remetente.");
        require(request.senderCity(), "Informe a cidade do remetente.");
        require(request.recipientName(), "Informe o destinatário.");
        require(request.recipientTaxId(), "Informe o CNPJ/CPF do destinatário.");
        require(request.recipientAddress(), "Informe o endereço do destinatário.");
        require(request.recipientCity(), "Informe a cidade do destinatário.");
        require(request.originCity(), "Informe a cidade de origem.");
        require(request.originState(), "Informe a UF de origem.");
        require(request.destinationCity(), "Informe a cidade de destino.");
        require(request.destinationState(), "Informe a UF de destino.");
        require(request.cargoDescription(), "Informe a descrição da carga.");
        requireMunicipality(company.getCodigoMunicipio(),
                "Cadastre o código IBGE do município da empresa (7 dígitos) nos dados fiscais.");
        requireMunicipality(request.originMunicipalityCode(),
                "Informe o código IBGE do município de origem (7 dígitos).");
        requireMunicipality(request.destinationMunicipalityCode(),
                "Informe o código IBGE do município de destino (7 dígitos).");

        validateUf(company.getState(), "UF da empresa");
        validateUf(request.originState(), "UF de origem");
        validateUf(request.destinationState(), "UF de destino");
        if (!blank(request.senderState())) {
            validateUf(request.senderState(), "UF do remetente");
        }
        if (!blank(request.recipientState())) {
            validateUf(request.recipientState(), "UF do destinatário");
        }
        String taker = normalizeTaker(request.serviceTaker());
        if (!"REMETENTE".equals(taker) && !"DESTINATARIO".equals(taker)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tomador inválido. Informe REMETENTE ou DESTINATÁRIO.");
        }
        if (request.cargoWeight() == null || request.cargoWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o peso da carga.");
        }
        if (request.freightValue() == null || request.freightValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o valor do frete.");
        }
        if (request.cargoValue() == null || request.cargoValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o valor da carga.");
        }
        if (request.icmsRate() != null && (request.icmsRate().compareTo(BigDecimal.ZERO) < 0
                || request.icmsRate().compareTo(new BigDecimal("100")) >= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A alíquota do ICMS deve estar entre 0 e 99,99%.");
        }
        if (!blank(request.cfop()) && CteAccessKey.digits(request.cfop(), 4).length() != 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CFOP deve ter 4 dígitos.");
        }
        if (!blank(request.rntrc())) {
            String rntrc = request.rntrc().trim().toUpperCase();
            if (!"ISENTO".equals(rntrc) && !rntrc.matches("\\d{1,8}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "RNTRC deve ter até 8 dígitos ou o valor ISENTO.");
            }
        }
    }

    private CteFiscalContext fiscalContext(CteEmissionRequest request, Company company, String environment) {
        String issuerCode = CteAccessKey.digits(company.getCodigoMunicipio(), 7);
        String originCode = CteAccessKey.digits(request.originMunicipalityCode(), 7);
        String destinationCode = CteAccessKey.digits(request.destinationMunicipalityCode(), 7);
        String senderCode = blank(request.senderMunicipalityCode())
                ? originCode : CteAccessKey.digits(request.senderMunicipalityCode(), 7);
        String recipientCode = blank(request.recipientMunicipalityCode())
                ? destinationCode : CteAccessKey.digits(request.recipientMunicipalityCode(), 7);
        requireMunicipality(senderCode, "Informe o código IBGE do município do remetente (7 dígitos).");
        requireMunicipality(recipientCode, "Informe o código IBGE do município do destinatário (7 dígitos).");
        String regime = trimToNull(company.getRegimeTributario());
        String crt = "1".equals(regime) ? "3" : "1";
        return new CteFiscalContext(issuerCode, originCode, destinationCode, senderCode,
                recipientCode, environment, crt);
    }

    private static void requireMunicipality(String value, String message) {
        String code = CteAccessKey.digits(value, 7);
        if (code.length() != 7 || "9999999".equals(code) || "0000000".equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private static void validateUf(String value, String label) {
        String uf = value == null ? "" : value.trim().toUpperCase();
        if (!UFS.contains(uf)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " inválida: " + value + ".");
        }
    }

    // ===================== PDF (DACTE) =====================

    private byte[] buildPdf(ElectronicCte cte) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            try (PdfDocument pdf = new PdfDocument(writer);
                 Document document = new Document(pdf)) {
                document.add(new Paragraph("DACTE")
                        .setBold().setFontSize(16).setFontColor(AMBER)
                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(0));
                document.add(new Paragraph("Documento Auxiliar do Conhecimento de Transporte Eletrônico")
                        .setFontSize(9).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                document.add(new Paragraph(cte.getIssuerName()).setBold().setFontSize(12)
                        .setTextAlignment(TextAlignment.CENTER));
                document.add(new Paragraph(issuerLine(cte)).setFontSize(8)
                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table id = grid(25, 25, 25, 25);
                id.addCell(info("Número", cte.getNumber()));
                id.addCell(info("Série", cte.getSeries()));
                id.addCell(info("Emissão", cte.getEmissionDate().format(DATE_TIME)));
                id.addCell(info("CFOP", cte.getCfop()));
                document.add(id);

                document.add(new Paragraph("Chave de acesso").setBold().setFontSize(8).setMarginBottom(0));
                document.add(new Paragraph(CteAccessKey.grouped(cte.getAccessKey()))
                        .setFontSize(11).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

                Table route = grid(50, 50);
                route.addCell(block("EMITENTE", cte.getIssuerName(),
                        "CNPJ: " + cte.getIssuerTaxId(),
                        "IE: " + value(cte.getIssuerStateRegistration()),
                        address(cte.getIssuerAddress(), cte.getIssuerCity(), cte.getIssuerState(), cte.getIssuerZip())));
                route.addCell(block("MODAL / PRESTAÇÃO", "Rodoviário",
                        "Natureza: " + cte.getNatureOperation(),
                        "Tomador: " + takerLabel(cte.getServiceTaker()),
                        "Situação: " + statusLabel(cte.getStatus())));
                document.add(route);

                Table parties = grid(50, 50);
                parties.addCell(block("REMETENTE", cte.getSenderName(),
                        "CNPJ/CPF: " + cte.getSenderTaxId(),
                        "IE: " + value(cte.getSenderStateRegistration()),
                        address(cte.getSenderAddress(), cte.getSenderCity(), cte.getSenderState(), cte.getSenderZip())));
                parties.addCell(block("DESTINATÁRIO", cte.getRecipientName(),
                        "CNPJ/CPF: " + cte.getRecipientTaxId(),
                        "IE: " + value(cte.getRecipientStateRegistration()),
                        address(cte.getRecipientAddress(), cte.getRecipientCity(), cte.getRecipientState(), cte.getRecipientZip())));
                document.add(parties);

                Table trip = grid(25, 25, 25, 25);
                trip.addCell(info("Origem", cte.getOriginCity() + "/" + cte.getOriginState()));
                trip.addCell(info("Destino", cte.getDestinationCity() + "/" + cte.getDestinationState()));
                trip.addCell(info("Placa", value(cte.getVehiclePlate())));
                trip.addCell(info("RNTRC", value(cte.getRntrc())));
                document.add(trip);

                document.add(new Paragraph("INFORMAÇÕES DA CARGA").setBold().setFontSize(9).setMarginBottom(4));
                Table cargo = grid(50, 25, 25);
                cargo.addHeaderCell(header("Produto predominante"));
                cargo.addHeaderCell(headerRight("Peso (kg)"));
                cargo.addHeaderCell(headerRight("Valor da carga"));
                cargo.addCell(body(cte.getCargoDescription()));
                cargo.addCell(bodyRight(cte.getCargoWeight().setScale(3, RoundingMode.HALF_UP).toPlainString()));
                cargo.addCell(bodyRight(currency(cte.getCargoValue())));
                document.add(cargo);

                document.add(new Paragraph("COMPONENTES DO VALOR DA PRESTAÇÃO")
                        .setBold().setFontSize(9).setMarginTop(8).setMarginBottom(4));
                Table values = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                        .useAllAvailableWidth().setMarginBottom(8);
                values.addCell(label("Frete"));
                values.addCell(valueCell(currency(cte.getFreightValue())));
                values.addCell(label("Base de cálculo ICMS"));
                values.addCell(valueCell(currency(cte.getIcmsBase())));
                values.addCell(label("Alíquota ICMS"));
                values.addCell(valueCell(cte.getIcmsRate().setScale(2, RoundingMode.HALF_UP).toPlainString() + "%"));
                values.addCell(label("Valor ICMS"));
                values.addCell(valueCell(currency(cte.getIcmsValue())));
                values.addCell(labelBold("Valor total do serviço"));
                values.addCell(valueCellBold(currency(cte.getFreightValue())));
                document.add(values);

                if (!blank(cte.getNotes())) {
                    document.add(new Paragraph("Observações: " + cte.getNotes()).setFontSize(8));
                }
                document.add(new Paragraph("Consulte a autenticidade pela chave de acesso na SEFAZ. "
                        + "Situação: " + statusLabel(cte.getStatus()))
                        .setFontSize(7).setTextAlignment(TextAlignment.CENTER).setMarginTop(12));
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar o PDF do CT-e.", e);
        }
    }

    // ===================== Auxiliares =====================

    private ElectronicCte load(UUID id) {
        UUID companyId = requireCompany();
        ElectronicCte cte = cteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CT-e não encontrado."));
        if (!companyId.equals(cte.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CT-e não encontrado.");
        }
        return cte;
    }

    private Company company(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Empresa do usuário não encontrada."));
    }

    private CteResponse toResponse(ElectronicCte cte) {
        return new CteResponse(
                cte.getId(),
                cte.getFiscalDocumentId(),
                cte.getNumber(),
                cte.getSeries(),
                cte.getAccessKey(),
                cte.getEmissionDate(),
                cte.getSenderName(),
                cte.getRecipientName(),
                cte.getOriginCity(),
                cte.getOriginState(),
                cte.getDestinationCity(),
                cte.getDestinationState(),
                cte.getFreightValue(),
                cte.getStatus());
    }

    private record Prepared(ElectronicCte cte, CteFiscalContext context) {
    }

    private static String normalizeSeries(String value) {
        String digits = CteAccessKey.digits(value, 3);
        return digits.isEmpty() ? "1" : digits;
    }

    private static String taxLabel(String taxId) {
        return CteAccessKey.digits(taxId, 14);
    }

    private static String normalizeTaker(String value) {
        if (value == null) {
            return "REMETENTE";
        }
        return switch (value.trim().toUpperCase()) {
            case "DESTINATARIO", "DESTINATÁRIO" -> "DESTINATARIO";
            case "EXPEDIDOR" -> "EXPEDIDOR";
            case "RECEBEDOR" -> "RECEBEDOR";
            case "OUTROS" -> "OUTROS";
            default -> "REMETENTE";
        };
    }

    private static String takerLabel(String value) {
        return switch (value) {
            case "DESTINATARIO" -> "Destinatário";
            case "EXPEDIDOR" -> "Expedidor";
            case "RECEBEDOR" -> "Recebedor";
            case "OUTROS" -> "Outros";
            default -> "Remetente";
        };
    }

    private static String statusLabel(String status) {
        return switch (status == null ? "" : status) {
            case STATUS_ISSUED -> "Autorizada";
            case STATUS_SENDING -> "Processando";
            case STATUS_ERROR -> "Erro";
            default -> "Rascunho";
        };
    }

    private static String companyAddress(Company company) {
        if (!blank(company.getEnderecoRua())) {
            StringBuilder address = new StringBuilder(company.getEnderecoRua());
            if (!blank(company.getEnderecoNumero())) {
                address.append(", ").append(company.getEnderecoNumero());
            }
            if (!blank(company.getEnderecoBairro())) {
                address.append(" - ").append(company.getEnderecoBairro());
            }
            return address.toString();
        }
        return company.getAddress();
    }

    private static String issuerLine(ElectronicCte cte) {
        return "CNPJ: " + value(cte.getIssuerTaxId())
                + "  •  " + address(cte.getIssuerAddress(), cte.getIssuerCity(), cte.getIssuerState(), cte.getIssuerZip())
                + (blank(cte.getIssuerPhone()) ? "" : "  •  Tel: " + cte.getIssuerPhone());
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

    private static UUID requireCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empresa do usuário não identificada.");
        }
        return companyId;
    }

    private static void require(String value, String message) {
        if (blank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static String currency(BigDecimal value) {
        return "R$ " + money(value).toPlainString().replace('.', ',');
    }

    private static String text(String value, String fallback) {
        return blank(value) ? fallback : value.trim();
    }

    private static String value(String text) {
        return blank(text) ? "-" : text.trim();
    }

    private static String trimToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private static String upper(String value) {
        return blank(value) ? null : value.trim().toUpperCase();
    }

    private static String firstNonBlank(String first, String fallback) {
        return blank(first) ? fallback : first;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String safeFilename(String value) {
        String safe = value == null ? "" : value.replaceAll("[^0-9A-Za-z-]", "");
        return safe.isEmpty() ? "CTE" : safe;
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
                .add(new Paragraph(text).setBold().setFontSize(8)
                        .setFontColor(HEADER_FG).setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell body(String text) {
        return new Cell().setPadding(4).add(new Paragraph(value(text)).setFontSize(8));
    }

    private static Cell bodyRight(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell label(String text) {
        return new Cell().setPadding(4).setBackgroundColor(LIGHT).add(new Paragraph(text).setFontSize(8));
    }

    private static Cell labelBold(String text) {
        return new Cell().setPadding(4).setBackgroundColor(LIGHT).add(new Paragraph(text).setBold().setFontSize(9));
    }

    private static Cell valueCell(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell valueCellBold(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setBold().setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT));
    }
}
