import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import cteService, { CteEmissionRequest, CteResponse } from '@/services/cteService';
import nfseService from '@/services/nfseService';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    FileDown,
    FileSignature,
    Loader2,
    RefreshCw,
    Send,
    Truck,
} from 'lucide-react';

interface FormState {
    series: string;
    cfop: string;
    natureOperation: string;
    serviceTaker: string;
    senderName: string;
    senderTaxId: string;
    senderAddress: string;
    senderCity: string;
    senderState: string;
    senderZip: string;
    senderStateRegistration: string;
    senderMunicipalityCode: string;
    recipientName: string;
    recipientTaxId: string;
    recipientAddress: string;
    recipientCity: string;
    recipientState: string;
    recipientZip: string;
    recipientStateRegistration: string;
    recipientMunicipalityCode: string;
    originCity: string;
    originState: string;
    originMunicipalityCode: string;
    destinationCity: string;
    destinationState: string;
    destinationMunicipalityCode: string;
    vehiclePlate: string;
    rntrc: string;
    cargoDescription: string;
    cargoWeight: string;
    cargoValue: string;
    freightValue: string;
    icmsRate: string;
    notes: string;
}

const initialForm: FormState = {
    series: '1',
    cfop: '',
    natureOperation: 'PRESTACAO DE SERVICO DE TRANSPORTE RODOVIARIO',
    serviceTaker: 'REMETENTE',
    senderName: '',
    senderTaxId: '',
    senderAddress: '',
    senderCity: '',
    senderState: 'MG',
    senderZip: '',
    senderStateRegistration: '',
    senderMunicipalityCode: '',
    recipientName: '',
    recipientTaxId: '',
    recipientAddress: '',
    recipientCity: '',
    recipientState: 'MG',
    recipientZip: '',
    recipientStateRegistration: '',
    recipientMunicipalityCode: '',
    originCity: '',
    originState: 'MG',
    originMunicipalityCode: '',
    destinationCity: '',
    destinationState: 'MG',
    destinationMunicipalityCode: '',
    vehiclePlate: '',
    rntrc: '',
    cargoDescription: '',
    cargoWeight: '',
    cargoValue: '',
    freightValue: '',
    icmsRate: '12',
    notes: '',
};

const digits = (value: string) => value.replace(/\D/g, '');

const numberOrUndefined = (value: string) => {
    if (!value || !value.trim()) return undefined;
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
};

const money = (value?: number) =>
    (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusStyle = (status?: string) => {
    switch (status) {
        case 'EMITIDA':
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
        case 'ERRO':
            return 'bg-red-500/15 text-red-300 border-red-500/40';
        case 'PROCESSANDO':
            return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
        default:
            return 'bg-gray-500/15 text-gray-300 border-gray-500/40';
    }
};

const errorMessage = (error: any) =>
    error?.response?.data?.message || error?.message || 'Erro inesperado.';

const CteEmissionPage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(initialForm);
    const [lastResult, setLastResult] = useState<CteResponse | null>(null);
    const [emitting, setEmitting] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [defaultsLoaded, setDefaultsLoaded] = useState(false);

    const { data: ctes = [], isLoading, refetch } = useQuery({
        queryKey: ['cteDocuments'],
        queryFn: cteService.list,
    });

    const { data: config } = useQuery({
        queryKey: ['nfseConfig'],
        queryFn: nfseService.getConfig,
    });

    useEffect(() => {
        if (!config || defaultsLoaded) return;
        setForm((previous) => ({
            ...previous,
            originCity: previous.originCity || config.city || '',
            originState: previous.originState || config.state || 'MG',
            originMunicipalityCode: previous.originMunicipalityCode || config.codigoMunicipio || '',
            senderMunicipalityCode: previous.senderMunicipalityCode || config.codigoMunicipio || '',
            senderCity: previous.senderCity || config.city || '',
            senderState: previous.senderState || config.state || 'MG',
        }));
        setDefaultsLoaded(true);
    }, [config, defaultsLoaded]);

    const totals = useMemo(() => ({
        issued: ctes.filter((item) => item.status === 'EMITIDA').length,
        errors: ctes.filter((item) => item.status === 'ERRO').length,
        value: ctes.filter((item) => item.status === 'EMITIDA')
            .reduce((sum, item) => sum + Number(item.freightValue ?? 0), 0),
    }), [ctes]);

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    const buildPayload = (): CteEmissionRequest => ({
        series: form.series || undefined,
        cfop: digits(form.cfop) || undefined,
        natureOperation: form.natureOperation.trim() || undefined,
        serviceTaker: form.serviceTaker,
        senderName: form.senderName.trim(),
        senderTaxId: digits(form.senderTaxId),
        senderAddress: form.senderAddress.trim() || undefined,
        senderCity: form.senderCity.trim() || undefined,
        senderState: form.senderState.trim().toUpperCase() || undefined,
        senderZip: digits(form.senderZip) || undefined,
        senderStateRegistration: form.senderStateRegistration.trim() || undefined,
        senderMunicipalityCode: digits(form.senderMunicipalityCode) || undefined,
        recipientName: form.recipientName.trim(),
        recipientTaxId: digits(form.recipientTaxId),
        recipientAddress: form.recipientAddress.trim() || undefined,
        recipientCity: form.recipientCity.trim() || undefined,
        recipientState: form.recipientState.trim().toUpperCase() || undefined,
        recipientZip: digits(form.recipientZip) || undefined,
        recipientStateRegistration: form.recipientStateRegistration.trim() || undefined,
        recipientMunicipalityCode: digits(form.recipientMunicipalityCode) || undefined,
        originCity: form.originCity.trim(),
        originState: form.originState.trim().toUpperCase(),
        originMunicipalityCode: digits(form.originMunicipalityCode),
        destinationCity: form.destinationCity.trim(),
        destinationState: form.destinationState.trim().toUpperCase(),
        destinationMunicipalityCode: digits(form.destinationMunicipalityCode),
        vehiclePlate: form.vehiclePlate.trim().toUpperCase() || undefined,
        rntrc: form.rntrc.trim().toUpperCase() || undefined,
        cargoDescription: form.cargoDescription.trim(),
        cargoWeight: numberOrUndefined(form.cargoWeight),
        cargoValue: numberOrUndefined(form.cargoValue),
        freightValue: numberOrUndefined(form.freightValue),
        icmsRate: numberOrUndefined(form.icmsRate),
        notes: form.notes.trim() || undefined,
    });

    const handleEmit = async () => {
        if (!form.senderName || !form.recipientName || !form.cargoDescription || !form.freightValue) {
            toast({
                title: 'Preencha os dados obrigatórios',
                description: 'Informe remetente, destinatário, carga e valor do frete.',
                variant: 'destructive',
            });
            return;
        }
        if (!confirm('Transmitir este CT-e à SEFAZ? A emissão não poderá ser desfeita pelo sistema.')) {
            return;
        }
        setEmitting(true);
        try {
            const result = await cteService.emit(buildPayload());
            setLastResult(result);
            queryClient.invalidateQueries({ queryKey: ['cteDocuments'] });
            toast({
                title: result.status === 'EMITIDA' ? 'CT-e autorizado' : 'Emissão não autorizada',
                description: result.status === 'EMITIDA'
                    ? `CT-e ${result.number} autorizado pela SEFAZ.`
                    : 'A SEFAZ não autorizou o CT-e. Consulte o histórico para detalhes.',
                variant: result.status === 'EMITIDA' ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Falha na emissão',
                description: errorMessage(error),
                variant: 'destructive',
            });
        } finally {
            setEmitting(false);
        }
    };

    const handleConsultar = async (id: string) => {
        setBusyId(id);
        try {
            const result = await cteService.consultar(id);
            queryClient.invalidateQueries({ queryKey: ['cteDocuments'] });
            toast({
                title: result.status === 'EMITIDA' ? 'CT-e autorizado na SEFAZ' : 'Consulta concluída',
                description: `Situação atual: ${result.status}.`,
                variant: result.status === 'ERRO' ? 'destructive' : undefined,
            });
        } catch (error: any) {
            toast({ title: 'Falha na consulta', description: errorMessage(error), variant: 'destructive' });
        } finally {
            setBusyId(null);
        }
    };

    const handleCancelar = async (item: CteResponse) => {
        const motivo = prompt('Informe a justificativa do cancelamento (15 a 255 caracteres):');
        if (!motivo || motivo.trim().length < 15) {
            toast({
                title: 'Justificativa inválida',
                description: 'Informe ao menos 15 caracteres para cancelar o CT-e.',
                variant: 'destructive',
            });
            return;
        }
        if (!confirm(`Cancelar o CT-e ${item.number} na SEFAZ?`)) return;
        setBusyId(item.id);
        try {
            await cteService.cancelar(item.id, motivo.trim());
            queryClient.invalidateQueries({ queryKey: ['cteDocuments'] });
            toast({ title: 'Evento de cancelamento registrado' });
        } catch (error: any) {
            toast({
                title: 'Não foi possível cancelar',
                description: errorMessage(error),
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    const download = async (item: CteResponse, kind: 'xml' | 'pdf') => {
        setBusyId(item.id);
        try {
            const blob = kind === 'xml' ? await cteService.xml(item.id) : await cteService.pdf(item.id);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `CTe-${item.number}-serie-${item.series}.${kind}`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (error: any) {
            toast({
                title: 'Não foi possível baixar o arquivo',
                description: errorMessage(error),
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <StandardLayout
            title="Emissão de CT-e"
            subtitle="Conhecimento de Transporte Eletrônico (modelo 57, v4.00) — transmissão SOAP à SEFAZ"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">CT-e autorizados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-blue-300">{totals.issued}</div>
                            <p className="text-xs text-gray-400">{totals.errors} com erro</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Frete autorizado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-seguranca-yellow">{money(totals.value)}</div>
                            <p className="text-xs text-gray-400">Total dos CT-e emitidos</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600 md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Pré-requisitos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="flex items-center gap-2 text-sm text-gray-300">
                                {config?.certificateConfigured
                                    ? <CheckCircle2 className="text-emerald-400" size={16} />
                                    : <AlertTriangle className="text-amber-400" size={16} />}
                                Certificado A1 {config?.certificateConfigured ? 'ativo' : 'não configurado'}
                            </p>
                            <p className="text-xs text-gray-400">
                                Cód. IBGE da empresa: {config?.codigoMunicipio || 'não cadastrado'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="emitir" className="space-y-4">
                    <TabsList className="bg-seguranca-graphite border border-gray-600">
                        <TabsTrigger value="emitir">Emitir CT-e</TabsTrigger>
                        <TabsTrigger value="documentos">CT-e emitidos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="emitir" className="space-y-4">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                                    <Truck className="text-seguranca-yellow" size={20} /> Dados do CT-e
                                </CardTitle>
                                <CardDescription>
                                    Emitente = empresa logada. Todos os códigos IBGE informados devem ser reais (7 dígitos).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div><Label>Série</Label><Input value={form.series} onChange={(e) => setField('series', e.target.value)} /></div>
                                    <div><Label>CFOP (4 dígitos)</Label><Input value={form.cfop} onChange={(e) => setField('cfop', e.target.value)} placeholder="5353" /></div>
                                    <div>
                                        <Label>Tomador</Label>
                                        <select
                                            className="h-10 w-full rounded-md border border-gray-600 bg-seguranca-black/40 px-3 text-sm text-gray-100"
                                            value={form.serviceTaker}
                                            onChange={(e) => setField('serviceTaker', e.target.value)}
                                        >
                                            <option value="REMETENTE">Remetente</option>
                                            <option value="DESTINATARIO">Destinatário</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3"><Label>Natureza da operação</Label><Input value={form.natureOperation} onChange={(e) => setField('natureOperation', e.target.value)} /></div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-seguranca-lightgray">Remetente</p>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="md:col-span-2"><Label>Nome / razão social *</Label><Input value={form.senderName} onChange={(e) => setField('senderName', e.target.value)} /></div>
                                        <div><Label>CNPJ/CPF *</Label><Input value={form.senderTaxId} onChange={(e) => setField('senderTaxId', e.target.value)} /></div>
                                        <div className="md:col-span-2"><Label>Endereço *</Label><Input value={form.senderAddress} onChange={(e) => setField('senderAddress', e.target.value)} /></div>
                                        <div><Label>Cód. IBGE município *</Label><Input value={form.senderMunicipalityCode} onChange={(e) => setField('senderMunicipalityCode', e.target.value)} placeholder="3142403" /></div>
                                        <div><Label>Cidade *</Label><Input value={form.senderCity} onChange={(e) => setField('senderCity', e.target.value)} /></div>
                                        <div><Label>UF *</Label><Input maxLength={2} value={form.senderState} onChange={(e) => setField('senderState', e.target.value)} /></div>
                                        <div><Label>CEP</Label><Input value={form.senderZip} onChange={(e) => setField('senderZip', e.target.value)} /></div>
                                        <div><Label>Inscrição estadual</Label><Input value={form.senderStateRegistration} onChange={(e) => setField('senderStateRegistration', e.target.value)} /></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-seguranca-lightgray">Destinatário</p>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="md:col-span-2"><Label>Nome / razão social *</Label><Input value={form.recipientName} onChange={(e) => setField('recipientName', e.target.value)} /></div>
                                        <div><Label>CNPJ/CPF *</Label><Input value={form.recipientTaxId} onChange={(e) => setField('recipientTaxId', e.target.value)} /></div>
                                        <div className="md:col-span-2"><Label>Endereço *</Label><Input value={form.recipientAddress} onChange={(e) => setField('recipientAddress', e.target.value)} /></div>
                                        <div><Label>Cód. IBGE município *</Label><Input value={form.recipientMunicipalityCode} onChange={(e) => setField('recipientMunicipalityCode', e.target.value)} placeholder="3106200" /></div>
                                        <div><Label>Cidade *</Label><Input value={form.recipientCity} onChange={(e) => setField('recipientCity', e.target.value)} /></div>
                                        <div><Label>UF *</Label><Input maxLength={2} value={form.recipientState} onChange={(e) => setField('recipientState', e.target.value)} /></div>
                                        <div><Label>CEP</Label><Input value={form.recipientZip} onChange={(e) => setField('recipientZip', e.target.value)} /></div>
                                        <div><Label>Inscrição estadual</Label><Input value={form.recipientStateRegistration} onChange={(e) => setField('recipientStateRegistration', e.target.value)} /></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-seguranca-lightgray">Prestação e carga</p>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div><Label>Cidade de origem *</Label><Input value={form.originCity} onChange={(e) => setField('originCity', e.target.value)} /></div>
                                        <div><Label>UF origem *</Label><Input maxLength={2} value={form.originState} onChange={(e) => setField('originState', e.target.value)} /></div>
                                        <div><Label>Cód. IBGE origem *</Label><Input value={form.originMunicipalityCode} onChange={(e) => setField('originMunicipalityCode', e.target.value)} /></div>
                                        <div><Label>Cidade de destino *</Label><Input value={form.destinationCity} onChange={(e) => setField('destinationCity', e.target.value)} /></div>
                                        <div><Label>UF destino *</Label><Input maxLength={2} value={form.destinationState} onChange={(e) => setField('destinationState', e.target.value)} /></div>
                                        <div><Label>Cód. IBGE destino *</Label><Input value={form.destinationMunicipalityCode} onChange={(e) => setField('destinationMunicipalityCode', e.target.value)} /></div>
                                        <div><Label>Placa do veículo</Label><Input value={form.vehiclePlate} onChange={(e) => setField('vehiclePlate', e.target.value)} /></div>
                                        <div><Label>RNTRC (8 dígitos ou ISENTO)</Label><Input value={form.rntrc} onChange={(e) => setField('rntrc', e.target.value)} /></div>
                                        <div><Label>Alíquota ICMS (%)</Label><Input type="number" step="0.01" value={form.icmsRate} onChange={(e) => setField('icmsRate', e.target.value)} /></div>
                                        <div className="md:col-span-3"><Label>Produto predominante *</Label><Input value={form.cargoDescription} onChange={(e) => setField('cargoDescription', e.target.value)} /></div>
                                        <div><Label>Peso (kg) *</Label><Input type="number" step="0.001" value={form.cargoWeight} onChange={(e) => setField('cargoWeight', e.target.value)} /></div>
                                        <div><Label>Valor da carga (R$)</Label><Input type="number" step="0.01" value={form.cargoValue} onChange={(e) => setField('cargoValue', e.target.value)} /></div>
                                        <div><Label>Valor do frete (R$) *</Label><Input type="number" step="0.01" value={form.freightValue} onChange={(e) => setField('freightValue', e.target.value)} /></div>
                                        <div className="md:col-span-3"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleEmit}
                                        disabled={emitting || !config?.certificateConfigured}
                                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                                    >
                                        {emitting ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Send className="mr-2" size={16} />}
                                        Transmitir à SEFAZ
                                    </Button>
                                </div>
                                {!config?.certificateConfigured && (
                                    <p className="flex items-center gap-2 text-xs text-amber-300">
                                        <AlertTriangle size={14} />
                                        Envie e ative o certificado A1 da empresa na emissão de NFS-e antes de emitir.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {lastResult && (
                            <Card className="bg-seguranca-graphite border-gray-600">
                                <CardHeader><CardTitle className="text-seguranca-lightgray">Último envio</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge className={statusStyle(lastResult.status)}>{lastResult.status}</Badge>
                                        <span className="text-gray-300">Nº {lastResult.number} — Série {lastResult.series}</span>
                                    </div>
                                    <p className="break-all text-xs text-gray-400">Chave: {lastResult.accessKey}</p>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="border-gray-600" onClick={() => download(lastResult, 'xml')}>
                                            <FileDown className="mr-1" size={14} /> XML
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-gray-600" onClick={() => download(lastResult, 'pdf')}>
                                            <FileSignature className="mr-1" size={14} /> PDF
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="documentos">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-seguranca-lightgray">CT-e emitidos</CardTitle>
                                    <CardDescription>Histórico e ações de consulta, cancelamento e download.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" className="border-gray-600" onClick={() => refetch()}>
                                    <RefreshCw className="mr-2" size={14} /> Atualizar
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-y border-gray-600/60 bg-black/20 text-left text-xs uppercase tracking-wider text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3">Número</th>
                                                <th className="px-4 py-3">Destinatário</th>
                                                <th className="px-4 py-3">Percurso</th>
                                                <th className="px-4 py-3 text-right">Frete</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {isLoading && (
                                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400"><Loader2 className="mx-auto animate-spin" size={20} /></td></tr>
                                            )}
                                            {!isLoading && ctes.length === 0 && (
                                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum CT-e emitido até o momento.</td></tr>
                                            )}
                                            {ctes.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-100">{item.number}</div>
                                                        <div className="text-xs text-gray-500">Série {item.series}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-gray-200">{item.recipientName}</div>
                                                        <div className="text-xs text-gray-500">{item.recipientTaxId ?? ''}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {item.originCity}/{item.originState} → {item.destinationCity}/{item.destinationState}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-200">{money(item.freightValue)}</td>
                                                    <td className="px-4 py-3"><Badge className={statusStyle(item.status)}>{item.status}</Badge></td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <Button size="sm" variant="ghost" title="Consultar na SEFAZ" onClick={() => handleConsultar(item.id)} disabled={busyId === item.id}>
                                                                {busyId === item.id ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" title="Cancelar" onClick={() => handleCancelar(item)} disabled={busyId === item.id || item.status !== 'EMITIDA'}>
                                                                <Ban size={15} />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" title="Baixar XML" onClick={() => download(item, 'xml')} disabled={busyId === item.id}>
                                                                <FileDown size={15} />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" title="Baixar PDF" onClick={() => download(item, 'pdf')} disabled={busyId === item.id}>
                                                                <FileSignature size={15} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </StandardLayout>
    );
};

export default CteEmissionPage;
