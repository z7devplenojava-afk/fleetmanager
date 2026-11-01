import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Bus, 
    Clock, 
    MapPin, 
    Bell, 
    User, 
    Map as MapIcon, 
    Home, 
    QrCode, 
    ArrowRight, 
    Navigation,
    ShieldCheck, 
    Phone, 
    Mail, 
    CreditCard, 
    CheckCircle2, 
    AlertTriangle, 
    Camera, 
    RefreshCw, 
    Lock, 
    LogOut,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PassengerLiveMap } from '@/components/passageiro/PassengerLiveMap';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import fretamentoCheckinService, { FretamentoCheckinRecord } from '@/services/fretamentoCheckinService';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/axios';

export const PassengerPortal: React.FC = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'home' | 'card' | 'scan' | 'map' | 'history' | 'profile'>('home');
    const [direction, setDirection] = useState<'IDA' | 'RETORNO'>('IDA');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Histórico de Embarques
    const [history, setHistory] = useState<FretamentoCheckinRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Estados de Troca de Senha no Perfil
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Scanner de Câmera
    const [cameraActive, setCameraActive] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanLoading, setScanLoading] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Relógio dinâmico para evitar fraude por print de tela no Cartão Digital
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Carregar histórico ao abrir aba ou montar
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const records = await fretamentoCheckinService.fetchRemoteHistory();
            setHistory(records);
        } catch {
            setHistory(fretamentoCheckinService.getHistory(user?.cpf || user?.username));
        } finally {
            setLoadingHistory(false);
        }
    };

    // Dados consolidados do passageiro
    const passengerName = user?.name || user?.fullName || 'Colaborador';
    const passengerCpf = user?.cpf || '000.000.000-00';
    const passengerRegistration = user?.employeeCode || user?.username || 'MAT-001';
    const clientName = (user as any)?.clientName || (user as any)?.empresa?.nome || 'Cliente Contratante';
    const assignedRoute = 'Linha Executiva Industrial - Rota 01';

    // Payload dinâmico do QR Code do passageiro (modo apresentação para o motorista)
    const qrPayload = generateQrCodeDataPayload('PASSENGER', {
        passengerId: (user as any)?.passengerId || user?.id,
        name: passengerName,
        cpf: passengerCpf,
        matricula: passengerRegistration,
        clientName: clientName,
        direction: direction,
        timestamp: currentTime.toISOString()
    });
    const qrSvg = generateQrCodeSvgUri(qrPayload, 260);

    // Iniciar Scanner de Câmera quando a aba 'scan' é selecionada
    useEffect(() => {
        let isMounted = true;
        if (activeTab === 'scan') {
            setScanResult(null);
            setScanError(null);
            setCameraActive(true);

            const timer = setTimeout(async () => {
                const el = document.getElementById('passenger-qr-reader');
                if (!el || !isMounted) return;

                try {
                    const html5Qr = new Html5Qrcode('passenger-qr-reader');
                    scannerRef.current = html5Qr;

                    await html5Qr.start(
                        { facingMode: 'environment' },
                        { fps: 15, qrbox: { width: 250, height: 250 } },
                        async (decodedText) => {
                            if (!isMounted) return;
                            await handleScanSuccess(decodedText);
                            if (scannerRef.current && scannerRef.current.isScanning) {
                                scannerRef.current.stop().catch(() => {}).finally(() => scannerRef.current?.clear());
                            }
                        },
                        () => {}
                    );
                } catch (err: any) {
                    if (isMounted) {
                        setScanError('Não foi possível inicializar a câmera. Verifique as permissões do dispositivo.');
                    }
                }
            }, 150);

            return () => {
                isMounted = false;
                clearTimeout(timer);
                if (scannerRef.current && scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(() => {}).finally(() => scannerRef.current?.clear());
                }
            };
        } else {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {}).finally(() => scannerRef.current?.clear());
            }
            setCameraActive(false);
        }
    }, [activeTab, direction]);

    // Processar leitura bem-sucedida do QR Code do motorista / ônibus
    const handleScanSuccess = async (decodedText: string) => {
        setScanLoading(true);
        setScanError(null);

        try {
            let tripId: string | undefined = undefined;
            let scheduleId: string | undefined = undefined;

            try {
                const parsed = JSON.parse(decodedText);
                tripId = parsed.tripId || parsed.trip_id;
                scheduleId = parsed.scheduleId || parsed.schedule_id;
            } catch {
                // Se for ID puro
                if (decodedText.length > 20) {
                    scheduleId = decodedText;
                }
            }

            const record = await fretamentoCheckinService.registerCheckin({
                passengerId: (user as any)?.passengerId || user?.id || 'pass_default',
                passengerName: passengerName,
                cpf: passengerCpf,
                matricula: passengerRegistration,
                companyName: clientName,
                lineName: assignedRoute,
                vehiclePlate: 'Ônibus Executivo',
                direction: direction,
                checkinType: 'QR_SCAN_BY_PASSENGER',
                tripId,
                scheduleId
            });

            setScanResult(`Embarque confirmado com sucesso às ${new Date().toLocaleTimeString('pt-BR')}!`);
            toast({
                title: "✅ Embarque Confirmado!",
                description: `Ponto de Embarque registrado com GPS (${direction}). Boa viagem!`,
            });

            loadHistory();
        } catch (err: any) {
            const msg = err.message || 'Falha ao registrar embarque.';
            setScanError(msg);
            toast({
                title: "🚫 Embarque Não Realizado",
                description: msg,
                variant: "destructive"
            });
        } finally {
            setScanLoading(false);
        }
    };

    // Alteração de Senha no Perfil
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ title: 'Atenção', description: 'Preencha todos os campos da senha.', variant: 'destructive' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Atenção', description: 'A nova senha e confirmação não coincidem.', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: 'Atenção', description: 'A nova senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
            return;
        }

        setPasswordLoading(true);
        try {
            await api.post('/api/first-access/change-password', {
                currentPassword,
                newPassword,
                confirmPassword
            });
            setPasswordSuccess(true);
            toast({ title: '✅ Senha Atualizada!', description: 'Sua nova senha foi salva com segurança.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Erro ao alterar a senha. Verifique a senha atual informada.';
            toast({ title: 'Erro ao Alterar Senha', description: msg, variant: 'destructive' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-800">
            {/* Top Bar Fixa com Identificação do Cliente / Empresa */}
            <header className="p-4 pt-5 bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-600/20 border border-cyan-500/40 rounded-xl flex items-center justify-center text-cyan-400 shadow-md">
                        <Bus className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block leading-tight">
                            Portal do Passageiro
                        </span>
                        <span className="text-sm font-black text-white tracking-tight leading-tight block truncate max-w-[190px]">
                            {clientName}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                        ATIVO
                    </Badge>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => logout()}
                        title="Sair da Conta"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Conteúdo Principal Dinâmico por Aba */}
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* ABA 1: INÍCIO / VISÃO GERAL */}
                {activeTab === 'home' && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Card do Usuário */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 text-lg font-black">
                                    {passengerName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold text-white truncate">{passengerName}</h2>
                                    <p className="text-xs text-slate-400">Matrícula: <span className="text-slate-200 font-mono">{passengerRegistration}</span></p>
                                    <p className="text-xs text-slate-400">CPF: <span className="text-slate-200 font-mono">{passengerCpf}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Seletor de Sentido de Viagem (Ida / Retorno) */}
                        <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex gap-1">
                            <button
                                onClick={() => setDirection('IDA')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    direction === 'IDA' 
                                        ? 'bg-cyan-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                ➔ Viagem de IDA
                            </button>
                            <button
                                onClick={() => setDirection('RETORNO')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    direction === 'RETORNO' 
                                        ? 'bg-cyan-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                ➔ Viagem de RETORNO
                            </button>
                        </div>

                        {/* Ações Rápidas de Embarque */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setActiveTab('card')}
                                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl text-left transition-all shadow-md group"
                            >
                                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                                    <QrCode className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-white mb-0.5">Meu Cartão QR</h3>
                                <p className="text-[10px] text-slate-400">Apresentar ao motorista</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('scan')}
                                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl text-left transition-all shadow-md group"
                            >
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                                    <Camera className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-white mb-0.5">Ler QR do Ônibus</h3>
                                <p className="text-[10px] text-slate-400">Validar embarque agora</p>
                            </button>
                        </div>

                        {/* Card da Rota Autorizada */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <Navigation className="h-4 w-4 text-cyan-400" /> Linha Autorizada
                                </span>
                                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                    {direction}
                                </Badge>
                            </div>
                            <div className="border-t border-slate-800/80 pt-2">
                                <p className="text-sm font-bold text-white">{assignedRoute}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Embarque: Ponto Principal (Parada 03)</p>
                            </div>
                            <Button
                                onClick={() => setActiveTab('map')}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs py-2.5 rounded-xl border border-slate-700/60 gap-2"
                            >
                                <MapIcon className="h-4 w-4" /> Acompanhar Ônibus no Google Maps
                            </Button>
                        </div>

                        {/* Último Embarque Realizado */}
                        {history.length > 0 && (
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Último Embarque Confirmado</span>
                                        <span className="text-xs font-bold text-slate-200">
                                            {new Date(history[0].timestamp).toLocaleDateString('pt-BR')} às {new Date(history[0].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTab('history')} className="text-xs text-cyan-400 hover:underline font-bold">
                                    Ver Todos
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ABA 2: MEU CARTÃO DIGITAL (QR CODE DO PASSAGEIRO) */}
                {activeTab === 'card' && (
                    <div className="space-y-4 animate-fadeIn text-center">
                        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                            {/* Cabeçalho do Cartão */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                                <div className="text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">Cartão Corporativo</span>
                                    <span className="text-xs font-black text-white">{clientName}</span>
                                </div>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    EMBARQUE AUTORIZADO
                                </Badge>
                            </div>

                            {/* QR Code Offline em SVG Puro */}
                            <div className="bg-white p-3.5 rounded-2xl shadow-xl inline-block border-2 border-slate-700/50 mb-3">
                                <img 
                                    src={qrSvg} 
                                    alt="QR Code do Passageiro" 
                                    className="w-56 h-56 mx-auto object-contain"
                                />
                            </div>

                            {/* Relógio Anti-Print em Tempo Real */}
                            <div className="bg-slate-950/80 border border-slate-800 py-1.5 px-3 rounded-full inline-flex items-center gap-2 mb-3">
                                <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                                <span className="font-mono text-xs font-bold text-slate-200">
                                    {currentTime.toLocaleTimeString('pt-BR')} &bull; {currentTime.toLocaleDateString('pt-BR')}
                                </span>
                            </div>

                            {/* Informações Pessoais do Titular */}
                            <div className="text-left bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1">
                                <p className="text-xs text-slate-400">Nome: <strong className="text-white">{passengerName}</strong></p>
                                <p className="text-xs text-slate-400">Matrícula: <strong className="text-slate-200 font-mono">{passengerRegistration}</strong> &bull; CPF: <strong className="text-slate-200 font-mono">{passengerCpf}</strong></p>
                                <p className="text-xs text-slate-400">Sentido: <strong className="text-cyan-400">{direction}</strong></p>
                            </div>

                            <p className="text-[10px] text-slate-500 mt-3">
                                Apresente este código ao leitor do ônibus. Funciona 100% offline mesmo em áreas sem sinal.
                            </p>
                        </div>
                    </div>
                )}

                {/* ABA 3: LER QR CODE DO ÔNIBUS (CÂMERA) */}
                {activeTab === 'scan' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-center">
                            <h3 className="text-sm font-bold text-white mb-1">Escanear QR Code do Ônibus</h3>
                            <p className="text-xs text-slate-400 mb-3">
                                Aponte a câmera para o QR Code exibido na tela do motorista ou no painel do veículo.
                            </p>

                            {/* Visor da Câmera */}
                            <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-cyan-500/60 bg-black flex items-center justify-center">
                                <div id="passenger-qr-reader" className="w-full h-full object-cover" />
                                {scanLoading && (
                                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-cyan-400">
                                        <RefreshCw className="h-6 w-6 animate-spin" />
                                        <span className="text-xs font-bold">Validando embarque...</span>
                                    </div>
                                )}
                            </div>

                            {/* Alerta de Sucesso */}
                            {scanResult && (
                                <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 text-left">
                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    <span>{scanResult}</span>
                                </div>
                            )}

                            {/* Alerta de Erro (Demitido / Bloqueado / Linha Incorreta) */}
                            {scanError && (
                                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2 text-left">
                                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
                                    <span>{scanError}</span>
                                </div>
                            )}

                            <Button 
                                onClick={() => setActiveTab('home')} 
                                variant="outline" 
                                className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                            >
                                Voltar ao Início
                            </Button>
                        </div>
                    </div>
                )}

                {/* ABA 4: MAPA EM TEMPO REAL (GOOGLE MAPS) */}
                {activeTab === 'map' && (
                    <div className="space-y-4 animate-fadeIn">
                        <PassengerLiveMap lineName={assignedRoute} />
                    </div>
                )}

                {/* ABA 5: HISTÓRICO DE EMBARQUES */}
                {activeTab === 'history' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Histórico de Movimentação ({history.length})
                            </h3>
                            <button onClick={loadHistory} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                <RefreshCw className={`h-3 w-3 ${loadingHistory ? 'animate-spin' : ''}`} /> Atualizar
                            </button>
                        </div>

                        {history.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                                <Clock className="h-8 w-8 mx-auto text-slate-600" />
                                <p className="text-xs font-bold">Nenhum embarque registrado ainda.</p>
                                <p className="text-[11px] text-slate-500">Seus registros de embarque por QR Code aparecerão aqui em tempo real.</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-cyan-500/20 text-cyan-300 border-none text-[10px]">
                                            {item.direction || 'IDA'}
                                        </Badge>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            {new Date(item.timestamp).toLocaleDateString('pt-BR')} às {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-white">{item.lineName || assignedRoute}</p>
                                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" /> {item.address}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ABA 6: MEU PERFIL & SEGURANÇA (MUDAR SENHA) */}
                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Dados Cadastrais */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dados do Colaborador</h3>
                            <div className="space-y-1 text-xs">
                                <p className="text-slate-400">Nome: <strong className="text-white">{passengerName}</strong></p>
                                <p className="text-slate-400">Matrícula: <strong className="text-slate-200 font-mono">{passengerRegistration}</strong></p>
                                <p className="text-slate-400">CPF: <strong className="text-slate-200 font-mono">{passengerCpf}</strong></p>
                                <p className="text-slate-400">Empresa: <strong className="text-cyan-400">{clientName}</strong></p>
                            </div>
                        </div>

                        {/* Formulário de Troca de Senha */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-cyan-400" /> Alterar Senha de Acesso
                            </h3>

                            {passwordSuccess && (
                                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                                    ✅ Senha alterada com sucesso!
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <div>
                                    <Label className="text-[11px] text-slate-400">Senha Atual</Label>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Digite a senha atual"
                                        className="bg-slate-950 border-slate-800 text-xs h-9"
                                    />
                                </div>

                                <div>
                                    <Label className="text-[11px] text-slate-400">Nova Senha</Label>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="bg-slate-950 border-slate-800 text-xs h-9"
                                    />
                                </div>

                                <div>
                                    <Label className="text-[11px] text-slate-400">Confirmar Nova Senha</Label>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        className="bg-slate-950 border-slate-800 text-xs h-9"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                                    >
                                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        {showPassword ? 'Ocultar' : 'Exibir'} senhas
                                    </button>

                                    <Button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-9 px-4 rounded-xl"
                                    >
                                        {passwordLoading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Salvar Nova Senha
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation Bar Mobile-First */}
            <nav className="p-2 bg-slate-900/95 border-t border-slate-800/80 sticky bottom-0 z-50 backdrop-blur-md flex items-center justify-around">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        activeTab === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Home className="h-5 w-5" />
                    <span className="text-[10px]">Início</span>
                </button>

                <button
                    onClick={() => setActiveTab('card')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        activeTab === 'card' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <QrCode className="h-5 w-5" />
                    <span className="text-[10px]">Meu QR</span>
                </button>

                <button
                    onClick={() => setActiveTab('scan')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        activeTab === 'scan' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px]">Validar</span>
                </button>

                <button
                    onClick={() => setActiveTab('map')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        activeTab === 'map' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <MapIcon className="h-5 w-5" />
                    <span className="text-[10px]">Ônibus</span>
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        activeTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <User className="h-5 w-5" />
                    <span className="text-[10px]">Perfil</span>
                </button>
            </nav>
        </div>
    );
};

export default PassengerPortal;
