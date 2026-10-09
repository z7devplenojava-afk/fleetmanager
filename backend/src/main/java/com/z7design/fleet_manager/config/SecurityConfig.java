package com.z7design.fleet_manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.z7design.fleet_manager.security.JwtAuthenticationFilter;
import com.z7design.fleet_manager.security.JwtTenantFilter;
import com.z7design.fleet_manager.service.CustomUserDetailsService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final CustomUserDetailsService customUserDetailsService;
        @Lazy
        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final JwtTenantFilter jwtTenantFilter;
        private final com.z7design.fleet_manager.security.LoginRateLimitFilter loginRateLimitFilter;

        public SecurityConfig(CustomUserDetailsService customUserDetailsService,
                        @Lazy JwtAuthenticationFilter jwtAuthenticationFilter,
                        JwtTenantFilter jwtTenantFilter,
                        com.z7design.fleet_manager.security.LoginRateLimitFilter loginRateLimitFilter) {
                this.customUserDetailsService = customUserDetailsService;
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.jwtTenantFilter = jwtTenantFilter;
                this.loginRateLimitFilter = loginRateLimitFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.sameOrigin())
                                                .contentTypeOptions(contentType -> {
                                                }))
                                .authorizeHttpRequests(auth -> auth
                                                // Endpoints pÃƒÂºblicos (sem autenticaÃƒÂ§ÃƒÂ£o)
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/files/**").permitAll()
                                                // SEGURANÃ‡A: /api/test/**, /api/diagnostic/** e /api/debug/** agora
                                                // exigem autenticaÃ§Ã£o (eram portas abertas para inspeÃ§Ã£o do sistema).
                                                .requestMatchers("/api/test/**", "/api/diagnostic/**", "/api/debug/**").authenticated()
                                                .requestMatchers("/api/health").permitAll()
                                                // WebSocket endpoints - permitir todos os transportes do SockJS (info,
                                                // websocket, xhr, eventsource, htmlfile, jsonp, iframe)
                                                // O SockJS faz requisiÃƒÂ§ÃƒÂµes HTTP iniciais que nÃƒÂ£o incluem o token JWT
                                                // A autenticaÃƒÂ§ÃƒÂ£o real acontece quando a conexÃƒÂ£o STOMP ÃƒÂ©
                                                // estabelecida (via
                                                // WebSocketSecurityConfig)
                                                // IMPORTANTE: Permitir todos os padrÃƒÂµes do SockJS, mas a conexÃƒÂ£o
                                                // STOMP serÃƒÂ¡
                                                // autenticada no WebSocketSecurityConfig
                                                // NOTA: PadrÃƒÂµes com ** devem ser os ÃƒÂºltimos elementos, entÃƒÂ£o usamos
                                                // um
                                                // RequestMatcher customizado
                                                .requestMatchers("/ws/info").permitAll()
                                                .requestMatchers("/ws/iframe.html").permitAll()
                                                // Permitir todos os transportes do SockJS usando um RequestMatcher
                                                // customizado
                                                // O SockJS usa URLs como: /ws/{server-id}/{session-id}/websocket,
                                                // /ws/{server-id}/{session-id}/xhr, etc.
                                                .requestMatchers(new RequestMatcher() {
                                                        @Override
                                                        public boolean matches(HttpServletRequest request) {
                                                                String path = request.getRequestURI();
                                                                if (path.startsWith("/ws/") && path.length() > 4) {
                                                                        String subPath = path.substring(4); // Remove
                                                                                                            // "/ws/"
                                                                        return subPath.contains("/websocket") ||
                                                                                        subPath.contains("/xhr") ||
                                                                                        subPath.contains("/eventsource")
                                                                                        ||
                                                                                        subPath.contains("/htmlfile") ||
                                                                                        subPath.contains("/jsonp");
                                                                }
                                                                return false;
                                                        }
                                                }).permitAll()
                                                      .requestMatchers("/ws/**").permitAll()
                                                .requestMatchers("/ws").permitAll()
                                                .requestMatchers("/api/email/test").authenticated()
                                                .requestMatchers("/api/email/config").authenticated()
                                                // Endpoints pÃƒÂºblicos do portal (vagas, etc)
                                                .requestMatchers("/api/public/**").permitAll()
                                                // WhatsApp controller - apenas health público; ações de conexão/desconexão/QR exigem autenticação
                                                .requestMatchers("/api/whatsapp/health").permitAll()
                                                .requestMatchers("/api/whatsapp/**").authenticated()
                                                .requestMatchers("/api/payslips/test-download/**").authenticated()
                                                .requestMatchers("/api/invoices/public/test-cost-centers").authenticated()
                                                .requestMatchers("/api/invoices/public/debug-cost-centers").authenticated()
                                                .requestMatchers("/api/invoices/cost-centers").permitAll()
                                                .requestMatchers("/api/accounts-receivable/public/test").authenticated()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers("/api/v1/document-processing/**").authenticated()
                                                // Arquivos pÃƒÂºblicos (imagens e uploads)
                                                .requestMatchers("/uploads/**").permitAll()
                                                // Logos e banners de empresas - permitir acesso pÃºblico para exibiÃ§Ã£o
                                                .requestMatchers("/api/uploads/companies/logos/**").permitAll()
                                                .requestMatchers("/api/uploads/companies/banners/**").permitAll()
                                                .requestMatchers("/api/uploads/companies/logo").authenticated()
                                                .requestMatchers("/api/uploads/companies/banner-upload", "/api/uploads/companies/banners").authenticated()
                                                .requestMatchers("/api/uploads/**").authenticated() // Outros arquivos
                                                                                                    // do chat requerem
                                                                                                    // autenticaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/files/**").permitAll()
                                                // Endpoints HR - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/hr/**")
                                                .hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE",
                                                                "EMPLOYEES_CREATE", "EMPLOYEES_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "HR", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_HR", "ROLE_RH")
                                                // Endpoints SST - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/sst/**")
                                                .hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE",
                                                                "EMPLOYEES_CREATE", "EMPLOYEES_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "HR", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_HR", "ROLE_RH")
                                                // Endpoints de usuÃƒÂ¡rios - permitir leitura para usuÃƒÂ¡rios autenticados
                                                // (para
                                                // chat), escrita requer permissÃƒÂµes especÃƒÂ­ficas
                                                // IMPORTANTE: Regras especÃƒÂ­ficas devem vir ANTES das genÃƒÂ©ricas
                                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/users/{id}")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/users/**")
                                                .hasAnyAuthority("USERS_CREATE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                                                "/api/users/**")
                                                .hasAnyAuthority("USERS_WRITE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                                                "/api/users/**")
                                                .hasAnyAuthority("USERS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                .requestMatchers("/api/users/**")
                                                .hasAnyAuthority("USERS_READ", "USERS_WRITE", "USERS_CREATE",
                                                                "USERS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN")
                                                // Endpoints de grupos - permitir consulta de prÃƒÂ³prios grupos para
                                                // usuÃƒÂ¡rios
                                                // autenticados
                                                .requestMatchers("/api/groups/user/**").authenticated()
                                                // Endpoints de grupos - operaÃƒÂ§ÃƒÂµes administrativas requerem
                                                // permissÃƒÂµes
                                                // especÃƒÂ­ficas
                                                .requestMatchers("/api/groups/**")
                                                .hasAnyAuthority("GROUPS_READ", "GROUPS_WRITE", "GROUPS_CREATE",
                                                                "GROUPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "RH",
                                                                "DEPARTAMENTO_PESSOAL", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL")
                                                // Endpoints de equipamentos - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/equipments/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de EPIs - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/epis/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de controle de EPI - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/epi-control/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints da frota - requerem apenas autenticaÃƒÂ§ÃƒÂ£o (temporÃƒÂ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/frota/vehicle-gate-checklists/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_PORTARIA",
                                                                "ROLE_MECANICO", "ROLE_MOTORISTA")
                                                // ConfiguraÃ§Ã£o de itens de checklist por veÃ­culo - leitura autenticada
                                                // (motorista lÃª para executar o checklist), escrita para admin/portaria
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/frota/checklist-configs/**")
                                                .authenticated()
                                                .requestMatchers("/api/frota/checklist-configs/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_PORTARIA",
                                                                "ROLE_MECANICO")
                                                .requestMatchers("/api/mechanic/dashboard/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_MECANICO")
                                                // Endpoints de Ordem de Serviço (Frota) - Motoristas e Mecânicos podem criar e consultar OS
                                                .requestMatchers("/api/fleet-work-orders/**", "/api/v1/fleet-work-orders/**").authenticated()
                                                .requestMatchers("/api/frota/**").authenticated()
                                                .requestMatchers("/api/client-checklists/**").authenticated()
                                                // Endpoints da Client Area (Mobile PWA)
                                                .requestMatchers("/api/client-area/**")
                                                .hasAnyAuthority("ROLE_CLIENT_MANAGER", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de fuel-records - requerem apenas autenticaÃƒÂ§ÃƒÂ£o
                                                // (temporÃƒÂ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fuel-records/**").authenticated()
                                                // Endpoints de fuel-stations - requerem apenas autenticaÃƒÂ§ÃƒÂ£o
                                                // (temporÃƒÂ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fuel-stations/**").authenticated()
                                                // Endpoints de veÃƒÂ­culos - requerem apenas autenticaÃƒÂ§ÃƒÂ£o (temporÃƒÂ¡rio
                                                // para
                                                // desenvolvimento)
                                                .requestMatchers("/api/vehicles/**").authenticated()
                                                // Endpoints de work-posts - requerem autenticaÃ§Ã£o (antes pÃºblico para debug)
                                                .requestMatchers("/api/work-posts/**").authenticated()
                                                // Endpoints de guias de transporte - requerem autenticaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/api/transport-guides/**").authenticated()
                                                // Endpoints de reconhecimento facial - requerem apenas autenticaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/api/facial-recognition/recognize").authenticated()
                                                .requestMatchers("/api/facial-recognition/test").authenticated()
                                                .requestMatchers("/api/facial-recognition/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "HR_READ", "HR_WRITE",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de autenticaÃƒÂ§ÃƒÂ£o de supervisores - pÃƒÂºblicos para login
                                                .requestMatchers("/api/supervisor-auth/**").permitAll()
                                                // Endpoints de supervisores - requerem permissÃƒÂµes administrativas
                                                .requestMatchers("/api/supervisors/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de consentimento LGPD - pÃƒÂºblicos para verificaÃƒÂ§ÃƒÂ£o e
                                                // aceitaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/api/first-access/**").authenticated()
                                                .requestMatchers("/api/user-terms-consent/check/**").permitAll()
                                                .requestMatchers("/api/user-terms-consent/accept").permitAll()
                                                .requestMatchers("/api/user-terms-consent/versions").permitAll()
                                                .requestMatchers("/api/user-terms-consent/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de contratos - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/contracts/**")
                                                .hasAnyAuthority("CONTRACTS_READ", "CONTRACTS_WRITE",
                                                                "CONTRACTS_CREATE", "CONTRACTS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_GESTOR")
                                                // Endpoints de propostas - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/proposals/**")
                                                .hasAnyAuthority("PROPOSALS_READ", "PROPOSALS_WRITE",
                                                                "PROPOSALS_CREATE", "PROPOSALS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_COMERCIAL")
                                                // Endpoints financeiros - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/financial/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                // Endpoints de invoices (contas a pagar)
                                                .requestMatchers("/api/invoices/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "FINANCEIRO",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN",
                                                                "ROLE_FINANCEIRO")
                                                // Endpoints de suppliers (fornecedores) - requerem permissÃƒÂµes
                                                // administrativas
                                                // ou financeiras
                                                .requestMatchers("/api/suppliers/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "FINANCEIRO",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN",
                                                                "ROLE_FINANCEIRO", "FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE",
                                                                "FINANCIAL_DELETE")
                                                // Endpoints de accounts-receivable (contas a receber) - requerem
                                                // permissÃƒÂµes
                                                // especÃƒÂ­ficas
                                                .requestMatchers("/api/accounts-receivable/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                // Endpoints de scheduled-payments (pagamentos agendados) - requerem
                                                // permissÃƒÂµes
                                                // especÃƒÂ­ficas
                                                .requestMatchers("/api/scheduled-payments/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "FINANCEIRO",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN",
                                                                "ROLE_FINANCEIRO")
                                                // Endpoints de bank-reconciliation (conciliaÃƒÂ§ÃƒÂ£o bancÃƒÂ¡ria) - requerem
                                                // permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/bank-reconciliation/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                // Endpoints de bancos e agÃƒÂªncias - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/banks/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                .requestMatchers("/api/agencies/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "FINANCEIRO",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_FINANCEIRO")
                                                // Endpoints de holerites - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/payslips/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "PAYSLIPS_PUBLISH", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_RH", "ROLE_FINANCEIRO",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_COLABORADOR", "ROLE_MOTORISTA", "ROLE_MECANICO",
                                                                "ROLE_PORTARIA")
                                                // Endpoints de recibos - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/receipts/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_FINANCEIRO", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_COLABORADOR")
                                                // Endpoints de documentos unificados - arquivos pÃƒÂºblicos para
                                                // download/visualizaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/api/unified-documents/public/**").permitAll()
                                                .requestMatchers("/api/unified-documents/download/**").permitAll()
                                                // Endpoints de documentos unificados - operaÃƒÂ§ÃƒÂµes requerem permissÃƒÂµes
                                                .requestMatchers("/api/unified-documents/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_FINANCEIRO", "ROLE_COLABORADOR", "ROLE_MOTORISTA",
                                                                "ROLE_MECANICO", "ROLE_PORTARIA")
                                                // SEGURANÃ‡A: organizaÃ§Ã£o por setor agora requer autenticaÃ§Ã£o (antes pÃºblico para debug)
                                                .requestMatchers("/api/sector-organization/**").authenticated()
                                                // Endpoints de relatÃƒÂ³rios - requerem permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers("/api/reports/**")
                                                .hasAnyAuthority("REPORTS_READ", "REPORTS_GENERATE", "REPORTS_EXPORT",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de chat e leads (CRM)
                                                .requestMatchers("/api/v1/chat/**").authenticated()
                                                // Assistente virtual BiliFlux (qualquer usuário autenticado)
                                                .requestMatchers("/api/v1/biliflux/**").authenticated()
                                                .requestMatchers("/api/leads/**").authenticated()
                                                // Endpoints de mensagens - permitir para todos os roles principais,
                                                // incluindo
                                                // Departamento Pessoal
                                                .requestMatchers("/api/v1/messages/**").hasAnyAuthority(
                                                                "SUPER_ADMIN",
                                                                "ADMIN",
                                                                "SUPERVISOR",
                                                                "COLABORADOR",
                                                                "VIGILANTE",
                                                                "RH",
                                                                "DEPARTAMENTO_PESSOAL",
                                                                "FINANCEIRO",
                                                                "GESTOR",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN",
                                                                "ROLE_SUPERVISOR",
                                                                "ROLE_COLABORADOR",
                                                                "ROLE_VIGILANTE",
                                                                "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL",
                                                                "ROLE_FINANCEIRO",
                                                                "ROLE_GESTOR",
                                                                "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN")
                                                // Endpoints de suporte e atendimento - requerem permissÃƒÂµes
                                                // especÃƒÂ­ficas
                                                .requestMatchers("/api/v1/support/**")
                                                .hasAnyAuthority("SUPPORT_READ", "SUPPORT_WRITE", "SUPPORT_CREATE",
                                                                "SUPPORT_DELETE",
                                                                "SUPPORT_MANAGE", "ATTENDANCE_READ", "ATTENDANCE_WRITE",
                                                                "ATTENDANCE_MANAGE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL",
                                                                "ROLE_FINANCEIRO", "ROLE_COMERCIAL", "ROLE_SUPERVISOR")
                                                // Endpoints de chatbot - mesmas permissÃƒÂµes de suporte
                                                .requestMatchers("/api/v1/support/chatbot/**")
                                                .hasAnyAuthority("SUPPORT_READ", "SUPPORT_WRITE", "SUPPORT_CREATE",
                                                                "SUPPORT_DELETE",
                                                                "SUPPORT_MANAGE", "ATTENDANCE_READ", "ATTENDANCE_WRITE",
                                                                "ATTENDANCE_MANAGE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL",
                                                                "ROLE_FINANCEIRO", "ROLE_COMERCIAL", "ROLE_SUPERVISOR")
                                                // SEGURANÃ‡A: mÃ³dulos com dados pessoais que estavam "temporariamente pÃºblicos
                                                // para debug" agora exigem autenticaÃ§Ã£o (LGPD).
                                                .requestMatchers("/api/employees/**").authenticated()
                                                .requestMatchers("/api/units/**").authenticated()
                                                .requestMatchers("/api/companies", "/api/companies/**").authenticated()
                                                .requestMatchers("/api/positions/**").authenticated()
                                                .requestMatchers("/api/clients/**").authenticated()
                                                .requestMatchers("/api/documents/**").authenticated()
                                                .requestMatchers("/api/employee-certifications/**").authenticated()
                                                // Endpoints de multas - requerem apenas autenticaÃƒÂ§ÃƒÂ£o (temporÃƒÂ¡rio
                                                // para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fines/**").authenticated()
                                                .requestMatchers("/api/vehicles/**").authenticated()
                                                .requestMatchers("/api/frota/**").authenticated()
                                                .requestMatchers("/api/fuel-records/**").authenticated()
                                                .requestMatchers("/api/maintenances/**").authenticated()
                                                .requestMatchers("/api/drivers/**").authenticated()
                                                .requestMatchers("/api/groups/**").authenticated()
                                                .requestMatchers("/api/tires/**").authenticated()
                                                // Endpoints de dashboard - requerem apenas autenticaÃƒÂ§ÃƒÂ£o para
                                                // usuÃƒÂ¡rios
                                                // logados
                                                .requestMatchers("/api/dashboard/**").authenticated()
                                                // SEGURANÃ‡A: endpoints operacionais que estavam pÃºblicos para teste de
                                                // integraÃ§Ã£o agora exigem autenticaÃ§Ã£o.
                                                .requestMatchers("/api/schedules/**").authenticated()
                                                .requestMatchers("/api/activity-reports/**").authenticated()
                                                .requestMatchers("/api/orders-of-service/**").authenticated()
                                                .requestMatchers("/api/operational/**").authenticated()
                                                .requestMatchers("/api/occurrences/**").authenticated()
                                                .requestMatchers("/api/vacation-coverages/**").authenticated()
                                                .requestMatchers("/api/work-post-assignments/**").authenticated()
                                                .requestMatchers("/api/specific-activities/**").authenticated()
                                                .requestMatchers("/api/absences/**").authenticated()
                                                // SEGURANÃ‡A: endpoints operacionais que estavam pÃºblicos para debug
                                                .requestMatchers("/api/equipment/**").authenticated()
                                                .requestMatchers("/api/alerts/**").authenticated()
                                                .requestMatchers("/api/visit-controls/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_PORTARIA")
                                                // Endpoints de relatÃƒÂ³rios de visitas - requerem autenticaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS,
                                                                "/api/visit-control-reports/**")
                                                .permitAll()
                                                .requestMatchers("/api/visit-control-reports/**").authenticated()
                                                // Endpoints de dados de teste - requerem autenticaÃ§Ã£o (antes pÃºblicos para desenvolvimento)
                                                .requestMatchers("/api/test-data/**").authenticated()
                                                // Endpoints de mediÃ§Ãµes e retenÃ§Ãµes contratuais - requerem autenticaÃ§Ã£o
                                                .requestMatchers("/api/measurements/test-pdf").permitAll()
                                                .requestMatchers("/api/measurements/*/pdf").permitAll()
                                                .requestMatchers("/api/measurements/*/excel").permitAll()
                                                .requestMatchers("/api/measurements/bulk/pdf").permitAll()
                                                .requestMatchers("/api/measurements/bulk/excel").permitAll()
                                                .requestMatchers("/api/measurements/**").authenticated()
                                                .requestMatchers("/api/contract-retentions/**").authenticated()
                                                // Endpoints de estoque - requerem permissÃƒÂµes especÃƒÂ­ficas ou
                                                // autenticaÃƒÂ§ÃƒÂ£o
                                                .requestMatchers("/api/stock/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "STOCK_READ",
                                                                "STOCK_WRITE", "STOCK_CREATE",
                                                                "STOCK_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // SEGURANÃ‡A: mÃ³dulos de documentos que estavam pÃºblicos para teste agora exigem autenticaÃ§Ã£o
                                                .requestMatchers("/api/modelos-documentos/**").authenticated()
                                                .requestMatchers("/api/documentos-gerados/**").authenticated()
                                                .requestMatchers("/api/assinaturas-documentos/**").authenticated()
                                                // Endpoints de dependentes - leitura requer permissÃƒÂµes bÃƒÂ¡sicas,
                                                // escrita
                                                // requer permissÃƒÂµes especÃƒÂ­ficas
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/dependents/**")
                                                .hasAnyAuthority(
                                                                "SUPER_ADMIN",
                                                                "ADMIN",
                                                                "GESTOR",
                                                                "RH",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN",
                                                                "ROLE_GESTOR",
                                                                "ROLE_RH",
                                                                "EMPLOYEES_READ",
                                                                "EMPLOYEES_WRITE")
                                                .requestMatchers("/api/dependents/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "GESTOR", "RH",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_RH", "EMPLOYEES_READ",
                                                                "EMPLOYEES_WRITE")
                                                // Endpoints de folha de ponto (time-sheets)
                                                .requestMatchers("/api/time-sheets/**").hasAnyAuthority(
                                                                "TIME_RECORD_READ",
                                                                "SUPER_ADMIN",
                                                                "ADMIN",
                                                                "RH",
                                                                "DEPARTAMENTO_PESSOAL",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN",
                                                                "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL")
                                                // Todo o resto requer autenticaÃƒÂ§ÃƒÂ£o
                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(jwtTenantFilter, UsernamePasswordAuthenticationFilter.class)
                                // SEGURANÃ‡A: rate limiting de tentativas de login (10/15min por IP)
                                .addFilterBefore(loginRateLimitFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(customUserDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder());
                return authProvider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        // Ajusta o prefixo padrÃƒÂ£o de roles para vazio, permitindo usar nomes como
        // "SUPER_ADMIN"
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // Restringir origens permitidas estritamente aos domínios oficiais e dev local (OWASP CORS hardening)
                configuration.setAllowedOriginPatterns(Arrays.asList(
                                "https://*.fluxbus.com.br",
                                "https://fluxbus.com.br",
                                "https://*.z7botsolutions.com.br",
                                "https://z7botsolutions.com.br",
                                "http://localhost:[*]",
                                "http://127.0.0.1:[*]",
                                "https://localhost:[*]",
                                "https://127.0.0.1:[*]"
                ));
                configuration.setAllowedMethods(
                                Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
                configuration.setAllowedHeaders(Arrays.asList("*"));
                configuration.setAllowCredentials(true);
                // Configurar exposiÃƒÂ§ÃƒÂ£o de headers para imagens
                configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With",
                                "Accept",
                                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
