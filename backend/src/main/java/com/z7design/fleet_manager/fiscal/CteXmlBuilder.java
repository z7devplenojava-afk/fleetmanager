package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteFiscalContext;
import com.z7design.fleet_manager.model.ElectronicCte;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Monta o XML do CT-e (modelo 57, leiaute 4.00) conforme os XSDs oficiais
 * empacotados em resources/fiscal/xsd/cte. Nenhum código de município
 * placeholder é produzido aqui: todos vêm de {@link CteFiscalContext}.
 */
@Component
public class CteXmlBuilder {

    public static final String NAMESPACE = "http://www.portalfiscal.inf.br/cte";
    public static final String VERSION = "4.00";
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter XML_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    /** Gera o CT-e sem assinatura (a assinatura é aplicada por XmlSigner). */
    public String build(ElectronicCte cte, CteFiscalContext context) {
        if (cte == null || context == null) {
            throw new IllegalArgumentException("Dados do CT-e não informados para gerar o XML.");
        }
        String key = cte.getAccessKey();
        if (key == null || key.length() != 44) {
            throw new IllegalArgumentException("Chave de acesso do CT-e inválida.");
        }
        String cCt = key.substring(35, 43);
        String cDv = key.substring(43);
        String environment = "1".equals(context.environment()) ? "1" : "2";
        String dhEmi = cte.getEmissionDate().atZone(ZONE).format(XML_DATE);

        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        // O XSD cte_v4.00 define "versao" apenas em infCte (e em cteProc), não na raiz CTe.
        xml.append("<CTe xmlns=\"").append(NAMESPACE).append("\">");
        xml.append("<infCte versao=\"").append(VERSION).append("\" Id=\"CTe").append(key).append("\">");

        appendIde(xml, cte, context, key, cCt, cDv, environment, dhEmi);
        appendCompl(xml, cte);
        appendEmit(xml, cte, context);
        appendParty(xml, "rem", "enderReme", cte.getSenderTaxId(), cte.getSenderStateRegistration(),
                cte.getSenderName(), cte.getSenderAddress(), cte.getSenderCity(), cte.getSenderState(),
                cte.getSenderZip(), context.senderMunicipalityCode());
        appendParty(xml, "dest", "enderDest", cte.getRecipientTaxId(), cte.getRecipientStateRegistration(),
                cte.getRecipientName(), cte.getRecipientAddress(), cte.getRecipientCity(), cte.getRecipientState(),
                cte.getRecipientZip(), context.recipientMunicipalityCode());

        xml.append("<vPrest>")
                .append(FiscalXml.tag("vTPrest", FiscalXml.money(cte.getFreightValue())))
                .append(FiscalXml.tag("vRec", FiscalXml.money(cte.getFreightValue())))
                .append("<Comp>")
                .append(FiscalXml.tag("xNome", "FRETE"))
                .append(FiscalXml.tag("vComp", FiscalXml.money(cte.getFreightValue())))
                .append("</Comp></vPrest>");

        appendImposto(xml, cte);
        appendInfCTeNorm(xml, cte);

        xml.append("</infCte></CTe>");
        return xml.toString();
    }

    private static void appendCompl(StringBuilder xml, ElectronicCte cte) {
        String observations = blank(cte.getNotes()) ? "" : cte.getNotes().trim();
        if (!blank(cte.getVehiclePlate())) {
            observations = observations + (observations.isEmpty() ? "" : " ") + "Placa: " + cte.getVehiclePlate().trim();
        }
        if (!blank(observations)) {
            xml.append("<compl>").append(FiscalXml.tag("xObs", observations)).append("</compl>");
        }
    }

    private static void appendIde(StringBuilder xml, ElectronicCte cte, CteFiscalContext context,
                                  String key, String cCt, String cDv, String environment, String dhEmi) {
        String takerCode = switch (safe(cte.getServiceTaker())) {
            case "EXPEDIDOR" -> "1";
            case "RECEBEDOR" -> "2";
            case "DESTINATARIO" -> "3";
            default -> "0";
        };
        String takerIe = "DESTINATARIO".equals(cte.getServiceTaker())
                ? cte.getRecipientStateRegistration()
                : cte.getSenderStateRegistration();
        String indIeToma = blank(takerIe) ? "9" : "1";

        xml.append("<ide>");
        xml.append(FiscalXml.tag("cUF", CteAccessKey.ufCode(cte.getIssuerState())));
        xml.append(FiscalXml.tag("cCT", cCt));
        xml.append(FiscalXml.tag("CFOP", digits(cte.getCfop())));
        xml.append(FiscalXml.tag("natOp", cte.getNatureOperation()));
        xml.append(FiscalXml.tag("mod", "57"));
        xml.append(FiscalXml.tag("serie", cte.getSeries()));
        xml.append(FiscalXml.tag("nCT", cte.getNumber()));
        xml.append(FiscalXml.tag("dhEmi", dhEmi));
        xml.append(FiscalXml.tag("tpImp", "1"));
        xml.append(FiscalXml.tag("tpEmis", "1"));
        xml.append(FiscalXml.tag("cDV", cDv));
        xml.append(FiscalXml.tag("tpAmb", environment));
        xml.append(FiscalXml.tag("tpCTe", "0"));
        xml.append(FiscalXml.tag("procEmi", "0"));
        xml.append(FiscalXml.tag("verProc", "FleetManager-4.00"));
        xml.append(FiscalXml.tag("cMunEnv", onlyDigits(context.issuerMunicipalityCode(), 7)));
        xml.append(FiscalXml.tag("xMunEnv", firstNonBlank(cte.getIssuerCity(), cte.getOriginCity())));
        xml.append(FiscalXml.tag("UFEnv", upper(cte.getIssuerState())));
        xml.append(FiscalXml.tag("modal", "01"));
        xml.append(FiscalXml.tag("tpServ", "0"));
        xml.append(FiscalXml.tag("cMunIni", onlyDigits(context.originMunicipalityCode(), 7)));
        xml.append(FiscalXml.tag("xMunIni", cte.getOriginCity()));
        xml.append(FiscalXml.tag("UFIni", upper(cte.getOriginState())));
        xml.append(FiscalXml.tag("cMunFim", onlyDigits(context.destinationMunicipalityCode(), 7)));
        xml.append(FiscalXml.tag("xMunFim", cte.getDestinationCity()));
        xml.append(FiscalXml.tag("UFFim", upper(cte.getDestinationState())));
        xml.append(FiscalXml.tag("retira", "1"));
        xml.append(FiscalXml.tag("indIEToma", indIeToma));
        xml.append("<toma3>").append(FiscalXml.tag("toma", takerCode)).append("</toma3>");
        xml.append("</ide>");
    }

    private static void appendEmit(StringBuilder xml, ElectronicCte cte, CteFiscalContext context) {
        xml.append("<emit>");
        xml.append(taxIdTag(cte.getIssuerTaxId()));
        xml.append(FiscalXml.tag("IE", normalizedIe(cte.getIssuerStateRegistration())));
        xml.append(FiscalXml.tag("xNome", cte.getIssuerName()));
        appendAddress(xml, "enderEmit", cte.getIssuerAddress(), cte.getIssuerCity(),
                cte.getIssuerState(), cte.getIssuerZip(), context.issuerMunicipalityCode());
        xml.append(FiscalXml.tag("CRT", "1".equals(context.crt()) || "2".equals(context.crt()) ? "1" : "3"));
        xml.append("</emit>");
    }

    private static void appendParty(StringBuilder xml, String group, String addressGroup, String taxId,
                                    String stateRegistration, String name, String street, String city,
                                    String state, String zip, String municipalityCode) {
        xml.append("<").append(group).append(">");
        xml.append(taxIdTag(taxId));
        if (!blank(stateRegistration)) {
            xml.append(FiscalXml.tag("IE", normalizedIe(stateRegistration)));
        }
        xml.append(FiscalXml.tag("xNome", name));
        appendAddress(xml, addressGroup, street, city, state, zip, municipalityCode);
        xml.append("</").append(group).append(">");
    }

    private static void appendAddress(StringBuilder xml, String group, String street, String city,
                                      String state, String zip, String municipalityCode) {
        xml.append("<").append(group).append(">");
        xml.append(FiscalXml.tag("xLgr", street));
        xml.append(FiscalXml.tag("nro", "S/N"));
        xml.append(FiscalXml.tag("xBairro", "CENTRO"));
        xml.append(FiscalXml.tag("cMun", onlyDigits(municipalityCode, 7)));
        xml.append(FiscalXml.tag("xMun", city));
        String cep = onlyDigits(zip, 8);
        if (cep.length() == 8) {
            xml.append(FiscalXml.tag("CEP", cep));
        }
        xml.append(FiscalXml.tag("UF", upper(state)));
        xml.append("</").append(group).append(">");
    }

    private static void appendImposto(StringBuilder xml, ElectronicCte cte) {
        BigDecimal rate = cte.getIcmsRate() == null ? BigDecimal.ZERO : cte.getIcmsRate();
        xml.append("<imp><ICMS>");
        if (rate.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("<ICMS00>")
                    .append(FiscalXml.tag("CST", "00"))
                    .append(FiscalXml.tag("vBC", FiscalXml.money(cte.getIcmsBase())))
                    .append(FiscalXml.tag("pICMS", FiscalXml.qty(rate, 2)))
                    .append(FiscalXml.tag("vICMS", FiscalXml.money(cte.getIcmsValue())))
                    .append("</ICMS00>");
        } else {
            xml.append("<ICMS45>").append(FiscalXml.tag("CST", "40")).append("</ICMS45>");
        }
        xml.append("</ICMS></imp>");
    }

    private static void appendInfCTeNorm(StringBuilder xml, ElectronicCte cte) {
        xml.append("<infCTeNorm><infCarga>");
        xml.append(FiscalXml.tag("vCarga", FiscalXml.money(cte.getCargoValue())));
        xml.append(FiscalXml.tag("proPred", cte.getCargoDescription()));
        xml.append("<infQ>")
                .append(FiscalXml.tag("cUnid", "01"))
                .append(FiscalXml.tag("tpMed", "PESO BRUTO"))
                .append(FiscalXml.tag("qCarga", FiscalXml.qty(cte.getCargoWeight(), 4)))
                .append("</infQ>");
        xml.append("</infCarga>");

        // O leiaute permite omitir infDoc; quando não há documento originário
        // informado, usa-se a classe genérica "Outros" (tpDoc=99).
        xml.append("<infDoc><infOutros>")
                .append(FiscalXml.tag("tpDoc", "99"))
                .append(FiscalXml.tag("descOutros", "CONHECIMENTO DE TRANSPORTE"))
                .append(FiscalXml.tag("nDoc", cte.getNumber()))
                .append("</infOutros></infDoc>");

        String rntrc = blank(cte.getRntrc()) ? "ISENTO" : upper(cte.getRntrc());
        xml.append("<infModal versaoModal=\"").append(VERSION).append("\"><rodo>")
                .append(FiscalXml.tag("RNTRC", rntrc))
                .append("</rodo></infModal>");
        xml.append("</infCTeNorm>");
    }

    /** Evento de cancelamento do CT-e, assinado no elemento infEvento. */
    public String buildCancellationEvent(String accessKey, String protocolNumber, String reason,
                                         String environment, String issuerTaxId) {
        if (blank(accessKey) || accessKey.length() != 44) {
            throw new IllegalArgumentException("Chave de acesso do CT-e inválida para o evento de cancelamento.");
        }
        if (blank(protocolNumber)) {
            throw new IllegalArgumentException("CT-e ainda não possui protocolo de autorização.");
        }
        if (blank(reason) || reason.trim().length() < 15 || reason.trim().length() > 255) {
            throw new IllegalArgumentException("A justificativa do cancelamento deve ter entre 15 e 255 caracteres.");
        }
        String eventCode = "110111"; // evCancCTe — código oficial do evento de cancelamento
        String sequence = "1";
        String id = "ID" + eventCode + accessKey + "001";
        String dhEvento = java.time.OffsetDateTime.now(ZONE).format(XML_DATE);
        String tpAmb = "1".equals(environment) ? "1" : "2";

        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<eventoCTe xmlns=\"").append(NAMESPACE).append("\" versao=\"").append(VERSION).append("\">");
        xml.append("<infEvento Id=\"").append(id).append("\">");
        xml.append(FiscalXml.tag("cOrgao", accessKey.substring(0, 2)));
        xml.append(FiscalXml.tag("tpAmb", tpAmb));
        xml.append(taxIdTag(issuerTaxId));
        xml.append(FiscalXml.tag("chCTe", accessKey));
        xml.append(FiscalXml.tag("dhEvento", dhEvento));
        xml.append(FiscalXml.tag("tpEvento", eventCode));
        xml.append(FiscalXml.tag("nSeqEvento", sequence));
        xml.append("<detEvento versaoEvento=\"").append(VERSION).append("\">");
        xml.append("<evCancCTe>")
                .append(FiscalXml.tag("descEvento", "Cancelamento"))
                .append(FiscalXml.tag("nProt", onlyDigits(protocolNumber, 15)))
                .append(FiscalXml.tag("xJust", reason.trim()))
                .append("</evCancCTe>");
        xml.append("</detEvento></infEvento></eventoCTe>");
        return xml.toString();
    }

    private static String taxIdTag(String taxId) {
        String digits = onlyDigits(taxId, 14);
        if (digits.length() <= 11) {
            return FiscalXml.tag("CPF", CteAccessKey.leftPad(digits, 11));
        }
        return FiscalXml.tag("CNPJ", CteAccessKey.leftPad(digits, 14));
    }

    /** Solicitação de consulta à situação atual do CT-e. */
    public String buildSituationQuery(String accessKey, String environment) {
        if (blank(accessKey) || accessKey.length() != 44) {
            throw new IllegalArgumentException("Chave de acesso do CT-e inválida para consulta.");
        }
        String tpAmb = "1".equals(environment) ? "1" : "2";
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<consSitCTe xmlns=\"" + NAMESPACE + "\" versao=\"" + VERSION + "\">"
                + FiscalXml.tag("tpAmb", tpAmb)
                + FiscalXml.tag("xServ", "CONSULTAR")
                + FiscalXml.tag("chCTe", accessKey)
                + "</consSitCTe>";
    }

    private static String normalizedIe(String value) {
        return blank(value) ? "ISENTO" : value.trim();
    }

    private static String onlyDigits(String value, int max) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        return digits.length() > max ? digits.substring(digits.length() - max) : digits;
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String upper(String value) {
        return blank(value) ? "" : value.trim().toUpperCase();
    }

    private static String safe(String value) {
        return blank(value) ? "" : value.trim().toUpperCase();
    }

    private static String firstNonBlank(String first, String fallback) {
        return blank(first) ? (blank(fallback) ? "" : fallback) : first;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
