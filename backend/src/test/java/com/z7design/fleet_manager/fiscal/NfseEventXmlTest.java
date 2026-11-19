package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.ServiceInvoice;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Valida os novos leiautes de IBS/CBS e de eventos contra os XSDs oficiais v1.01.
 */
class NfseEventXmlTest {

    private static final String BASE = "fiscal/xsd/v1.01/";
    private static final String CH_NFSE = "314240371055644000125" + "1".repeat(29); // 50 dígitos
    private static final String CNPJ = "71055644000125";
    private static final String JUSTIFICATIVA = "Erro na emissao da nota fiscal de servicos";

    @Test
    void dpsComIbscbsValidaContraXsd() {
        Company company = company();
        ServiceInvoice invoice = invoice(company);
        NfseIbscbsData ibscbs = NfseIbscbsData.of("0", "0", "123456", "0", "000", "000000");

        String xml = new NfseXmlBuilder().build(invoice, company, ibscbs);
        List<String> messages = new FiscalXmlValidator().validate(BASE, "DPS_v1.01.xsd", xml);

        System.out.println("Validação DPS com IBS/CBS: " + messages);
        assertFalse(FiscalXmlValidator.hasErrors(messages), "DPS com IBS/CBS deveria ser válida: " + messages);
        assertTrue(xml.contains("<IBSCBS>"), "DPS deve conter o grupo IBSCBS");
        assertTrue(xml.indexOf("<IBSCBS>") > xml.indexOf("</valores>"),
                "IBSCBS deve vir depois de valores");
    }

    @Test
    void pedRegEventoCancelamentoValidaAntesDeAssinar() {
        String evento = NfseEventBuilder.buildCancelamento(
                CH_NFSE, CNPJ, "2", "1", JUSTIFICATIVA);
        String pedReg = NfseEventBuilder.extractPedRegEvento(evento);

        List<String> messages = new FiscalXmlValidator()
                .validate(BASE, "pedRegEvento_v1.01.xsd", pedReg);

        System.out.println("Validação pedRegEvento: " + messages);
        System.out.println(pedReg);
        assertFalse(FiscalXmlValidator.hasErrors(messages),
                "pedRegEvento de cancelamento deveria ser válido: " + messages);
        assertTrue(pedReg.contains("<e101101>"), "Deve conter o evento de cancelamento e101101");
    }

    @Test
    void eventoCancelamentoAssinadoValidaContraXsd() throws Exception {
        String xml = NfseEventBuilder.buildCancelamento(
                CH_NFSE, CNPJ, "2", "2", JUSTIFICATIVA, "1");

        String signed = new XmlSigner().signElement(
                xml, XmlSigner.NFSE_NAMESPACE, "infEvento", "Id", selfSignedMaterial());
        List<String> messages = new FiscalXmlValidator()
                .validate(BASE, "evento_v1.01.xsd", signed);

        System.out.println("Validação evento assinado: " + messages);
        assertFalse(FiscalXmlValidator.hasErrors(messages),
                "Evento assinado deveria ser válido: " + messages);
        assertTrue(signed.contains("<Signature"), "Evento assinado deve conter Signature");
        assertTrue(signed.contains("EVT" + CH_NFSE + "101101001"), "Id do evento incorreto");
    }

    @Test
    void parserInterpretaRespostaDeEventoXmlEJson() {
        String xml = "<retEvento><infEvento Id=\"" + "EVT" + CH_NFSE + "101101001" + "\">"
                + "<cStat>135</cStat><xMotivo>Evento registrado e vinculado</xMotivo>"
                + "<nProt>123456789012345</nProt></infEvento></retEvento>";
        var parsedXml = NfseEventParser.parse(xml);
        assertTrue(parsedXml.success());
        assertTrue("135".equals(parsedXml.status()));
        assertTrue("123456789012345".equals(parsedXml.protocol()));
        assertTrue(parsedXml.id().startsWith("EVT"));

        var parsedJson = NfseEventParser.parse(
                "{\"cStat\":\"100\",\"xMotivo\":\"Evento registrado\",\"nProt\":\"999\",\"id\":\"EVT123\"}");
        assertTrue(parsedJson.success());
        assertTrue("100".equals(parsedJson.status()));
        assertTrue("999".equals(parsedJson.protocol()));
    }

    private static Company company() {
        Company company = new Company();
        company.setName("VIAÇÃO SÃO SILVESTRE LTDA");
        company.setCnpj(CNPJ);
        company.setInscricaoMunicipal("12345");
        company.setCodigoMunicipio("3142403");
        company.setRegimeTributario("1");
        company.setEnderecoRua("RUA DAS FLORES");
        company.setEnderecoNumero("100");
        company.setEnderecoBairro("CENTRO");
        company.setZipCode("35499000");
        company.setCity("MOEDA");
        company.setState("MG");
        company.setPhone("3133334444");
        company.setEmail("fiscal@empresa.com.br");
        return company;
    }

    private static ServiceInvoice invoice(Company company) {
        ServiceInvoice invoice = new ServiceInvoice();
        invoice.setNumber("DPS1");
        invoice.setSeries("1");
        invoice.setVerificationCode("DPS1");
        invoice.setStatus("RASCUNHO");
        invoice.setEmissionDate(LocalDateTime.now());
        invoice.setCompetence("2026-11");
        invoice.setEnvironment("2");
        invoice.setDpsNumber(1L);
        invoice.setDpsId(NfseDpsId.build("3142403", CNPJ, "1", 1));
        invoice.setIssuerName(company.getName());
        invoice.setIssuerTaxId(company.getCnpj());
        invoice.setIssuerMunicipalRegistration("12345");
        invoice.setMunicipalityCode("3142403");
        invoice.setServiceLocationCode("3142403");
        invoice.setTakerName("SALOBO METAIS LTDA");
        invoice.setTakerTaxId("12345678000199");
        invoice.setTakerAddress("AVENIDA INDUSTRIAL");
        invoice.setTakerAddressNumber("500");
        invoice.setTakerNeighborhood("DISTRITO INDUSTRIAL");
        invoice.setTakerMunicipalityCode("3106200");
        invoice.setTakerZip("30110000");
        invoice.setTakerCity("BELO HORIZONTE");
        invoice.setTakerState("MG");
        invoice.setServiceCode("160101");
        invoice.setNbsCode("104011119");
        invoice.setServiceDescription("SERVICOS DE TRANSPORTE DE CARGAS");
        invoice.setDiscrimination("PRESTACAO DE SERVICO DE TRANSPORTE RODOVIARIO DE CARGAS");
        invoice.setGrossAmount(new BigDecimal("758364.20"));
        invoice.setDeductionAmount(BigDecimal.ZERO);
        invoice.setIssRate(new BigDecimal("5.00"));
        invoice.setIssAmount(new BigDecimal("37918.21"));
        invoice.setIssWithheld(true);
        invoice.setIssRetainedAmount(new BigDecimal("37918.21"));
        invoice.setIssTaxation("1");
        invoice.setIssWithholdingType("2");
        invoice.setInssAmount(new BigDecimal("25026.01"));
        invoice.setNetAmount(new BigDecimal("695419.98"));
        invoice.setOpSimpNac("1");
        invoice.setRegEspTrib("0");
        return invoice;
    }

    /** Certificado self-signed (BouncyCastle), copiado de NfseXmlRoundTripTest. */
    private static FiscalCertificateMaterial selfSignedMaterial() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        long now = System.currentTimeMillis();
        Date from = new Date(now - 86_400_000L);
        Date to = new Date(now + 365L * 86_400_000L);
        JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                new org.bouncycastle.asn1.x500.X500Name("CN=TESTE 71055644000125, O=TESTE"),
                java.math.BigInteger.valueOf(now),
                from,
                to,
                new org.bouncycastle.asn1.x500.X500Name("CN=TESTE 71055644000125, O=TESTE"),
                keyPair.getPublic());
        ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256withRSA").build(keyPair.getPrivate());
        X509Certificate certificate = new JcaX509CertificateConverter()
                .getCertificate(builder.build(contentSigner));

        return new FiscalCertificateMaterial(
                keyPair.getPrivate(), certificate, List.of(certificate), new byte[0], new char[0]);
    }
}
