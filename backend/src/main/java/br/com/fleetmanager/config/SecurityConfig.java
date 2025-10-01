package br.com.fleetmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import br.com.fleetmanager.security.JwtAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(UserDetailsService userDetailsService, JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
                .contentTypeOptions(contentType -> {})
            )
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos (sem autenticação)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/files/**").permitAll()
                .requestMatchers("/api/test/health").permitAll()
                .requestMatchers("/api/payslips/test-download/**").permitAll()
                .requestMatchers("/api/invoices/public/test-cost-centers").permitAll()
                .requestMatchers("/api/invoices/public/debug-cost-centers").permitAll()
                .requestMatchers("/api/invoices/cost-centers").permitAll()
                .requestMatchers("/api/accounts-receivable/public/test").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Arquivos públicos (imagens e uploads)
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/files/**").permitAll()
                // Endpoints HR - requerem permissões específicas
                .requestMatchers("/api/hr/**").hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE", "EMPLOYEES_CREATE", "EMPLOYEES_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_HR")
                // Endpoints SST - requerem permissões específicas
                .requestMatchers("/api/sst/**").hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE", "EMPLOYEES_CREATE", "EMPLOYEES_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_HR")
                // Endpoints de usuários - requerem permissões específicas
                .requestMatchers("/api/users/**").hasAnyAuthority("USERS_READ", "USERS_WRITE", "USERS_CREATE", "USERS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN")
                // Endpoints de grupos - requerem permissões específicas
                .requestMatchers("/api/groups/**").hasAnyAuthority("GROUPS_READ", "GROUPS_WRITE", "GROUPS_CREATE", "GROUPS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN")
                // Endpoints de equipamentos - requerem permissões específicas
                .requestMatchers("/api/equipments/**").hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE", "EQUIPMENTS_CREATE", "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR", "ROLE_SUPERVISOR")
                // Endpoints de EPIs - requerem permissões específicas
                .requestMatchers("/api/epis/**").hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE", "EQUIPMENTS_CREATE", "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR", "ROLE_SUPERVISOR")
                // Endpoints de controle de EPI - requerem permissões específicas
                .requestMatchers("/api/epi-control/**").hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE", "EQUIPMENTS_CREATE", "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR", "ROLE_SUPERVISOR")
                // Endpoints da frota - requerem apenas autenticação (temporário para desenvolvimento)
                .requestMatchers("/api/frota/**").authenticated()
                // Endpoints de fuel-records - requerem apenas autenticação (temporário para desenvolvimento)
                .requestMatchers("/api/fuel-records/**").authenticated()
                // Endpoints de fuel-stations - requerem apenas autenticação (temporário para desenvolvimento)
                .requestMatchers("/api/fuel-stations/**").authenticated()
                // Endpoints de veículos - requerem apenas autenticação (temporário para desenvolvimento)
                .requestMatchers("/api/vehicles/**").authenticated()
                // Endpoints de work-posts - requerem apenas autenticação (temporário para debug)
                .requestMatchers("/api/work-posts/test-create").permitAll()
                .requestMatchers("/api/work-posts/test-clients").permitAll()
                .requestMatchers("/api/work-posts/**").authenticated()
                // Endpoints de clientes - requerem permissões específicas
                .requestMatchers("/api/clients/**").hasAnyAuthority("CLIENTS_READ", "CLIENTS_WRITE", "CLIENTS_CREATE", "CLIENTS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN")
                // Endpoints de contratos - requerem permissões específicas
                .requestMatchers("/api/contracts/**").hasAnyAuthority("CONTRACTS_READ", "CONTRACTS_WRITE", "CONTRACTS_CREATE", "CONTRACTS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR")
                // Endpoints financeiros - requerem permissões específicas
                .requestMatchers("/api/financial/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de invoices (contas a pagar) - requerem permissões específicas
                // Endpoints de invoices (contas a pagar) - temporariamente permitir para SUPER_ADMIN
                .requestMatchers("/api/invoices/**").hasAnyAuthority("ROLE_SUPER_ADMIN")
                // Endpoints de suppliers (fornecedores) - temporariamente permitir para SUPER_ADMIN
                .requestMatchers("/api/suppliers/**").hasAnyAuthority("ROLE_SUPER_ADMIN")
                // Endpoints de units (empresas) - temporariamente permitir para SUPER_ADMIN
                .requestMatchers("/api/units/**").hasAnyAuthority("ROLE_SUPER_ADMIN")
                // Endpoints de accounts-receivable (contas a receber) - requerem permissões específicas
                .requestMatchers("/api/accounts-receivable/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de scheduled-payments (pagamentos agendados) - requerem permissões específicas
                .requestMatchers("/api/scheduled-payments/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de bank-reconciliation (conciliação bancária) - requerem permissões específicas
                .requestMatchers("/api/bank-reconciliation/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de bancos e agências - requerem permissões específicas
                .requestMatchers("/api/banks/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                .requestMatchers("/api/agencies/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de holerites - requerem permissões específicas
                .requestMatchers("/api/payslips/**").hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE", "PAYSLIPS_DELETE", "PAYSLIPS_PUBLISH", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH", "ROLE_FINANCEIRO")
                // Endpoints de recibos - requerem permissões específicas
                .requestMatchers("/api/receipts/**").hasAnyAuthority("PAYSLIPS_READ", "PAYSLIPS_WRITE", "PAYSLIPS_CREATE", "PAYSLIPS_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_RH", "ROLE_FINANCEIRO")
                // Endpoints de relatórios - requerem permissões específicas
                .requestMatchers("/api/reports/**").hasAnyAuthority("REPORTS_READ", "REPORTS_GENERATE", "REPORTS_EXPORT", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR", "ROLE_SUPERVISOR")
                // Endpoints de chat - requerem permissões específicas
                .requestMatchers("/api/v1/chat/**").hasAnyAuthority("MESSAGES_READ", "MESSAGES_WRITE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPERVISOR", "ROLE_COLABORADOR")
                // Endpoints de mensagens - requerem permissões específicas
                .requestMatchers("/api/v1/messages/**").hasAnyAuthority("MESSAGES_READ", "MESSAGES_WRITE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPERVISOR", "ROLE_COLABORADOR")
                // Endpoints de funcionários - requerem permissões específicas
                .requestMatchers("/api/employees/**").hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE", "EMPLOYEES_CREATE", "EMPLOYEES_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_HR")
                // Endpoints de cargos/posições - requerem permissões específicas
                .requestMatchers("/api/positions/**").hasAnyAuthority("EMPLOYEES_READ", "EMPLOYEES_WRITE", "EMPLOYEES_CREATE", "EMPLOYEES_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_HR")
                // Endpoints de multas - requerem apenas autenticação (temporário para desenvolvimento)
                .requestMatchers("/api/fines/**").authenticated()
                // Endpoints de medições - requerem permissões específicas
                .requestMatchers("/api/measurements/**").hasAnyAuthority("FINANCIAL_READ", "FINANCIAL_WRITE", "FINANCIAL_CREATE", "FINANCIAL_DELETE", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCEIRO")
                // Endpoints de estoque - requerem permissões específicas
                .requestMatchers("/api/stock/**").hasAnyAuthority("EQUIPMENTS_READ", "EQUIPMENTS_WRITE", "EQUIPMENTS_CREATE", "EQUIPMENTS_DELETE", "EQUIPMENTS_ASSIGN", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_GESTOR", "ROLE_SUPERVISOR")
                // Endpoints de modelos de documentos - temporariamente público para teste
                .requestMatchers("/api/modelos-documentos/**").permitAll()
                // Endpoints de documentos gerados - temporariamente público para teste
                .requestMatchers("/api/documentos-gerados/**").permitAll()
                // Endpoints de assinaturas de documentos - temporariamente público para teste
                .requestMatchers("/api/assinaturas-documentos/**").permitAll()
                // Todo o resto requer autenticação
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permitir todas as origens para desenvolvimento (incluindo diferentes portas do frontend)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        // Configurar exposição de headers para imagens
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}