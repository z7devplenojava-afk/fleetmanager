package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteFiscalContext;
import com.z7design.fleet_manager.model.ElectronicCte;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMValidateContext;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Valida o CT-e 4.00 gerado contra os XSDs oficiais e confere a assinatura
 * XMLDSig gerada com um certificado A1 self-signed.
 */
class CteXmlRoundTripTest {

    private static final String NS = CteXmlBuilder.NAMESPACE;

    @Test
    void geraValidaEAssinaCte() throws Exception {
        ElectronicCte cte = sampleCte();
        CteFiscalContext context = new CteFiscalContext(
                "3142403", "3142403", "3106200", "3142403", "3106200", "2", "3");

        CteXmlBuilder builder = new CteXmlBuilder();
        FiscalXmlValidator validator = new FiscalXmlValidator();

        String xml = builder.build(cte, context);
        assertTrue(xml.contains("<infCte"));
        assertTrue(xml.contains("<infModal versaoModal=\"4.00\">"));

        // O XSD do CT-e exige a assinatura como filho da raiz, por isso a
        // validação formal é feita sobre o documento já assinado.
        FiscalCertificateMaterial material = selfSignedMaterial();
        String signed = new XmlSigner().signElement(xml, NS, "infCte", "Id", material);
        List<String> signedMessages = validator.validate("fiscal/xsd/cte/", "cte_v4.00.xsd", signed);
        System.out.println("Validação CT-e assinado: " + signedMessages);
        assertFalse(FiscalXmlValidator.hasErrors(signedMessages),
                "CT-e assinado deveria ser válido: " + signedMessages);

        assertTrue(signed.contains("<Signature"), "XML assinado deve conter Signature");
        assertTrue(signed.contains("Id=\"CTe" + cte.getAccessKey() + "\""), "infCte deve manter o Id");
        assertTrue(verifySignature(signed, material.certificate()), "Assinatura XMLDSig deveria ser válida");
        assertFalse(signed.contains("9999999"), "Não deve usar código de município placeholder");
    }

    @Test
    void geraEventoDeCancelamentoValido() throws Exception {
        ElectronicCte cte = sampleCte();
        CteXmlBuilder builder = new CteXmlBuilder();
        FiscalXmlValidator validator = new FiscalXmlValidator();

        String event = builder.buildCancellationEvent(cte.getAccessKey(), "123456789012345",
                "Cancelamento por solicitação expressa do contratante.", "2", cte.getIssuerTaxId());
        String signed = new XmlSigner().signElement(event, NS, "infEvento", "Id",
                selfSignedMaterial());
        List<String> messages = validator.validate("fiscal/xsd/cte/", "eventoCTe_v4.00.xsd", signed);
        System.out.println("Validação evento de cancelamento: " + messages);
        assertFalse(FiscalXmlValidator.hasErrors(messages), "Evento deveria ser válido: " + messages);
        assertTrue(signed.contains("<evCancCTe>"));
    }

    private static ElectronicCte sampleCte() {
        LocalDateTime emission = LocalDateTime.of(2026, 11, 19, 10, 30);
        ElectronicCte cte = new ElectronicCte();
        cte.setCompanyId(java.util.UUID.randomUUID());
        cte.setNumber("1");
        cte.setSeries("1");
        cte.setAccessKey(CteAccessKey.generate("MG", emission, "71055644000125", "1", "1"));
        cte.setStatus("EMITIDA");
        cte.setEmissionDate(emission);
        cte.setCfop("5353");
        cte.setNatureOperation("PRESTACAO DE SERVICO DE TRANSPORTE RODOVIARIO");
        cte.setServiceTaker("REMETENTE");
        cte.setIssuerName("VIAÇÃO SÃO SILVESTRE LTDA");
        cte.setIssuerTaxId("71055644000125");
        cte.setIssuerAddress("RUA DAS FLORES, 100 - CENTRO");
        cte.setIssuerCity("MOEDA");
        cte.setIssuerState("MG");
        cte.setIssuerZip("35499000");
        cte.setIssuerStateRegistration("531000000");
        cte.setSenderName("SALOBO METAIS LTDA");
        cte.setSenderTaxId("12345678000199");
        cte.setSenderAddress("AVENIDA INDUSTRIAL, 500 - DISTRITO INDUSTRIAL");
        cte.setSenderCity("MOEDA");
        cte.setSenderState("MG");
        cte.setSenderStateRegistration("531000001");
        cte.setRecipientName("INDUSTRIAS PIRANGA LTDA");
        cte.setRecipientTaxId("98765432000110");
        cte.setRecipientAddress("AVENIDA DO COMERCIO, 1200 - CENTRO");
        cte.setRecipientCity("BELO HORIZONTE");
        cte.setRecipientState("MG");
        cte.setRecipientStateRegistration("531000002");
        cte.setOriginCity("MOEDA");
        cte.setOriginState("MG");
        cte.setDestinationCity("BELO HORIZONTE");
        cte.setDestinationState("MG");
        cte.setVehiclePlate("ABC1D23");
        cte.setRntrc("12345678");
        cte.setCargoDescription("PECAS INDUSTRIAIS");
        cte.setCargoWeight(new BigDecimal("1500.000"));
        cte.setCargoValue(new BigDecimal("758364.20"));
        cte.setFreightValue(new BigDecimal("12500.00"));
        cte.setIcmsBase(new BigDecimal("12500.00"));
        cte.setIcmsRate(new BigDecimal("12.0000"));
        cte.setIcmsValue(new BigDecimal("1500.00"));
        cte.setNotes("TRANSPORTE DE CARGAS");
        return cte;
    }

    private static boolean verifySignature(String xml, X509Certificate certificate) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        Document document = factory.newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        Element infCte = (Element) document.getElementsByTagNameNS(NS, "infCte").item(0);
        infCte.setIdAttributeNS(null, "Id", true);

        NodeList signatures = document.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
        if (signatures.getLength() == 0) {
            return false;
        }
        XMLSignatureFactory signatureFactory = XMLSignatureFactory.getInstance("DOM");
        DOMValidateContext context = new DOMValidateContext(certificate.getPublicKey(), signatures.item(0));
        // O leiaute da SEFAZ exige RSA-SHA1; o JDK bloqueia esse algoritmo quando
        // a validação segura está ativa (não é o caso do WebService fiscal).
        context.setProperty("org.jcp.xml.dsig.secureValidation", Boolean.FALSE);
        XMLSignature signature = signatureFactory.unmarshalXMLSignature(context);
        if (!signature.validate(context)) {
            return false;
        }
        if (!signature.getSignatureValue().validate(context)) {
            return false;
        }
        for (Object item : signature.getSignedInfo().getReferences()) {
            javax.xml.crypto.dsig.Reference reference = (javax.xml.crypto.dsig.Reference) item;
            if (!Boolean.TRUE.equals(reference.validate(context))) {
                return false;
            }
        }
        return true;
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
