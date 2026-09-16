import React, { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    Search,
    Users,
    Activity,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { companyService, CreateCompanyRequest } from '@/services/companyService';
import { Loader2 } from 'lucide-react';

const FluxBusCompanies: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const data = await companyService.getAllCompanies();
            setCompanies(data);
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar as empresas.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.sigla?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.cnpj?.includes(searchQuery)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Ativa</Badge>;
            case 'INACTIVE':
                return <Badge variant="secondary">Inativa</Badge>;
            case 'SUSPENDED':
                return <Badge variant="destructive">Suspensa</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
                        <Shield className="text-seguranca-yellow" />
                        Gestão de Empresas (SaaS)
                    </h1>
                    <p className="text-gray-400">Gerencie os clientes da plataforma FluxBus e seus limites de uso.</p>
                </div>
                <Button className="bg-seguranca-red hover:bg-seguranca-darkred text-white flex gap-2">
                    <Plus size={18} />
                    Nova Empresa
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-seguranca-graphite p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total de Empresas</p>
                        <p className="text-2xl font-bold text-seguranca-lightgray">{companies.length}</p>
                    </div>
                </div>
                <div className="bg-seguranca-graphite p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Empresas Ativas</p>
                        <p className="text-2xl font-bold text-seguranca-lightgray">
                            {companies.filter(c => c.status === 'ACTIVE').length}
                        </p>
                    </div>
                </div>
                <div className="bg-seguranca-graphite p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Taxa de Ocupação</p>
                        <p className="text-2xl font-bold text-seguranca-lightgray">78%</p>
                    </div>
                </div>
            </div>

            <div className="bg-seguranca-graphite rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar por nome, sigla ou CNPJ..."
                            className="pl-10 bg-seguranca-black border-gray-600 text-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" className="border-gray-600 text-gray-400 hover:text-white flex-1 md:flex-none">
                            Filtros
                        </Button>
                        <Button variant="outline" className="border-gray-600 text-gray-400 hover:text-white flex-1 md:flex-none">
                            Exportar
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-seguranca-red" size={40} />
                        <p className="text-gray-400 italic">Carregando empresas...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-seguranca-black/50">
                            <TableRow className="border-gray-700">
                                <TableHead className="text-gray-300">Empresa</TableHead>
                                <TableHead className="text-gray-300">CNPJ</TableHead>
                                <TableHead className="text-gray-300">Limite Usuários</TableHead>
                                <TableHead className="text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-300 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <TableRow key={company.id} className="border-gray-700 hover:bg-white/5 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-seguranca-black border border-gray-600 flex items-center justify-center overflow-hidden">
                                                    {company.logoUrl ? (
                                                        <img src={resolveCompanyLogoUrl(company.logoUrl) || company.logoUrl} alt={company.name} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <Building2 className="text-gray-500" size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-seguranca-lightgray">{company.name}</p>
                                                    <p className="text-xs text-seguranca-yellow font-mono">{company.sigla}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400 font-mono">{company.cnpj}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-gray-400" />
                                                <span className="text-seguranca-lightgray font-bold">
                                                    {company.maxUsers || 'Ilimitado'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700">
                                                        <MoreVertical size={16} className="text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 text-gray-200">
                                                    <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700 gap-2 cursor-pointer">
                                                        <Edit size={14} /> Editar Dados
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700 gap-2 cursor-pointer">
                                                        <Activity size={14} /> Visualizar Métricas
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700 gap-2 cursor-pointer text-red-400 focus:text-red-400">
                                                        <Trash2 size={14} /> Suspender Empresa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500 italic">
                                        Nenhuma empresa encontrada com os critérios de busca.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default FluxBusCompanies;
