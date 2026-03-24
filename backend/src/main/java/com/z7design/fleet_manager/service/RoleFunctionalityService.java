package com.z7design.fleet_manager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class RoleFunctionalityService {

    /**
     * Define as funcionalidades disponÃ­veis para cada ROLE
     */
    public Map<String, List<Functionality>> getFunctionalitiesByRole(List<String> roles) {
        log.info("ðŸ” Obtendo funcionalidades para roles: {}", roles);
        
        Map<String, List<Functionality>> functionalitiesMap = new HashMap<>();
        
        for (String role : roles) {
            List<Functionality> functionalities = getFunctionalitiesForRole(role);
            functionalitiesMap.put(role, functionalities);
        }
        
        return functionalitiesMap;
    }

    /**
     * Retorna todas as funcionalidades de um usuÃ¡rio baseado em seus roles
     */
    public List<Functionality> getAllUserFunctionalities(List<String> roles) {
        Set<Functionality> allFunctionalities = new HashSet<>();
        
        for (String role : roles) {
            allFunctionalities.addAll(getFunctionalitiesForRole(role));
        }
        
        return new ArrayList<>(allFunctionalities);
    }

    /**
     * Define funcionalidades especÃ­ficas por ROLE
     */
    private List<Functionality> getFunctionalitiesForRole(String role) {
        return switch (role.toUpperCase()) {
            case "SUPER_ADMIN" -> Arrays.asList(
                // Dashboard e VisÃ£o Geral
                new Functionality("dashboard", "Dashboard", "Dashboard principal", "LayoutDashboard", "/dashboard", "primary", 1),
                
                // GestÃ£o de UsuÃ¡rios e Acessos
                new Functionality("users", "UsuÃ¡rios", "Gerenciar usuÃ¡rios do sistema", "Users", "/usuarios", "admin", 2),
                new Functionality("roles", "Perfis e PermissÃµes", "Gerenciar perfis e permissÃµes", "Shield", "/roles", "admin", 3),
                new Functionality("groups", "Grupos de UsuÃ¡rios", "Gerenciar grupos", "UsersRound", "/grupos", "admin", 4),
                
                // RH e FuncionÃ¡rios
                new Functionality("employees", "FuncionÃ¡rios", "Cadastro e gestÃ£o de funcionÃ¡rios", "UserCheck", "/funcionarios", "hr", 5),
                new Functionality("sst", "SST", "SaÃºde e SeguranÃ§a do Trabalho", "HeartPulse", "/sst", "hr", 6),
                new Functionality("payslips", "Holerites", "GestÃ£o de holerites", "Receipt", "/holerites", "hr", 7),
                new Functionality("vacations", "FÃ©rias", "Controle de fÃ©rias", "Palmtree", "/ferias", "hr", 8),
                
                // Operacional
                new Functionality("work-posts", "Postos de Trabalho", "GestÃ£o de postos", "MapPin", "/postos", "operational", 9),
                new Functionality("schedules", "Escalas", "GestÃ£o de escalas", "Calendar", "/escalas", "operational", 10),
                new Functionality("occurrences", "OcorrÃªncias", "Registro de ocorrÃªncias", "AlertCircle", "/ocorrencias", "operational", 11),
                new Functionality("rounds", "Rondas", "Controle de rondas", "Route", "/rondas", "operational", 12),
                
                // Frota
                new Functionality("fleet", "Frota", "GestÃ£o de veÃ­culos", "Car", "/frota", "fleet", 13),
                
                // Financeiro
                new Functionality("financial", "Financeiro", "GestÃ£o financeira", "DollarSign", "/financeiro", "financial", 14),
                new Functionality("invoices", "Contas a Pagar", "GestÃ£o de faturas", "FileText", "/contas-pagar", "financial", 15),
                new Functionality("receivables", "Contas a Receber", "Contas a receber", "TrendingUp", "/contas-receber", "financial", 16),
                
                // Clientes e Contratos
                new Functionality("clients", "Clientes", "GestÃ£o de clientes", "Building", "/clientes", "commercial", 17),
                new Functionality("contracts", "Contratos", "GestÃ£o de contratos", "FileSignature", "/contratos", "commercial", 18),
                
                // Estoque e Compras
                new Functionality("inventory", "Estoque", "Controle de estoque", "Package", "/estoque", "inventory", 19),
                new Functionality("purchases", "Compras", "SolicitaÃ§Ãµes de compra", "ShoppingCart", "/compras", "inventory", 20),
                
                // Mensagens e ComunicaÃ§Ã£o
                new Functionality("messages", "Mensagens", "Central de mensagens", "MessageSquare", "/mensagens", "communication", 21),
                new Functionality("chat", "Chat Interno", "Chat entre colaboradores", "MessagesSquare", "/chat", "communication", 22),
                
                // RelatÃ³rios e ConfiguraÃ§Ãµes
                new Functionality("reports", "RelatÃ³rios", "RelatÃ³rios do sistema", "BarChart", "/relatorios", "reports", 23),
                new Functionality("settings", "ConfiguraÃ§Ãµes", "ConfiguraÃ§Ãµes do sistema", "Settings", "/configuracoes", "admin", 24),
                new Functionality("logs", "Logs de Atividade", "Logs do sistema", "Activity", "/logs", "admin", 25)
            );
            
            case "ADMIN" -> Arrays.asList(
                new Functionality("dashboard", "Dashboard", "Dashboard principal", "LayoutDashboard", "/dashboard", "primary", 1),
                new Functionality("users", "UsuÃ¡rios", "Gerenciar usuÃ¡rios", "Users", "/usuarios", "admin", 2),
                new Functionality("employees", "FuncionÃ¡rios", "GestÃ£o de funcionÃ¡rios", "UserCheck", "/funcionarios", "hr", 3),
                new Functionality("sst", "SST", "SaÃºde e SeguranÃ§a", "HeartPulse", "/sst", "hr", 4),
                new Functionality("payslips", "Holerites", "GestÃ£o de holerites", "Receipt", "/holerites", "hr", 5),
                new Functionality("work-posts", "Postos", "Postos de trabalho", "MapPin", "/postos", "operational", 6),
                new Functionality("schedules", "Escalas", "GestÃ£o de escalas", "Calendar", "/escalas", "operational", 7),
                new Functionality("occurrences", "OcorrÃªncias", "OcorrÃªncias", "AlertCircle", "/ocorrencias", "operational", 8),
                new Functionality("fleet", "Frota", "GestÃ£o de veÃ­culos", "Car", "/frota", "fleet", 9),
                new Functionality("financial", "Financeiro", "GestÃ£o financeira", "DollarSign", "/financeiro", "financial", 10),
                new Functionality("clients", "Clientes", "GestÃ£o de clientes", "Building", "/clientes", "commercial", 11),
                new Functionality("contracts", "Contratos", "Contratos", "FileSignature", "/contratos", "commercial", 12),
                new Functionality("reports", "RelatÃ³rios", "RelatÃ³rios", "BarChart", "/relatorios", "reports", 13),
                new Functionality("settings", "ConfiguraÃ§Ãµes", "ConfiguraÃ§Ãµes", "Settings", "/configuracoes", "admin", 14)
            );
            
            case "RH" -> Arrays.asList(
                new Functionality("dashboard", "Dashboard", "Dashboard RH", "LayoutDashboard", "/dashboard", "primary", 1),
                new Functionality("employees", "FuncionÃ¡rios", "GestÃ£o de funcionÃ¡rios", "UserCheck", "/funcionarios", "hr", 2),
                new Functionality("sst", "SST", "SaÃºde e SeguranÃ§a", "HeartPulse", "/sst", "hr", 3),
                new Functionality("payslips", "Holerites", "GestÃ£o de holerites", "Receipt", "/holerites", "hr", 4),
                new Functionality("vacations", "FÃ©rias", "Controle de fÃ©rias", "Palmtree", "/ferias", "hr", 5),
                new Functionality("documents", "Documentos", "Documentos RH", "FileText", "/documentos", "hr", 6),
                new Functionality("reports", "RelatÃ³rios RH", "RelatÃ³rios", "BarChart", "/relatorios", "reports", 7)
            );
            
            case "SUPERVISOR" -> Arrays.asList(
                new Functionality("dashboard", "Dashboard", "Dashboard Supervisor", "LayoutDashboard", "/dashboard", "primary", 1),
                new Functionality("work-posts", "Postos", "Postos de trabalho", "MapPin", "/postos", "operational", 2),
                new Functionality("schedules", "Escalas", "GestÃ£o de escalas", "Calendar", "/escalas", "operational", 3),
                new Functionality("occurrences", "OcorrÃªncias", "Registrar ocorrÃªncias", "AlertCircle", "/ocorrencias", "operational", 4),
                new Functionality("rounds", "Rondas", "Controle de rondas", "Route", "/rondas", "operational", 5),
                new Functionality("team", "Minha Equipe", "Equipe supervisionada", "Users", "/equipe", "operational", 6),
                new Functionality("reports", "RelatÃ³rios", "RelatÃ³rios operacionais", "BarChart", "/relatorios", "reports", 7)
            );
            
            case "FINANCEIRO" -> Arrays.asList(
                new Functionality("dashboard", "Dashboard", "Dashboard Financeiro", "LayoutDashboard", "/dashboard", "primary", 1),
                new Functionality("financial", "Financeiro", "GestÃ£o financeira", "DollarSign", "/financeiro", "financial", 2),
                new Functionality("invoices", "Contas a Pagar", "Faturas e contas", "FileText", "/contas-pagar", "financial", 3),
                new Functionality("receivables", "Contas a Receber", "Recebimentos", "TrendingUp", "/contas-receber", "financial", 4),
                new Functionality("payslips", "Holerites", "Visualizar holerites", "Receipt", "/holerites", "financial", 5),
                new Functionality("reports", "RelatÃ³rios", "RelatÃ³rios financeiros", "BarChart", "/relatorios", "reports", 6)
            );
            
            case "COLABORADOR" -> Arrays.asList(
                new Functionality("dashboard", "Meu Painel", "Dashboard pessoal", "LayoutDashboard", "/dashboard-colaborador", "primary", 1),
                new Functionality("profile", "Meu Perfil", "Meus dados pessoais", "User", "/perfil", "personal", 2),
                new Functionality("payslips", "Meus Holerites", "Consultar holerites", "Receipt", "/meus-holerites", "personal", 3),
                new Functionality("messages", "Mensagens", "Central de mensagens", "MessageSquare", "/mensagens", "communication", 4)
            );
            
            case "VIGILANTE" -> Arrays.asList(
                new Functionality("dashboard", "Meu Painel", "Dashboard do vigilante", "LayoutDashboard", "/dashboard-vigilante", "primary", 1),
                new Functionality("profile", "Meu Perfil", "Meus dados", "User", "/perfil", "personal", 2),
                new Functionality("occurrences", "Registrar OcorrÃªncia", "Registrar ocorrÃªncias", "AlertCircle", "/ocorrencias", "operational", 3),
                new Functionality("rounds", "Minhas Rondas", "Rondas do dia", "Route", "/rondas", "operational", 4),
                new Functionality("payslips", "Meus Holerites", "Consultar holerites", "Receipt", "/meus-holerites", "personal", 5),
                new Functionality("messages", "Mensagens", "Central de mensagens", "MessageSquare", "/mensagens", "communication", 6)
            );
            
            default -> Arrays.asList(
                new Functionality("dashboard", "Dashboard", "Dashboard principal", "LayoutDashboard", "/dashboard", "primary", 1),
                new Functionality("profile", "Meu Perfil", "Meus dados", "User", "/perfil", "personal", 2)
            );
        };
    }

    /**
     * Classe interna para representar uma funcionalidade
     */
    public static class Functionality {
        private String id;
        private String name;
        private String description;
        private String icon;
        private String route;
        private String category;
        private int order;

        public Functionality(String id, String name, String description, String icon, String route, String category, int order) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.route = route;
            this.category = category;
            this.order = order;
        }

        // Getters
        public String getId() { return id; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
        public String getRoute() { return route; }
        public String getCategory() { return category; }
        public int getOrder() { return order; }
    }
}


