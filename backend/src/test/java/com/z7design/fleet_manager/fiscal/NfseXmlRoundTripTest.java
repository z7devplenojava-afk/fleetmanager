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
 * Garante que a DPS gerada segue o leiaute oficial v1.01 e que a assinatura
 * XMLDSig continua válida após a serialização.
 */
class NfseXmlRoundTripTest {

    @Test
    void geraEValidaDpsAssinada() throws Exception {
        Company company = new Company();
        company.setName("VIAÇÃO SÃO SILVESTRE LTDA");
        company.setCnpj("71055644000125");
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

        ServiceInvoice invoice = new ServiceInvoice();
        invoice.setNumber("DPS1");
        invoice.setSeries("1");
        invoice.setVerificationCode("DPS1");
        invoice.setStatus("RASCUNHO");
        invoice.setEmissionDate(LocalDateTime.now());
        invoice.setCompetence("2026-11");
        invoice.setEnvironment("2");
        invoice.setDpsNumber(1L);
        invoice.setDpsId(NfseDpsId.build("3142403", "71055644000125", "1", 1));
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

        NfseXmlBuilder builder = new NfseXmlBuilder();
        NfseSchemaValidator validator = new NfseSchemaValidator();

        String xml = builder.build(invoice, company);
        List<String> unsignedMessages = validator.validate(xml);
        System.out.println("Validação DPS sem assinatura: " + unsignedMessages);
        assertFalse(hasErrors(unsignedMessages), "DPS deveria ser válida: " + unsignedMessages);

        FiscalCertificateMaterial material = selfSignedMaterial();
        XmlSigner signer = new XmlSigner();
        String signed = signer.signDps(xml, material);
        List<String> signedMessages = validator.validate(signed);
        System.out.println("Validação DPS assinada: " + signedMessages);
        assertFalse(hasErrors(signedMessages), "DPS assinada deveria ser válida: " + signedMessages);
        assertTrue(signed.contains("<Signature"), "XML assinado deve conter Signature");
        assertTrue(signed.contains("infDPS"), "XML assinado deve conter infDPS");
    }

    private static boolean hasErrors(List<String> messages) {
        return messages.stream().anyMatch(m -> m.startsWith("Erro") || m.startsWith("Falha"));
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
