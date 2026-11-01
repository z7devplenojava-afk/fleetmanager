import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Users, 
    FileText, 
    Download, 
    Search, 
    RefreshCw, 
    CheckCircle2, 
    MapPin, 
    QrCode, 
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    Filter
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface BoardingItem {
    id: string;
    passengerName: string;
    passengerRegistration: string;
    passengerCpf: string;
    clientName: string;
    routeName: string;
    vehiclePlate: string;
    direction: string;
    validationMode: string;
    boardingTime: string;
    isSyncedOffline: boolean;
}

interface ClientOption {
    id: string;
    name: string;
}

export const TrafficBoardingManagementTab: React.FC = () => {
    const { toast } = useToast();
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [boardings, setBoardings] = useState<BoardingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        loadClients();
        loadBoardings();
    }, []);

    const loadClients = async () => {
        try {
            const res = await api.get('/api/clients');
            if (res.data && Array.isArray(res.data)) {
                setClients(res.data.map((c: any) => ({ id: c.id, name: c.name || c.corporateName })));
            }
        } catch (e) {
            console.warn('Erro ao carregar clientes:', e);
        }
    };

    const loadBoardings = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (selectedClientId && selectedClientId !== 'ALL') {
                params.clientId = selectedClientId;
            }
            if (startDate) {
                params.startDate = `${startDate}T00:00:00`;
            }
            if (endDate) {
                params.endDate = `${endDate}T23:59:59`;
            }

            const res = await api.get('/api/boardings/filtered', { params });
            if (res.data && Array.isArray(res.data)) {
                setBoardings(res.data);
            }
        } catch (e) {
            console.warn('Erro ao carregar embarques:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const params: Record<string, string> = {};
            if (selectedClientId && selectedClientId !== 'ALL') {
                params.clientId = selectedClientId;
            }
            if (startDate) {
                params.startDate = `${startDate}T00:00:00`;
            }
            if (endDate) {
                params.endDate = `${endDate}T23:59:59`;
            }

            const response = await api.get('/api/boardings/report/pdf', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_embarques_${startDate || 'periodo'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "✅ Relatório Gerado com Sucesso!",
                description: "O arquivo PDF foi baixado para o seu dispositivo."
            });
        } catch (e: any) {
            toast({
                title: "Erro ao Gerar PDF",
                description: "Não foi possível emitir o relatório de embarques. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    // Filtro em tempo real por busca de texto
    const filteredList = boardings.filter((b) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
            (b.passengerCpf && b.passengerCpf.includes(q)) ||
            (b.passengerRegistration && b.passengerRegistration.toLowerCase().includes(q)) ||
            (b.routeName && b.routeName.toLowerCase().includes(q)) ||
            (b.clientName && b.clientName.toLowerCase().includes(q))
        );
    });

    const totalEmbarques = filteredList.length;
    const idaCount = filteredList.filter(b => b.direction === 'IDA').length;
    const retornoCount = filteredList.filter(b => b.direction === 'RETORNO').length;
    const qrCount = filteredList.filter(b => (b.validationMode || '').includes('QR')).length;

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* Header com Filtros e Exportação */}
            <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-cyan-400" /> Gestão de Embarques dos Clientes
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Controle de passageiros, validação por QR Code e exportação oficial para faturamento e auditoria
                            </CardDescription>
                        </div>

                        <Button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf || boardings.length === 0}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 shadow-lg"
                        >
                            {downloadingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Exportar Relatório PDF
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                            <Label className="text-[11px] text-slate-400 mb-1 block">Empresa Cliente / Contratante</Label>
                            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200">
                                    <SelectValue placeholder="Todos os Clientes" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    <SelectItem value="ALL">Todos os Clientes</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-[11px] text-slate-400 mb-1 block">Data Inicial</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
                            />
                        </div>

                        <div>
                            <Label className="text-[11px] text-slate-400 mb-1 block">Data Final</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-200"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={loadBoardings}
                                disabled={loading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-9 gap-2"
                            >
                                <Filter className="h-3.5 w-3.5" /> Filtrar Dados
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-slate-900 border-slate-800 p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Embarques</span>
                        <span className="text-lg font-black text-white">{totalEmbarques}</span>
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                        <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Sentido Ida</span>
                        <span className="text-lg font-black text-white">{idaCount}</span>
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                        <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Sentido Retorno</span>
                        <span className="text-lg font-black text-white">{retornoCount}</span>
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                        <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Validados via QR</span>
                        <span className="text-lg font-black text-white">{qrCount}</span>
                    </div>
                </Card>
            </div>

            {/* Tabela de Embarques */}
            <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar passageiro, matrícula, CPF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-950 border-slate-800 pl-9 text-xs h-9 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                        {filteredList.length} registro(s)
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                                <th className="p-3">Data / Hora</th>
                                <th className="p-3">Passageiro</th>
                                <th className="p-3">Matrícula</th>
                                <th className="p-3">CPF</th>
                                <th className="p-3">Cliente / Contratante</th>
                                <th className="p-3">Linha / Rota</th>
                                <th className="p-3 text-center">Sentido</th>
                                <th className="p-3 text-center">Validação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-400" />
                                        Carregando registros de embarque...
                                    </td>
                                </tr>
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        Nenhum registro de embarque encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-3 font-mono text-slate-300">
                                            {b.boardingTime ? new Date(b.boardingTime).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-3 font-bold text-white">
                                            {b.passengerName || 'Passageiro'}
                                        </td>
                                        <td className="p-3 font-mono text-slate-300">
                                            {b.passengerRegistration || '-'}
                                        </td>
                                        <td className="p-3 font-mono text-slate-400">
                                            {b.passengerCpf || '-'}
                                        </td>
                                        <td className="p-3 text-slate-300">
                                            {b.clientName || 'Cliente Padrão'}
                                        </td>
                                        <td className="p-3 text-slate-300">
                                            {b.routeName || 'Linha Geral'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge className={`text-[10px] font-bold ${
                                                b.direction === 'IDA' 
                                                    ? 'bg-blue-500/20 text-blue-300 border-none' 
                                                    : 'bg-amber-500/20 text-amber-300 border-none'
                                            }`}>
                                                {b.direction || 'IDA'}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                                <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                                                {(b.validationMode || 'QR').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TrafficBoardingManagementTab;

