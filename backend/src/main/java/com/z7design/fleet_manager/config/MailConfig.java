package com.z7design.fleet_manager.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import java.util.Properties;

/**
 * ConfiguraÃ§Ã£o customizada do JavaMailSender para garantir
 * que as propriedades de email sejam aplicadas corretamente
 */
@Configuration
public class MailConfig {
    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    // Prioridade: variÃ¡vel de ambiente MAIL_HOST > spring.mail.host > padrÃ£o
    @Value("#{systemEnvironment['MAIL_HOST'] ?: '${spring.mail.host:186.209.113.105}'}")
    private String host;

    @Value("${spring.mail.port:465}")
    private int port;

    @Value("${spring.mail.username:securedguard@z7design.com.br}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:false}")
    private boolean starttlsEnable;

    @Value("${spring.mail.properties.mail.smtp.starttls.required:false}")
    private boolean starttlsRequired;

    @Value("${spring.mail.properties.mail.smtp.ssl.enable:true}")
    private boolean sslEnable;

    @Value("${spring.mail.properties.mail.smtp.ssl.trust:*}")
    private String sslTrust;

    @Value("${spring.mail.properties.mail.smtp.socketFactory.class:javax.net.ssl.SSLSocketFactory}")
    private String socketFactoryClass;

    @Value("${spring.mail.properties.mail.smtp.socketFactory.port:465}")
    private String socketFactoryPortStr;

    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:10000}")
    private String connectionTimeoutStr;

    @Value("${spring.mail.properties.mail.smtp.timeout:10000}")
    private String timeoutStr;

    @Value("${spring.mail.properties.mail.smtp.writetimeout:10000}")
    private String writeTimeoutStr;

    @Value("${spring.mail.properties.mail.debug:false}")
    private boolean debug;

    @Bean
    public JavaMailSender javaMailSender() {
        // Verificar se MAIL_HOST estÃ¡ definido na variÃ¡vel de ambiente (tem
        // prioridade absoluta)
        String mailHostEnv = System.getenv("MAIL_HOST");
        if (mailHostEnv != null && !mailHostEnv.trim().isEmpty()) {
            host = mailHostEnv.trim();
            log.info("ðŸ“§ Usando MAIL_HOST da variÃ¡vel de ambiente: {}", host);
        }

        log.info("ðŸ“§ Configurando JavaMailSender...");
        log.info("ðŸ“§ Host: {} (env: {}), Port: {}, Username: {}", host, mailHostEnv, port, username);
        log.info("ðŸ“§ Password configurado: {}", password != null && !password.isEmpty() ? "SIM" : "NÃƒO");
        log.info("ðŸ“§ SSL: {}, STARTTLS: {}", sslEnable, starttlsEnable);

        // Converter strings para int com valores padrÃ£o
        int socketFactoryPort = parseInteger(socketFactoryPortStr, 465);
        int connectionTimeout = parseInteger(connectionTimeoutStr, 10000);
        int timeout = parseInteger(timeoutStr, 10000);
        int writeTimeout = parseInteger(writeTimeoutStr, 10000);

        log.info("ðŸ“§ SocketFactory: {}:{}", socketFactoryClass, socketFactoryPort);
        log.info("ðŸ“§ Timeouts: connection={}ms, timeout={}ms, write={}ms", connectionTimeout, timeout, writeTimeout);

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(auth));
        props.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnable));
        props.put("mail.smtp.starttls.required", String.valueOf(starttlsRequired));
        props.put("mail.smtp.ssl.enable", String.valueOf(sslEnable));
        props.put("mail.smtp.ssl.trust", sslTrust);
        // Confiar no certificado SSL (necessÃ¡rio para alguns servidores)
        props.put("mail.smtp.ssl.checkserveridentity", "false");

        // SocketFactory apenas para porta 465 (SSL direto)
        // NÃƒO usar SocketFactory com porta 587 (STARTTLS)
        if (port == 465 && sslEnable) {
            // Porta 465: usar SocketFactory SSL direto
            if (socketFactoryClass != null && !socketFactoryClass.isEmpty()) {
                props.put("mail.smtp.socketFactory.class", socketFactoryClass);
                props.put("mail.smtp.socketFactory.port", String.valueOf(socketFactoryPort));
                props.put("mail.smtp.socketFactory.fallback", "false");
                log.info("ðŸ”’ SocketFactory SSL configurado para porta 465");
            }
        } else if (port == 587) {
            // Porta 587: usar STARTTLS, NÃƒO usar SocketFactory
            // Remover qualquer propriedade de SocketFactory que possa ter sido definida
            props.remove("mail.smtp.socketFactory.class");
            props.remove("mail.smtp.socketFactory.port");
            props.remove("mail.smtp.socketFactory.fallback");
            log.info("ðŸ”“ Porta 587: usando STARTTLS (SocketFactory removido)");
        }

        props.put("mail.smtp.connectiontimeout", String.valueOf(connectionTimeout));
        props.put("mail.smtp.timeout", String.valueOf(timeout));
        props.put("mail.smtp.writetimeout", String.valueOf(writeTimeout));
        // Propriedades adicionais para melhorar compatibilidade
        // JavaMail espera protocolos separados por espaÃ§o
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.debug", String.valueOf(debug));

        log.info("âœ… JavaMailSender configurado com sucesso");
        return mailSender;
    }

    /**
     * Converte string para int com valor padrÃ£o se vazio ou invÃ¡lido
     */
    private int parseInteger(String value, int defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("âš ï¸ Valor invÃ¡lido para timeout: '{}', usando padrÃ£o: {}", value, defaultValue);
            return defaultValue;
        }
    }
}
