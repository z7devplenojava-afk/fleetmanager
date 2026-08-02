import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderTree,
    Folder,
    File,
    Download,
    ChevronRight,
    ChevronDown,
    Calendar,
    Building2,
    Layers,
    Loader2,
    ArrowLeft,
    Files,
    Inbox,
    HardDrive,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    clientAreaService,
    ClientDocumentationSummary,
    ClientDocumentationStructure,
    ClientDocFile,
} from '@/services/clientAreaService';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const getMonthName = (month: number): string => MONTH_NAMES[month - 1] || `Mês ${month}`;

const formatDisplayDate = (iso: string): string => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR');
    } catch {
        return '';
    }
};

export const ClientDocumentacaoPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [docs, setDocs] = useState<ClientDocumentationSummary[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<ClientDocumentationSummary | null>(null);
    const [structure, setStructure] = useState<ClientDocumentationStructure | null>(null);
    const [loadingStructure, setLoadingStructure] = useState(false);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

    const loadDocs = useCallback(async () => {
        setLoadingDocs(true);
        try {
            const data = await clientAreaService.listDocumentations();
            setDocs(data);
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error?.response?.data?.message || 'Não foi possível carregar a documentação',
                variant: 'destructive',
            });
        } finally {
            setLoadingDocs(false);
        }
    }, [toast]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    const handleOpenDoc = async (doc: ClientDocumentationSummary) => {
        setSelectedDoc(doc);
        setStructure(null);
        setExpandedStage(null);
        setLoadingStructure(true);
        try {
            const data = await clientAreaService.getDocumentationStructure(doc.id);
            setStructure(data);
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error?.response?.data?.message || 'Não foi possível carregar a estrutura da documentação',
                variant: 'destructive',
            });
        } finally {
            setLoadingStructure(false);
        }
    };

    const handleBack = () => {
        setSelectedDoc(null);
        setStructure(null);
        setExpandedStage(null);
        loadDocs();
    };

    const handleDownload = async (file: ClientDocFile) => {
        setDownloadingFileId(file.id);
        try {
            const blob = await clientAreaService.downloadDocumentationFile(file.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName || 'arquivo';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            toast({
                title: 'Erro ao baixar',
                description: error?.response?.data?.message || 'Não foi possível baixar o arquivo',
                variant: 'destructive',
            });
        } finally {
            setDownloadingFileId(null);
        }
    };

    const groupByYear = (list: ClientDocumentationSummary[]) => {
        const map = new Map<number, ClientDocumentationSummary[]>();
        list.forEach((doc) => {
            const year = doc.year || new Date(doc.createdAt).getFullYear();
            if (!map.has(year)) map.set(year, []);
            map.get(year)!.push(doc);
        });
        return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
    };

    // ============ LIST VIEW (documentações da empresa) ============
    const renderList = () => (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <FolderTree className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Documentação</h1>
                    <p className="text-xs text-slate-400">Acompanhe a documentação mensal do seu contrato</p>
                </div>
            </div>

            {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                    <p className="text-sm">Carregando documentação...</p>
                </div>
            ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <Inbox className="w-10 h-10 mb-3" />
                    <p className="text-sm">Nenhuma documentação disponível para sua empresa ainda.</p>
                </div>
            ) : (
                groupByYear(docs).map(([year, yearDocs]) => (
                    <div key={year}>
                        <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{year}</span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>
                        <div className="space-y-2">
                            {yearDocs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => handleOpenDoc(doc)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-200 text-left"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{doc.clientName}</p>
                                        <p className="text-xs text-slate-400">{getMonthName(doc.month)} · {doc.stageCount} etapa(s)</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // ============ DETAIL VIEW (etapas → categorias → arquivos) ============
    const renderDetail = () => {
        if (!selectedDoc) return null;
        const stages = structure?.stages || [];

        return (
            <div className="p-4 space-y-4">
                {/* Header with back */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para documentação
                </button>

                <div className="rounded-xl bg-gradient-to-br from-emerald-500/15 to-slate-900 border border-emerald-500/25 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold text-white truncate">{selectedDoc.clientName}</h1>
                            <p className="text-xs text-emerald-400 font-medium">
                                {getMonthName(selectedDoc.month)} / {selectedDoc.year}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            {stages.length} etapa(s)
                        </span>
                        <span className="flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                            Atualizado em {formatDisplayDate(selectedDoc.updatedAt || selectedDoc.createdAt)}
                        </span>
                    </div>
                </div>

                {loadingStructure ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                        <p className="text-sm">Carregando estrutura...</p>
                    </div>
                ) : stages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Files className="w-10 h-10 mb-3" />
                        <p className="text-sm text-center">Nenhuma etapa criada para este período ainda.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage) => {
                            const isOpen = expandedStage === stage.id;
                            return (
                                <div
                                    key={stage.id}
                                    className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedStage(isOpen ? null : stage.id)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors"
                                    >
                                        {isOpen ? (
                                            <ChevronDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                        )}
                                        <FolderTree className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        <span className="flex-1 text-sm font-semibold text-white text-left">
                                            {stage.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {stage.categories?.length || 0} categoria(s)
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-slate-800 p-3 space-y-3">
                                            {!stage.categories || stage.categories.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center py-3">
                                                    Nenhuma categoria disponível
                                                </p>
                                            ) : (
                                                stage.categories.map(({ category, files }) => (
                                                    <div
                                                        key={category.id}
                                                        className="rounded-lg bg-slate-950/70 border border-slate-800 p-3"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Folder className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-slate-200 truncate flex-1">
                                                                {category.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
                                                                {files?.length || 0} arquivo(s)
                                                            </span>
                                                        </div>

                                                        {!files || files.length === 0 ? (
                                                            <p className="text-[11px] text-slate-600 pl-6">
                                                                Nenhum arquivo enviado
                                                            </p>
                                                        ) : (
                                                            <ul className="space-y-1.5">
                                                                {files.map((file) => (
                                                                    <li key={file.id}>
                                                                        <button
                                                                            onClick={() => handleDownload(file)}
                                                                            disabled={downloadingFileId === file.id}
                                                                            className="w-full flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/70 transition-colors group"
                                                                        >
                                                                            <File className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                                            <span className="flex-1 text-slate-300 truncate text-left group-hover:text-white transition-colors">
                                                                                {file.originalName}
                                                                            </span>
                                                                            {file.displaySize && (
                                                                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                                                                    {file.displaySize}
                                                                                </span>
                                                                            )}
                                                                            {downloadingFileId === file.id ? (
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
                                                                            ) : (
                                                                                <Download className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                                            )}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-full">
            {/* Local breadcrumb header when in detail */}
            {!selectedDoc && renderList()}
            {selectedDoc && renderDetail()}
        </div>
    );
};
export default ClientDocumentacaoPage;
