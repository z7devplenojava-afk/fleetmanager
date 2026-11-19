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
import nfseService, {
    FiscalCertificate,
    NfseConfig,
    NfseCreateRequest,
    NfsePreviewResponse,
    NfseResponse,
} from '@/services/nfseService';
import {
    AlertTriangle,
    Ban,
    Building2,
    CheckCircle2,
    FileDown,
    FileSignature,
    KeyRound,
    Loader2,
    RefreshCw,
    Send,
    ShieldCheck,
    Upload,
} from 'lucide-react';

const currentCompetence = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

interface FormState {
    series: string;
    competence: string;
    grossAmount: string;
    deductionAmount: string;
    issRate: string;
    issWithheld: boolean;
    inssAmount: string;
    irrfAmount: string;
    csllAmount: string;
    takerName: string;
    takerTaxId: string;
    takerMunicipalRegistration: string;
    takerAddress: string;
    takerAddressNumber: string;
    takerNeighborhood: string;
    takerMunicipalityCode: string;
    takerCity: string;
    takerState: string;
    takerZip: string;
    takerEmail: string;
    serviceCode: string;
    municipalTaxCode: string;
    nbsCode: string;
    serviceDescription: string;
    discrimination: string;
    notes: string;
    ibscbsCIndOp: string;
    ibscbsIndDest: string;
    ibscbsCst: string;
    ibscbsCClassTrib: string;
    ibscbsIndFinal: string;
}

const initialForm: FormState = {
    series: '1',
    competence: currentCompetence(),
    grossAmount: '',
    deductionAmount: '',
    issRate: '5',
    issWithheld: false,
    inssAmount: '',
    irrfAmount: '',
    csllAmount: '',
    takerName: '',
    takerTaxId: '',
    takerMunicipalRegistration: '',
    takerAddress: '',
    takerAddressNumber: '',
    takerNeighborhood: '',
    takerMunicipalityCode: '',
    takerCity: '',
    takerState: '',
    takerZip: '',
    takerEmail: '',
    serviceCode: '160101',
    municipalTaxCode: '',
    nbsCode: '',
    serviceDescription: '',
    discrimination: '',
    notes: '',
    ibscbsCIndOp: '',
    ibscbsIndDest: '0',
    ibscbsCst: '000',
    ibscbsCClassTrib: '000000',
    ibscbsIndFinal: '0',
};

const money = (value?: number) =>
    (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const digits = (value: string) => value.replace(/\D/g, '');

const numberOrUndefined = (value: string) => {
    if (!value || !value.trim()) return undefined;
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
};

const statusStyle = (status?: string) => {
    switch (status) {
        case 'EMITIDA':
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
        case 'CANCELADA':
            return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
        case 'ERRO':
            return 'bg-red-500/15 text-red-300 border-red-500/40';
        case 'PROCESSANDO':
            return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
        default:
            return 'bg-gray-500/15 text-gray-300 border-gray-500/40';
    }
};

const NfseEmissionPage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(initialForm);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showEmptyTemplate, setShowEmptyTemplate] = useState(false);
    const [preview, setPreview] = useState<NfsePreviewResponse | null>(null);
    const [lastResult, setLastResult] = useState<NfseResponse | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [emitting, setEmitting] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [configForm, setConfigForm] = useState({
        inscricaoEstadual: '',
        inscricaoMunicipal: '',
        codigoMunicipio: '',
        regimeTributario: '',
    });
    const [configLoaded, setConfigLoaded] = useState(false);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [certificatePassword, setCertificatePassword] = useState('');
    const [uploadingCertificate, setUploadingCertificate] = useState(false);

    const { data: invoices = [], isLoading, refetch } = useQuery({
        queryKey: ['nfseInvoices'],
        queryFn: nfseService.list,
    });

    const { data: config } = useQuery<NfseConfig>({
        queryKey: ['nfseConfig'],
        queryFn: nfseService.getConfig,
    });

    const { data: certificates = [], refetch: refetchCertificates } = useQuery<FiscalCertificate[]>({
        queryKey: ['fiscalCertificates'],
        queryFn: nfseService.listCertificates,
    });

    React.useEffect(() => {
        if (config && !configLoaded) {
            setConfigForm({
                inscricaoEstadual: config.inscricaoEstadual ?? '',
                inscricaoMunicipal: config.inscricaoMunicipal ?? '',
                codigoMunicipio: config.codigoMunicipio ?? '',
                regimeTributario: config.regimeTributario ?? '',
            });
            setConfigLoaded(true);
        }
    }, [config, configLoaded]);

    const activeCertificate = useMemo(
        () => certificates.find((certificate) => certificate.active) ?? null,
        [certificates],
    );

    const totals = useMemo(() => {
        const issued = invoices.filter((invoice) => invoice.status === 'EMITIDA');
        return {
            issued: issued.length,
            errors: invoices.filter((invoice) => invoice.status === 'ERRO').length,
            value: issued.reduce((sum, invoice) => sum + Number(invoice.grossAmount ?? 0), 0),
        };
    }, [invoices]);

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    const buildPayload = (): NfseCreateRequest => ({
        series: form.series || undefined,
        competence: form.competence || undefined,
        grossAmount: numberOrUndefined(form.grossAmount),
        deductionAmount: numberOrUndefined(form.deductionAmount),
        issRate: numberOrUndefined(form.issRate),
        issWithheld: form.issWithheld,
        issWithholdingType: form.issWithheld ? '2' : '1',
        inssAmount: numberOrUndefined(form.inssAmount),
        irrfAmount: numberOrUndefined(form.irrfAmount),
        csllAmount: numberOrUndefined(form.csllAmount),
        takerName: form.takerName.trim(),
        takerTaxId: digits(form.takerTaxId),
        takerMunicipalRegistration: form.takerMunicipalRegistration.trim() || undefined,
        takerAddress: form.takerAddress.trim() || undefined,
        takerAddressNumber: form.takerAddressNumber.trim() || undefined,
        takerNeighborhood: form.takerNeighborhood.trim() || undefined,
        takerMunicipalityCode: digits(form.takerMunicipalityCode) || undefined,
        takerCity: form.takerCity.trim() || undefined,
        takerState: form.takerState.trim().toUpperCase() || undefined,
        takerZip: digits(form.takerZip) || undefined,
        takerEmail: form.takerEmail.trim() || undefined,
        serviceCode: digits(form.serviceCode),
        municipalTaxCode: form.municipalTaxCode.trim() || undefined,
        nbsCode: digits(form.nbsCode) || undefined,
        serviceDescription: form.serviceDescription.trim(),
        discrimination: form.discrimination.trim() || undefined,
        notes: form.notes.trim() || undefined,
        ibscbs: digits(form.ibscbsCIndOp)
            ? {
                  finNFSe: '0',
                  cIndOp: digits(form.ibscbsCIndOp),
                  indDest: form.ibscbsIndDest,
                  cst: form.ibscbsCst,
                  cClassTrib: form.ibscbsCClassTrib,
                  indFinal: form.ibscbsIndFinal,
              }
            : undefined,
    });

    const validateFormForPreview = (): string[] => {
        const errors: string[] = [];
        if (!form.takerName?.trim()) {
            errors.push('Nome / Razão Social do Tomador');
        }
        const taxDigits = digits(form.takerTaxId);
        if (!taxDigits || (taxDigits.length !== 11 && taxDigits.length !== 14)) {
            errors.push('CPF (11 dígitos) ou CNPJ (14 dígitos) do Tomador');
        }
        if (!form.serviceDescription?.trim()) {
            errors.push('Descrição dos Serviços Prestados');
        }
        const grossVal = numberOrUndefined(form.grossAmount);
        if (!grossVal || grossVal <= 0) {
            errors.push('Valor Bruto do Serviço (R$)');
        }
        const srvCode = digits(form.serviceCode);
        if (!srvCode || srvCode.length !== 6) {
            errors.push('Código de Tributação Nacional (cTribNac com 6 dígitos)');
        }
        return errors;
    };

    const handleShowEmptyTemplate = () => {
        setShowEmptyTemplate(true);
        setFormErrors([]);
        setPreview({
            dpsId: 'DPS_MODELO_EM_BRANCO_V101',
            xml: `<?xml version="1.0" encoding="UTF-8"?>
<!-- MODELO DEMONSTRATIVO DE DPS EM BRANCO (LEIAUTE NACIONAL V1.01) -->
<!-- Preencha os campos da nota fiscal para gerar o XML oficial validado -->
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01">
  <infDPS Id="DPS_MODELO_EXEMPLO">
    <tpAmb>2</tpAmb>
    <dhEmi>${new Date().toISOString()}</dhEmi>
    <verAplic>FluxBus_Nfse_v1.01</verAplic>
    <serie>${form.series || '900'}</serie>
    <nDPS>1</nDPS>
    <dCompet>${form.competence || new Date().toISOString().split('T')[0]}</dCompet>
    <prest>
      <CNPJ>[CNPJ_DA_EMPRESA_EMITENTE]</CNPJ>
      <xNome>[RAZAO_SOCIAL_PRESTADOR]</xNome>
    </prest>
    <toma>
      <CNPJ>${digits(form.takerTaxId) || '[CNPJ_OU_CPF_DO_TOMADOR]'}</CNPJ>
      <xNome>${form.takerName || '[NOME_OU_RAZAO_SOCIAL_DO_TOMADOR]'}</xNome>
      <end>
        <xLgr>${form.takerAddress || '[LOGRADOURO_TOMADOR]'}</xLgr>
        <nro>${form.takerAddressNumber || '[NUMERO]'}</nro>
        <xBairro>${form.takerNeighborhood || '[BAIRRO]'}</xBairro>
        <cMun>${digits(form.takerMunicipalityCode) || '[COD_MUNICIPIO_IBGE_7_DIGITOS]'}</cMun>
        <UF>${form.takerState || '[UF]'}</UF>
        <CEP>${digits(form.takerZip) || '[CEP_8_DIGITOS]'}</CEP>
      </end>
    </toma>
    <serv>
      <locPrest>
        <cLocPrestacao>[COD_MUNICIPIO_PRESTACAO]</cLocPrestacao>
      </locPrest>
      <cServ>
        <cTribNac>${form.serviceCode || '[COD_TRIB_NAC_6_DIGITOS]'}</cTribNac>
        <xDescServ>${form.serviceDescription || '[DESCRICAO_DETALHADA_DO_SERVICO_PRESTADO]'}</xDescServ>
      </cServ>
    </serv>
    <valores>
      <vServPrest>
        <vServ>${numberOrUndefined(form.grossAmount)?.toFixed(2) || '0.00'}</vServ>
      </vServPrest>
      <trib>
        <tribMun>
          <tribISSQN>1</tribISSQN>
          <pAliq>${form.issRate || '0.00'}</pAliq>
          <vISSQN>0.00</vISSQN>
          <tpRetISSQN>${form.issWithheld ? '2' : '1'}</tpRetISSQN>
        </tribMun>
      </trib>
    </valores>
  </infDPS>
</DPS>`,
            schemaValid: false,
            messages: ['Modelo em branco exibido para conferência estrutural da DPS. Preencha os campos obrigatórios da nota para gerar a DPS oficial e validar.'],
            grossAmount: numberOrUndefined(form.grossAmount) || 0,
            issAmount: 0,
            netAmount: numberOrUndefined(form.grossAmount) || 0,
        });
    };

    const handlePreview = async () => {
        const errors = validateFormForPreview();
        if (errors.length > 0) {
            setFormErrors(errors);
            toast({
                title: 'Preencha os campos da nota para pré-visualizar',
                description: `Informe os dados obrigatórios: ${errors.join(', ')}.`,
                variant: 'destructive',
            });
            return;
        }

        setFormErrors([]);
        setShowEmptyTemplate(false);
        setPreviewing(true);
        try {
            const result = await nfseService.preview(buildPayload());
            setPreview(result);
            toast({
                title: result.schemaValid ? 'Prévia gerada com sucesso' : 'Prévia gerada com alertas',
                description: result.schemaValid
                    ? 'O XML da DPS passou na validação do leiaute v1.01.'
                    : result.messages.join(' | '),
                variant: result.schemaValid ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Não foi possível pré-visualizar o XML',
                description: error?.response?.data?.message || error?.message || 'Verifique se os dados da nota foram preenchidos corretamente.',
                variant: 'destructive',
            });
        } finally {
            setPreviewing(false);
        }
    };

    const handleEmit = async () => {
        if (!form.takerName || !form.takerTaxId || !form.serviceDescription) {
            toast({
                title: 'Preencha os dados obrigatórios',
                description: 'Informe tomador (nome e CNPJ/CPF), serviço e valor bruto.',
                variant: 'destructive',
            });
            return;
        }
        if (!confirm('Transmitir esta DPS à SEFIN Nacional? A emissão não poderá ser desfeita pelo sistema.')) {
            return;
        }
        setEmitting(true);
        try {
            const result = await nfseService.emit(buildPayload());
            setLastResult(result);
            queryClient.invalidateQueries({ queryKey: ['nfseInvoices'] });
            refetchCertificates();
            toast({
                title: result.status === 'EMITIDA' ? 'NFS-e emitida' : 'Emissão não autorizada',
                description:
                    result.status === 'EMITIDA'
                        ? `NFS-e ${result.number} autorizada pela SEFIN.`
                        : result.rejectionMessage || 'A SEFIN não autorizou a DPS.',
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
            const result = await nfseService.consultar(id);
            queryClient.invalidateQueries({ queryKey: ['nfseInvoices'] });
            toast({
                title: result.status === 'EMITIDA' ? 'NFS-e autorizada' : 'Consulta concluída',
                description:
                    result.status === 'EMITIDA'
                        ? `NFS-e ${result.number}.`
                        : result.rejectionMessage || 'A SEFIN ainda não retornou autorização.',
                variant: result.status === 'EMITIDA' ? undefined : 'destructive',
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

    const handleCancelar = async (invoice: NfseResponse) => {
        const reason = window.prompt(
            'Motivo do cancelamento:\n1 - Erro na emissão\n2 - Serviço não prestado\n9 - Outros', '1');
        if (!reason || !['1', '2', '9'].includes(reason)) {
            return;
        }
        const justification = window.prompt('Justificativa do cancelamento (15 a 255 caracteres):');
        if (!justification || justification.trim().length < 15) {
            toast({ title: 'Justificativa inválida', description: 'Informe ao menos 15 caracteres.', variant: 'destructive' });
            return;
        }
        setBusyId(invoice.id);
        try {
            const result = await nfseService.cancelar(invoice.id, {
                reasonCode: reason,
                justification: justification.trim(),
            });
            queryClient.invalidateQueries({ queryKey: ['nfseInvoices'] });
            toast({
                title: result.success ? 'Cancelamento registrado na SEFIN' : 'Cancelamento não registrado',
                description: result.message,
                variant: result.success ? undefined : 'destructive',
            });
        } catch (error: any) {
            toast({
                title: 'Falha ao cancelar',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    const download = async (invoice: NfseResponse, kind: 'xml' | 'pdf') => {
        setBusyId(invoice.id);
        try {
            const blob = kind === 'xml' ? await nfseService.xml(invoice.id) : await nfseService.pdf(invoice.id);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `NFS-e-${invoice.number}-${invoice.series}.${kind}`;
            anchor.click();
            URL.revokeObjectURL(url);
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

    const saveConfig = async () => {
        try {
            await nfseService.updateConfig({
                inscricaoEstadual: configForm.inscricaoEstadual || undefined,
                inscricaoMunicipal: configForm.inscricaoMunicipal || undefined,
                codigoMunicipio: configForm.codigoMunicipio || undefined,
                regimeTributario: configForm.regimeTributario || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['nfseConfig'] });
            toast({ title: 'Dados fiscais atualizados' });
        } catch (error: any) {
            toast({
                title: 'Não foi possível salvar',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        }
    };

    const uploadCertificate = async () => {
        if (!certificateFile || !certificatePassword) {
            toast({
                title: 'Informe o arquivo e a senha',
                description: 'Selecione o A1 (.pfx/.p12) e digite a senha.',
                variant: 'destructive',
            });
            return;
        }
        setUploadingCertificate(true);
        try {
            await nfseService.uploadCertificate(certificateFile, certificatePassword);
            setCertificateFile(null);
            setCertificatePassword('');
            await refetchCertificates();
            toast({ title: 'Certificado armazenado', description: 'Ative o certificado para usá-lo na emissão.' });
        } catch (error: any) {
            toast({
                title: 'Certificado não aceito',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        } finally {
            setUploadingCertificate(false);
        }
    };

    const activateCertificate = async (id: string) => {
        try {
            await nfseService.activateCertificate(id);
            await refetchCertificates();
            toast({ title: 'Certificado ativado' });
        } catch (error: any) {
            toast({
                title: 'Não foi possível ativar',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        }
    };

    const deleteCertificate = async (id: string) => {
        if (!confirm('Remover este certificado do sistema?')) return;
        try {
            await nfseService.deleteCertificate(id);
            await refetchCertificates();
            toast({ title: 'Certificado removido' });
        } catch (error: any) {
            toast({
                title: 'Não foi possível remover',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive',
            });
        }
    };

    return (
        <StandardLayout
            title="Emissão de NFS-e"
            subtitle="Integração direta com a SEFIN Nacional — DPS assinada com certificado A1"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Ambiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-seguranca-yellow">
                                {config?.certificateConfigured ? 'SEFIN conectado' : 'Configuração pendente'}
                            </div>
                            <p className="text-xs text-gray-400">Homologação (produção restrita)</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Certificado A1</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-lg font-bold">
                                {activeCertificate && !activeCertificate.expired ? (
                                    <CheckCircle2 className="text-emerald-400" size={18} />
                                ) : (
                                    <AlertTriangle className="text-amber-400" size={18} />
                                )}
                                <span className={activeCertificate && !activeCertificate.expired ? 'text-emerald-300' : 'text-amber-300'}>
                                    {activeCertificate ? (activeCertificate.expired ? 'Vencido' : 'Ativo') : 'Não configurado'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {activeCertificate?.validUntil
                                    ? `Válido até ${new Date(activeCertificate.validUntil).toLocaleDateString('pt-BR')}`
                                    : 'Envie o certificado e-CNPJ'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">NFS-e emitidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-blue-300">{totals.issued}</div>
                            <p className="text-xs text-gray-400">{totals.errors} com erro</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Valor autorizado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-seguranca-yellow">{money(totals.value)}</div>
                            <p className="text-xs text-gray-400">Total das notas emitidas</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="emitir" className="space-y-4">
                    <TabsList className="bg-seguranca-graphite border border-gray-600">
                        <TabsTrigger value="emitir">Emitir DPS</TabsTrigger>
                        <TabsTrigger value="notas">Notas emitidas</TabsTrigger>
                        <TabsTrigger value="config">Dados fiscais</TabsTrigger>
                        <TabsTrigger value="certificado">Certificado A1</TabsTrigger>
                    </TabsList>

                    <TabsContent value="emitir" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <Card className="bg-seguranca-graphite border-gray-600 xl:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                                        <FileSignature className="text-seguranca-yellow" size={20} />
                                        Dados da DPS
                                    </CardTitle>
                                    <CardDescription>
                                        Os dados do prestador vêm do cadastro da empresa. O tomador e o serviço são informados abaixo.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Série</Label>
                                            <Input value={form.series} onChange={(e) => setField('series', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Competência</Label>
                                            <Input type="month" value={form.competence} onChange={(e) => setField('competence', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Valor bruto (R$)</Label>
                                            <Input type="number" step="0.01" value={form.grossAmount} onChange={(e) => setField('grossAmount', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-seguranca-lightgray">Tomador</p>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="md:col-span-2">
                                                <Label>Nome / razão social *</Label>
                                                <Input value={form.takerName} onChange={(e) => setField('takerName', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>CNPJ / CPF *</Label>
                                                <Input value={form.takerTaxId} onChange={(e) => setField('takerTaxId', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Inscrição municipal</Label>
                                                <Input value={form.takerMunicipalRegistration} onChange={(e) => setField('takerMunicipalRegistration', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>E-mail</Label>
                                                <Input type="email" value={form.takerEmail} onChange={(e) => setField('takerEmail', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Endereço</Label>
                                                <Input value={form.takerAddress} onChange={(e) => setField('takerAddress', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Número</Label>
                                                <Input value={form.takerAddressNumber} onChange={(e) => setField('takerAddressNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Bairro</Label>
                                                <Input value={form.takerNeighborhood} onChange={(e) => setField('takerNeighborhood', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Cód. IBGE município</Label>
                                                <Input value={form.takerMunicipalityCode} onChange={(e) => setField('takerMunicipalityCode', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>CEP</Label>
                                                <Input value={form.takerZip} onChange={(e) => setField('takerZip', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Cidade</Label>
                                                <Input value={form.takerCity} onChange={(e) => setField('takerCity', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>UF</Label>
                                                <Input maxLength={2} value={form.takerState} onChange={(e) => setField('takerState', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-seguranca-lightgray">Serviço</p>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div>
                                                <Label>cTribNac (6 dígitos) *</Label>
                                                <Input value={form.serviceCode} onChange={(e) => setField('serviceCode', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>cTribMun</Label>
                                                <Input value={form.municipalTaxCode} onChange={(e) => setField('municipalTaxCode', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>NBS</Label>
                                                <Input value={form.nbsCode} onChange={(e) => setField('nbsCode', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Label>Descrição do serviço *</Label>
                                                <Input value={form.serviceDescription} onChange={(e) => setField('serviceDescription', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Label>Discriminação</Label>
                                                <Textarea rows={2} value={form.discrimination} onChange={(e) => setField('discrimination', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-seguranca-lightgray">Tributos</p>
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                            <div>
                                                <Label>Dedução (R$)</Label>
                                                <Input type="number" step="0.01" value={form.deductionAmount} onChange={(e) => setField('deductionAmount', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Alíquota ISS (%)</Label>
                                                <Input type="number" step="0.01" value={form.issRate} onChange={(e) => setField('issRate', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>INSS retido (R$)</Label>
                                                <Input type="number" step="0.01" value={form.inssAmount} onChange={(e) => setField('inssAmount', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>IRRF retido (R$)</Label>
                                                <Input type="number" step="0.01" value={form.irrfAmount} onChange={(e) => setField('irrfAmount', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>CSLL retida (R$)</Label>
                                                <Input type="number" step="0.01" value={form.csllAmount} onChange={(e) => setField('csllAmount', e.target.value)} />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={form.issWithheld}
                                                onChange={(e) => setField('issWithheld', e.target.checked)}
                                                className="h-4 w-4 accent-seguranca-red"
                                            />
                                            ISS retido pelo tomador
                                        </label>
                                        <div>
                                            <Label>Observações</Label>
                                            <Textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
                                        </div>
                                        <div className="rounded-md border border-gray-600 p-3 space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-seguranca-lightgray">IBS/CBS (opcional)</p>
                                                <p className="text-[11px] text-gray-400">
                                                    Preencha o indicador da operação para incluir a classificação IBS/CBS na DPS.
                                                    Alíquotas e valores são definidos pela SEFIN.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>cIndOp (6 dígitos)</Label>
                                                    <Input value={form.ibscbsCIndOp} onChange={(e) => setField('ibscbsCIndOp', digits(e.target.value))} placeholder="Ex.: 000001" />
                                                </div>
                                                <div>
                                                    <Label>Destinatário</Label>
                                                    <select
                                                        className="w-full rounded-md border border-gray-600 bg-transparent p-2 text-sm"
                                                        value={form.ibscbsIndDest}
                                                        onChange={(e) => setField('ibscbsIndDest', e.target.value)}
                                                    >
                                                        <option value="0">0 — É o próprio tomador</option>
                                                        <option value="1">1 — Outro destinatário</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label>CST IBS/CBS</Label>
                                                    <Input value={form.ibscbsCst} onChange={(e) => setField('ibscbsCst', digits(e.target.value))} />
                                                </div>
                                                <div>
                                                    <Label>cClassTrib</Label>
                                                    <Input value={form.ibscbsCClassTrib} onChange={(e) => setField('ibscbsCClassTrib', digits(e.target.value))} />
                                                </div>
                                                <div>
                                                    <Label>Uso pessoal (indFinal)</Label>
                                                    <select
                                                        className="w-full rounded-md border border-gray-600 bg-transparent p-2 text-sm"
                                                        value={form.ibscbsIndFinal}
                                                        onChange={(e) => setField('ibscbsIndFinal', e.target.value)}
                                                    >
                                                        <option value="0">0 — Não</option>
                                                        <option value="1">1 — Sim</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button variant="outline" onClick={handlePreview} disabled={previewing} className="border-gray-600">
                                            {previewing ? <Loader2 className="mr-2 animate-spin" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                                            Pré-visualizar XML
                                        </Button>
                                        <Button
                                            onClick={handleEmit}
                                            disabled={emitting || !activeCertificate || activeCertificate.expired}
                                            className="bg-seguranca-red hover:bg-seguranca-darkred"
                                        >
                                            {emitting ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Send className="mr-2" size={16} />}
                                            Transmitir à SEFIN
                                        </Button>
                                    </div>
                                    {!activeCertificate && (
                                        <p className="flex items-center gap-2 text-xs text-amber-300">
                                            <AlertTriangle size={14} />
                                            Envie e ative um certificado A1 na aba "Certificado A1" antes de emitir.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Card className="bg-seguranca-graphite border-gray-600">
                                    <CardHeader>
                                        <CardTitle className="text-seguranca-lightgray">Prévia da DPS</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {preview ? (
                                            <>
                                                {showEmptyTemplate ? (
                                                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200 flex items-center justify-between">
                                                        <span className="font-semibold">Modelo Demonstrativo em Branco (DPS Vazia)</span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 text-[10px] text-amber-300 hover:bg-amber-500/20 px-2"
                                                            onClick={() => {
                                                                setPreview(null);
                                                                setShowEmptyTemplate(false);
                                                            }}
                                                        >
                                                            Fechar Modelo
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className={`rounded-md border p-3 text-sm ${preview.schemaValid ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>
                                                        {preview.schemaValid ? 'XML válido no leiaute v1.01' : 'XML com inconsistências'}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <span className="text-gray-400">Bruto</span>
                                                    <span className="text-right text-gray-100">{money(preview.grossAmount)}</span>
                                                    <span className="text-gray-400">ISS</span>
                                                    <span className="text-right text-gray-100">{money(preview.issAmount)}</span>
                                                    <span className="text-gray-400">Líquido</span>
                                                    <span className="text-right text-gray-100">{money(preview.netAmount)}</span>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs text-gray-400">Id da DPS</p>
                                                    <code className="block break-all rounded bg-black/40 p-2 text-[11px] text-gray-300">{preview.dpsId}</code>
                                                </div>
                                                <pre className="max-h-72 overflow-auto rounded bg-black/50 p-3 text-[11px] leading-relaxed text-gray-300">
                                                    {preview.xml}
                                                </pre>
                                                {preview.messages.length > 0 && (
                                                    <ul className="list-disc space-y-1 pl-4 text-xs text-amber-300">
                                                        {preview.messages.map((message, index) => <li key={index}>{message}</li>)}
                                                    </ul>
                                                )}
                                            </>
                                        ) : formErrors.length > 0 ? (
                                            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200 space-y-2.5">
                                                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                                                    <span>Preencha os campos obrigatórios da nota:</span>
                                                </div>
                                                <ul className="list-disc pl-4 space-y-1 text-xs text-amber-200">
                                                    {formErrors.map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                </ul>
                                                <div className="pt-1.5 border-t border-amber-500/20">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleShowEmptyTemplate}
                                                        className="w-full text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                                                    >
                                                        Exibir Modelo de DPS em Branco (XML Vazio)
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-400">
                                                    Preencha os dados e clique em "Pré-visualizar XML" para conferir a DPS antes do envio.
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleShowEmptyTemplate}
                                                    className="text-xs text-gray-400 hover:text-white p-0 h-auto underline"
                                                >
                                                    Ou clique aqui para exibir um modelo de DPS em branco
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {lastResult && (
                                    <Card className="bg-seguranca-graphite border-gray-600">
                                        <CardHeader>
                                            <CardTitle className="text-seguranca-lightgray">Último envio</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge className={statusStyle(lastResult.status)}>{lastResult.status}</Badge>
                                                <span className="text-gray-300">Nº {lastResult.number}</span>
                                            </div>
                                            {lastResult.nfseKey && (
                                                <p className="break-all text-xs text-gray-400">Chave: {lastResult.nfseKey}</p>
                                            )}
                                            {lastResult.rejectionMessage && (
                                                <p className="text-xs text-red-300">{lastResult.rejectionMessage}</p>
                                            )}
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="outline" className="border-gray-600" onClick={() => download(lastResult, 'xml')}>
                                                    <FileDown className="mr-1" size={14} /> XML
                                                </Button>
                                                <Button size="sm" variant="outline" className="border-gray-600" onClick={() => download(lastResult, 'pdf')}>
                                                    <FileDown className="mr-1" size={14} /> PDF
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="notas">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-seguranca-lightgray">NFS-e emitidas</CardTitle>
                                    <CardDescription>Histórico de DPS e notas autorizadas pela SEFIN.</CardDescription>
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
                                                <th className="px-4 py-3">Competência</th>
                                                <th className="px-4 py-3">Tomador</th>
                                                <th className="px-4 py-3 text-right">Bruto</th>
                                                <th className="px-4 py-3 text-right">Líquido</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {isLoading && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                                        <Loader2 className="mx-auto animate-spin" size={20} />
                                                    </td>
                                                </tr>
                                            )}
                                            {!isLoading && invoices.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                                        Nenhuma NFS-e emitida até o momento.
                                                    </td>
                                                </tr>
                                            )}
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-100">{invoice.number}</div>
                                                        <div className="text-xs text-gray-500">Série {invoice.series} • DPS {invoice.dpsNumber ?? '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">{invoice.competenceLabel}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-gray-200">{invoice.takerName}</div>
                                                        <div className="text-xs text-gray-500">{invoice.takerTaxId}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-200">{money(invoice.grossAmount)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-200">{money(invoice.netAmount)}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge className={statusStyle(invoice.status)}>{invoice.status}</Badge>
                                                        {invoice.rejectionMessage && (
                                                            <p className="mt-1 max-w-[220px] truncate text-xs text-red-300" title={invoice.rejectionMessage}>
                                                                {invoice.rejectionMessage}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            {invoice.status === 'EMITIDA' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    title="Cancelar na SEFIN"
                                                                    onClick={() => handleCancelar(invoice)}
                                                                    disabled={busyId === invoice.id}
                                                                >
                                                                    <Ban size={15} />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Consultar na SEFIN"
                                                                onClick={() => handleConsultar(invoice.id)}
                                                                disabled={busyId === invoice.id}
                                                            >
                                                                {busyId === invoice.id ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" title="Baixar XML" onClick={() => download(invoice, 'xml')} disabled={busyId === invoice.id}>
                                                                <FileDown size={15} />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" title="Baixar PDF" onClick={() => download(invoice, 'pdf')} disabled={busyId === invoice.id}>
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

                    <TabsContent value="config">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                                    <Building2 className="text-seguranca-yellow" size={20} /> Dados fiscais da empresa
                                </CardTitle>
                                <CardDescription>
                                    Usados na geração da DPS. O CNPJ e o endereço vêm do cadastro da empresa.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>CNPJ</Label>
                                        <Input value={config?.cnpj ?? ''} disabled />
                                    </div>
                                    <div>
                                        <Label>Razão social</Label>
                                        <Input value={config?.name ?? ''} disabled />
                                    </div>
                                    <div>
                                        <Label>Inscrição estadual</Label>
                                        <Input value={configForm.inscricaoEstadual} onChange={(e) => setConfigForm({ ...configForm, inscricaoEstadual: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Inscrição municipal</Label>
                                        <Input value={configForm.inscricaoMunicipal} onChange={(e) => setConfigForm({ ...configForm, inscricaoMunicipal: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Código IBGE do município</Label>
                                        <Input value={configForm.codigoMunicipio} onChange={(e) => setConfigForm({ ...configForm, codigoMunicipio: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Regime tributário (Simples Nacional)</Label>
                                        <select
                                            className="h-10 w-full rounded-md border border-gray-600 bg-seguranca-black/40 px-3 text-sm text-gray-100"
                                            value={configForm.regimeTributario}
                                            onChange={(e) => setConfigForm({ ...configForm, regimeTributario: e.target.value })}
                                        >
                                            <option value="">Selecione</option>
                                            <option value="1">1 — Não optante</option>
                                            <option value="2">2 — MEI</option>
                                            <option value="3">3 — ME/EPP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="rounded-md border border-gray-700 bg-black/20 p-3 text-sm text-gray-400">
                                    <p>{config?.address ?? 'Endereço não cadastrado'}{config?.addressNumber ? `, ${config.addressNumber}` : ''}</p>
                                    <p>{config?.neighborhood} {config?.city ? `— ${config.city}/${config.state}` : ''} {config?.zipCode ? `• CEP ${config.zipCode}` : ''}</p>
                                </div>
                                <Button onClick={saveConfig} className="bg-seguranca-red hover:bg-seguranca-darkred">
                                    <ShieldCheck className="mr-2" size={16} /> Salvar dados fiscais
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="certificado" className="space-y-4">
                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                                    <KeyRound className="text-seguranca-yellow" size={20} /> Certificado digital A1
                                </CardTitle>
                                <CardDescription>
                                    O arquivo PKCS#12 é armazenado criptografado (AES-256-GCM) e usado na assinatura e no mTLS com a SEFIN.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="md:col-span-2">
                                        <Label>Arquivo .pfx / .p12</Label>
                                        <Input
                                            type="file"
                                            accept=".pfx,.p12,application/x-pkcs12"
                                            onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Senha do certificado</Label>
                                        <Input type="password" value={certificatePassword} onChange={(e) => setCertificatePassword(e.target.value)} />
                                    </div>
                                </div>
                                <Button onClick={uploadCertificate} disabled={uploadingCertificate} className="bg-seguranca-red hover:bg-seguranca-darkred">
                                    {uploadingCertificate ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Upload className="mr-2" size={16} />}
                                    Enviar certificado
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-600">
                            <CardHeader>
                                <CardTitle className="text-seguranca-lightgray">Certificados cadastrados</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {certificates.length === 0 && (
                                    <p className="text-sm text-gray-400">Nenhum certificado cadastrado.</p>
                                )}
                                {certificates.map((certificate) => (
                                    <div key={certificate.id} className="flex flex-col gap-3 rounded-md border border-gray-700 bg-black/20 p-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium text-gray-100">
                                                    {certificate.alias || certificate.fileName || 'Certificado'}
                                                </span>
                                                {certificate.active && <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300">Ativo</Badge>}
                                                {certificate.expired && <Badge className="border-red-500/40 bg-red-500/15 text-red-300">Vencido</Badge>}
                                            </div>
                                            <p className="truncate text-xs text-gray-400">CNPJ {certificate.cnpj || '-'} • {certificate.subject || 'sem titular'}</p>
                                            <p className="text-xs text-gray-500">
                                                Válido até {certificate.validUntil ? new Date(certificate.validUntil).toLocaleDateString('pt-BR') : '-'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!certificate.active && !certificate.expired && (
                                                <Button size="sm" variant="outline" className="border-gray-600" onClick={() => activateCertificate(certificate.id)}>
                                                    Ativar
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => deleteCertificate(certificate.id)}>
                                                        Remover
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </StandardLayout>
    );
};

export default NfseEmissionPage;
