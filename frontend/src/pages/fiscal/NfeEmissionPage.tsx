import React, { useMemo, useState } from 'react';
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
import nfeService, { NfeCreateRequest, NfeItemRequest, NfeResponse } from '@/services/nfeService';
import {
    AlertTriangle,
    CheckCircle2,
    FileDown,
    FileSignature,
    Loader2,
    Plus,
    RefreshCw,
    Send,
    Trash2,
} from 'lucide-react';

interface ItemForm {
    code: string;
    description: string;
    ncm: string;
    cfop: string;
    unit: string;
    quantity: string;
    unitValue: string;
    icmsOrig: string;
    icmsCst: string;
    icmsRate: string;
    pisRate: string;
    cofinsRate: string;
}

interface FormState {
    series: string;
    natureOperation: string;
    paymentType: string;
    paymentInd: string;
    freightModality: string;
    notes: string;
    issuerStateRegistration: string;
    issuerAddress: string;
    issuerAddressNumber: string;
    issuerNeighborhood: string;
    issuerCity: string;
    issuerState: string;
    issuerZip: string;
    issuerMunicipalityCode: string;
    issuerCrt: string;
    recipientName: string;
    recipientTaxId: string;
    recipientStateRegistration: string;
    recipientIndIeDest: string;
    recipientEmail: string;
    recipientAddress: string;
    recipientAddressNumber: string;
    recipientNeighborhood: string;
    recipientCity: string;
    recipientState: string;
    recipientZip: string;
    recipientMunicipalityCode: string;
}

const emptyItem = (): ItemForm => ({
    code: '',
    description: '',
    ncm: '84099199',
    cfop: '5102',
    unit: 'UN',
    quantity: '1',
    unitValue: '',
    icmsOrig: '0',
    icmsCst: '00',
    icmsRate: '18',
    pisRate: '1.65',
    cofinsRate: '7.60',
});

const initialForm: FormState = {
    series: '1',
    natureOperation: 'VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS',
    paymentType: '15',
    paymentInd: '0',
    freightModality: '9',
    notes: '',
    issuerStateRegistration: '',
    issuerAddress: '',
    issuerAddressNumber: '',
    issuerNeighborhood: '',
    issuerCity: '',
    issuerState: '',
    issuerZip: '',
    issuerMunicipalityCode: '',
    issuerCrt: '3',
    recipientName: '',
    recipientTaxId: '',
    recipientStateRegistration: '',
    recipientIndIeDest: '9',
    recipientEmail: '',
    recipientAddress: '',
    recipientAddressNumber: '',
    recipientNeighborhood: '',
    recipientCity: '',
    recipientState: '',
    recipientZip: '',
    recipientMunicipalityCode: '',
};

const digits = (value: string) => value.replace(/\D/g, '');

const numberOrUndefined = (value: string) => {
    if (!value.trim()) return undefined;
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
        case 'CANCELADA':
            return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
        default:
            return 'bg-gray-500/15 text-gray-300 border-gray-500/40';
    }
};

const NfeEmissionPage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(initialForm);
    const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
    const [lastResult, setLastResult] = useState<NfeResponse | null>(null);
    const [emitting, setEmitting] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const { data: notes = [], isLoading, refetch } = useQuery({
        queryKey: ['electronicNfes'],
        queryFn: nfeService.list,
    });

    const totals = useMemo(() => {
        const issued = notes.filter((note) => note.status === 'EMITIDA');
        return {
            issued: issued.length,
            errors: notes.filter((note) => note.status === 'ERRO').length,
            value: issued.reduce((sum, note) => sum + Number(note.totalAmount ?? 0), 0),
        };
    }, [notes]);

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    const setItemField = (index: number, field: keyof ItemForm, value: string) =>
        setItems((previous) => previous.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

    const buildPayload = (): NfeCreateRequest => ({
        series: form.series.trim() || undefined,
        natureOperation: form.natureOperation.trim() || undefined,
        paymentType: form.paymentType || undefined,
        paymentInd: form.paymentInd || undefined,
        freightModality: form.freightModality || undefined,
        notes: form.notes.trim() || undefined,
        issuerStateRegistration: digits(form.issuerStateRegistration) || undefined,
        issuerAddress: form.issuerAddress.trim() || undefined,
        issuerAddressNumber: form.issuerAddressNumber.trim() || undefined,
        issuerNeighborhood: form.issuerNeighborhood.trim() || undefined,
        issuerCity: form.issuerCity.trim() || undefined,
        issuerState: form.issuerState.trim().toUpperCase() || undefined,
        issuerZip: digits(form.issuerZip) || undefined,
        issuerMunicipalityCode: digits(form.issuerMunicipalityCode) || undefined,
        issuerCrt: form.issuerCrt || undefined,
        recipientName: form.recipientName.trim(),
        recipientTaxId: digits(form.recipientTaxId),
        recipientStateRegistration: digits(form.recipientStateRegistration) || undefined,
        recipientIndIeDest: form.recipientIndIeDest || undefined,
        recipientEmail: form.recipientEmail.trim() || undefined,
        recipientAddress: form.recipientAddress.trim(),
        recipientAddressNumber: form.recipientAddressNumber.trim() || undefined,
        recipientNeighborhood: form.recipientNeighborhood.trim() || undefined,
        recipientCity: form.recipientCity.trim(),
        recipientState: form.recipientState.trim().toUpperCase(),
        recipientZip: digits(form.recipientZip),
        recipientMunicipalityCode: digits(form.recipientMunicipalityCode),
        items: items.map<NfeItemRequest>((item) => ({
            code: item.code.trim() || undefined,
            description: item.description.trim(),
            ncm: digits(item.ncm),
            cfop: digits(item.cfop),
            unit: item.unit.trim() || undefined,
            quantity: Number(item.quantity.replace(',', '.')) || 1,
            unitValue: Number(item.unitValue.replace(',', '.')) || 0,
            icmsOrig: item.icmsOrig || undefined,
            icmsCst: item.icmsCst || undefined,
            icmsRate: numberOrUndefined(item.icmsRate),
            pisRate: numberOrUndefined(item.pisRate),
            cofinsRate: numberOrUndefined(item.cofinsRate),
        })),
    });

    const handleEmit = async () => {
        if (!form.recipientName || !form.recipientTaxId || items.some((item) => !item.description || !item.unitValue)) {
            toast({
                title: 'Preencha os dados obrigatórios',
                description: 'Informe destinatário e, em cada item, descrição e valor unitário.',
                variant: 'destructive',
            });
            return;
        }
        if (!confirm('Transmitir esta NF-e à SEFAZ? A emissão não poderá ser desfeita pelo sistema.')) {
            return;
        }
        setEmitting(true);
        try {
            const result = await nfeService.emit(buildPayload());
            setLastResult(result);
            queryClient.invalidateQueries({ queryKey: ['electronicNfes'] });
            toast({
                title: result.status === 'EMITIDA' ? 'NF-e autorizada' : 'Emissão não autorizada',
                description:
                    result.status === 'EMITIDA'
                        ? `NF-e ${result.number} autorizada pela SEFAZ.`
                        : result.rejectionMessage || 'A SEFAZ não autorizou a NF-e.',
                variant: result.status === 'EMITIDA' ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Falha na emissão',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setEmitting(false);
        }
    };

    const handleConsultar = async (id: string) => {
        setBusyId(id);
        try {
            const result = await nfeService.consultar(id);
            queryClient.invalidateQueries({ queryKey: ['electronicNfes'] });
            toast({
                title: result.status === 'EMITIDA' ? 'NF-e autorizada' : 'Consulta concluída',
                description: result.protocolMessage || result.rejectionMessage || `Situação: ${result.status}.`,
                variant: result.status === 'EMITIDA' || result.status === 'CANCELADA' ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Falha na consulta',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    const handleCancelar = async (note: NfeResponse) => {
        const justificativa = window.prompt('Justificativa do cancelamento (mínimo 15 caracteres):');
        if (!justificativa) return;
        setBusyId(note.id);
        try {
            const result = await nfeService.cancelar(note.id, justificativa);
            queryClient.invalidateQueries({ queryKey: ['electronicNfes'] });
            toast({
                title: 'Evento de cancelamento processado',
                description: result.protocolMessage || `Situação: ${result.status}.`,
                variant: result.status === 'CANCELADA' ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Não foi possível cancelar',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    const download = async (note: NfeResponse, kind: 'xml' | 'pdf') => {
        setBusyId(note.id);
        try {
            const blob = kind === 'xml' ? await nfeService.xml(note.id) : await nfeService.pdf(note.id);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `NFe-${note.number}-serie-${note.series}.${kind}`;
            anchor.click();
            URL.revokeObjectURL(url);
            if (kind === 'pdf') {
                toast({
                    title: 'DANFE simplificada gerada',
                    description: 'Documento auxiliar gerado localmente, sem validade fiscal.',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Não foi possível baixar o arquivo',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <StandardLayout
            title="Emissão de NF-e (modelo 55)"
            subtitle="NF-e 4.00 assinada com certificado A1 e transmitida à SEFAZ"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Ambiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-seguranca-yellow">
                                {notes[0]?.environment === '1' ? 'Produção' : 'Homologação'}
                            </div>
                            <p className="text-xs text-gray-400">Definido em fiscal.nfe.environment</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Autorizadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-emerald-300">{totals.issued}</div>
                            <p className="text-xs text-gray-400">{money(totals.value)} em NF-e</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Ocorrências</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-lg font-bold">
                                {totals.errors > 0 ? (
                                    <AlertTriangle className="text-amber-400" size={18} />
                                ) : (
                                    <CheckCircle2 className="text-emerald-400" size={18} />
                                )}
                                {totals.errors}
                            </div>
                            <p className="text-xs text-gray-400">Notas com erro de emissão</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="emitir">
                    <TabsList>
                        <TabsTrigger value="emitir">Nova NF-e</TabsTrigger>
                        <TabsTrigger value="historico">Histórico ({notes.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="emitir" className="space-y-4">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSignature size={18} /> Identificação e emitente
                                </CardTitle>
                                <CardDescription>
                                    Os dados do emitente são obtidos do cadastro da empresa; os campos abaixo complementam o XML.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div>
                                    <Label>Série</Label>
                                    <Input value={form.series} onChange={(e) => setField('series', e.target.value)} />
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <Label>Natureza da operação</Label>
                                    <Input value={form.natureOperation}
                                           onChange={(e) => setField('natureOperation', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Pagamento (tPag)</Label>
                                    <Input value={form.paymentType}
                                           onChange={(e) => setField('paymentType', digits(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Inscrição estadual</Label>
                                    <Input value={form.issuerStateRegistration}
                                           onChange={(e) => setField('issuerStateRegistration', e.target.value)} />
                                </div>
                                <div>
                                    <Label>CRT</Label>
                                    <Input value={form.issuerCrt}
                                           onChange={(e) => setField('issuerCrt', digits(e.target.value))} />
                                </div>
                                <div className="col-span-2">
                                    <Label>Código IBGE do município</Label>
                                    <Input value={form.issuerMunicipalityCode}
                                           onChange={(e) => setField('issuerMunicipalityCode', digits(e.target.value))} />
                                </div>
                                <div>
                                    <Label>UF</Label>
                                    <Input value={form.issuerState} maxLength={2}
                                           onChange={(e) => setField('issuerState', e.target.value.toUpperCase())} />
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <Label>Cidade</Label>
                                    <Input value={form.issuerCity}
                                           onChange={(e) => setField('issuerCity', e.target.value)} />
                                </div>
                                <div>
                                    <Label>CEP</Label>
                                    <Input value={form.issuerZip}
                                           onChange={(e) => setField('issuerZip', digits(e.target.value))} />
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <Label>Logradouro</Label>
                                    <Input value={form.issuerAddress}
                                           onChange={(e) => setField('issuerAddress', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Número</Label>
                                    <Input value={form.issuerAddressNumber}
                                           onChange={(e) => setField('issuerAddressNumber', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Bairro</Label>
                                    <Input value={form.issuerNeighborhood}
                                           onChange={(e) => setField('issuerNeighborhood', e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle>Destinatário</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="col-span-2">
                                    <Label>Nome / Razão social *</Label>
                                    <Input value={form.recipientName}
                                           onChange={(e) => setField('recipientName', e.target.value)} />
                                </div>
                                <div>
                                    <Label>CPF/CNPJ *</Label>
                                    <Input value={form.recipientTaxId}
                                           onChange={(e) => setField('recipientTaxId', digits(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Inscrição estadual</Label>
                                    <Input value={form.recipientStateRegistration}
                                           onChange={(e) => setField('recipientStateRegistration', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Ind. IE (1/2/9)</Label>
                                    <Input value={form.recipientIndIeDest}
                                           onChange={(e) => setField('recipientIndIeDest', digits(e.target.value))} />
                                </div>
                                <div className="col-span-3">
                                    <Label>E-mail</Label>
                                    <Input value={form.recipientEmail}
                                           onChange={(e) => setField('recipientEmail', e.target.value)} />
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                    <Label>Logradouro *</Label>
                                    <Input value={form.recipientAddress}
                                           onChange={(e) => setField('recipientAddress', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Número</Label>
                                    <Input value={form.recipientAddressNumber}
                                           onChange={(e) => setField('recipientAddressNumber', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Bairro</Label>
                                    <Input value={form.recipientNeighborhood}
                                           onChange={(e) => setField('recipientNeighborhood', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Município (IBGE) *</Label>
                                    <Input value={form.recipientMunicipalityCode}
                                           onChange={(e) => setField('recipientMunicipalityCode', digits(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Cidade *</Label>
                                    <Input value={form.recipientCity}
                                           onChange={(e) => setField('recipientCity', e.target.value)} />
                                </div>
                                <div>
                                    <Label>UF *</Label>
                                    <Input value={form.recipientState} maxLength={2}
                                           onChange={(e) => setField('recipientState', e.target.value.toUpperCase())} />
                                </div>
                                <div>
                                    <Label>CEP *</Label>
                                    <Input value={form.recipientZip}
                                           onChange={(e) => setField('recipientZip', digits(e.target.value))} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Itens</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => setItems([...items, emptyItem()])}>
                                    <Plus size={14} className="mr-1" /> Adicionar item
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-600 p-3 md:grid-cols-6">
                                        <div className="col-span-2 md:col-span-2">
                                            <Label>Descrição *</Label>
                                            <Input value={item.description}
                                                   onChange={(e) => setItemField(index, 'description', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Código</Label>
                                            <Input value={item.code}
                                                   onChange={(e) => setItemField(index, 'code', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>NCM *</Label>
                                            <Input value={item.ncm}
                                                   onChange={(e) => setItemField(index, 'ncm', digits(e.target.value))} />
                                        </div>
                                        <div>
                                            <Label>CFOP *</Label>
                                            <Input value={item.cfop}
                                                   onChange={(e) => setItemField(index, 'cfop', digits(e.target.value))} />
                                        </div>
                                        <div>
                                            <Label>Unidade</Label>
                                            <Input value={item.unit}
                                                   onChange={(e) => setItemField(index, 'unit', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Quantidade</Label>
                                            <Input value={item.quantity}
                                                   onChange={(e) => setItemField(index, 'quantity', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Valor unitário *</Label>
                                            <Input value={item.unitValue}
                                                   onChange={(e) => setItemField(index, 'unitValue', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>CST/CSOSN ICMS</Label>
                                            <Input value={item.icmsCst}
                                                   onChange={(e) => setItemField(index, 'icmsCst', digits(e.target.value))} />
                                        </div>
                                        <div>
                                            <Label>Alíquota ICMS</Label>
                                            <Input value={item.icmsRate}
                                                   onChange={(e) => setItemField(index, 'icmsRate', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Alíquota PIS</Label>
                                            <Input value={item.pisRate}
                                                   onChange={(e) => setItemField(index, 'pisRate', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Alíquota COFINS</Label>
                                            <Input value={item.cofinsRate}
                                                   onChange={(e) => setItemField(index, 'cofinsRate', e.target.value)} />
                                        </div>
                                        <div className="flex items-end">
                                            <Button variant="destructive" size="sm" type="button"
                                                    disabled={items.length === 1}
                                                    onClick={() => setItems(items.filter((_, i) => i !== index))}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle>Observações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea value={form.notes} rows={3}
                                          onChange={(e) => setField('notes', e.target.value)} />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleEmit} disabled={emitting} size="lg">
                                {emitting ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Send className="mr-2" size={16} />}
                                {emitting ? 'Transmitindo...' : 'Emitir NF-e na SEFAZ'}
                            </Button>
                        </div>

                        {lastResult && (
                            <Card className="bg-seguranca-graphite border-gray-600">
                                <CardHeader>
                                    <CardTitle>Último resultado</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge className={statusStyle(lastResult.status)}>{lastResult.status}</Badge>
                                        <span>NF-e {lastResult.number} — série {lastResult.series}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Chave: {lastResult.accessKey}</p>
                                    {lastResult.protocolMessage && <p className="text-xs">{lastResult.protocolMessage}</p>}
                                    {lastResult.rejectionMessage && (
                                        <p className="text-xs text-red-300">{lastResult.rejectionMessage}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="historico">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Notas emitidas</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                    <RefreshCw size={14} className="mr-1" /> Atualizar
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Loader2 className="animate-spin" size={16} /> Carregando...
                                    </div>
                                ) : notes.length === 0 ? (
                                    <p className="text-sm text-gray-400">Nenhuma NF-e emitida.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-xs uppercase text-gray-400">
                                                <tr>
                                                    <th className="p-2">Número</th>
                                                    <th className="p-2">Destinatário</th>
                                                    <th className="p-2">Emissão</th>
                                                    <th className="p-2">Valor</th>
                                                    <th className="p-2">Situação</th>
                                                    <th className="p-2 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {notes.map((note) => (
                                                    <tr key={note.id} className="border-t border-gray-700">
                                                        <td className="p-2 font-medium">
                                                            {note.number}/{note.series}
                                                            <div className="text-[10px] text-gray-400">{note.accessKey}</div>
                                                        </td>
                                                        <td className="p-2">{note.recipientName || '-'}</td>
                                                        <td className="p-2">
                                                            {new Date(note.emissionDate).toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="p-2">{money(note.totalAmount)}</td>
                                                        <td className="p-2">
                                                            <Badge className={statusStyle(note.status)}>{note.status}</Badge>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" title="Consultar situação"
                                                                        disabled={busyId === note.id}
                                                                        onClick={() => handleConsultar(note.id)}>
                                                                    <RefreshCw size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" title="Baixar XML"
                                                                        disabled={busyId === note.id}
                                                                        onClick={() => download(note, 'xml')}>
                                                                    <FileSignature size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" title="Baixar DANFE simplificada"
                                                                        disabled={busyId === note.id}
                                                                        onClick={() => download(note, 'pdf')}>
                                                                    <FileDown size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" title="Cancelar"
                                                                        disabled={note.status !== 'EMITIDA' || busyId === note.id}
                                                                        onClick={() => handleCancelar(note)}>
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </StandardLayout>
    );
};

export default NfeEmissionPage;
