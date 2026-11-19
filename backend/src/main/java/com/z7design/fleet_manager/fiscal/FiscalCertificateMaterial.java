package com.z7design.fleet_manager.fiscal;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import java.io.ByteArrayInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.List;

/**
 * Material do certificado A1 já descriptografado, mantido apenas em memória durante a requisição.
 */
public record FiscalCertificateMaterial(
        PrivateKey privateKey,
        X509Certificate certificate,
        List<X509Certificate> chain,
        byte[] pkcs12,
        char[] password
) {

    public SSLContext sslContext() {
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(pkcs12), password);
            KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(keyStore, password);
            SSLContext context = SSLContext.getInstance("TLS");
            context.init(kmf.getKeyManagers(), null, null);
            return context;
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível montar o contexto TLS com o certificado A1.", e);
        }
    }
}
