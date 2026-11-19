package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.model.ElectronicNfe;
import com.z7design.fleet_manager.model.ElectronicNfeItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Gera o XML da NF-e modelo 55 (versão 4.00) no padrão da SEFAZ.
 *
 * <p>A ordem dos elementos segue rigorosamente o leiaute oficial (leiauteNFe_v4.00.xsd).
 * O XML gerado não contém assinatura: a assinatura é aplicada por
 * {@link XmlSigner#signElement(String, String, String, String, FiscalCertificateMaterial)}
 * antes da validação e do envio.</p>
 */
@Component
public class NfeXmlBuilder {

    public static final String NFE_NAMESPACE = "http://www.portalfiscal.inf.br/nfe";
    public static final String VERSION = "4.00";

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter XML_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    public String build(ElectronicNfe nfe) {
        if (nfe == null) {
            throw new IllegalArgumentException("Dados da NF-e não informados.");
        }
        String key = required(nfe.getAccessKey(), "Chave de acesso da NF-e não informada.");
        if (key.length() != 44 || !key.matches("\\d{44}")) {
            throw new IllegalArgumentException("A chave de acesso da NF-e deve ter 44 dígitos.");
        }
        String cUf = key.substring(0, 2);
        String cNF = key.substring(35, 43);
        String cDv = key.substring(43, 44);

        String environment = nvl(nfe.getEnvironment(), "2");
        List<ElectronicNfeItem> items = nfe.getItems() == null ? List.of() : nfe.getItems();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("A NF-e precisa ter ao menos um item.");
        }

        BigDecimal totalProducts = BigDecimal.ZERO;
        BigDecimal totalIcms = BigDecimal.ZERO;
        BigDecimal totalPis = BigDecimal.ZERO;
        BigDecimal totalCofins = BigDecimal.ZERO;

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<NFe xmlns=\"").append(NFE_NAMESPACE).append("\">");
        xml.append("<infNFe versao=\"").append(VERSION).append("\" Id=\"NFe").append(key).append("\">");

        // ===== B09 — identificação =====
        xml.append("<ide>");
        xml.append(tag("cUF", cUf));
        xml.append(tag("cNF", cNF));
        xml.append(tag("natOp", cut(nfe.getNatureOperation(), 60, " natureza da operação ")));
        xml.append(tag("mod", "55"));
        xml.append(tag("serie", digits(nfe.getSeries(), 3)));
        xml.append(tag("nNF", digits(nfe.getNumber(), 9)));
        xml.append(tag("dhEmi", nfe.getEmissionDate() == null
                ? XML_DATE.format(java.time.LocalDateTime.now(ZONE))
                : XML_DATE.format(nfe.getEmissionDate().atZone(ZONE))));
        xml.append(tag("tpNF", allowed(nvl(nfe.getTpNf(), "1"), "0", "1")));
        xml.append(tag("idDest", allowed(nvl(nfe.getIdDest(), "1"), "1", "2", "3")));
        xml.append(tag("cMunFG", sevenDigits(nfe.getIssuerMunicipalityCode(), "código IBGE do município do emitente")));
        xml.append(tag("tpImp", allowed(nvl(nfe.getTpImp(), "1"), "1", "2", "3", "4", "5", "6")));
        xml.append(tag("tpEmis", allowed(nvl(nfe.getTpEmis(), "1"), "1", "2", "3", "4", "5", "6", "7", "9")));
        xml.append(tag("cDV", cDv));
        xml.append(tag("tpAmb", allowed(environment, "1", "2")));
        xml.append(tag("finNFe", allowed(nvl(nfe.getFinNfe(), "1"), "1", "2", "3", "4", "5", "6")));
        xml.append(tag("indFinal", allowed(nvl(nfe.getIndFinal(), "1"), "0", "1")));
        xml.append(tag("indPres", allowed(nvl(nfe.getIndPres(), "1"), "0", "1", "2", "3", "4", "5", "9")));
        xml.append(tag("procEmi", allowed(nvl(nfe.getProcEmi(), "0"), "0", "1", "2", "3", "4")));
        xml.append(tag("verProc", cut(nvl(nfe.getVerProc(), "FleetManager"), 20, "FleetManager")));
        xml.append("</ide>");

        // ===== C01 — emitente =====
        xml.append("<emit>");
        xml.append(partyTax(nfe.getIssuerTaxId(), true));
        xml.append(tag("xNome", cut(required(nfe.getIssuerName(), "Razão social do emitente não informada."), 60, "emitente")));
        xml.append("<enderEmit>");
        xml.append(tag("xLgr", cut(defaultText(nfe.getIssuerAddress(), "NAO INFORMADO"), 60, "logradouro")));
        xml.append(tag("nro", cut(defaultText(nfe.getIssuerAddressNumber(), "S/N"), 60, "número")));
        xml.append(tag("xBairro", cut(defaultText(nfe.getIssuerNeighborhood(), "CENTRO"), 60, "bairro")));
        xml.append(tag("cMun", sevenDigits(nfe.getIssuerMunicipalityCode(), "código IBGE do município do emitente")));
        xml.append(tag("xMun", cut(defaultText(nfe.getIssuerCity(), "NAO INFORMADO"), 60, "município")));
        xml.append(tag("UF", upper2(nfe.getIssuerState())));
        xml.append(tag("CEP", eightDigits(nfe.getIssuerZip(), "CEP do emitente")));
        String issuerPhone = digits(nfe.getIssuerPhone(), 14);
        if (!issuerPhone.isBlank()) {
            xml.append(tag("fone", issuerPhone));
        }
        xml.append("</enderEmit>");
        String ie = digits(nfe.getIssuerStateRegistration(), 14);
        if (!ie.isBlank()) {
            xml.append(tag("IE", ie));
        }
        xml.append(tag("CRT", allowed(nvl(nfe.getIssuerCrt(), "3"), "1", "2", "3", "4")));
        xml.append("</emit>");

        // ===== E01 — destinatário =====
        if (nfe.getRecipientTaxId() != null && !nfe.getRecipientTaxId().isBlank()) {
            xml.append("<dest>");
            xml.append(partyTax(nfe.getRecipientTaxId(), false));
            if (nfe.getRecipientName() != null && !nfe.getRecipientName().isBlank()) {
                xml.append(tag("xNome", cut(nfe.getRecipientName(), 60, "destinatário")));
            }
            if (nfe.getRecipientAddress() != null && !nfe.getRecipientAddress().isBlank()) {
                xml.append("<enderDest>");
                xml.append(tag("xLgr", cut(nfe.getRecipientAddress(), 60, "logradouro do destinatário")));
                xml.append(tag("nro", cut(defaultText(nfe.getRecipientAddressNumber(), "S/N"), 60, "número")));
                xml.append(tag("xBairro", cut(defaultText(nfe.getRecipientNeighborhood(), "CENTRO"), 60, "bairro")));
                xml.append(tag("cMun", sevenDigits(nfe.getRecipientMunicipalityCode(),
                        "código IBGE do município do destinatário")));
                xml.append(tag("xMun", cut(defaultText(nfe.getRecipientCity(), "NAO INFORMADO"), 60, "município")));
                xml.append(tag("UF", upper2(nfe.getRecipientState())));
                String recipientZip = digits(nfe.getRecipientZip(), 8);
                if (recipientZip.length() == 8) {
                    xml.append(tag("CEP", recipientZip));
                }
                xml.append("</enderDest>");
            }
            String indIeDest = allowed(nvl(nfe.getRecipientIndIeDest(), "9"), "1", "2", "9");
            xml.append(tag("indIEDest", indIeDest));
            String recipientIe = digits(nfe.getRecipientStateRegistration(), 14);
            if ("1".equals(indIeDest) && recipientIe.length() < 2) {
                throw new IllegalArgumentException(
                        "Informe a inscrição estadual do destinatário quando indIEDest = 1 (contribuinte).");
            }
            if (recipientIe.length() >= 2) {
                xml.append(tag("IE", recipientIe));
            }
            if (nfe.getRecipientEmail() != null && !nfe.getRecipientEmail().isBlank()) {
                xml.append(tag("email", cut(nfe.getRecipientEmail(), 60, "e-mail do destinatário")));
            }
            xml.append("</dest>");
        }

        // ===== D01 — detalhamento dos produtos/serviços =====
        int itemNumber = 0;
        for (ElectronicNfeItem item : items) {
            itemNumber++;
            String code = cut(required(item.getCode(), "Código do produto não informado."), 60, "código do produto");
            String description = cut(required(item.getDescription(), "Descrição do produto não informada."), 120, "descrição");
            String ncm = digits(item.getNcm(), 8);
            if (ncm.length() != 2 && ncm.length() != 8) {
                throw new IllegalArgumentException("O NCM deve ter 2 ou 8 dígitos (item " + itemNumber + ").");
            }
            String cfop = digits(item.getCfop(), 4);
            if (!cfop.matches("[123567][0-9]{3}")) {
                throw new IllegalArgumentException("CFOP inválido no item " + itemNumber + ": " + item.getCfop());
            }
            BigDecimal quantity = decimal(item.getQuantity(), 4);
            BigDecimal unitValue = decimal(item.getUnitValue(), 10);
            BigDecimal total = decimal(item.getTotalValue(), 2);
            totalProducts = totalProducts.add(total);

            xml.append("<det nItem=\"").append(itemNumber).append("\">");
            xml.append("<prod>");
            xml.append(tag("cProd", code));
            xml.append(tag("cEAN", "SEM GTIN"));
            xml.append(tag("xProd", description));
            xml.append(tag("NCM", ncm));
            xml.append(tag("CFOP", cfop));
            xml.append(tag("uCom", cut(defaultText(item.getUnit(), "UN"), 6, "unidade")));
            xml.append(tag("qCom", qty(quantity, 4)));
            xml.append(tag("vUnCom", qty(unitValue, 10)));
            xml.append(tag("vProd", money(total)));
            xml.append(tag("cEANTrib", "SEM GTIN"));
            xml.append(tag("uTrib", cut(defaultText(item.getUnit(), "UN"), 6, "unidade")));
            xml.append(tag("qTrib", qty(quantity, 4)));
            xml.append(tag("vUnTrib", qty(unitValue, 10)));
            xml.append(tag("indTot", "1"));
            xml.append("</prod>");

            BigDecimal icmsBase = decimal(item.getIcmsBase(), 2);
            BigDecimal icmsRate = decimal(item.getIcmsRate(), 4);
            BigDecimal icmsValue = decimal(item.getIcmsValue(), 2);
            BigDecimal pisBase = decimal(item.getPisBase(), 2);
            BigDecimal pisRate = decimal(item.getPisRate(), 4);
            BigDecimal pisValue = decimal(item.getPisValue(), 2);
            BigDecimal cofinsBase = decimal(item.getCofinsBase(), 2);
            BigDecimal cofinsRate = decimal(item.getCofinsRate(), 4);
            BigDecimal cofinsValue = decimal(item.getCofinsValue(), 2);
            totalIcms = totalIcms.add(icmsValue);
            totalPis = totalPis.add(pisValue);
            totalCofins = totalCofins.add(cofinsValue);

            xml.append("<imposto>");
            xml.append("<ICMS>").append(icmsXml(item, icmsBase, icmsRate, icmsValue, itemNumber)).append("</ICMS>");
            xml.append("<PIS>");
            xml.append("<PISAliq>");
            xml.append(tag("CST", allowed(nvl(item.getPisCst(), "01"), "01", "02")));
            xml.append(tag("vBC", money(pisBase)));
            xml.append(tag("pPIS", rate(pisRate)));
            xml.append(tag("vPIS", money(pisValue)));
            xml.append("</PISAliq>");
            xml.append("</PIS>");
            xml.append("<COFINS>");
            xml.append("<COFINSAliq>");
            xml.append(tag("CST", allowed(nvl(item.getCofinsCst(), "01"), "01", "02")));
            xml.append(tag("vBC", money(cofinsBase)));
            xml.append(tag("pCOFINS", rate(cofinsRate)));
            xml.append(tag("vCOFINS", money(cofinsValue)));
            xml.append("</COFINSAliq>");
            xml.append("</COFINS>");
            xml.append("</imposto>");
            xml.append("</det>");
        }

        // ===== W01 — totais =====
        BigDecimal totalNf = totalProducts
                .subtract(BigDecimal.ZERO) // descontos/frete/seguro não são informados neste leiaute simplificado
                .setScale(2, RoundingMode.HALF_UP);
        xml.append("<total><ICMSTot>");
        xml.append(tag("vBC", money(totalIcmsBase(items))));
        xml.append(tag("vICMS", money(totalIcms)));
        xml.append(tag("vICMSDeson", money(BigDecimal.ZERO)));
        xml.append(tag("vFCP", money(BigDecimal.ZERO)));
        xml.append(tag("vBCST", money(BigDecimal.ZERO)));
        xml.append(tag("vST", money(BigDecimal.ZERO)));
        xml.append(tag("vFCPST", money(BigDecimal.ZERO)));
        xml.append(tag("vFCPSTRet", money(BigDecimal.ZERO)));
        xml.append(tag("vProd", money(totalProducts)));
        xml.append(tag("vFrete", money(BigDecimal.ZERO)));
        xml.append(tag("vSeg", money(BigDecimal.ZERO)));
        xml.append(tag("vDesc", money(BigDecimal.ZERO)));
        xml.append(tag("vII", money(BigDecimal.ZERO)));
        xml.append(tag("vIPI", money(BigDecimal.ZERO)));
        xml.append(tag("vIPIDevol", money(BigDecimal.ZERO)));
        xml.append(tag("vPIS", money(totalPis)));
        xml.append(tag("vCOFINS", money(totalCofins)));
        xml.append(tag("vOutro", money(BigDecimal.ZERO)));
        xml.append(tag("vNF", money(totalNf)));
        xml.append("</ICMSTot></total>");

        // ===== X01 — transporte =====
        xml.append("<transp>");
        xml.append(tag("modFrete", allowed(nvl(nfe.getFreightModality(), "9"), "0", "1", "2", "3", "4", "9")));
        xml.append("</transp>");

        // ===== Y01 — pagamento =====
        String tPag = allowed(nvl(nfe.getPaymentType(), "15"), "01", "02", "03", "04", "05", "10", "11", "12",
                "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "90", "99");
        xml.append("<pag><detPag>");
        xml.append(tag("indPag", allowed(nvl(nfe.getPaymentInd(), "0"), "0", "1")));
        xml.append(tag("tPag", tPag));
        xml.append(tag("vPag", money(totalNf)));
        xml.append("</detPag></pag>");

        if (notBlank(nfe.getNotes())) {
            xml.append("<infAdic>").append(tag("infCpl", cut(nfe.getNotes(), 5000, "observações")))
                    .append("</infAdic>");
        }

        // ===== Responsável técnico (opcional) =====
        if (notBlank(nfe.getRespTechCnpj()) && notBlank(nfe.getRespTechContact())
                && notBlank(nfe.getRespTechEmail()) && notBlank(nfe.getRespTechPhone())) {
            xml.append("<infRespTec>");
            xml.append(tag("CNPJ", digits(nfe.getRespTechCnpj(), 14)));
            xml.append(tag("xContato", cut(nfe.getRespTechContact(), 60, "responsável técnico")));
            xml.append(tag("email", cut(nfe.getRespTechEmail(), 60, "e-mail do responsável técnico")));
            xml.append(tag("fone", digits(nfe.getRespTechPhone(), 14)));
            xml.append("</infRespTec>");
        }

        xml.append("</infNFe></NFe>");
        return xml.toString();
    }

    /** XML do evento de cancelamento da NF-e (tpEvento 111111), sem assinatura. */
    public String buildCancellationEvent(ElectronicNfe nfe, String justificativa, int sequence) {
        String key = required(nfe.getAccessKey(), "Chave de acesso da NF-e não informada.");
        String justification = required(justificativa, "Informe a justificativa do cancelamento (mínimo 15 caracteres).")
                .trim();
        if (justification.length() < 15 || justification.length() > 255) {
            throw new IllegalArgumentException("A justificativa do cancelamento deve ter entre 15 e 255 caracteres.");
        }
        String environment = nvl(nfe.getEnvironment(), "2");
        String eventId = "EV" + key + "111111" + String.format("%02d", sequence);
        String dhEvento = XML_DATE.format(java.time.LocalDateTime.now(ZONE));

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<evento versao=\"1.00\" xmlns=\"").append(NFE_NAMESPACE).append("\">");
        xml.append("<infEvento Id=\"").append(eventId).append("\">");
        xml.append(tag("cOrgao", NfeAccessKey.ufCode(nfe.getIssuerState())));
        xml.append(tag("tpAmb", allowed(environment, "1", "2")));
        xml.append(partyTax(nfe.getIssuerTaxId(), true));
        xml.append(tag("chNFe", key));
        xml.append(tag("dhEvento", dhEvento));
        xml.append(tag("tpEvento", "111111"));
        xml.append(tag("nSeqEvento", String.format("%02d", sequence)));
        xml.append(tag("verEvento", "1.00"));
        xml.append("<detEvento versao=\"1.00\">");
        xml.append(tag("descEvento", "Cancelamento"));
        xml.append(tag("xJust", justification));
        xml.append("</detEvento>");
        xml.append("</infEvento>");
        xml.append("</evento>");
        return xml.toString();
    }

    private static String icmsXml(ElectronicNfeItem item, BigDecimal base, BigDecimal rate,
                                  BigDecimal value, int itemNumber) {
        String cst = nvl(item.getIcmsCst(), "00");
        String orig = allowed(nvl(item.getIcmsOrig(), "0"), "0", "1", "2");
        if ("00".equals(cst)) {
            return "<ICMS00>"
                    + tag("orig", orig)
                    + tag("CST", "00")
                    + tag("modBC", "3")
                    + tag("vBC", money(base))
                    + tag("pICMS", rate(rate))
                    + tag("vICMS", money(value))
                    + "</ICMS00>";
        }
        if ("40".equals(cst) || "41".equals(cst) || "50".equals(cst)) {
            return "<ICMS40>" + tag("orig", orig) + tag("CST", cst) + "</ICMS40>";
        }
        if ("101".equals(cst)) {
            return "<ICMSSN101>" + tag("orig", orig) + tag("CSOSN", "101")
                    + tag("pCredSN", rate(rate)) + tag("vCredICMSSN", money(value)) + "</ICMSSN101>";
        }
        if ("102".equals(cst) || "103".equals(cst) || "300".equals(cst) || "400".equals(cst)) {
            return "<ICMSSN102>" + tag("orig", orig) + tag("CSOSN", cst) + "</ICMSSN102>";
        }
        throw new IllegalArgumentException(
                "CST/CSOSN de ICMS não suportado no item " + itemNumber + ": " + cst
                        + ". Use 00, 40, 41, 50 ou os CSOSN 101/102/103/300/400.");
    }

    private static BigDecimal totalIcmsBase(List<ElectronicNfeItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (ElectronicNfeItem item : items) {
            total = total.add(decimal(item.getIcmsBase(), 2));
        }
        return total;
    }

    /** CNPJ para pessoa jurídica, CPF para pessoa física (11 dígitos). */
    private static String partyTax(String taxId, boolean required) {
        String digits = digits(taxId, 14);
        if (required && digits.length() != 14) {
            throw new IllegalArgumentException("Informe o CNPJ do emitente com 14 dígitos.");
        }
        if (digits.length() == 11) {
            return tag("CPF", digits);
        }
        if (digits.length() != 14) {
            throw new IllegalArgumentException("Informe o CPF (11) ou CNPJ (14) do destinatário.");
        }
        return tag("CNPJ", digits);
    }

    private static String tag(String name, String value) {
        return FiscalXml.tag(name, value);
    }

    private static String money(BigDecimal value) {
        return FiscalXml.money(value);
    }

    private static BigDecimal decimal(BigDecimal value, int scale) {
        return (value == null ? BigDecimal.ZERO : value).setScale(scale, RoundingMode.HALF_UP);
    }

    private static String qty(BigDecimal value, int scale) {
        return FiscalXml.qty(value, scale);
    }

    /** pICMS/pPIS/pCOFINS: de 2 a 4 casas decimais (TDec_0302a04). */
    private static String rate(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(4, RoundingMode.HALF_UP).toPlainString();
    }

    private static String allowed(String value, String... options) {
        for (String option : options) {
            if (option.equals(value)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Valor inválido para campo do leiaute NF-e: " + value
                + ". Permitidos: " + String.join(", ", options) + ".");
    }

    private static String sevenDigits(String value, String field) {
        String digits = digits(value, 7);
        if (digits.length() != 7) {
            throw new IllegalArgumentException("Informe " + field + " com 7 dígitos.");
        }
        return digits;
    }

    private static String eightDigits(String value, String field) {
        String digits = digits(value, 8);
        if (digits.length() != 8) {
            throw new IllegalArgumentException("Informe " + field + " com 8 dígitos.");
        }
        return digits;
    }

    private static String upper2(String value) {
        String text = value == null ? "" : value.trim().toUpperCase();
        if (!text.matches("[A-Z]{2}")) {
            throw new IllegalArgumentException("Informe a UF com 2 letras.");
        }
        return text;
    }

    private static String digits(String value, int max) {
        return NfeAccessKey.digits(value, max);
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static String defaultText(String value, String fallback) {
        return notBlank(value) ? value.trim() : fallback;
    }

    private static String cut(String value, int max, String field) {
        String text = value == null ? "" : value.trim();
        if (text.length() > max) {
            return text.substring(0, max);
        }
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Campo obrigatório da NF-e não informado: " + field + ".");
        }
        return text;
    }

    private static String nvl(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
