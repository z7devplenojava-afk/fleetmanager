package com.z7design.fleet_manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
public class SecurityConfig {

        private final CustomUserDetailsService customUserDetailsService;
        @Lazy
        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final JwtTenantFilter jwtTenantFilter;

        public SecurityConfig(CustomUserDetailsService customUserDetailsService,
                        @Lazy JwtAuthenticationFilter jwtAuthenticationFilter,
                        JwtTenantFilter jwtTenantFilter) {
                this.customUserDetailsService = customUserDetailsService;
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.jwtTenantFilter = jwtTenantFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.disable())
                                                .contentTypeOptions(contentType -> {
                                                }))
                                .authorizeHttpRequests(auth -> auth
                                                // Endpoints pÃºblicos (sem autenticaÃ§Ã£o)
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/files/**").permitAll()
                                                .requestMatchers("/api/test/**").permitAll()
                                                .requestMatchers("/api/health").permitAll()
                                                .requestMatchers("/api/diagnostic/**").permitAll()
                                                .requestMatchers("/api/debug/**").permitAll()
                                                // WebSocket endpoints - permitir todos os transportes do SockJS (info,
                                                // websocket, xhr, eventsource, htmlfile, jsonp, iframe)
                                                // O SockJS faz requisiÃ§Ãµes HTTP iniciais que nÃ£o incluem o token JWT
                                                // A autenticaÃ§Ã£o real acontece quando a conexÃ£o STOMP Ã©
                                                // estabelecida (via
                                                // WebSocketSecurityConfig)
                                                // IMPORTANTE: Permitir todos os padrÃµes do SockJS, mas a conexÃ£o
                                                // STOMP serÃ¡
                                                // autenticada no WebSocketSecurityConfig
                                                // NOTA: PadrÃµes com ** devem ser os Ãºltimos elementos, entÃ£o usamos
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
                                                .requestMatchers("/ws/**").authenticated()
                                                .requestMatchers("/ws").authenticated()
                                                .requestMatchers("/api/email/test").authenticated()
                                                .requestMatchers("/api/email/config").authenticated()
                                                // Endpoints pÃºblicos do portal (vagas, etc)
                                                .requestMatchers("/api/public/**").permitAll()
                                                // WhatsApp controller - pÃºblico para pareamento/health em dev
                                                .requestMatchers("/api/whatsapp/**").permitAll()
                                                .requestMatchers("/api/payslips/test-download/**").permitAll()
                                                .requestMatchers("/api/invoices/public/test-cost-centers").permitAll()
                                                .requestMatchers("/api/invoices/public/debug-cost-centers").permitAll()
                                                .requestMatchers("/api/invoices/cost-centers").permitAll()
                                                .requestMatchers("/api/accounts-receivable/public/test").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers("/api/v1/document-processing/**").authenticated()
                                                // Arquivos pÃºblicos (imagens e uploads)
                                                .requestMatchers("/uploads/**").permitAll()
                                                // Logos de empresas - permitir acesso pÃºblico (para exibiÃ§Ã£o em
                                                // relatÃ³rios)
                                                .requestMatchers("/api/uploads/companies/logos/**").permitAll()
                                                .requestMatchers("/api/uploads/**").authenticated() // Outros arquivos
                                                                                                    // do chat requerem
                                                                                                    // autenticaÃ§Ã£o
                                                .requestMatchers("/files/**").permitAll()
                                                // Endpoints HR - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/hr/**")
                                                .hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE",
                                                                "EMPLOYEES_CREATE", "EMPLOYEES_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "HR", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_HR", "ROLE_RH")
                                                // Endpoints SST - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/sst/**")
                                                .hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE",
                                                                "EMPLOYEES_CREATE", "EMPLOYEES_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "HR", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_HR", "ROLE_RH")
                                                // Endpoints de usuÃ¡rios - permitir leitura para usuÃ¡rios autenticados
                                                // (para
                                                // chat), escrita requer permissÃµes especÃ­ficas
                                                // IMPORTANTE: Regras especÃ­ficas devem vir ANTES das genÃ©ricas
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
                                                // Endpoints de grupos - permitir consulta de prÃ³prios grupos para
                                                // usuÃ¡rios
                                                // autenticados
                                                .requestMatchers("/api/groups/user/**").authenticated()
                                                // Endpoints de grupos - operaÃ§Ãµes administrativas requerem
                                                // permissÃµes
                                                // especÃ­ficas
                                                .requestMatchers("/api/groups/**")
                                                .hasAnyAuthority("GROUPS_READ", "GROUPS_WRITE", "GROUPS_CREATE",
                                                                "GROUPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "RH",
                                                                "DEPARTAMENTO_PESSOAL", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL")
                                                // Endpoints de equipamentos - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/equipments/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de EPIs - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/epis/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de controle de EPI - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/epi-control/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "SUPER_ADMIN",
                                                                "ADMIN", "GESTOR",
                                                                "SUPERVISOR", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints da frota - requerem apenas autenticaÃ§Ã£o (temporÃ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/frota/vehicle-gate-checklists/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_PORTARIA",
                                                                "ROLE_MECANICO", "ROLE_MOTORISTA")
                                                // Configuração de itens de checklist por veículo - leitura autenticada
                                                // (motorista lê para executar o checklist), escrita para admin/portaria
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
                                                .requestMatchers("/api/frota/**").authenticated()
                                                .requestMatchers("/api/client-checklists/**").authenticated()
                                                // Endpoints da Client Area (Mobile PWA)
                                                .requestMatchers("/api/client-area/**")
                                                .hasAnyAuthority("ROLE_CLIENT_MANAGER", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de fuel-records - requerem apenas autenticaÃ§Ã£o
                                                // (temporÃ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fuel-records/**").authenticated()
                                                // Endpoints de fuel-stations - requerem apenas autenticaÃ§Ã£o
                                                // (temporÃ¡rio para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fuel-stations/**").authenticated()
                                                // Endpoints de veÃ­culos - requerem apenas autenticaÃ§Ã£o (temporÃ¡rio
                                                // para
                                                // desenvolvimento)
                                                .requestMatchers("/api/vehicles/**").authenticated()
                                                // Endpoints de work-posts - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/work-posts/**").permitAll()
                                                // Endpoints de guias de transporte - requerem autenticaÃ§Ã£o
                                                .requestMatchers("/api/transport-guides/**").authenticated()
                                                // Endpoints de reconhecimento facial - requerem apenas autenticaÃ§Ã£o
                                                .requestMatchers("/api/facial-recognition/recognize").authenticated()
                                                .requestMatchers("/api/facial-recognition/test").permitAll()
                                                .requestMatchers("/api/facial-recognition/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "HR_READ", "HR_WRITE",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de autenticaÃ§Ã£o de supervisores - pÃºblicos para login
                                                .requestMatchers("/api/supervisor-auth/**").permitAll()
                                                // Endpoints de supervisores - requerem permissÃµes administrativas
                                                .requestMatchers("/api/supervisors/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de consentimento LGPD - pÃºblicos para verificaÃ§Ã£o e
                                                // aceitaÃ§Ã£o
                                                .requestMatchers("/api/first-access/**").authenticated()
                                                .requestMatchers("/api/user-terms-consent/check/**").permitAll()
                                                .requestMatchers("/api/user-terms-consent/accept").permitAll()
                                                .requestMatchers("/api/user-terms-consent/versions").permitAll()
                                                .requestMatchers("/api/user-terms-consent/**")
                                                .hasAnyAuthority("SUPER_ADMIN", "ADMIN", "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN")
                                                // Endpoints de contratos - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/contracts/**")
                                                .hasAnyAuthority("CONTRACTS_READ", "CONTRACTS_WRITE",
                                                                "CONTRACTS_CREATE", "CONTRACTS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_GESTOR")
                                                // Endpoints de propostas - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/proposals/**")
                                                .hasAnyAuthority("PROPOSALS_READ", "PROPOSALS_WRITE",
                                                                "PROPOSALS_CREATE", "PROPOSALS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_COMERCIAL")
                                                // Endpoints financeiros - requerem permissÃµes especÃ­ficas
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
                                                // Endpoints de suppliers (fornecedores) - requerem permissÃµes
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
                                                // permissÃµes
                                                // especÃ­ficas
                                                .requestMatchers("/api/accounts-receivable/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                // Endpoints de scheduled-payments (pagamentos agendados) - requerem
                                                // permissÃµes
                                                // especÃ­ficas
                                                .requestMatchers("/api/scheduled-payments/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "SUPER_ADMIN", "ADMIN", "FINANCEIRO",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN",
                                                                "ROLE_FINANCEIRO")
                                                // Endpoints de bank-reconciliation (conciliaÃ§Ã£o bancÃ¡ria) - requerem
                                                // permissÃµes especÃ­ficas
                                                .requestMatchers("/api/bank-reconciliation/**")
                                                .hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE",
                                                                "FINANCIAL_CREATE", "FINANCIAL_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_FINANCEIRO")
                                                // Endpoints de bancos e agÃªncias - requerem permissÃµes especÃ­ficas
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
                                                // Endpoints de holerites - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/payslips/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "PAYSLIPS_PUBLISH", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_RH", "ROLE_FINANCEIRO",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_COLABORADOR", "ROLE_MOTORISTA", "ROLE_MECANICO",
                                                                "ROLE_PORTARIA")
                                                // Endpoints de recibos - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/receipts/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_FINANCEIRO", "ROLE_COMPANY_ADMIN",
                                                                "ROLE_FLEX_ADMIN", "ROLE_COLABORADOR")
                                                // Endpoints de documentos unificados - arquivos pÃºblicos para
                                                // download/visualizaÃ§Ã£o
                                                .requestMatchers("/api/unified-documents/public/**").permitAll()
                                                .requestMatchers("/api/unified-documents/download/**").permitAll()
                                                // Endpoints de documentos unificados - operaÃ§Ãµes requerem permissÃµes
                                                .requestMatchers("/api/unified-documents/**")
                                                .hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE",
                                                                "PAYSLIPS_DELETE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_FINANCEIRO", "ROLE_COLABORADOR", "ROLE_MOTORISTA",
                                                                "ROLE_MECANICO", "ROLE_PORTARIA")
                                                // Endpoints de organizaÃ§Ã£o por setor - temporariamente pÃºblico para
                                                .requestMatchers("/api/sector-organization/**").permitAll()
                                                // Endpoints de relatÃ³rios - requerem permissÃµes especÃ­ficas
                                                .requestMatchers("/api/reports/**")
                                                .hasAnyAuthority("REPORTS_READ", "REPORTS_GENERATE", "REPORTS_EXPORT",
                                                                "ROLE_SUPER_ADMIN",
                                                                "ROLE_ADMIN", "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de chat e leads (CRM)
                                                .requestMatchers("/api/v1/chat/**").authenticated()
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
                                                // Endpoints de suporte e atendimento - requerem permissÃµes
                                                // especÃ­ficas
                                                .requestMatchers("/api/v1/support/**")
                                                .hasAnyAuthority("SUPPORT_READ", "SUPPORT_WRITE", "SUPPORT_CREATE",
                                                                "SUPPORT_DELETE",
                                                                "SUPPORT_MANAGE", "ATTENDANCE_READ", "ATTENDANCE_WRITE",
                                                                "ATTENDANCE_MANAGE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL",
                                                                "ROLE_FINANCEIRO", "ROLE_COMERCIAL", "ROLE_SUPERVISOR")
                                                // Endpoints de chatbot - mesmas permissÃµes de suporte
                                                .requestMatchers("/api/v1/support/chatbot/**")
                                                .hasAnyAuthority("SUPPORT_READ", "SUPPORT_WRITE", "SUPPORT_CREATE",
                                                                "SUPPORT_DELETE",
                                                                "SUPPORT_MANAGE", "ATTENDANCE_READ", "ATTENDANCE_WRITE",
                                                                "ATTENDANCE_MANAGE",
                                                                "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH",
                                                                "ROLE_DEPARTAMENTO_PESSOAL",
                                                                "ROLE_FINANCEIRO", "ROLE_COMERCIAL", "ROLE_SUPERVISOR")
                                                // Endpoints de funcionÃ¡rios - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/employees/**").permitAll()
                                                // Endpoints de unidades - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/units/**").permitAll()
                                                // Endpoints de empresas - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/companies/**").permitAll()
                                                // Endpoints de cargos/posiÃ§Ãµes - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/positions/**").permitAll()
                                                // Endpoints de clientes - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/clients/**").permitAll()
                                                // Endpoints de documentos - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/documents/**").permitAll()
                                                // Endpoints de certificaÃ§Ãµes de funcionÃ¡rios - temporariamente
                                                // pÃºblicos
                                                // para debug
                                                .requestMatchers("/api/employee-certifications/**").permitAll()
                                                // Endpoints de multas - requerem apenas autenticaÃ§Ã£o (temporÃ¡rio
                                                // para
                                                // desenvolvimento)
                                                .requestMatchers("/api/fines/**").authenticated()
                                                // Pneus / gestão de pneus
                                                .requestMatchers("/api/tires/**").authenticated()
                                                // Endpoints de dashboard - requerem apenas autenticaÃ§Ã£o para
                                                // usuÃ¡rios
                                                // logados
                                                .requestMatchers("/api/dashboard/**").authenticated()
                                                // Endpoints operacionais - temporariamente pÃºblicos para teste de
                                                // integraÃ§Ã£o
                                                .requestMatchers("/api/schedules/**").permitAll()
                                                .requestMatchers("/api/activity-reports/**").permitAll()
                                                .requestMatchers("/api/orders-of-service/**").permitAll()
                                                .requestMatchers("/api/operational/**").permitAll()
                                                .requestMatchers("/api/occurrences/**").permitAll()
                                                .requestMatchers("/api/vacation-coverages/**").permitAll()
                                                .requestMatchers("/api/work-post-assignments/**").permitAll()
                                                .requestMatchers("/api/specific-activities/**").permitAll()
                                                .requestMatchers("/api/absences/**").permitAll()
                                                // Endpoints operacionais - temporariamente pÃºblicos para debug
                                                .requestMatchers("/api/equipment/**").permitAll()
                                                .requestMatchers("/api/alerts/**").permitAll()
                                                .requestMatchers("/api/visit-controls/**")
                                                .hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_PORTARIA")
                                                // Endpoints de relatÃ³rios de visitas - requerem autenticaÃ§Ã£o
                                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS,
                                                                "/api/visit-control-reports/**")
                                                .permitAll()
                                                .requestMatchers("/api/visit-control-reports/**").authenticated()
                                                // Endpoints de dados de teste - pÃºblicos para desenvolvimento
                                                .requestMatchers("/api/test-data/**").permitAll()
                                                // Endpoints de medições e retenções contratuais - requerem autenticação
                                                .requestMatchers("/api/measurements/test-pdf").permitAll()
                                                .requestMatchers("/api/measurements/*/pdf").permitAll()
                                                .requestMatchers("/api/measurements/*/excel").permitAll()
                                                .requestMatchers("/api/measurements/bulk/pdf").permitAll()
                                                .requestMatchers("/api/measurements/bulk/excel").permitAll()
                                                .requestMatchers("/api/measurements/**").authenticated()
                                                .requestMatchers("/api/contract-retentions/**").authenticated()
                                                // Endpoints de estoque - requerem permissÃµes especÃ­ficas ou
                                                // autenticaÃ§Ã£o
                                                .requestMatchers("/api/stock/**")
                                                .hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE",
                                                                "EQUIPMENTS_CREATE",
                                                                "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "STOCK_READ",
                                                                "STOCK_WRITE", "STOCK_CREATE",
                                                                "STOCK_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN",
                                                                "ROLE_COMPANY_ADMIN", "ROLE_FLEX_ADMIN",
                                                                "ROLE_GESTOR", "ROLE_SUPERVISOR")
                                                // Endpoints de modelos de documentos - temporariamente pÃºblico para
                                                // teste
                                                .requestMatchers("/api/modelos-documentos/**").permitAll()
                                                // Endpoints de documentos gerados - temporariamente pÃºblico para teste
                                                .requestMatchers("/api/documentos-gerados/**").permitAll()
                                                // Endpoints de assinaturas de documentos - temporariamente pÃºblico
                                                // para teste
                                                .requestMatchers("/api/assinaturas-documentos/**").permitAll()
                                                // Endpoints de dependentes - leitura requer permissÃµes bÃ¡sicas,
                                                // escrita
                                                // requer permissÃµes especÃ­ficas
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
                                                // Todo o resto requer autenticaÃ§Ã£o
                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(jwtTenantFilter, UsernamePasswordAuthenticationFilter.class);

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

        // Ajusta o prefixo padrÃ£o de roles para vazio, permitindo usar nomes como
        // "SUPER_ADMIN"
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // Permitir todas as origens para desenvolvimento (incluindo diferentes portas
                // do frontend)
                configuration.setAllowedOriginPatterns(Arrays.asList("*"));
                configuration.setAllowedMethods(
                                Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
                configuration.setAllowedHeaders(Arrays.asList("*"));
                configuration.setAllowCredentials(true);
                // Configurar exposiÃ§Ã£o de headers para imagens
                configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With",
                                "Accept",
                                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
