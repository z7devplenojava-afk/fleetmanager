package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cliente SOAP dos WebServices da NF-e 4.00 (SEFAZ) com mTLS por certificado A1.
 *
 * <p>As URLs dependem da UF e do ambiente (SVRS, SVAN, SVC-AN, SEFAZ própria etc.) e
 * devem ser configuradas explicitamente. Quando vazias, qualquer envio falha com
 * mensagem orientando a configuração — não existe endpoint padrão seguro.</p>
 */
@Component
@Slf4j
public class NfeSefazClient {

    public static final String WSDL_AUTORIZACAO = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4";
    public static final String WSDL_CONSULTA = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4";
    public static final String WSDL_EVENTO = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4";

    private static final String ACTION_AUTORIZACAO = WSDL_AUTORIZACAO + "/nfeAutorizacaoLote";
    private static final String ACTION_CONSULTA = WSDL_CONSULTA + "/nfeConsultaNF";
    private static final String ACTION_EVENTO = WSDL_EVENTO + "/nfeRecepcaoEvento";

    private final String configuredEnvironment;
    private final String homologationUrl;
    private final String productionUrl;
    private final String homologationQueryUrl;
    private final String productionQueryUrl;
    private final String homologationEventUrl;
    private final String productionEventUrl;
    private final String soapAction;
    private final Duration timeout;
    private final SefazSoapClient transport;

    public NfeSefazClient(
            SefazSoapClient transport,
            @Value("${fiscal.nfe.environment:2}") String configuredEnvironment,
            @Value("${fiscal.nfe.sefaz-url-homologacao:}") String homologationUrl,
            @Value("${fiscal.nfe.sefaz-url-producao:}") String productionUrl,
            @Value("${fiscal.nfe.consulta-url-homologacao:}") String homologationQueryUrl,
            @Value("${fiscal.nfe.consulta-url-producao:}") String productionQueryUrl,
            @Value("${fiscal.nfe.evento-url-homologacao:}") String homologationEventUrl,
            @Value("${fiscal.nfe.evento-url-producao:}") String productionEventUrl,
            @Value("${fiscal.nfe.timeout-seconds:90}") long timeoutSeconds,
            @Value("${fiscal.nfe.soap-action:}") String soapAction) {
        this.transport = transport;
        this.configuredEnvironment = configuredEnvironment;
        this.homologationUrl = homologationUrl;
        this.productionUrl = productionUrl;
        this.homologationQueryUrl = homologationQueryUrl;
        this.productionQueryUrl = productionQueryUrl;
        this.homologationEventUrl = homologationEventUrl;
        this.productionEventUrl = productionEventUrl;
        this.soapAction = soapAction;
        this.timeout = Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : 90);
    }

    /** 1 = produção, 2 = homologação (padrão). */
    public String environment() {
        return "1".equals(configuredEnvironment == null ? "" : configuredEnvironment.trim()) ? "1" : "2";
    }

    public SefazSoapClient.SoapResponse recepcao(String signedNfeXml, FiscalCertificateMaterial material,
                                                 String environment) {
        String body = "<nfeDadosMsg xmlns=\"" + WSDL_AUTORIZACAO + "\">"
                + "<enviNFe xmlns=\"" + NfeXmlBuilder.NFE_NAMESPACE + "\" versao=\"" + NfeXmlBuilder.VERSION + "\">"
                + "<idLote>1</idLote><indSinc>0</indSinc>"
                + stripDeclaration(signedNfeXml)
                + "</enviNFe></nfeDadosMsg>";
        return send(environment, action(ACTION_AUTORIZACAO), body, material,
                homologationUrl, productionUrl);
    }

    public SefazSoapClient.SoapResponse consultaSituacao(String accessKey, FiscalCertificateMaterial material,
                                                         String environment) {
        String body = "<nfeDadosMsg xmlns=\"" + WSDL_CONSULTA + "\">"
                + "<consSitNFe xmlns=\"" + NfeXmlBuilder.NFE_NAMESPACE + "\" versao=\"" + NfeXmlBuilder.VERSION + "\">"
                + "<tpAmb>" + environment + "</tpAmb>"
                + "<xServ>CONSULTAR</xServ>"
                + "<chNFe>" + (accessKey == null ? "" : accessKey.trim()) + "</chNFe>"
                + "</consSitNFe></nfeDadosMsg>";
        return send(environment, action(ACTION_CONSULTA), body, material,
                homologationQueryUrl, productionQueryUrl);
    }

    public SefazSoapClient.SoapResponse cancelamento(String signedEventXml, FiscalCertificateMaterial material,
                                                     String environment) {
        String body = "<nfeDadosMsg xmlns=\"" + WSDL_EVENTO + "\">"
                + "<envEvento xmlns=\"" + NfeXmlBuilder.NFE_NAMESPACE + "\" versao=\"1.00\">"
                + "<idLote>1</idLote>"
                + stripDeclaration(signedEventXml)
                + "</envEvento></nfeDadosMsg>";
        return send(environment, action(ACTION_EVENTO), body, material,
                homologationEventUrl, productionEventUrl);
    }

    private SefazSoapClient.SoapResponse send(String environment, String action, String body,
                                              FiscalCertificateMaterial material,
                                              String homologationSpecificUrl, String productionSpecificUrl) {
        String url = url(environment, homologationSpecificUrl, productionSpecificUrl);
        log.info("Enviando mensagem NF-e para {} (ambiente {})", url, environment);
        return transport.send(url, action, SefazSoapClient.envelope(body), material, timeout, true);
    }

    /** URL configurada para o ambiente informado; falha rápido se não houver endpoint. */
    public String url(String environment) {
        return url(environment, homologationUrl, productionUrl);
    }

    private String url(String environment, String homologationSpecificUrl, String productionSpecificUrl) {
        boolean production = "1".equals(environment);
        String primary = production ? productionUrl : homologationUrl;
        String specific = production ? productionSpecificUrl : homologationSpecificUrl;
        String value = specific == null || specific.isBlank() ? primary : specific;
        if (value == null || value.isBlank()) {
            String property = production
                    ? "fiscal.nfe.sefaz-url-producao"
                    : "fiscal.nfe.sefaz-url-homologacao";
            throw new IllegalStateException("WebService da SEFAZ não configurado para o ambiente "
                    + (production ? "de produção" : "de homologação")
                    + ". Defina a propriedade " + property
                    + " com a URL do WebService da UF do emitente (NFeAutorizacao4/NFeConsultaProtocolo4/"
                    + "NFeRecepcaoEvento4), conforme o ambiente e a jurisdição da empresa.");
        }
        return value.trim();
    }

    private String action(String defaultAction) {
        return soapAction == null || soapAction.isBlank() ? defaultAction : soapAction.trim();
    }

    private static String stripDeclaration(String xml) {
        if (xml == null) {
            return "";
        }
        return xml.replaceFirst("^\\s*<\\?xml[^>]*\\?>\\s*", "").trim();
    }
}
