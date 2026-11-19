package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.ServiceInvoice;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Gera o XML da DPS no leiaute NFS-e Nacional v1.01, respeitando a ordem
 * exata dos elementos definida em DPS_v1.01.xsd / tiposComplexos_v1.01.xsd.
 */
@Component
public class NfseXmlBuilder {

    public static final String VERSAO = "1.01";
    public static final String VER_APLIC = "FleetManager-1.0";
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DH_EMI = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    /** Mantém o comportamento original: DPS sem o grupo opcional de IBS/CBS. */
    public String build(ServiceInvoice invoice, Company company) {
        return build(invoice, company, null);
    }

    /**
     * Gera a DPS incluindo o grupo {@code infDPS/IBSCBS} somente quando
     * {@code ibscbs != null}, na posição exigida pelo XSD (após {@code valores}).
     */
    public String build(ServiceInvoice invoice, Company company, NfseIbscbsData ibscbs) {
        required(company.getCnpj(), "Cadastre o CNPJ da empresa antes de emitir a NFS-e.");
        String cnpj = NfseDpsId.digits(company.getCnpj());
        if (cnpj.length() != 14) {
            throw new IllegalArgumentException("O CNPJ da empresa deve ter 14 dígitos.");
        }
        String municipality = firstNonBlank(invoice.getMunicipalityCode(), company.getCodigoMunicipio());
        requireMunicipality(municipality);
        if (invoice.getDpsNumber() == null || invoice.getDpsNumber() <= 0) {
            throw new IllegalArgumentException("Número da DPS não informado.");
        }
        String dpsId = firstNonBlank(invoice.getDpsId(),
                NfseDpsId.build(municipality, cnpj, invoice.getSeries(), invoice.getDpsNumber()));

        String competence = invoice.getCompetence();
        if (competence == null || competence.isBlank()) {
            throw new IllegalArgumentException("Informe a competência (AAAA-MM).");
        }
        BigDecimal gross = amount(invoice.getGrossAmount());
        if (gross.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor bruto do serviço deve ser maior que zero.");
        }
        BigDecimal deduction = amount(invoice.getDeductionAmount());
        if (deduction.compareTo(gross) > 0) {
            throw new IllegalArgumentException("A dedução não pode ser maior que o valor bruto do serviço.");
        }

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<DPS xmlns=\"").append(XmlSigner.NFSE_NAMESPACE).append("\" versao=\"").append(VERSAO).append("\">");
        xml.append("<infDPS Id=\"").append(dpsId).append("\">");

        xml.append(tag("tpAmb", environment(invoice.getEnvironment())));
        xml.append(tag("dhEmi", OffsetDateTime.now(ZONE).format(DH_EMI)));
        xml.append(tag("verAplic", VER_APLIC));
        xml.append(tag("serie", serie(invoice.getSeries())));
        xml.append(tag("nDPS", String.valueOf(invoice.getDpsNumber())));
        xml.append(tag("dCompet", competenceDate(competence)));
        xml.append(tag("tpEmit", "1"));
        xml.append(tag("cLocEmi", municipality));

        appendPrestador(xml, invoice, company, cnpj, municipality);
        appendTomador(xml, invoice);
        appendServico(xml, invoice);
        appendValores(xml, invoice, gross, deduction);
        if (ibscbs != null) {
            appendIbscbs(xml, ibscbs);
        }

        xml.append("</infDPS>");
        xml.append("</DPS>");
        return xml.toString();
    }

    private void appendPrestador(StringBuilder xml, ServiceInvoice invoice, Company company,
                                 String cnpj, String municipality) {
        xml.append("<prest>");
        xml.append(tag("CNPJ", cnpj));
        String im = firstNonBlank(invoice.getIssuerMunicipalRegistration(), company.getInscricaoMunicipal());
        if (notBlank(im)) {
            xml.append(tag("IM", im.trim()));
        }
        xml.append(tag("xNome", required(company.getName(), "Informe a razão social da empresa.")));
        xml.append("<end>");
        xml.append("<endNac>");
        xml.append(tag("cMun", municipality));
        xml.append(tag("CEP", cep(firstNonBlank(company.getZipCode(), invoice.getIssuerZip()))));
        xml.append("</endNac>");
        xml.append(tag("xLgr", logradouro(company, invoice)));
        xml.append(tag("nro", firstNonBlank(company.getEnderecoNumero(), "S/N")));
        if (notBlank(company.getEnderecoComplemento())) {
            xml.append(tag("xCpl", company.getEnderecoComplemento()));
        }
        xml.append(tag("xBairro", firstNonBlank(company.getEnderecoBairro(), "CENTRO")));
        xml.append("</end>");
        String phone = NfseDpsId.digits(firstNonBlank(invoice.getIssuerPhone(), company.getPhone()));
        if (phone.length() >= 10) {
            xml.append(tag("fone", phone));
        }
        String email = firstNonBlank(invoice.getIssuerEmail(), company.getEmail());
        if (notBlank(email)) {
            xml.append(tag("email", email));
        }
        xml.append("<regTrib>");
        xml.append(tag("opSimpNac", simpNac(invoice.getOpSimpNac(), company.getRegimeTributario())));
        xml.append(tag("regEspTrib", firstNonBlank(invoice.getRegEspTrib(), "0")));
        xml.append("</regTrib>");
        xml.append("</prest>");
    }

    private void appendTomador(StringBuilder xml, ServiceInvoice invoice) {
        if (blank(invoice.getTakerName()) && blank(invoice.getTakerTaxId())) {
            return;
        }
        String taxId = NfseDpsId.digits(invoice.getTakerTaxId());
        xml.append("<toma>");
        if (taxId.length() == 14) {
            xml.append(tag("CNPJ", taxId));
        } else if (taxId.length() == 11) {
            xml.append(tag("CPF", taxId));
        } else {
            throw new IllegalArgumentException("Informe o CNPJ (14 dígitos) ou CPF (11 dígitos) do tomador.");
        }
        if (notBlank(invoice.getTakerMunicipalRegistration())) {
            xml.append(tag("IM", invoice.getTakerMunicipalRegistration().trim()));
        }
        xml.append(tag("xNome", required(invoice.getTakerName(), "Informe o nome do tomador.")));
        String takerMunicipality = invoice.getTakerMunicipalityCode();
        String takerZip = NfseDpsId.digits(invoice.getTakerZip());
        if (notBlank(takerMunicipality) && NfseDpsId.digits(takerMunicipality).length() == 7
                && takerZip.length() == 8) {
            xml.append("<end>");
            xml.append("<endNac>");
            xml.append(tag("cMun", NfseDpsId.digits(takerMunicipality)));
            xml.append(tag("CEP", takerZip));
            xml.append("</endNac>");
            xml.append(tag("xLgr", required(invoice.getTakerAddress(), "Informe o endereço do tomador.")));
            xml.append(tag("nro", firstNonBlank(invoice.getTakerAddressNumber(), "S/N")));
            xml.append(tag("xBairro", firstNonBlank(invoice.getTakerNeighborhood(), "CENTRO")));
            xml.append("</end>");
        }
        if (notBlank(invoice.getTakerEmail())) {
            xml.append(tag("email", invoice.getTakerEmail()));
        }
        xml.append("</toma>");
    }

    private void appendServico(StringBuilder xml, ServiceInvoice invoice) {
        String location = firstNonBlank(invoice.getServiceLocationCode(), invoice.getMunicipalityCode());
        requireMunicipality(location);
        String cTribNac = NfseDpsId.digits(invoice.getServiceCode());
        if (cTribNac.length() != 6) {
            throw new IllegalArgumentException("O código de tributação nacional (cTribNac) deve ter 6 dígitos.");
        }

        xml.append("<serv>");
        xml.append("<locPrest>");
        xml.append(tag("cLocPrestacao", location));
        xml.append("</locPrest>");
        xml.append("<cServ>");
        xml.append(tag("cTribNac", cTribNac));
        if (notBlank(invoice.getMunicipalTaxCode())) {
            xml.append(tag("cTribMun", invoice.getMunicipalTaxCode().trim()));
        }
        xml.append(tag("xDescServ", required(invoice.getServiceDescription(), "Informe a descrição do serviço.")));
        String nbs = NfseDpsId.digits(invoice.getNbsCode());
        if (nbs.length() == 9) {
            xml.append(tag("cNBS", nbs));
        } else if (notBlank(invoice.getNbsCode())) {
            throw new IllegalArgumentException("O código NBS deve ter 9 dígitos.");
        }
        xml.append("</cServ>");
        String complement = complement(invoice);
        if (notBlank(complement)) {
            xml.append("<infoCompl>");
            xml.append(tag("xInfComp", complement));
            xml.append("</infoCompl>");
        }
        xml.append("</serv>");
    }

    private void appendValores(StringBuilder xml, ServiceInvoice invoice, BigDecimal gross, BigDecimal deduction) {
        xml.append("<valores>");
        xml.append("<vServPrest>");
        xml.append(tag("vServ", money(gross)));
        xml.append("</vServPrest>");
        if (deduction.compareTo(BigDecimal.ZERO) > 0) {
            xml.append("<vDedRed>");
            xml.append(tag("vDR", money(deduction)));
            xml.append("</vDedRed>");
        }
        xml.append("<trib>");
        xml.append("<tribMun>");
        xml.append(tag("tribISSQN", firstNonBlank(invoice.getIssTaxation(), "1")));
        xml.append(tag("tpRetISSQN", issWithholdingType(invoice)));
        if (invoice.getIssRate() != null && invoice.getIssRate().compareTo(BigDecimal.ZERO) > 0) {
            xml.append(tag("pAliq", rate(invoice.getIssRate())));
        }
        xml.append("</tribMun>");

        boolean hasFederal = positive(invoice.getInssAmount()) || positive(invoice.getIrrfAmount())
                || positive(invoice.getCsllAmount());
        if (hasFederal) {
            xml.append("<tribFed>");
            if (positive(invoice.getInssAmount())) {
                xml.append(tag("vRetCP", money(invoice.getInssAmount())));
            }
            if (positive(invoice.getIrrfAmount())) {
                xml.append(tag("vRetIRRF", money(invoice.getIrrfAmount())));
            }
            if (positive(invoice.getCsllAmount())) {
                xml.append(tag("vRetCSLL", money(invoice.getCsllAmount())));
            }
            xml.append("</tribFed>");
        }
        xml.append("<totTrib>");
        xml.append(tag("indTotTrib", "0"));
        xml.append("</totTrib>");
        xml.append("</trib>");
        xml.append("</valores>");
    }

    /**
     * Escreve {@code infDPS/IBSCBS} conforme {@code TCRTCInfoIBSCBS}.
     * O XSD da DPS não admite vBC/alíquotas/totais neste grupo: apenas a
     * classificação tributária (CST/cClassTrib) dentro de valores/trib/gIBSCBS.
     */
    private void appendIbscbs(StringBuilder xml, NfseIbscbsData ibscbs) {
        String finNFSe = oneOf(defaultIfBlank(ibscbs.finNFSe(), "0"), "0", "finNFSe");
        String cIndOp = digitsExact(ibscbs.cIndOp(), 6, "cIndOp");
        String indDest = oneOf(ibscbs.indDest(), "0,1", "indDest");
        String cst = digitsExact(defaultIfBlank(ibscbs.cst(), "000"), 3, "CST");
        String cClassTrib = digitsExact(defaultIfBlank(ibscbs.cClassTrib(), "000000"), 6, "cClassTrib");

        xml.append("<IBSCBS>");
        xml.append(tag("finNFSe", finNFSe));
        if (notBlank(ibscbs.indFinal())) {
            xml.append(tag("indFinal", oneOf(ibscbs.indFinal(), "0,1", "indFinal")));
        }
        xml.append(tag("cIndOp", cIndOp));
        if (notBlank(ibscbs.tpOper())) {
            xml.append(tag("tpOper", oneOf(ibscbs.tpOper(), "1,2,3,4,5", "tpOper")));
        }
        if (notBlank(ibscbs.tpEnteGov())) {
            xml.append(tag("tpEnteGov", oneOf(ibscbs.tpEnteGov(), "1,2,3,4", "tpEnteGov")));
        }
        xml.append(tag("indDest", indDest));
        xml.append("<valores>");
        xml.append("<trib>");
        xml.append("<gIBSCBS>");
        xml.append(tag("CST", cst));
        xml.append(tag("cClassTrib", cClassTrib));
        if (notBlank(ibscbs.cCredPres())) {
            xml.append(tag("cCredPres", digitsExact(ibscbs.cCredPres(), 2, "cCredPres")));
        }
        xml.append("</gIBSCBS>");
        xml.append("</trib>");
        xml.append("</valores>");
        xml.append("</IBSCBS>");
    }

    private static String oneOf(String value, String allowed, String label) {
        if (blank(value)) {
            throw new IllegalArgumentException("Informe " + label + " nos dados de IBS/CBS.");
        }
        String trimmed = value.trim();
        for (String option : allowed.split(",")) {
            if (option.equals(trimmed)) {
                return trimmed;
            }
        }
        throw new IllegalArgumentException(label + " inválido: " + trimmed + ". Use " + allowed + ".");
    }

    private static String digitsExact(String value, int length, String label) {
        String digits = NfseDpsId.digits(value);
        if (digits.length() != length) {
            throw new IllegalArgumentException(label + " deve ter " + length + " dígitos.");
        }
        return digits;
    }

    private static String defaultIfBlank(String value, String fallback) {
        return blank(value) ? fallback : value.trim();
    }

    private static String complement(ServiceInvoice invoice) {
        StringBuilder text = new StringBuilder();
        if (notBlank(invoice.getDiscrimination())) {
            text.append(invoice.getDiscrimination().trim());
        }
        if (notBlank(invoice.getNotes())) {
            if (!text.isEmpty()) {
                text.append('\n');
            }
            text.append(invoice.getNotes().trim());
        }
        if (text.length() > 2000) {
            return text.substring(0, 2000);
        }
        return text.toString();
    }

    private static String issWithholdingType(ServiceInvoice invoice) {
        if (notBlank(invoice.getIssWithholdingType())) {
            return invoice.getIssWithholdingType().trim();
        }
        return invoice.isIssWithheld() ? "2" : "1";
    }

    private static String simpNac(String invoiceValue, String companyValue) {
        String value = firstNonBlank(invoiceValue, companyValue, "1");
        return switch (value) {
            case "1", "2", "3" -> value;
            default -> throw new IllegalArgumentException(
                    "Situação perante o Simples Nacional inválida: use 1 (não optante), 2 (MEI) ou 3 (ME/EPP).");
        };
    }

    private static String environment(String value) {
        return "1".equals(value) ? "1" : "2";
    }

    private static String serie(String value) {
        String digits = NfseDpsId.digits(value);
        return digits.isBlank() ? "1" : digits;
    }

    private static String competenceDate(String value) {
        return NfseDpsId.competenceDate(value).toString();
    }

    private static String cep(String value) {
        String digits = NfseDpsId.digits(value);
        if (digits.length() != 8) {
            throw new IllegalArgumentException("O CEP do prestador deve ter 8 dígitos.");
        }
        return digits;
    }

    private static String logradouro(Company company, ServiceInvoice invoice) {
        if (notBlank(company.getEnderecoRua())) {
            return company.getEnderecoRua().trim();
        }
        if (notBlank(company.getAddress())) {
            return company.getAddress().trim();
        }
        if (notBlank(invoice.getIssuerAddress())) {
            return invoice.getIssuerAddress().trim();
        }
        throw new IllegalArgumentException("Cadastre o endereço da empresa (logradouro) antes de emitir a NFS-e.");
    }

    private static void requireMunicipality(String value) {
        if (NfseDpsId.digits(value).length() != 7) {
            throw new IllegalArgumentException(
                    "Informe o código IBGE do município (7 dígitos) nos dados fiscais da empresa.");
        }
    }

    private static boolean positive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private static String money(BigDecimal value) {
        return amount(value).toPlainString();
    }

    private static BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static String rate(BigDecimal value) {
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        if (scaled.compareTo(new BigDecimal("10")) >= 0) {
            throw new IllegalArgumentException("A alíquota do ISS deve ser menor que 10%.");
        }
        return scaled.toPlainString();
    }

    private static String tag(String name, String value) {
        return "<" + name + ">" + FiscalXml.esc(value) + "</" + name + ">";
    }

    private static String required(String value, String message) {
        if (blank(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (notBlank(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
