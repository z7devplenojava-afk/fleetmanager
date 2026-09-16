import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Search,
    Plus,
    MoreHorizontal,
    Users,
    FileText,
    ArrowRightCircle,
    Bus
} from 'lucide-react';
import { api } from '@/services/api';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';

// Simplified Company Type
interface Company {
    id: string;
    name: string;
    sigla: string;
    cnpj: string;
    logoUrl?: string;
    status: string;
    active: boolean;
}

export const CompanyList: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await api.get('/companies');
            // Adjust based on actual API response structure (could be paginated)
            const data = Array.isArray(response.data) ? response.data :
                (response.data.content ? response.data.content : []);
            setCompanies(data);
        } catch (error) {
            console.error('Failed to fetch companies', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    );

    const handleManageCompany = (companyId: string, companyName: string) => {
        // Set text context logic here
        sessionStorage.setItem('admin_target_company_id', companyId);
        console.log(`Switched context to ${companyName} (${companyId})`);
        // Redirect to company dashboard (to be implemented)
        window.location.href = `/admin/company/${companyId}/dashboard`;
    };

    return (
        <AdminLayout
            title="Empresas"
            subtitle="Gerencie as empresas clientes e seus acessos."
            actions={
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    <Plus size={18} className="mr-2" />
                    Nova Empresa
                </Button>
            }
        >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Buscar por nome, sigla ou CNPJ..."
                        className="pl-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse bg-slate-50 border-slate-200">
                            <CardHeader className="h-24 bg-slate-200/50" />
                            <CardContent className="h-32" />
                        </Card>
                    ))
                ) : filteredCompanies.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhuma empresa encontrada</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-1">Nenhum resultado corresponde à sua busca.</p>
                    </div>
                ) : (
                    filteredCompanies.map((company) => (
                        <Card key={company.id} className="hover:shadow-md transition-shadow duration-300 border-slate-200 group overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-slate-900 to-slate-700 group-hover:from-amber-500 group-hover:to-amber-400 transition-all duration-500" />

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
                                            {company.logoUrl ? (
                                                <img src={resolveCompanyLogoUrl(company.logoUrl) || company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="text-slate-400" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1" title={company.name}>
                                                {company.name}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs mt-1">
                                                {company.cnpj}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={company.active ? 'default' : 'secondary'} className={company.active ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-slate-100 text-slate-500"}>
                                        {company.active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                        <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">Usuários</span>
                                        {/* Placeholder count */}
                                        {/* <p className="text-sm font-bold text-slate-900">-</p> */}
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                        <Bus className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">Frota</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white group-hover:bg-amber-500 group-hover:text-black transition-colors"
                                        onClick={() => handleManageCompany(company.id, company.name)}
                                    >
                                        Gerenciar Empresa
                                        <ArrowRightCircle size={16} className="ml-2 opacity-70 group-hover:opacity-100" />
                                    </Button>
                                    <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:text-slate-900">
                                        Detalhes Financeiros
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </AdminLayout>
    );
};

export default CompanyList;
