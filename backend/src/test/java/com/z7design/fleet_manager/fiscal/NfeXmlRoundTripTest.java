package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.model.ElectronicNfe;
import com.z7design.fleet_manager.model.ElectronicNfeItem;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Garante que o XML da NF-e 4.00 gerado pelo builder passa no XSD oficial e que a
 * assinatura XMLDSig permanece válida após a serialização.
 */
class NfeXmlRoundTripTest {

    @Test
    void geraValidaEAssinaNfeModelo55() throws Exception {
        LocalDateTime emission = LocalDateTime.of(2026, 11, 19, 10, 30, 0);
        String key = NfeAccessKey.generate("MG", emission, "71055644000125", "1", "1", "1", "12345678");

        ElectronicNfe nfe = new ElectronicNfe();
        nfe.setAccessKey(key);
        nfe.setNumber("1");
        nfe.setSeries("1");
        nfe.setEnvironment("2");
        nfe.setEmissionDate(emission);
        nfe.setNatureOperation("VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS");
        nfe.setTpNf("1");
        nfe.setIdDest("1");
        nfe.setTpImp("1");
        nfe.setTpEmis("1");
        nfe.setFinNfe("1");
        nfe.setIndFinal("1");
        nfe.setIndPres("1");
        nfe.setProcEmi("0");
        nfe.setVerProc("FleetManager");

        nfe.setIssuerName("VIAÇÃO SÃO SILVESTRE LTDA");
        nfe.setIssuerTaxId("71055644000125");
        nfe.setIssuerStateRegistration("123456789");
        nfe.setIssuerState("MG");
        nfe.setIssuerCity("MOEDA");
        nfe.setIssuerMunicipalityCode("3142403");
        nfe.setIssuerAddress("RUA DAS FLORES");
        nfe.setIssuerAddressNumber("100");
        nfe.setIssuerNeighborhood("CENTRO");
        nfe.setIssuerZip("35499000");
        nfe.setIssuerCrt("3");

        nfe.setRecipientName("SALOBO METAIS LTDA");
        nfe.setRecipientTaxId("12345678000199");
        nfe.setRecipientIndIeDest("9");
        nfe.setRecipientAddress("AVENIDA INDUSTRIAL");
        nfe.setRecipientAddressNumber("500");
        nfe.setRecipientNeighborhood("DISTRITO INDUSTRIAL");
        nfe.setRecipientCity("BELO HORIZONTE");
        nfe.setRecipientState("MG");
        nfe.setRecipientZip("30110000");
        nfe.setRecipientMunicipalityCode("3106200");

        nfe.setPaymentType("15");
        nfe.setPaymentInd("0");
        nfe.setFreightModality("9");
        nfe.setTotalAmount(new BigDecimal("300.00"));

        nfe.addItem(item(1, "PRODUTO TRIBUTADO", "84099199", "5102", "00", "18", "1.65", "7.60"));
        nfe.addItem(item(2, "PRODUTO ISENTO", "84099199", "5102", "40", "0", "1.65", "7.60"));

        assertEquals(44, key.length());
        assertTrue(NfeAccessKey.valid(key), "O dígito verificador da chave deve ser válido.");

        NfeXmlBuilder builder = new NfeXmlBuilder();
        String xml = builder.build(nfe);
        assertTrue(xml.contains("<NFe xmlns=\"" + NfeXmlBuilder.NFE_NAMESPACE + "\">"));
        assertTrue(xml.contains("<infNFe versao=\"4.00\" Id=\"NFe" + key + "\">"));
        assertTrue(xml.contains("<ICMS00>"));
        assertTrue(xml.contains("<ICMS40>"));
        assertTrue(xml.contains("<PISAliq>"));
        assertTrue(xml.contains("<COFINSAliq>"));

        FiscalCertificateMaterial material = selfSignedMaterial();
        XmlSigner signer = new XmlSigner();
        String signed = signer.signElement(xml, NfeXmlBuilder.NFE_NAMESPACE, "infNFe", "Id", material);
        assertTrue(signed.contains("<Signature"), "O XML assinado deve conter a assinatura XMLDSig.");

        FiscalXmlValidator validator = new FiscalXmlValidator();
        List<String> messages = validator.validate("fiscal/xsd/nfe/", "nfe_v4.00.xsd", signed);
        System.out.println("Validação NF-e 4.00 assinada: " + messages);
        assertFalse(hasErrors(messages), "A NF-e assinada deveria ser válida: " + messages);
    }

    private static ElectronicNfeItem item(int number, String description, String ncm, String cfop,
                                          String icmsCst, String icmsRate, String pisRate, String cofinsRate) {
        BigDecimal total = new BigDecimal(number == 1 ? "200.00" : "100.00");
        BigDecimal rate = new BigDecimal(icmsRate);
        BigDecimal icmsValue = "00".equals(icmsCst)
                ? total.multiply(rate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2);
        BigDecimal pisRateValue = new BigDecimal(pisRate);
        BigDecimal cofinsRateValue = new BigDecimal(cofinsRate);

        ElectronicNfeItem item = new ElectronicNfeItem();
        item.setItemNumber(number);
        item.setCode(String.valueOf(number));
        item.setDescription(description);
        item.setNcm(ncm);
        item.setCfop(cfop);
        item.setUnit("UN");
        item.setQuantity(BigDecimal.ONE.setScale(4));
        item.setUnitValue(total.setScale(10));
        item.setTotalValue(total);
        item.setIcmsOrig("0");
        item.setIcmsCst(icmsCst);
        item.setIcmsBase("00".equals(icmsCst) ? total : BigDecimal.ZERO.setScale(2));
        item.setIcmsRate(rate.setScale(4));
        item.setIcmsValue(icmsValue);
        item.setPisCst("01");
        item.setPisBase(total);
        item.setPisRate(pisRateValue.setScale(4));
        item.setPisValue(total.multiply(pisRateValue)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP));
        item.setCofinsCst("01");
        item.setCofinsBase(total);
        item.setCofinsRate(cofinsRateValue.setScale(4));
        item.setCofinsValue(total.multiply(cofinsRateValue)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP));
        return item;
    }

    private static boolean hasErrors(List<String> messages) {
        return messages.stream().anyMatch(m -> m != null && (m.startsWith("Erro")
                || m.startsWith("Falha") || m.startsWith("Erro grave")));
    }

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
