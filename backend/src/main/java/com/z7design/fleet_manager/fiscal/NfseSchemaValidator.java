package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.ls.LSInput;
import org.w3c.dom.ls.LSResourceResolver;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Valida o XML da DPS contra os schemas oficiais v1.01 empacotados em resources.
 * A validação local evita enviar à SEFIN um documento que seria rejeitado por leiaute.
 */
@Component
@Slf4j
public class NfseSchemaValidator {

    private static final String BASE = "fiscal/xsd/v1.01/";
    private final Schema schema;

    public NfseSchemaValidator() {
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setResourceResolver(new ClasspathResolver());
            InputStream stream = resource("DPS_v1.01.xsd");
            if (stream == null) {
                throw new IllegalStateException("Schema DPS_v1.01.xsd não encontrado no classpath.");
            }
            this.schema = factory.newSchema(new StreamSource(stream, BASE + "DPS_v1.01.xsd"));
        } catch (SAXException e) {
            throw new IllegalStateException("Não foi possível carregar os schemas oficiais da NFS-e v1.01.", e);
        }
    }

    public List<String> validate(String xml) {
        List<String> messages = new ArrayList<>();
        try {
            Validator validator = schema.newValidator();
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            validator.setErrorHandler(new org.xml.sax.ErrorHandler() {
                @Override
                public void warning(SAXParseException exception) {
                    messages.add("Aviso (linha " + exception.getLineNumber() + "): " + exception.getMessage());
                }

                @Override
                public void error(SAXParseException exception) {
                    messages.add("Erro (linha " + exception.getLineNumber() + "): " + exception.getMessage());
                }

                @Override
                public void fatalError(SAXParseException exception) {
                    messages.add("Erro grave (linha " + exception.getLineNumber() + "): " + exception.getMessage());
                }
            });
            validator.validate(new StreamSource(new StringReader(xml)));
        } catch (Exception e) {
            messages.add("Falha ao validar o XML: " + e.getMessage());
        }
        return messages;
    }

    private static InputStream resource(String name) {
        return NfseSchemaValidator.class.getClassLoader().getResourceAsStream(BASE + name);
    }

    /**
     * O xmldsig-core-schema.xsd oficial referencia um DTD remoto do W3C. Como o
     * acesso externo fica bloqueado (e a homologação pode rodar sem internet),
     * removemos apenas o DOCTYPE antes de entregar o schema ao validador.
     */
    private static InputStream sanitize(String name, InputStream stream) {
        if (!name.toLowerCase().endsWith(".xsd")) {
            return stream;
        }
        try {
            String content = new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            if ("xmldsig-core-schema.xsd".equalsIgnoreCase(name)) {
                content = content.replaceAll("(?s)<!DOCTYPE[^\\[]*\\[.*?\\]>", "");
                content = content.replaceAll("(?s)<!DOCTYPE[^>]*>", "");
            }
            // Os XSDs oficiais usam "^...$" nos patterns, mas o XML Schema não
            // trata ^/$ como âncoras. Removemos apenas essas âncoras para que a
            // validação local reflita a regra pretendida (ex.: série "1").
            content = content.replaceAll("(?s)(<xs:pattern\\b[^>]*value=\")\\^(.*?)\\$(\")", "$1$2$3");
            return new java.io.ByteArrayInputStream(
                    content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            return stream;
        }
    }

    private static final class ClasspathResolver implements LSResourceResolver {
        @Override
        public LSInput resolveResource(String type, String namespaceURI, String publicId,
                                       String systemId, String baseURI) {
            if (systemId == null) {
                return null;
            }
            String name = systemId;
            int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
            if (slash >= 0) {
                name = name.substring(slash + 1);
            }
            InputStream stream = resource(name);
            return stream == null ? null : new ClasspathInput(publicId, systemId, baseURI, sanitize(name, stream));
        }
    }

    private static final class ClasspathInput implements LSInput {
        private final String publicId;
        private final String systemId;
        private final String baseURI;
        private final InputStream stream;
        private String encoding = "UTF-8";

        private ClasspathInput(String publicId, String systemId, String baseURI, InputStream stream) {
            this.publicId = publicId;
            this.systemId = systemId;
            this.baseURI = baseURI;
            this.stream = stream;
        }

        @Override
        public Reader getCharacterStream() {
            return null;
        }

        @Override
        public void setCharacterStream(Reader characterStream) {
        }

        @Override
        public InputStream getByteStream() {
            return stream;
        }

        @Override
        public void setByteStream(InputStream byteStream) {
        }

        @Override
        public String getStringData() {
            return null;
        }

        @Override
        public void setStringData(String stringData) {
        }

        @Override
        public String getSystemId() {
            return systemId;
        }

        @Override
        public void setSystemId(String systemId) {
        }

        @Override
        public String getPublicId() {
            return publicId;
        }

        @Override
        public void setPublicId(String publicId) {
        }

        @Override
        public String getBaseURI() {
            return baseURI;
        }

        @Override
        public void setBaseURI(String baseURI) {
        }

        @Override
        public String getEncoding() {
            return encoding;
        }

        @Override
        public void setEncoding(String encoding) {
            this.encoding = encoding;
        }

        @Override
        public boolean getCertifiedText() {
            return false;
        }

        @Override
        public void setCertifiedText(boolean certifiedText) {
        }
    }
}
