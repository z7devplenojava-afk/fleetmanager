import React from 'react';
import {
    Calendar,
    FileText,
    MapPin,
    MessageSquare,
    Clock,
    ChevronRight,
    User,
    Shield,
    FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';

const DriverDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const quickActions = [
        {
            title: 'Minhas Escalas',
            description: 'Veja sua agenda de trabalho',
            icon: Calendar,
            color: 'bg-blue-500',
            to: '/driver/trips'
        },
        {
            title: 'Controle de Horas',
            description: 'Registre seu ponto e veja horas',
            icon: Clock,
            color: 'bg-green-500',
            to: '/rh/controle-horas'
        },
        {
            title: 'Meus Holerites',
            description: 'Baixe seus comprovantes',
            icon: FileSpreadsheet,
            color: 'bg-purple-500',
            to: '/meus-holerites'
        },
        {
            title: 'Mensagens',
            description: 'Comunicação interna',
            icon: MessageSquare,
            color: 'bg-orange-500',
            to: '/mensagens'
        }
    ];

    return (
        <StandardLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.name}</h1>
                        <p className="text-muted-foreground">
                            Portal do Motorista - Fleet Manager
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-medium">Perfil: Motorista</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Card
                            key={action.title}
                            className="cursor-pointer hover:shadow-md transition-shadow group"
                            onClick={() => navigate(action.to)}
                        >
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{action.title}</h3>
                                    <p className="text-xs text-muted-foreground">{action.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Próximas Escalas
                            </CardTitle>
                            <CardDescription>Suas próximas escalas de trabalho programadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Carregando escalas programadas...</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Comunicados
                            </CardTitle>
                            <CardDescription>Avisos importantes da empresa</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Importante: LGPD</p>
                                    <p className="text-sm text-amber-900">Não esqueça de assinar o termo de consentimento LGPD na área de documentos.</p>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Normas da Empresa</p>
                                    <p className="text-sm text-blue-900">As novas normas de conduta estão disponíveis para download.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </StandardLayout>
    );
};

export default DriverDashboard;
