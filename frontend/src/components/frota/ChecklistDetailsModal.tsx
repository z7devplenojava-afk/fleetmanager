import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Gauge,
    Calendar,
    User,
    Bus,
    AlertTriangle,
    FileText,
    Printer,
    ImageIcon,
    MapPin,
    ArrowRight
} from 'lucide-react';
import type { VehicleGateChecklist, ChecklistItem } from '@/types/portaria';
import { CATEGORY_LABELS } from '@/utils/checklistConfig';
import { getApiUrl } from '@/config/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChecklistDetailsModalProps {
    checklist: VehicleGateChecklist | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChecklistDetailsModal: React.FC<ChecklistDetailsModalProps> = ({
    checklist,
    open,
    onOpenChange,
}) => {
    if (!checklist) return null;

    const mediaBase = getApiUrl().replace(/\/api\/?$/, '');

    // Parse dos itens inspecionados salvos em checklistData
    const parsedItems = useMemo<ChecklistItem[]>(() => {
        if (!checklist.checklistData) return [];
        try {
            const data = JSON.parse(checklist.checklistData);
            if (Array.isArray(data)) {
                return data.map((item: any) => ({
                    id: String(item.id || item.title),
                    title: String(item.title || item.name || 'Item'),
                    category: String(item.category || 'Geral'),
                    required: Boolean(item.required),
                    checked: Boolean(item.checked),
                    notes: item.notes ? String(item.notes) : undefined,
                }));
            }
        } catch (e) {
            console.error('Erro ao processar checklistData:', e);
        }
        return [];
    }, [checklist.checklistData]);

    const totalItems = parsedItems.length;
    const checkedItems = parsedItems.filter((i) => i.checked).length;
    const conformityPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Agrupamento por categoria
    const groupedItems = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        parsedItems.forEach((item) => {
            const cat = item.category || 'Geral';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [parsedItems]);

    // Fotos do veículo
    const vehiclePhotosList = useMemo(() => {
        if (!checklist.vehiclePhotos) return [];
        return checklist.vehiclePhotos
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);
    }, [checklist.vehiclePhotos]);

    // Exportação em PDF detalhada
    const handleExportPDF = () => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const isExit = checklist.type === 'EXIT';
        const typeLabel = isExit ? 'CHECK-OUT (SAÍDA)' : 'CHECK-IN (CHEGADA)';
        const occurredDate = new Date(checklist.occurredAt).toLocaleString('pt-BR');

        // Cabeçalho
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 32, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FLUXBUS - RELATÓRIO DE CHECKLIST DO VEÍCULO', 14, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`Registro Oficial de Portaria e Inspeção Veicular • Tipo: ${typeLabel}`, 14, 23);

        // Bloco de Identificação
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DA OPERAÇÃO', 14, 40);

        const opData = [
            ['Tipo de Registro:', typeLabel, 'Data e Hora:', occurredDate],
            ['Veículo (Placa):', checklist.vehiclePlate || 'Não informado', 'Motorista:', checklist.driverName || 'Não informado'],
            ['Odômetro do Registro:', `${checklist.kmReading.toLocaleString('pt-BR')} km`, 'Status de Conformidade:', `${checkedItems}/${totalItems} itens (${conformityPercent}%)`],
        ];

        if (checklist.distanceTravelled != null) {
            opData.push([
                'Distância Percorrida:', `${checklist.distanceTravelled} km`,
                'Deslocamento Garagem:', checklist.displacementDistance != null ? `${checklist.displacementDistance} km` : 'Não informado',
            ]);
        }

        autoTable(doc, {
            startY: 43,
            body: opData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 38 },
                1: { textColor: [15, 23, 42], cellWidth: 62 },
                2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 38 },
                3: { textColor: [15, 23, 42], cellWidth: 62 },
            },
        });

        let currentY = (doc as any).lastAutoTable.finalY + 8;

        // Se houver problemas relatados
        if (checklist.driverProblemReport) {
            doc.setFillColor(254, 242, 242);
            doc.setDrawColor(239, 68, 68);
            doc.rect(14, currentY, 182, 18, 'FD');

            doc.setTextColor(185, 28, 28);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('AVARIA / PROBLEMA RELATADO PELO MOTORISTA:', 18, currentY + 6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(69, 10, 10);
            doc.text(checklist.driverProblemReport.slice(0, 140), 18, currentY + 12);
            currentY += 24;
        }

        // Tabela com os Itens do Checklist
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('ITENS INSPECIONADOS NO VEÍCULO', 14, currentY);

        const tableRows: any[] = [];
        parsedItems.forEach((item) => {
            const catLabel = CATEGORY_LABELS[item.category] || item.category || 'Geral';
            tableRows.push([
                catLabel,
                item.title,
                item.checked ? 'CONFORME' : 'NÃO VERIFICADO / PENDENTE',
            ]);
        });

        if (tableRows.length === 0) {
            tableRows.push(['Geral', 'Checklist básico do veículo', 'REGISTRADO']);
        }

        autoTable(doc, {
            startY: currentY + 3,
            head: [['Categoria', 'Item Inspecionado', 'Status']],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 45, fontStyle: 'bold' },
                1: { cellWidth: 100 },
                2: { cellWidth: 37, halign: 'center' },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 2) {
                    if (data.cell.raw === 'CONFORME') {
                        data.cell.styles.textColor = [22, 101, 52];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'NÃO VERIFICADO / PENDENTE') {
                        data.cell.styles.textColor = [185, 28, 28];
                    }
                }
            },
        });

        currentY = (doc as any).lastAutoTable.finalY + 14;

        // Se couber na página, adiciona campo de assinaturas
        if (currentY > 240) {
            doc.addPage();
            currentY = 25;
        }

        doc.setDrawColor(148, 163, 184);
        doc.line(20, currentY + 15, 90, currentY + 15);
        doc.line(120, currentY + 15, 190, currentY + 15);

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Assinatura do Motorista', 35, currentY + 20);
        doc.text('Fiscal de Frota / Portaria', 135, currentY + 20);

        const safePlate = (checklist.vehiclePlate || 'veiculo').replace(/[^a-zA-Z0-9]/g, '');
        const safeType = isExit ? 'saida' : 'chegada';
        doc.save(`checklist-${safeType}-${safePlate}-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-6 shadow-2xl">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${checklist.type === 'EXIT' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    Inspeção Veicular
                                    <Badge
                                        variant="outline"
                                        className={
                                            checklist.type === 'EXIT'
                                                ? 'border-blue-500 text-blue-500 font-semibold'
                                                : 'border-green-500 text-green-600 font-semibold'
                                        }
                                    >
                                        {checklist.type === 'EXIT' ? 'Check-out (Saída)' : 'Check-in (Chegada)'}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    ID: <span className="font-mono">{checklist.id}</span>
                                </DialogDescription>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            className="gap-2 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir / Salvar PDF
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Resumo de Identificação e Odômetro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-muted/40 border-border">
                            <CardContent className="p-3.5 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Bus className="h-3.5 w-3.5 text-primary" /> Veículo
                                </span>
                                <p className="font-bold text-base tracking-tight">{checklist.vehiclePlate || 'Não informado'}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/40 border-border">
                            <CardContent className="p-3.5 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <User className="h-3.5 w-3.5 text-primary" /> Motorista
                                </span>
                                <p className="font-bold text-sm truncate" title={checklist.driverName || 'Não informado'}>
                                    {checklist.driverName || 'Não informado'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/40 border-border">
                            <CardContent className="p-3.5 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Calendar className="h-3.5 w-3.5 text-primary" /> Data / Hora
                                </span>
                                <p className="font-semibold text-xs font-mono">
                                    {new Date(checklist.occurredAt).toLocaleString('pt-BR')}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/40 border-border">
                            <CardContent className="p-3.5 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Gauge className="h-3.5 w-3.5 text-primary" /> Odômetro
                                </span>
                                <p className="font-bold text-base font-mono text-emerald-400">
                                    {checklist.kmReading.toLocaleString('pt-BR')} km
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detalhes de Quilometragem e Deslocamento se disponíveis */}
                    {(checklist.initialKm != null || checklist.distanceTravelled != null || checklist.hasDisplacement) && (
                        <Card className="border-border bg-card/60">
                            <CardContent className="p-4 space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary" /> Quilometragem da Viagem & Deslocamento
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    {checklist.initialKm != null && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">KM Inicial Origem</span>
                                            <span className="font-mono font-semibold">{checklist.initialKm.toLocaleString('pt-BR')} km</span>
                                        </div>
                                    )}
                                    {checklist.finalKm != null && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">KM Final Destino</span>
                                            <span className="font-mono font-semibold">{checklist.finalKm.toLocaleString('pt-BR')} km</span>
                                        </div>
                                    )}
                                    {checklist.distanceTravelled != null && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Distância Viagem</span>
                                            <span className="font-mono font-bold text-blue-400">{checklist.distanceTravelled} km</span>
                                        </div>
                                    )}
                                    {checklist.displacementDistance != null && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Deslocamento Garagem</span>
                                            <span className="font-mono font-bold text-amber-400">{checklist.displacementDistance} km</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Alerta de Avaria / Problema Relatado */}
                    {checklist.driverProblemReport && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-1">
                            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Problema / Avaria Relatada pelo Motorista
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed pl-6">
                                {checklist.driverProblemReport}
                            </p>
                        </div>
                    )}

                    {/* Observações Gerais */}
                    {checklist.observations && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</span>
                            <p className="text-foreground">{checklist.observations}</p>
                        </div>
                    )}

                    {/* Lista Completa dos Itens Inspecionados */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-primary" /> Itens Inspecionados do Veículo
                            </h3>
                            {totalItems > 0 && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {checkedItems} de {totalItems} itens conformes ({conformityPercent}%)
                                </span>
                            )}
                        </div>

                        {totalItems === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-3">
                                Nenhum item de checklist detalhado gravado para este registro.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupedItems).map(([category, items]) => {
                                    const catLabel = CATEGORY_LABELS[category] || category;
                                    const catChecked = items.filter((i) => i.checked).length;
                                    return (
                                        <div key={category} className="border rounded-lg p-3 space-y-2 bg-card/40">
                                            <div className="flex items-center justify-between border-b pb-1.5">
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-primary">
                                                    {catLabel}
                                                </h4>
                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                    {catChecked}/{items.length} conformes
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                {items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-start gap-2 p-2 rounded text-xs border ${
                                                            item.checked
                                                                ? 'bg-green-500/5 border-green-500/20 text-foreground'
                                                                : 'bg-muted/30 border-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {item.checked ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={item.checked ? 'font-medium' : 'line-through text-muted-foreground'}>
                                                                {item.title}
                                                            </p>
                                                            {item.notes && (
                                                                <p className="text-[10px] text-amber-500 mt-0.5">{item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Fotos (Odômetro e Inspeção) */}
                    {(checklist.odometerPhotoUrl || vehiclePhotosList.length > 0) && (
                        <div className="space-y-3 border-t pt-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" /> Registros Fotográficos
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {checklist.odometerPhotoUrl && (
                                    <div className="space-y-1">
                                        <a
                                            href={`${mediaBase}${checklist.odometerPhotoUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-video rounded-lg overflow-hidden border border-border bg-black/40 hover:opacity-90 transition-opacity"
                                        >
                                            <img
                                                src={`${mediaBase}${checklist.odometerPhotoUrl}`}
                                                alt="Foto do Odômetro"
                                                className="w-full h-full object-cover"
                                            />
                                        </a>
                                        <span className="text-[11px] text-muted-foreground block text-center truncate">
                                            Odômetro ({checklist.kmReading} km)
                                        </span>
                                    </div>
                                )}
                                {vehiclePhotosList.map((photoUrl, index) => (
                                    <div key={photoUrl} className="space-y-1">
                                        <a
                                            href={`${mediaBase}${photoUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-video rounded-lg overflow-hidden border border-border bg-black/40 hover:opacity-90 transition-opacity"
                                        >
                                            <img
                                                src={`${mediaBase}${photoUrl}`}
                                                alt={`Foto Veículo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </a>
                                        <span className="text-[11px] text-muted-foreground block text-center truncate">
                                            Foto Veículo {index + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex items-center justify-between sm:justify-between w-full">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                    <Button onClick={handleExportPDF} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Baixar Relatório em PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
