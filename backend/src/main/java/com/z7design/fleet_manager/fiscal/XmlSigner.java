package com.z7design.fleet_manager.fiscal;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.crypto.dsig.CanonicalizationMethod;
import javax.xml.crypto.dsig.DigestMethod;
import javax.xml.crypto.dsig.Reference;
import javax.xml.crypto.dsig.SignatureMethod;
import javax.xml.crypto.dsig.SignedInfo;
import javax.xml.crypto.dsig.Transform;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

/**
 * Assinatura XMLDSig no padrão exigido pelo Sistema Nacional NFS-e:
 * envelope, C14N inclusivo, RSA-SHA1 e SHA-1 no digest.
 */
@Component
public class XmlSigner {

    public static final String NFSE_NAMESPACE = "http://www.sped.fazenda.gov.br/nfse";

    public String signDps(String dpsXml, FiscalCertificateMaterial material) {
        return signElement(dpsXml, NFSE_NAMESPACE, "infDPS", "Id", material);
    }

    /** Assina qualquer elemento identificado por um atributo Id/ID. */
    public String signElement(String xml, String namespaceUri, String elementName,
                              String idAttribute, FiscalCertificateMaterial material) {
        try {
            Document document = parse(xml);
            Element root = document.getDocumentElement();
            Element target = namespaceUri == null || namespaceUri.isBlank()
                    ? (Element) root.getElementsByTagName(elementName).item(0)
                    : (Element) root.getElementsByTagNameNS(namespaceUri, elementName).item(0);
            if (target == null) {
                throw new IllegalArgumentException("Elemento " + elementName + " não encontrado no XML.");
            }
            String id = target.getAttribute(idAttribute);
            if (id == null || id.isBlank()) {
                throw new IllegalArgumentException("Elemento " + elementName + " sem atributo Id.");
            }

            XMLSignatureFactory factory = XMLSignatureFactory.getInstance("DOM");
            List<Transform> transforms = new ArrayList<>();
            transforms.add(factory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null));
            transforms.add(factory.newTransform(CanonicalizationMethod.INCLUSIVE, (TransformParameterSpec) null));

            Reference reference = factory.newReference(
                    "#" + id,
                    factory.newDigestMethod(DigestMethod.SHA1, null),
                    transforms,
                    null,
                    null);

            SignedInfo signedInfo = factory.newSignedInfo(
                    factory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE,
                            (C14NMethodParameterSpec) null),
                    factory.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                    List.of(reference));

            KeyInfoFactory keyInfoFactory = factory.getKeyInfoFactory();
            List<Object> x509Content = new ArrayList<>();
            x509Content.add(material.certificate());
            for (X509Certificate certificate : material.chain()) {
                if (!certificate.equals(material.certificate())) {
                    x509Content.add(certificate);
                }
            }
            X509Data x509Data = keyInfoFactory.newX509Data(x509Content);
            KeyInfo keyInfo = keyInfoFactory.newKeyInfo(List.of(x509Data));

            DOMSignContext context = new DOMSignContext(material.privateKey(), root);
            context.setDefaultNamespacePrefix(null);
            try {
                context.setIdAttributeNS(target, null, idAttribute);
            } catch (Exception ignored) {
                // Alguns provedores JSR105 não expõem o atributo Id; tentamos o DOM Level 3.
            }
            try {
                target.setIdAttributeNS(null, idAttribute, true);
            } catch (Exception ignored) {
                // Ignora: o contexto acima já registrou o atributo quando suportado.
            }
            XMLSignature signature = factory.newXMLSignature(signedInfo, keyInfo);
            signature.sign(context);

            return serialize(document);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível assinar o XML da DPS.", e);
        }
    }

    private Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        return factory.newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    }

    private String serialize(Document document) throws Exception {
        TransformerFactory factory = TransformerFactory.newInstance();
        factory.setFeature(javax.xml.XMLConstants.FEATURE_SECURE_PROCESSING, true);
        Transformer transformer = factory.newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        transformer.setOutputProperty(OutputKeys.INDENT, "no");
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(document), new StreamResult(writer));
        return writer.toString();
    }
}
