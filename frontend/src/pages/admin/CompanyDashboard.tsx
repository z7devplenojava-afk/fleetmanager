import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const [activeContext, setActiveContext] = useState<string | null>(null);

    useEffect(() => {
        // Verify if the session context matches the URL
        const stored = sessionStorage.getItem('admin_target_company_id');
        setActiveContext(stored);

        if (stored !== companyId) {
            console.warn('URL companyId mismatch with session context. Updating session...');
            if (companyId) {
                sessionStorage.setItem('admin_target_company_id', companyId);
                setActiveContext(companyId);
            }
        }
    }, [companyId]);

    const handleExit = () => {
        sessionStorage.removeItem('admin_target_company_id');
        navigate('/admin/companies');
    };

    return (
        <AdminLayout
            title="Painel da Empresa"
            subtitle={`Gerenciando contexto: ${companyId}`}
            actions={
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 animate-pulse">
                        <AlertTriangle size={12} className="mr-1" />
                        Modo de Impersonação Ativo
                    </Badge>
                    <Button variant="ghost" onClick={handleExit}>
                        <ArrowLeft size={16} className="mr-2" />
                        Voltar para Lista
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-6">
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-100 rounded-full">
                                <RefreshCw className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-amber-900">Contexto Ativo</h3>
                                <p className="text-amber-700">
                                    Você está visualizando dados como se fosse um administrador desta empresa.
                                    Todas as ações realizadas (criar usuários, notas fiscais, etc.) serão registradas neste contexto.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Integration Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:border-amber-400 cursor-pointer transition-colors" onClick={() => navigate(`/admin/company/${companyId}/users`)}>
                        <CardContent className="pt-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Usuários</h3>
                            <p className="text-slate-500 text-sm">Gerenciar contas de usuários desta empresa</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-amber-400 cursor-pointer transition-colors" onClick={() => navigate(`/admin/company/${companyId}/financial`)}>
                        <CardContent className="pt-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Financeiro</h3>
                            <p className="text-slate-500 text-sm">Visualizar Faturas e Requisições</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-amber-400 cursor-pointer transition-colors" onClick={() => navigate(`/admin/company/${companyId}/settings`)}>
                        <CardContent className="pt-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Configurações</h3>
                            <p className="text-slate-500 text-sm">Dados cadastrais e preferências</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CompanyDashboard;
