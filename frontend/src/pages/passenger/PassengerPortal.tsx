import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Bus, 
    Clock, 
    MapPin, 
    Bell, 
    User, 
    Map as MapIcon, 
    Home, 
    ChevronRight, 
    QrCode, 
    ArrowRight, 
    Compass, 
    Sparkles, 
    Navigation,
    Layers,
    ShieldCheck,
    Phone,
    Mail,
    CreditCard,
    Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PassengerLineDetails } from '@/components/passageiro/PassengerLineDetails';
import { PassengerLiveMap } from '@/components/passageiro/PassengerLiveMap';
import { PassengerNotificationsTab } from '@/components/passageiro/PassengerNotificationsTab';
import { PassengerQRCodeModal } from '@/components/passageiro/PassengerQRCodeModal';
import { PassengerRegisterModal, type PassengerProfile } from '@/components/passageiro/PassengerRegisterModal';

interface LineItem {
    id: string;
    name: string;
    route: string;
    color: string;
    dotColor: string;
    etaMinutes: number;
    statusText: string;
}

const PASSENGER_LINES: LineItem[] = [
    {
        id: 'verde',
        name: 'Verde - Farofa',
        route: 'Belo Horizonte ➔ Farofa',
        color: '#16a34a',
        dotColor: 'bg-emerald-500',
        etaMinutes: 12,
        statusText: '12 min &bull; Chegada prevista'
    },
    {
        id: 'azul',
        name: 'Azul - Belo Vale',
        route: 'Belo Horizonte ➔ Belo Vale',
        color: '#2563eb',
        dotColor: 'bg-blue-500',
        etaMinutes: 18,
        statusText: '18 min &bull; Chegada prevista'
    },
    {
        id: 'rosa',
        name: 'Rosa - Serra Verde',
        route: 'Belo Horizonte ➔ Serra Verde',
        color: '#ec4899',
        dotColor: 'bg-pink-500',
        etaMinutes: 24,
        statusText: '24 min &bull; Em andamento'
    },
    {
        id: 'amarela',
        name: 'Amarela - FHEMIG',
        route: 'Belo Horizonte ➔ FHEMIG',
        color: '#eab308',
        dotColor: 'bg-yellow-500',
        etaMinutes: 32,
        statusText: '32 min &bull; Programado'
    }
];

export const PassengerPortal: React.FC = () => {
    const { user } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeTab, setActiveTab] = useState<'home' | 'lines' | 'map' | 'notifications' | 'profile'>('home');
    const [selectedLine, setSelectedLine] = useState<LineItem | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    // Perfil do passageiro (persistido no localStorage)
    const [profile, setProfile] = useState<PassengerProfile>(() => {
        try {
            const saved = localStorage.getItem('passenger_profile');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao ler perfil do localStorage:', e);
        }
        return {
            id: 'pass_default',
            name: user?.name || 'Maria Aparecida Souza',
            cpf: '123.456.789-00',
            phone: '(31) 98765-4321',
            email: user?.email || 'maria.souza@email.com',
            type: 'Estudante',
            preferredLine: 'Rosa - Serra Verde',
            address: 'Rua das Flores, 123 - Belo Horizonte',
            lgpdAcceptedAt: new Date().toISOString()
        };
    });

    const handleProfileSaved = (newProfile: PassengerProfile) => {
        setProfile(newProfile);
        setShowOnboarding(false);
    };

    const userName = profile.name ? profile.name.split(' ')[0] : 'Passageiro';

    // Tela 1: Onboarding (Imagem 2 - Tela 1)
    if (showOnboarding) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b1329] to-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto shadow-2xl">
                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Viação</span>
                            <span className="text-base font-black text-white">São Silvestre</span>
                        </div>
                    </div>
                </div>

                {/* Imagem do Ônibus / Hero */}
                <div className="my-auto text-center space-y-6">
                    <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px]" />
                        <img 
                            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80" 
                            alt="Ônibus Executivo"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Bem-vindo(a)!
                        </h1>
                        <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
                            Acompanhe seus trajetos, horários e a localização dos ônibus em tempo real.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pb-6">
                    <Button 
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 gap-2 text-sm"
                    >
                        Criar Cadastro (LGPD) <ArrowRight className="h-4 w-4" />
                    </Button>
                    <button 
                        onClick={() => setShowOnboarding(false)}
                        className="w-full text-center text-xs font-bold text-slate-400 hover:text-white py-1"
                    >
                        Continuar como {userName}
                    </button>
                </div>

                <PassengerRegisterModal
                    isOpen={isRegisterModalOpen}
                    onClose={() => setIsRegisterModalOpen(false)}
                    onSuccess={handleProfileSaved}
                    initialData={profile}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-800">
            {/* Top Navigation Bar */}
            <div className="p-4 pt-6 bg-gradient-to-b from-slate-900 via-slate-900/95 to-transparent flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 shadow-md">
                        <Bus className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block leading-none">Viação</span>
                        <span className="text-sm font-black text-white tracking-tight leading-none">São Silvestre</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setActiveTab('notifications')}
                        className="relative h-9 w-9 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsQrModalOpen(true)}
                        className="h-9 w-9 rounded-full text-pink-400 hover:text-pink-300 hover:bg-pink-950/30"
                        title="Meu Embarque QR Code"
                    >
                        <QrCode className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Conteúdo Principal por Aba */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto space-y-5">
                {selectedLine ? (
                    <PassengerLineDetails 
                        lineName={selectedLine.name}
                        route={selectedLine.route}
                        color={selectedLine.color}
                        onBack={() => setSelectedLine(null)}
                        onSelectTrip={() => {
                            setSelectedLine(null);
                            setActiveTab('map');
                        }}
                    />
                ) : activeTab === 'home' ? (
                    <>
                        {/* Saudação (Imagem 2 - Tela 2) */}
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Olá, <span className="text-blue-400">{userName}!</span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Acompanhe aqui todas as informações da sua viagem.
                            </p>
                        </div>

                        {/* Card: Localização & Ponto Próximo */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-700/60 shadow-lg relative overflow-hidden">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 z-10">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Sua localização
                                    </span>
                                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-emerald-400" /> {profile.address || 'R. das Flores, 123'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Belo Horizonte - MG</p>
                                    
                                    <div className="pt-2">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold gap-1 py-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            Você está próximo ao ponto
                                        </Badge>
                                    </div>
                                </div>

                                {/* Imagem Ilustrativa de Ônibus */}
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-blue-950/40 border border-blue-500/30 shadow-md shrink-0">
                                    <img 
                                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80" 
                                        alt="Ônibus"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Grid de Atalhos Rápidos (Imagem 2 - Tela 2) */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setActiveTab('lines')}
                                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex flex-col justify-between text-left transition-all group shadow-md"
                            >
                                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Bus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">Minhas Linhas</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Confira as linhas disponíveis</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setActiveTab('lines')}
                                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex flex-col justify-between text-left transition-all group shadow-md"
                            >
                                <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">Horários</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Veja os horários de partida</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setActiveTab('map')}
                                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex flex-col justify-between text-left transition-all group shadow-md"
                            >
                                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Compass className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">Acompanhar Ônibus</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Em tempo real no mapa</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setActiveTab('notifications')}
                                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex flex-col justify-between text-left transition-all group shadow-md"
                            >
                                <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">Notificações</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Avisos importantes</p>
                                </div>
                            </button>
                        </div>

                        {/* Lista: Suas Linhas (Imagem 2 - Tela 2) */}
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-white">Suas Linhas</h3>
                                <button 
                                    onClick={() => setActiveTab('lines')}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                                >
                                    Ver todas &rarr;
                                </button>
                            </div>

                            <div className="space-y-2">
                                {PASSENGER_LINES.map((line) => (
                                    <div 
                                        key={line.id}
                                        onClick={() => setSelectedLine(line)}
                                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all hover:translate-x-1"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-3.5 h-3.5 rounded-full ${line.dotColor} shrink-0`} />
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{line.name}</h4>
                                                <p className="text-[11px] text-slate-400" dangerouslySetInnerHTML={{ __html: line.statusText }} />
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'lines' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Bus className="h-5 w-5 text-blue-400" /> Linhas e Trajetos
                            </h3>
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                                4 Ativas
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {PASSENGER_LINES.map((line) => (
                                <div 
                                    key={line.id}
                                    onClick={() => setSelectedLine(line)}
                                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer space-y-2 transition-all shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3.5 h-3.5 rounded-full ${line.dotColor}`} />
                                            <h4 className="text-sm font-bold text-white">{line.name}</h4>
                                        </div>
                                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs">
                                            {line.etaMinutes} min
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400">{line.route}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'map' ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Compass className="h-5 w-5 text-emerald-400" /> Acompanhar Ônibus
                            </h3>
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                                GPS Ao Vivo
                            </Badge>
                        </div>
                        <PassengerLiveMap onOpenBoardingQr={() => setIsQrModalOpen(true)} />
                    </div>
                ) : activeTab === 'notifications' ? (
                    <PassengerNotificationsTab />
                ) : (
                    /* Aba Perfil & LGPD */
                    <div className="space-y-4 py-2">
                        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-3 shadow-xl">
                            <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">{profile.name}</h3>
                                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] mt-1 font-bold">
                                    Passageiro {profile.type}
                                </Badge>
                            </div>
                        </div>

                        {/* Dados Pessoais & Documento */}
                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <CreditCard className="h-4 w-4 text-slate-400" /> CPF
                                </span>
                                <span className="font-mono text-white font-bold">{profile.cpf}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Phone className="h-4 w-4 text-slate-400" /> WhatsApp
                                </span>
                                <span className="text-white">{profile.phone}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Mail className="h-4 w-4 text-slate-400" /> E-mail
                                </span>
                                <span className="text-white truncate max-w-[180px]">{profile.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Bus className="h-4 w-4 text-slate-400" /> Linha Principal
                                </span>
                                <span className="text-blue-400 font-bold">{profile.preferredLine}</span>
                            </div>
                        </div>

                        {/* Status de Consentimento LGPD */}
                        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-bold text-white">Consentimento LGPD Confirmado</p>
                                <p className="text-[11px] text-slate-400">
                                    Termo de privacidade aceito em {new Date(profile.lgpdAcceptedAt || Date.now()).toLocaleDateString('pt-BR')}.
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 space-y-2">
                            <Button 
                                onClick={() => setIsQrModalOpen(true)}
                                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-xl gap-2 text-xs shadow-lg shadow-pink-900/30"
                            >
                                <QrCode className="h-4 w-4" /> Visualizar Meu QR Code de Embarque
                            </Button>
                            
                            <Button 
                                variant="outline"
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="w-full border-slate-700 text-slate-300 hover:text-white text-xs gap-1.5"
                            >
                                <Edit3 className="h-3.5 w-3.5" /> Editar Meus Dados / Termos
                            </Button>

                            <Button 
                                variant="ghost"
                                onClick={() => setShowOnboarding(true)}
                                className="w-full text-slate-400 hover:text-white text-xs"
                            >
                                Ver Guia de Boas-Vindas
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar (Imagem 2) */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 py-2.5 px-6 flex items-center justify-between z-50 shadow-2xl">
                <button 
                    onClick={() => {
                        setSelectedLine(null);
                        setActiveTab('home');
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' && !selectedLine ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                    <Home className="h-5 w-5" />
                    <span className="text-[10px]">Início</span>
                </button>

                <button 
                    onClick={() => {
                        setSelectedLine(null);
                        setActiveTab('lines');
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'lines' || selectedLine ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                    <Bus className="h-5 w-5" />
                    <span className="text-[10px]">Minhas Linhas</span>
                </button>

                <button 
                    onClick={() => {
                        setSelectedLine(null);
                        setActiveTab('map');
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                    <MapIcon className="h-5 w-5" />
                    <span className="text-[10px]">Mapa</span>
                </button>

                <button 
                    onClick={() => {
                        setSelectedLine(null);
                        setActiveTab('profile');
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                    <User className="h-5 w-5" />
                    <span className="text-[10px]">Perfil</span>
                </button>
            </div>

            {/* Modal de QR Code do Passageiro */}
            {isQrModalOpen && (
                <PassengerQRCodeModal 
                    isOpen={isQrModalOpen}
                    onClose={() => setIsQrModalOpen(false)}
                    currentLine={profile.preferredLine}
                    passengerName={profile.name}
                    passengerCpf={profile.cpf}
                />
            )}

            {/* Modal de Cadastro / Edição LGPD */}
            {isRegisterModalOpen && (
                <PassengerRegisterModal
                    isOpen={isRegisterModalOpen}
                    onClose={() => setIsRegisterModalOpen(false)}
                    onSuccess={handleProfileSaved}
                    initialData={profile}
                />
            )}
        </div>
    );
};

export default PassengerPortal;
