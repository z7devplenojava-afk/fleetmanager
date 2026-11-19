package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.ls.LSInput;
import org.w3c.dom.ls.LSResourceResolver;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Valida XML fiscal contra XSDs oficiais empacotados no classpath.
 * Os schemas são resolvidos pelo nome do arquivo dentro da pasta informada.
 */
@Component
@Slf4j
public class FiscalXmlValidator {

    public List<String> validate(String base, String mainSchema, String xml) {
        List<String> messages = new ArrayList<>();
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setResourceResolver(new ClasspathResolver(normalize(base)));
            InputStream stream = resource(base, mainSchema);
            if (stream == null) {
                messages.add("Falha ao validar o XML: schema " + mainSchema + " não encontrado.");
                return messages;
            }
            Schema schema = factory.newSchema(new StreamSource(stream, normalize(base) + mainSchema));
            Validator validator = schema.newValidator();
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            validator.setErrorHandler(new org.xml.sax.ErrorHandler() {
                @Override
                public void warning(SAXParseException e) {
                    messages.add("Aviso (linha " + e.getLineNumber() + "): " + e.getMessage());
                }

                @Override
                public void error(SAXParseException e) {
                    messages.add("Erro (linha " + e.getLineNumber() + "): " + e.getMessage());
                }

                @Override
                public void fatalError(SAXParseException e) {
                    messages.add("Erro grave (linha " + e.getLineNumber() + "): " + e.getMessage());
                }
            });
            validator.validate(new StreamSource(new StringReader(xml)));
        } catch (SAXException e) {
            messages.add("Falha ao carregar o schema: " + e.getMessage());
        } catch (Exception e) {
            messages.add("Falha ao validar o XML: " + e.getMessage());
        }
        return messages;
    }

    public static boolean hasErrors(List<String> messages) {
        if (messages == null) {
            return false;
        }
        return messages.stream().anyMatch(m -> m != null
                && (m.startsWith("Erro") || m.startsWith("Falha") || m.startsWith("Erro grave")));
    }

    private static InputStream resource(String base, String name) {
        return FiscalXmlValidator.class.getClassLoader()
                .getResourceAsStream(normalize(base) + name);
    }

    private static String normalize(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        return base.endsWith("/") ? base : base + "/";
    }

    /** Remove DOCTYPE remoto e âncoras ^/$ de patterns (o XSD não as trata como âncoras). */
    private static InputStream sanitize(InputStream stream) {
        try {
            String content = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            content = content.replaceAll("(?s)<!DOCTYPE[^>\\[]*\\[.*?\\]>", "");
            content = content.replaceAll("(?s)<!DOCTYPE[^>]*>", "");
            content = content.replaceAll("(?s)(<xs:pattern\\b[^>]*value=\")\\^(.*?)\\$(\")", "$1$2$3");
            return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return stream;
        }
    }

    private static final class ClasspathResolver implements LSResourceResolver {
        private final String base;

        private ClasspathResolver(String base) {
            this.base = base;
        }

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
            InputStream stream = resource(base, name);
            return stream == null ? null : new ClasspathInput(publicId, systemId, baseURI, sanitize(stream));
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

        @Override public Reader getCharacterStream() { return null; }
        @Override public void setCharacterStream(Reader characterStream) { }
        @Override public InputStream getByteStream() { return stream; }
        @Override public void setByteStream(InputStream byteStream) { }
        @Override public String getStringData() { return null; }
        @Override public void setStringData(String stringData) { }
        @Override public String getSystemId() { return systemId; }
        @Override public void setSystemId(String systemId) { }
        @Override public String getPublicId() { return publicId; }
        @Override public void setPublicId(String publicId) { }
        @Override public String getBaseURI() { return baseURI; }
        @Override public void setBaseURI(String baseURI) { }
        @Override public String getEncoding() { return encoding; }
        @Override public void setEncoding(String encoding) { this.encoding = encoding; }
        @Override public boolean getCertifiedText() { return false; }
        @Override public void setCertifiedText(boolean certifiedText) { }
    }
}
