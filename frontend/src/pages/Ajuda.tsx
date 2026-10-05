import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    HelpCircle,
    Search,
    Book,
    Video,
    FileText,
    ExternalLink,
    Download,
    Phone,
    Globe,
    Mail,
    ArrowRight,
    CheckCircle,
    Lightbulb,
    Play,
    Clock,
    Star,
    MessageCircle,
    BarChart3,
    Filter
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { helpModules, helpCategories, HelpModule } from '@/data/helpModules';
import { HelpSearchFilters } from '@/components/HelpSearchFilters';
import { HelpStats } from '@/components/HelpStats';

export default function Ajuda() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedModule, setSelectedModule] = useState<HelpModule | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>(['funcionários', 'relatórios', 'estoque', 'backup']);

    // Dados para estatísticas
    const helpStats = {
        totalModules: helpModules.length,
        totalTutorials: 6,
        totalFaqItems: 18,
        averageRating: 4.7,
        totalViews: 1247,
        recentActivity: [
            { type: 'module' as const, title: 'Gestão de Funcionários', views: 156, timeAgo: '2 horas atrás' },
            { type: 'tutorial' as const, title: 'Controle Financeiro', views: 89, timeAgo: '4 horas atrás' },
            { type: 'faq' as const, title: 'Como redefinir senha?', views: 67, timeAgo: '6 horas atrás' },
            { type: 'module' as const, title: 'Gestão de Estoque', views: 45, timeAgo: '1 dia atrás' },
            { type: 'tutorial' as const, title: 'Primeiros Passos', views: 123, timeAgo: '1 dia atrás' }
        ]
    };

    // Tags disponíveis para filtros
    const availableTags = ['cadastro', 'relatórios', 'configuração', 'backup', 'financeiro', 'estoque', 'rh', 'operacional'];

    // Handlers para filtros avançados
    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleRecentSearchClick = (search: string) => {
        setSearchTerm(search);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedTags([]);
        setSelectedCategory('all');
    };

    // Adicionar busca ao histórico
    useEffect(() => {
        if (searchTerm && searchTerm.length > 2) {
            setRecentSearches(prev => {
                const updated = [searchTerm, ...prev.filter(s => s !== searchTerm)];
                return updated.slice(0, 5);
            });
        }
    }, [searchTerm]);

    // Filtrar módulos baseado na busca e categoria
    const filteredModules = useMemo(() => {
        let filtered = helpModules;

        // Filtrar por categoria
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(module => module.category === selectedCategory);
        }

        // Filtrar por termo de busca
        if (searchTerm) {
            filtered = filtered.filter(module =>
                module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                module.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
    }, [searchTerm, selectedCategory]);

    return (
        <MainLayout title="Central de Ajuda" subtitle="Guias, tutoriais e documentação do sistema">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Central de Ajuda</h1>
                        <p className="text-muted-foreground">
                            Encontre guias, tutoriais e documentação para usar o sistema
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Manual PDF
                        </Button>
                        <Button variant="outline">
                            <Video className="w-4 h-4 mr-2" />
                            Tutoriais
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Buscar ajuda sobre funcionalidades..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar com categorias */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Book className="w-5 h-5 mr-2" />
                                    Categorias
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {helpCategories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <category.icon className="w-4 h-4 mr-2" />
                                        {category.name}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Conteúdo principal */}
                    <div className="lg:col-span-3">
                        <Tabs defaultValue="modules" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="modules">Módulos</TabsTrigger>
                                <TabsTrigger value="tutorials">Tutoriais</TabsTrigger>
                                <TabsTrigger value="faq">FAQ</TabsTrigger>
                                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                                <TabsTrigger value="contact">Contato</TabsTrigger>
                            </TabsList>

                            <TabsContent value="modules" className="space-y-4">
                                {selectedModule ? (
                                    /* Visualização detalhada do módulo */
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedModule(null)}
                                                className="mb-4"
                                            >
                                                ← Voltar para lista de módulos
                                            </Button>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center space-x-3">
                                                    <selectedModule.icon className="w-8 h-8 text-blue-600" />
                                                    <div>
                                                        <CardTitle className="text-2xl">{selectedModule.title}</CardTitle>
                                                        <p className="text-muted-foreground">{selectedModule.description}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Rotas de acesso */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <ExternalLink className="w-5 h-5 mr-2" />
                                                        Como Acessar
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedModule.routes.map((route, index) => (
                                                            <Badge key={index} variant="outline" className="text-sm">
                                                                {route}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Funcionalidades */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <CheckCircle className="w-5 h-5 mr-2" />
                                                        Funcionalidades Principais
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {selectedModule.features.map((feature, index) => (
                                                            <div key={index} className="flex items-start space-x-2">
                                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Como usar */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <Play className="w-5 h-5 mr-2" />
                                                        Como Usar
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {selectedModule.howToUse.map((step, index) => (
                                                            <div key={index} className="flex items-start space-x-3">
                                                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <span className="text-sm">{step}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dicas */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <Lightbulb className="w-5 h-5 mr-2" />
                                                        Dicas e Boas Práticas
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {selectedModule.tips.map((tip, index) => (
                                                            <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                                                                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{tip}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    /* Lista de módulos */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-semibold">
                                                {selectedCategory === 'all' ? 'Todos os Módulos' : helpCategories.find(c => c.id === selectedCategory)?.name}
                                            </h2>
                                            <Badge variant="secondary">
                                                {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>

                                        {filteredModules.length === 0 ? (
                                            <div className="text-center py-8">
                                                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                                <h3 className="text-lg font-semibold mb-2">Nenhum módulo encontrado</h3>
                                                <p className="text-muted-foreground">
                                                    Tente ajustar os filtros ou termo de busca.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredModules.map((module) => (
                                                    <Card
                                                        key={module.id}
                                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() => setSelectedModule(module)}
                                                    >
                                                        <CardHeader>
                                                            <div className="flex items-center space-x-3">
                                                                <module.icon className="w-6 h-6 text-blue-600" />
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-lg">{module.title}</CardTitle>
                                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                                        {module.description}
                                                                    </p>
                                                                </div>
                                                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center text-sm text-muted-foreground">
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    {module.features.length} funcionalidades
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {module.routes.slice(0, 2).map((route, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {route}
                                                                        </Badge>
                                                                    ))}
                                                                    {module.routes.length > 2 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{module.routes.length - 2} mais
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="tutorials" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Primeiros Passos
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Aprenda a navegar pelo sistema e configurar seu perfil.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    5 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.8
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Gestão de Funcionários
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Como cadastrar e gerenciar funcionários no sistema.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    12 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.9
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Controle Financeiro
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Aprenda a usar o módulo financeiro e gerar relatórios.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    15 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.7
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Gestão de Estoque
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Controle de produtos, movimentações e inventário.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    18 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.6
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Módulo Operacional
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Gestão de equipamentos e operações de segurança.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    20 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.8
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Video className="w-5 h-5 mr-2" />
                                                Relatórios e Dashboards
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Como gerar e interpretar relatórios do sistema.
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    10 min
                                                    <Star className="w-3 h-3 ml-3 mr-1" />
                                                    4.9
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Assistir Tutorial
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="faq" className="space-y-4">
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                Encontre respostas para as dúvidas mais comuns sobre o sistema
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Login e Acesso */}
                                            <div>
                                                <h4 className="font-semibold text-blue-600 mb-3">🔐 Login e Acesso</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-blue-500 pl-4">
                                                        <h5 className="font-semibold">Como faço para redefinir minha senha?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um e-mail com instruções para redefinir. Se não receber o e-mail, verifique a pasta de spam ou entre em contato com o suporte.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-blue-500 pl-4">
                                                        <h5 className="font-semibold">Não consigo fazer login no sistema</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Verifique se está usando o usuário e senha corretos. Certifique-se de que o Caps Lock não está ativado. Se o problema persistir, entre em contato com o administrador do sistema.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-blue-500 pl-4">
                                                        <h5 className="font-semibold">Posso acessar o sistema pelo celular?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Sim! O sistema é responsivo e funciona perfeitamente em dispositivos móveis através do navegador. Recomendamos usar Chrome ou Safari para melhor experiência.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Funcionários e RH */}
                                            <div>
                                                <h4 className="font-semibold text-green-600 mb-3">👥 Funcionários e RH</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-green-500 pl-4">
                                                        <h5 className="font-semibold">Como cadastrar um novo funcionário?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Vá para o módulo RH > Funcionários > Novo Funcionário. Preencha todos os campos obrigatórios (nome, CPF, cargo, etc.) e clique em Salvar. Certifique-se de que o cargo já esteja cadastrado no sistema.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-green-500 pl-4">
                                                        <h5 className="font-semibold">Como gerar holerites dos funcionários?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Acesse RH > Folha de Pagamento > Gerar Holerites. Selecione o mês/ano desejado, escolha os funcionários e clique em "Processar". Os holerites serão gerados automaticamente.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-green-500 pl-4">
                                                        <h5 className="font-semibold">Como configurar cargos e salários?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Vá em RH > Cargos > Novo Cargo. Defina o nome do cargo, salário base, benefícios e permissões. Os cargos criados poderão ser atribuídos aos funcionários.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financeiro */}
                                            <div>
                                                <h4 className="font-semibold text-purple-600 mb-3">💰 Financeiro</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-purple-500 pl-4">
                                                        <h5 className="font-semibold">Como gerar relatórios financeiros?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Acesse Financeiro > Relatórios, selecione o período desejado e o tipo de relatório (receitas, despesas, fluxo de caixa). Clique em "Gerar" para visualizar ou exportar em PDF/Excel.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-purple-500 pl-4">
                                                        <h5 className="font-semibold">Como lançar contas a pagar?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Vá em Financeiro > Contas a Pagar > Nova Conta. Preencha fornecedor, valor, data de vencimento e categoria. O sistema alertará sobre vencimentos próximos.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-purple-500 pl-4">
                                                        <h5 className="font-semibold">Como controlar o fluxo de caixa?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              O dashboard financeiro mostra o fluxo de caixa em tempo real. Acesse Financeiro > Dashboard para ver entradas, saídas e saldo atual. Configure alertas para saldo baixo.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Estoque */}
                                            <div>
                                                <h4 className="font-semibold text-orange-600 mb-3">📦 Estoque</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-orange-500 pl-4">
                                                        <h5 className="font-semibold">Como configurar alertas de estoque baixo?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            No módulo Estoque, edite o produto e defina o "Estoque Mínimo". O sistema alertará automaticamente quando atingir esse valor. Configure também o "Estoque Máximo" para controle de compras.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-orange-500 pl-4">
                                                        <h5 className="font-semibold">Como fazer movimentações de estoque?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Acesse Estoque > Movimentações > Nova Movimentação. Selecione o produto, tipo (entrada/saída), quantidade e motivo. Todas as movimentações ficam registradas no histórico.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-orange-500 pl-4">
                                                        <h5 className="font-semibold">Como fazer inventário do estoque?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Vá em Estoque > Inventário > Novo Inventário. O sistema gerará uma lista de produtos para contagem. Após a contagem física, insira as quantidades reais para ajustar o estoque.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Operacional */}
                                            <div>
                                                <h4 className="font-semibold text-red-600 mb-3">🛡️ Operacional</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-red-500 pl-4">
                                                        <h5 className="font-semibold">Como cadastrar equipamentos de segurança?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Acesse Operacional > Equipamentos > Novo Equipamento. Preencha tipo, modelo, número de série e responsável. Configure manutenções preventivas e alertas de vencimento.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-red-500 pl-4">
                                                        <h5 className="font-semibold">Como registrar ocorrências?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Vá em Operacional > Ocorrências > Nova Ocorrência. Descreva o evento, local, data/hora e pessoas envolvidas. Anexe fotos se necessário. As ocorrências geram relatórios automáticos.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-red-500 pl-4">
                                                        <h5 className="font-semibold">Como agendar manutenções de equipamentos?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              Em Operacional > Equipamentos, selecione o equipamento e clique em "Agendar Manutenção". Defina data, tipo de manutenção e responsável. O sistema enviará lembretes automáticos.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Suporte Técnico */}
                                            <div>
                                                <h4 className="font-semibold text-gray-600 mb-3">🔧 Suporte Técnico</h4>
                                                <div className="space-y-4">
                                                    <div className="border-l-4 border-gray-500 pl-4">
                                                        <h5 className="font-semibold">O sistema está lento, o que fazer?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Verifique sua conexão com a internet. Feche outras abas do navegador. Limpe o cache do navegador (Ctrl+Shift+Del). Se o problema persistir, entre em contato com o suporte.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-gray-500 pl-4">
                                                        <h5 className="font-semibold">Como fazer backup dos dados?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                              O sistema faz backup automático diário. Para backup manual, acesse Configurações > Backup > Gerar Backup. Recomendamos fazer backups antes de grandes alterações no sistema.
                                                        </p>
                                                    </div>

                                                    <div className="border-l-4 border-gray-500 pl-4">
                                                        <h5 className="font-semibold">Como entrar em contato com o suporte?</h5>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Telefone: (11) 9999-9999 (horário comercial). E-mail: suporte@fluxbus.com. Para problemas urgentes, use o telefone. Para dúvidas gerais, prefira o e-mail.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Card de contato rápido */}
                                    <Card className="bg-blue-50 border-blue-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <MessageCircle className="w-8 h-8 text-blue-600" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-blue-900">Não encontrou sua resposta?</h4>
                                                    <p className="text-sm text-blue-700">
                                                        Nossa equipe de suporte está pronta para ajudar você
                                                    </p>
                                                </div>
                                                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                                                    Falar com Suporte
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="stats" className="space-y-4">
                                <HelpStats
                                    totalModules={helpStats.totalModules}
                                    totalTutorials={helpStats.totalTutorials}
                                    totalFaqItems={helpStats.totalFaqItems}
                                    averageRating={helpStats.averageRating}
                                    totalViews={helpStats.totalViews}
                                    recentActivity={helpStats.recentActivity}
                                />
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Entre em Contato</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">Suporte Técnico</p>
                                                <p className="text-sm text-muted-foreground">(11) 9999-9999</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">E-mail</p>
                                                <p className="text-sm text-muted-foreground">suporte@fluxbus.com</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">Site</p>
                                                <p className="text-sm text-muted-foreground">www.fluxbus.com</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}