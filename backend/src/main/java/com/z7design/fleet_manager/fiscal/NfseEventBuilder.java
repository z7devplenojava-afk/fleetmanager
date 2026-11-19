package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseCancelRequest;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Construtor do pedido de registro de eventos da NFS-e Nacional v1.01.
 *
 * <p>Gera o documento completo {@code evento}, contendo {@code infEvento} e,
 * aninhado, {@code pedRegEvento/infPedReg/e101101}. O chamador deve assinar o
 * elemento {@code infEvento} com
 * {@code XmlSigner.signElement(xml, XmlSigner.NFSE_NAMESPACE, "infEvento", "Id", material)}
 * e validar com {@code FiscalXmlValidator} antes de enviar à SEFIN.</p>
 */
public final class NfseEventBuilder {

    public static final String VERSAO = NfseXmlBuilder.VERSAO;
    public static final String VER_APLIC = NfseXmlBuilder.VER_APLIC;
    public static final String CODIGO_EVENTO_CANCELAMENTO = "101101";
    public static final String X_DESC_CANCELAMENTO = "Cancelamento de NFS-e";
    private static final String SEQ_EVENTO_UNICO = "001";
    private static final String AMBIENTE_GERADOR_SEFIN = "2";
    private static final DateTimeFormatter DH_UTC =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssxxx");

    public NfseEventBuilder() {
    }

    /** nDFSe padrão = "1" (sequencial do documento no ambiente gerador). */
    public static String buildCancelamento(String chNFSe, String cnpjAutor, String environment,
                                           String reasonCode, String justification) {
        return buildCancelamento(chNFSe, cnpjAutor, environment, reasonCode, justification, "1");
    }

    /** Conveniência para uso direto com o DTO recebido pelo controller. */
    public static String buildCancelamento(String chNFSe, String cnpjAutor, String environment,
                                           NfseCancelRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Informe os dados do cancelamento.");
        }
        return buildCancelamento(chNFSe, cnpjAutor, environment,
                request.reasonCode(), request.justification(), "1");
    }

    /**
     * Gera o XML completo do evento de cancelamento (e101101), ainda sem assinatura.
     *
     * @param chNFSe       chave da NFS-e (50 dígitos)
     * @param cnpjAutor    CNPJ do autor do evento (14 dígitos)
     * @param environment  "1" produção, "2" homologação (padrão quando em branco)
     * @param reasonCode   "1", "2" ou "9"
     * @param justification justificativa com 15 a 255 caracteres
     * @param nDFSe        sequencial do documento (1 a 13 dígitos)
     */
    public static String buildCancelamento(String chNFSe, String cnpjAutor, String environment,
                                           String reasonCode, String justification, String nDFSe) {
        String chave = digitsExact(chNFSe, 50, "chNFSe");
        String cnpj = digitsExact(cnpjAutor, 14, "CNPJAutor");
        String tpAmb = oneOf(environment == null || environment.isBlank() ? "2" : environment,
                "1,2", "tpAmb");
        String cMotivo = oneOf(reasonCode, "1,2,9", "cMotivo");
        String xMotivo = requireJustification(justification);
        String sequencial = digitsRange(nDFSe == null || nDFSe.isBlank() ? "1" : nDFSe,
                1, 13, "nDFSe");

        String pedRegId = "PRE" + chave + CODIGO_EVENTO_CANCELAMENTO;
        String eventoId = "EVT" + chave + CODIGO_EVENTO_CANCELAMENTO + SEQ_EVENTO_UNICO;
        String dhEvento = OffsetDateTime.now(ZoneOffset.UTC).format(DH_UTC);

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<evento xmlns=\"").append(XmlSigner.NFSE_NAMESPACE)
                .append("\" versao=\"").append(VERSAO).append("\">");
        xml.append("<infEvento Id=\"").append(eventoId).append("\">");
        xml.append(FiscalXml.tag("verAplic", VER_APLIC));
        xml.append(FiscalXml.tag("ambGer", AMBIENTE_GERADOR_SEFIN));
        xml.append(FiscalXml.tag("nSeqEvento", SEQ_EVENTO_UNICO));
        xml.append(FiscalXml.tag("dhProc", dhEvento));
        xml.append(FiscalXml.tag("nDFSe", sequencial));
        xml.append("<pedRegEvento versao=\"").append(VERSAO).append("\">");
        xml.append("<infPedReg Id=\"").append(pedRegId).append("\">");
        xml.append(FiscalXml.tag("tpAmb", tpAmb));
        xml.append(FiscalXml.tag("verAplic", VER_APLIC));
        xml.append(FiscalXml.tag("dhEvento", dhEvento));
        xml.append(FiscalXml.tag("CNPJAutor", cnpj));
        xml.append(FiscalXml.tag("chNFSe", chave));
        xml.append("<e101101>");
        xml.append(FiscalXml.tag("xDesc", X_DESC_CANCELAMENTO));
        xml.append(FiscalXml.tag("cMotivo", cMotivo));
        xml.append(FiscalXml.tag("xMotivo", xMotivo));
        xml.append("</e101101>");
        xml.append("</infPedReg>");
        xml.append("</pedRegEvento>");
        xml.append("</infEvento>");
        xml.append("</evento>");
        return xml.toString();
    }

    /**
     * Extrai o subtree {@code pedRegEvento} para validação standalone contra
     * {@code pedRegEvento_v1.01.xsd} antes de assinar o evento.
     */
    public static String extractPedRegEvento(String eventoXml) {
        if (eventoXml == null || eventoXml.isBlank()) {
            throw new IllegalArgumentException("XML do evento vazio.");
        }
        int start = eventoXml.indexOf("<pedRegEvento");
        int end = eventoXml.indexOf("</pedRegEvento>", start);
        if (start < 0 || end < 0) {
            throw new IllegalArgumentException("Elemento pedRegEvento não encontrado no XML do evento.");
        }
        String fragment = eventoXml.substring(start, end + "</pedRegEvento>".length());
        if (!fragment.contains("xmlns=")) {
            fragment = fragment.replaceFirst("<pedRegEvento",
                    "<pedRegEvento xmlns=\"" + XmlSigner.NFSE_NAMESPACE + "\"");
        }
        return fragment;
    }

    private static String requireJustification(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Informe a justificativa do cancelamento.");
        }
        String trimmed = value.trim();
        if (trimmed.length() < 15 || trimmed.length() > 255) {
            throw new IllegalArgumentException("A justificativa do cancelamento deve ter entre 15 e 255 caracteres.");
        }
        return trimmed;
    }

    private static String oneOf(String value, String allowed, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Informe " + label + " do evento.");
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

    private static String digitsRange(String value, int min, int max, String label) {
        String digits = NfseDpsId.digits(value);
        if (digits.length() < min || digits.length() > max) {
            throw new IllegalArgumentException(label + " deve ter entre " + min + " e " + max + " dígitos.");
        }
        return digits;
    }
}
