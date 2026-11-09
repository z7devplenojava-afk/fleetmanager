import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Receipt,
    Search,
    FileText,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    ExternalLink,
    Filter,
    Barcode,
    Eye,
    TrendingDown
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import contasAPagarService from '@/services/contasAPagarService';
import fuelPumpService, { FuelDelivery } from '@/services/fuelPumpService';
import fleetService from '@/services/fleetService';
import { FuelRecord } from '@/types/fleet';
import BoletoViewerModal from './BoletoViewerModal';

export const FuelExpensesTab: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABERTA' | 'PAGA' | 'VENCIDA'>('ALL');
    const [originFilter, setOriginFilter] = useState<'ALL' | 'ENTRADA' | 'EXTERNO' | 'INTERNO'>('ALL');

    // Estado do Modal de Visualização de Boleto
    const [viewingBoleto, setViewingBoleto] = useState<{
        isOpen: boolean;
        boletoUrl?: string;
        fileName?: string;
        invoiceNumber?: string;
        installmentText?: string;
        supplier?: string;
        amount?: number;
        dueDate?: string;
        barcode?: string;
        linhaDigitavel?: string;
    }>({ isOpen: false });

    // 1. Carregar Contas a Pagar
    const { data: contas = [], isLoading: isLoadingContas, refetch: refetchContas } = useQuery({
        queryKey: ['contas-a-pagar'],
        queryFn: () => contasAPagarService.getContasAPagar(),
        retry: 1
    });

    // 2. Carregar Entradas de Tanques
    const { data: deliveries = [], isLoading: isLoadingDeliveries, refetch: refetchDeliveries } = useQuery({
        queryKey: ['fuelDeliveries'],
        queryFn: fuelPumpService.getDeliveries,
        retry: 1
    });

    // 3. Carregar Abastecimentos (Externos / Internos)
    const { data: fuelRecords = [], isLoading: isLoadingRecords, refetch: refetchRecords } = useQuery({
        queryKey: ['fuelRecords'],
        queryFn: () => fleetService.getFuelRecords(),
        retry: 1
    });

    const isRefreshing = isLoadingContas || isLoadingDeliveries || isLoadingRecords;

    const handleRefreshAll = () => {
        refetchContas();
        refetchDeliveries();
        refetchRecords();
    };

    // Consolidação unificada de despesas de combustível
    const expensesList = useMemo(() => {
        const list: Array<{
            id: string;
            invoiceNumber: string;
            origin: 'ENTRADA' | 'EXTERNO' | 'INTERNO';
            originLabel: string;
            supplier: string;
            installmentText: string;
            amount: number;
            issueDate: string;
            dueDate: string;
            status: 'ABERTA' | 'PAGA' | 'VENCIDA';
            boletoUrl?: string;
            boletoFileName?: string;
            barcode?: string;
            linhaDigitavel?: string;
            details?: string;
            contaId?: string;
        }> = [];

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // A. Faturas do Contas a Pagar vinculadas a Combustível
        contas.forEach((conta) => {
            const cat = (conta.categoria || '').toUpperCase();
            const desc = (conta.descricao || '').toUpperCase();
            const centro = (conta.centroCusto || '').toUpperCase();

            const isCombustivel =
                cat.includes('COMBUST') ||
                desc.includes('COMBUST') ||
                desc.includes('DIESEL') ||
                desc.includes('ARLA') ||
                centro.includes('ABASTECIMENTO');

            if (!isCombustivel) return;

            const isPaga = conta.status === 'PAGA' || conta.baixa;
            const dVenc = conta.vencimento ? new Date(conta.vencimento) : null;
            if (dVenc) dVenc.setHours(0, 0, 0, 0);

            const isVencida = !isPaga && dVenc && dVenc < hoje;

            let statusCalculado: 'ABERTA' | 'PAGA' | 'VENCIDA' = isPaga ? 'PAGA' : isVencida ? 'VENCIDA' : 'ABERTA';

            let origin: 'ENTRADA' | 'EXTERNO' | 'INTERNO' = 'ENTRADA';
            let originLabel = 'Entrada Tanque (NF)';
            if (desc.includes('EXTERNO')) {
                origin = 'EXTERNO';
                originLabel = 'Abast. Externo';
            } else if (desc.includes('INTERNO') && !desc.includes('ENTRADA')) {
                origin = 'INTERNO';
                originLabel = 'Abast. Interno';
            }

            const parcelSeq = conta.installmentSeq || 1;
            const parcelTotal = conta.totalInstallments || 1;
            const installmentText = parcelTotal > 1 ? `Parc ${parcelSeq}/${parcelTotal}` : 'Única';

            list.push({
                id: `conta-${conta.id}`,
                invoiceNumber: conta.invoiceNumber || 'S/N',
                origin,
                originLabel,
                supplier: conta.fornecedor || 'Fornecedor de Combustível',
                installmentText,
                amount: Number(conta.valor) || 0,
                issueDate: conta.dataEmissao ? new Date(conta.dataEmissao).toISOString().slice(0, 10) : '',
                dueDate: conta.vencimento ? new Date(conta.vencimento).toISOString().slice(0, 10) : '',
                status: statusCalculado,
                boletoUrl: conta.boletoUrl,
                boletoFileName: conta.boletoOriginalName,
                barcode: conta.codigoBarras,
                linhaDigitavel: conta.linhaDigitavel,
                details: conta.descricao,
                contaId: conta.id
            });
        });

        // B. Entradas de Tanques que porventura não estejam como fatura avulsa
        deliveries.forEach((del) => {
            const alreadyExists = list.some(
                (item) => item.invoiceNumber.includes(del.invoiceNumber) && item.origin === 'ENTRADA'
            );
            if (!alreadyExists) {
                const dVenc = del.deliveryDate ? new Date(del.deliveryDate) : hoje;
                const isVencida = dVenc < hoje;

                list.push({
                    id: `delivery-${del.id}`,
                    invoiceNumber: del.invoiceNumber,
                    origin: 'ENTRADA',
                    originLabel: 'Entrada Tanque (NF)',
                    supplier: del.supplier,
                    installmentText: 'Entrada Direta',
                    amount: del.totalPrice,
                    issueDate: del.deliveryDate,
                    dueDate: del.deliveryDate,
                    status: isVencida ? 'VENCIDA' : 'ABERTA',
                    details: `Tanque: ${del.fuelTankName} • ${del.liters} Litros a R$ ${del.pricePerLiter}/L`
                });
            }
        });

        // C. Abastecimentos Externos com valor registrado
        fuelRecords
            .filter((r) => r.isExternal || (r as any).type === 'EXTERNO')
            .forEach((rec) => {
                const doc = (rec as any).invoiceNumber || (rec as any).receiptNumber || `CUPOM-${rec.id.slice(0, 6)}`;
                const alreadyExists = list.some((item) => item.invoiceNumber === doc);
                if (!alreadyExists && (rec.cost || 0) > 0) {
                    list.push({
                        id: `record-${rec.id}`,
                        invoiceNumber: doc,
                        origin: 'EXTERNO',
                        originLabel: 'Abast. Externo',
                        supplier: (rec as any).gasStation || (rec as any).posto || 'Posto Credenciado',
                        installmentText: 'À Vista',
                        amount: rec.cost || 0,
                        issueDate: rec.date || rec.createdAt || '',
                        dueDate: rec.date || rec.createdAt || '',
                        status: 'PAGA',
                        details: `Veículo: ${(rec as any).vehiclePlate || 'Frota'} • ${rec.quantity || rec.liters || 0} L`
                    });
                }
            });

        return list;
    }, [contas, deliveries, fuelRecords]);

    // Totais e Métricas
    const summary = useMemo(() => {
        let total = 0;
        let pendente = 0;
        let vencido = 0;
        let pago = 0;

        expensesList.forEach((e) => {
            total += e.amount;
            if (e.status === 'PAGA') pago += e.amount;
            else if (e.status === 'VENCIDA') vencido += e.amount;
            else pendente += e.amount;
        });

        return { total, pendente, vencido, pago, count: expensesList.length };
    }, [expensesList]);

    // Filtragem
    const filteredExpenses = useMemo(() => {
        return expensesList.filter((item) => {
            const doc = item.invoiceNumber.toLowerCase();
            const supp = item.supplier.toLowerCase();
            const det = (item.details || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !search || doc.includes(search) || supp.includes(search) || det.includes(search);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            const matchesOrigin = originFilter === 'ALL' || item.origin === originFilter;

            return matchesSearch && matchesStatus && matchesOrigin;
        });
    }, [expensesList, searchTerm, statusFilter, originFilter]);

    return (
        <div className="space-y-6">
            {/* Header com Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                                Total de Despesas (Combustível)
                            </p>
                            <p className="text-2xl font-bold font-mono text-white mt-0.5">
                                {summary.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">{summary.count} títulos e abastecimentos</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <Receipt size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'ABERTA' ? 'ALL' : 'ABERTA')}
                    className={`bg-seguranca-graphite border cursor-pointer transition-all ${
                        statusFilter === 'ABERTA' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-gray-700 hover:border-amber-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                                A Pagar (Boletos Pendentes)
                            </p>
                            <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                                {summary.pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">Aguardando vencimento</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Clock size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'VENCIDA' ? 'ALL' : 'VENCIDA')}
                    className={`bg-seguranca-graphite border cursor-pointer transition-all ${
                        statusFilter === 'VENCIDA' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-gray-700 hover:border-red-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                                Vencidas / Em Atraso
                            </p>
                            <p className="text-2xl font-bold font-mono text-red-500 mt-0.5">
                                {summary.vencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">Intervenção financeira urgente</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <AlertCircle size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'PAGA' ? 'ALL' : 'PAGA')}
                    className={`bg-seguranca-graphite border cursor-pointer transition-all ${
                        statusFilter === 'PAGA' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-700 hover:border-emerald-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                                Pagas / Baixadas
                            </p>
                            <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                                {summary.pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">Quitadas no Contas a Pagar</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 size={22} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-seguranca-graphite border border-gray-700 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <Input
                            placeholder="Buscar por NF, fornecedor ou posto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-seguranca-black border-gray-600 text-white text-xs rounded-lg"
                        />
                    </div>

                    <select
                        value={originFilter}
                        onChange={(e) => setOriginFilter(e.target.value as any)}
                        className="h-10 bg-seguranca-black border border-gray-600 text-gray-200 text-xs rounded-lg px-3 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="ALL">🌐 Todas as Origens</option>
                        <option value="ENTRADA">📦 Entradas no Tanque (NF)</option>
                        <option value="EXTERNO">⛽ Abastecimentos Externos</option>
                        <option value="INTERNO">🏢 Abastecimentos Internos</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="h-10 bg-seguranca-black border border-gray-600 text-gray-200 text-xs rounded-lg px-3 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value="ABERTA">⏳ Em Aberto / A Pagar</option>
                        <option value="VENCIDA">🚨 Vencidas</option>
                        <option value="PAGA">✅ Pagas</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        className="h-10 border-gray-600 text-gray-300 hover:text-white text-xs"
                    >
                        <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sincronizar
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => navigate('/contas-a-pagar')}
                        className="h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 rounded-lg shadow"
                    >
                        <ExternalLink size={14} className="mr-1.5" /> Acessar Contas a Pagar
                    </Button>
                </div>
            </div>

            {/* Tabela de Despesas e Boletos */}
            <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-gray-700 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText size={16} className="text-purple-400" />
                        Notas Fiscais, Despesas e Boletos de Combustível
                    </CardTitle>
                    <span className="text-xs text-gray-400 font-mono">
                        {filteredExpenses.length} títulos listados
                    </span>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-700 bg-seguranca-black/40 text-[11px] font-mono uppercase text-gray-400">
                                <TableHead className="py-3 px-4">Documento / NF</TableHead>
                                <TableHead className="py-3 px-4">Origem</TableHead>
                                <TableHead className="py-3 px-4">Fornecedor / Posto</TableHead>
                                <TableHead className="py-3 px-4">Parcela</TableHead>
                                <TableHead className="py-3 px-4">Valor Total</TableHead>
                                <TableHead className="py-3 px-4">Vencimento</TableHead>
                                <TableHead className="py-3 px-4">Status Contas a Pagar</TableHead>
                                <TableHead className="py-3 px-4 text-center">Boleto a Pagar</TableHead>
                                <TableHead className="py-3 px-4 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-800 text-xs">
                            {filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                        <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
                                        <p className="text-sm font-medium">Nenhuma despesa ou boleto encontrado</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Registre novas entradas de combustível com boletos para listá-las aqui.
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((exp) => (
                                    <TableRow key={exp.id} className="hover:bg-seguranca-black/30 transition-colors">
                                        <TableCell className="font-mono font-bold text-white py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <FileText size={14} className="text-purple-400 shrink-0" />
                                                <span>{exp.invoiceNumber}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-3 px-4">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-mono ${
                                                    exp.origin === 'ENTRADA'
                                                        ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                                                        : exp.origin === 'EXTERNO'
                                                        ? 'border-green-500/40 text-green-400 bg-green-500/10'
                                                        : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                                }`}
                                            >
                                                {exp.originLabel}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="py-3 px-4">
                                            <div className="font-medium text-gray-200">{exp.supplier}</div>
                                            {exp.details && (
                                                <div className="text-[10px] text-gray-400 truncate max-w-xs font-mono">
                                                    {exp.details}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 px-4 font-mono text-gray-300">
                                            {exp.installmentText}
                                        </TableCell>

                                        <TableCell className="py-3 px-4 font-mono font-bold text-amber-400">
                                            {exp.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>

                                        <TableCell className="py-3 px-4 font-mono">
                                            {exp.dueDate ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-gray-400 shrink-0" />
                                                    <span className={exp.status === 'VENCIDA' ? 'text-red-400 font-bold' : 'text-gray-200'}>
                                                        {new Date(exp.dueDate).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 italic">A Vista</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 px-4">
                                            {exp.status === 'PAGA' ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-mono">
                                                    PAGA
                                                </Badge>
                                            ) : exp.status === 'VENCIDA' ? (
                                                <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] font-mono">
                                                    VENCIDA
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-mono">
                                                    A PAGAR
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 px-4 text-center">
                                            {exp.boletoUrl ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setViewingBoleto({
                                                            isOpen: true,
                                                            boletoUrl: exp.boletoUrl,
                                                            fileName: exp.boletoFileName,
                                                            invoiceNumber: exp.invoiceNumber,
                                                            installmentText: exp.installmentText,
                                                            supplier: exp.supplier,
                                                            amount: exp.amount,
                                                            dueDate: exp.dueDate,
                                                            barcode: exp.barcode,
                                                            linhaDigitavel: exp.linhaDigitavel
                                                        })
                                                    }
                                                    className="h-8 px-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold rounded-lg"
                                                >
                                                    <Barcode size={13} className="mr-1.5 text-blue-400" />
                                                    Visualizar Boleto
                                                </Button>
                                            ) : (
                                                <span className="text-[11px] text-gray-500 font-mono">
                                                    Sem Anexo
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 px-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    navigate(`/contas-a-pagar?search=${encodeURIComponent(exp.invoiceNumber)}`);
                                                }}
                                                className="h-8 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
                                                title="Visualizar no Contas a Pagar"
                                            >
                                                <ExternalLink size={13} className="mr-1" />
                                                Contas a Pagar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Visualização de Boleto */}
            <BoletoViewerModal
                isOpen={viewingBoleto.isOpen}
                onClose={() => setViewingBoleto({ isOpen: false })}
                boletoUrl={viewingBoleto.boletoUrl}
                fileName={viewingBoleto.fileName}
                invoiceNumber={viewingBoleto.invoiceNumber}
                installmentText={viewingBoleto.installmentText}
                supplier={viewingBoleto.supplier}
                amount={viewingBoleto.amount}
                dueDate={viewingBoleto.dueDate}
                barcode={viewingBoleto.barcode}
                linhaDigitavel={viewingBoleto.linhaDigitavel}
            />
        </div>
    );
};

export default FuelExpensesTab;
