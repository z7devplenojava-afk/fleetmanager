package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cliente SOAP dos WebServices de CT-e da SEFAZ (recepção, consulta e eventos),
 * com autenticação mTLS por certificado A1.
 *
 * <p>A URL nunca é inventada: ela deve ser configurada por UF/ambiente. Se
 * não houver configuração, o cliente falha rápido com mensagem explícita.</p>
 */
@Component
@Slf4j
public class CteSefazClient {

    private static final String NS = CteXmlBuilder.NAMESPACE;
    private static final String ACTION_BASE = "http://www.portalfiscal.inf.br/cte/wsdl/";

    private final SefazSoapClient transport;
    private final String environment;
    private final String homologationUrl;
    private final String productionUrl;
    private final String soapAction;
    private final Duration timeout;

    public CteSefazClient(
            SefazSoapClient transport,
            @Value("${fiscal.cte.environment:}") String environment,
            @Value("${fiscal.cte.sefaz-url-homologacao:}") String homologationUrl,
            @Value("${fiscal.cte.sefaz-url-producao:}") String productionUrl,
            @Value("${fiscal.cte.timeout-seconds:90}") long timeoutSeconds,
            @Value("${fiscal.cte.soap-action:}") String soapAction) {
        this.transport = transport;
        this.environment = "1".equals(trim(environment)) ? "1" : "2";
        this.homologationUrl = trim(homologationUrl);
        this.productionUrl = trim(productionUrl);
        this.soapAction = trim(soapAction);
        this.timeout = Duration.ofSeconds(timeoutSeconds <= 0 ? 90 : timeoutSeconds);
    }

    /** Ambiente efetivo: 1 = produção, 2 = homologação (padrão). */
    public String environment() {
        return environment;
    }

    /** Endpoint configurado para o ambiente atual (fail-fast se vazio). */
    public String endpoint() {
        String url = "1".equals(environment) ? productionUrl : homologationUrl;
        if (url == null || url.isBlank()) {
            String property = "1".equals(environment)
                    ? "fiscal.cte.sefaz-url-producao"
                    : "fiscal.cte.sefaz-url-homologacao";
            throw new IllegalStateException(
                    "WebService da SEFAZ não configurado para o ambiente "
                            + ("1".equals(environment) ? "de produção" : "de homologação")
                            + ". Configure a propriedade " + property
                            + " com a URL do serviço da UF do emitente (ex.: SVRS/SVAN/SVC). "
                            + "A emissão foi interrompida para não transmitir para um endereço inventado.");
        }
        return url;
    }

    public SefazSoapClient.SoapResponse recepcao(String signedXml, FiscalCertificateMaterial material) {
        String body = "<cteDadosMsg xmlns=\"" + NS + "\">"
                + "<enviCTe versao=\"" + CteXmlBuilder.VERSION + "\" xmlns=\"" + NS + "\">"
                + "<idLote>1</idLote>" + signedXml + "</enviCTe></cteDadosMsg>";
        return send(body, action("CTeRecepcaoV4"), material);
    }

    public SefazSoapClient.SoapResponse consultaSituacao(String chave, FiscalCertificateMaterial material) {
        String query = new CteXmlBuilder().buildSituationQuery(chave, environment);
        String body = "<cteDadosMsg xmlns=\"" + NS + "\">" + query + "</cteDadosMsg>";
        return send(body, action("CTeConsultaV4"), material);
    }

    public SefazSoapClient.SoapResponse cancelamento(String signedEventXml, FiscalCertificateMaterial material) {
        String body = "<cteDadosMsg xmlns=\"" + NS + "\">" + signedEventXml + "</cteDadosMsg>";
        return send(body, action("CTeRecepcaoEventoV4"), material);
    }

    private SefazSoapClient.SoapResponse send(String body, String action, FiscalCertificateMaterial material) {
        String url = endpoint();
        log.info("Enviando CT-e SOAP para {}", url);
        return transport.send(url, action, SefazSoapClient.envelope(body), material, timeout, true);
    }

    private String action(String service) {
        if (!soapAction.isBlank()) {
            return soapAction;
        }
        return ACTION_BASE + service + "/cteDadosMsg";
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
