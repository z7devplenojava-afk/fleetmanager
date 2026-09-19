import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Download, Printer, X, ZoomIn, ZoomOut, RotateCw, FileText,
    ExternalLink, Loader2, RefreshCw
} from 'lucide-react';
import { FleetWorkOrder } from '@/services/fleetWorkOrderService';
import {
    generateFleetWorkOrderPDFBlob,
    generateFleetWorkOrderPDFDownload
} from '@/utils/fleetWorkOrderPDFGenerator';
import { useToast } from '@/hooks/use-toast';

interface FleetWorkOrderViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: FleetWorkOrder | null;
    pdfBlob?: Blob | null;
}

export const FleetWorkOrderViewModal: React.FC<FleetWorkOrderViewModalProps> = ({
    isOpen,
    onClose,
    order,
    pdfBlob: initialBlob,
}) => {
    const { toast } = useToast();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(initialBlob || null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const osNumber = order?.osNumber || (order?.id ? order.id.slice(0, 8) : 'OS');
    const fileName = `ordem-servico-${osNumber.replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`;

    // Carrega o Blob se não foi passado diretamente
    useEffect(() => {
        let isMounted = true;

        if (isOpen) {
            if (initialBlob) {
                setPdfBlob(initialBlob);
            } else if (order?.id) {
                setIsLoading(true);
                generateFleetWorkOrderPDFBlob(order)
                    .then(blob => {
                        if (isMounted) setPdfBlob(blob);
                    })
                    .catch(err => {
                        console.error('Falha ao gerar PDF da OS:', err);
                        if (isMounted) {
                            toast({
                                title: 'Erro ao gerar PDF',
                                description: 'Não foi possível carregar a pré-visualização da Ordem de Serviço.',
                                variant: 'destructive'
                            });
                        }
                    })
                    .finally(() => {
                        if (isMounted) setIsLoading(false);
                    });
            }
            // Reseta controles de visualização
            setZoom(1);
            setRotation(0);
        } else {
            setPdfBlob(null);
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, initialBlob, order, toast]);

    // Cria e gerencia a URL do Blob
    useEffect(() => {
        if (pdfBlob && isOpen) {
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setPdfUrl(null);
            };
        } else {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }
    }, [pdfBlob, isOpen]);

    const handleDownload = async () => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: 'Download iniciado', description: fileName });
        } else if (order) {
            try {
                await generateFleetWorkOrderPDFDownload(order);
                toast({ title: 'Download concluído' });
            } catch {
                toast({ title: 'Erro', description: 'Falha ao baixar o PDF.', variant: 'destructive' });
            }
        }
    };

    const handlePrint = () => {
        if (pdfUrl) {
            const printWindow = window.open(pdfUrl, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }
    };

    const handleOpenInNewTab = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleReload = () => {
        if (order?.id) {
            setIsLoading(true);
            generateFleetWorkOrderPDFBlob(order)
                .then(blob => {
                    setPdfBlob(blob);
                    toast({ title: 'PDF Atualizado', description: 'O documento foi regenerado com os dados mais recentes.' });
                })
                .catch(() => {
                    toast({ title: 'Erro', description: 'Falha ao recarregar PDF.', variant: 'destructive' });
                })
                .finally(() => setIsLoading(false));
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[95vw] h-[92vh] max-h-[95vh] overflow-hidden bg-seguranca-graphite border-gray-700 p-0 flex flex-col z-[10100]">
                {/* Header */}
                <DialogHeader className="bg-gradient-to-r from-seguranca-black via-gray-900 to-seguranca-black border-b border-gray-800 p-4 shrink-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-base sm:text-lg font-bold flex items-center gap-2">
                                    <span>Ordem de Serviço</span>
                                    <Badge className="bg-red-600 text-white font-mono text-xs px-2 py-0.5">
                                        #{osNumber}
                                    </Badge>
                                    {order?.status && (
                                        <Badge variant="outline" className="text-xs text-gray-300 border-gray-600 hidden sm:inline-flex">
                                            {order.status}
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {order?.vehiclePlate ? `Veículo: ${order.vehiclePlate} ${order.vehicleModel ? `(${order.vehicleModel})` : ''}` : 'Documento Oficial de Manutenção e Almoxarifado'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReload}
                                disabled={isLoading}
                                title="Recarregar PDF"
                                className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 bg-seguranca-black border-b border-gray-800 shrink-0 text-xs">
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.6 || !pdfUrl}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2"
                            title="Reduzir zoom"
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-gray-400 font-mono text-xs min-w-[45px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 2.5 || !pdfUrl}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2"
                            title="Aumentar zoom"
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRotate}
                            disabled={!pdfUrl}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2 ml-1"
                            title="Girar 90°"
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenInNewTab}
                            disabled={!pdfUrl}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 text-xs"
                            title="Abrir em uma aba do navegador"
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Nova Aba
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            disabled={!pdfUrl && !order}
                            className="border-gray-700 text-gray-200 hover:bg-gray-800 h-7 text-xs"
                        >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Baixar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            disabled={!pdfUrl}
                            className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs font-semibold"
                        >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer Body */}
                <div className="flex-1 bg-[#1e1e24] overflow-auto flex items-center justify-center p-2 relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            <p className="text-sm font-medium">Gerando PDF da Ordem de Serviço...</p>
                            <p className="text-xs text-gray-500">Compilando peças, serviços de oficina e dados do veículo</p>
                        </div>
                    ) : pdfUrl ? (
                        <div
                            className="w-full h-full flex items-center justify-center transition-transform duration-200"
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transformOrigin: 'top center'
                            }}
                        >
                            <iframe
                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                className="w-full h-full min-h-[600px] border-0 rounded bg-white shadow-2xl"
                                title={`OS-${osNumber}`}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-600 mb-1" />
                            <p className="text-sm font-semibold text-gray-300">Nenhum documento disponível para visualização</p>
                            <p className="text-xs text-gray-500 max-w-sm">
                                Salve a Ordem de Serviço para compilar o documento oficial em PDF.
                            </p>
                            {order?.id && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReload}
                                    className="border-red-500/50 text-red-400 mt-2"
                                >
                                    Tentar Novamente
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FleetWorkOrderViewModal;
