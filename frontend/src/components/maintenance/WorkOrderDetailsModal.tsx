import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
    FileText, Calendar, User, Truck, Wrench, CheckCircle, Clock, 
    AlertTriangle, Edit2, Trash2, Plus, Save, X 
} from "lucide-react";
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';

interface WorkOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId?: string; // ID for fetching data
    vehiclePlate?: string;
}

const FALLBACK_STOCK_ITEMS = [
    { id: '1', code: 'PST-9988', name: 'Jogo de Pastilhas Dianteiras', currentQuantity: 15 },
    { id: '2', code: 'PST-9977', name: 'Jogo de Pastilhas Traseiras', currentQuantity: 10 },
    { id: '3', code: 'DSC-1010', name: 'Disco de Freio Dianteiro (Par)', currentQuantity: 8 },
    { id: '4', code: 'DSC-1020', name: 'Disco de Freio Traseiro (Par)', currentQuantity: 5 },
    { id: '5', code: 'OLE-5W30', name: 'Óleo Motor 5W30 Sintético (1L)', currentQuantity: 50 },
    { id: '6', code: 'FLT-OLEO', name: 'Filtro de Óleo Lubrificante', currentQuantity: 25 },
    { id: '7', code: 'FLT-ARCO', name: 'Filtro de Cabine / Ar Condicionado', currentQuantity: 12 },
    { id: '8', code: 'FLT-ARMT', name: 'Filtro de Ar do Motor', currentQuantity: 18 },
    { id: '9', code: 'PAL-PARA', name: 'Jogo de Palhetas do Parabrisa', currentQuantity: 20 },
    { id: '10', code: 'LIQ-ARRE', name: 'Aditivo / Líquido de Arrefecimento (1L)', currentQuantity: 30 }
];

export function WorkOrderDetailsModal({ isOpen, onClose, workOrderId, vehiclePlate }: WorkOrderDetailsModalProps) {
    const { toast } = useToast();
    
    // Status e dados principais da O.S. (reativos para permitir edição instantânea na tela)
    const [status, setStatus] = useState('OPEN');
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Troca de Pastilhas de Freio', status: 'PENDING' },
        { id: 2, title: 'Verificação de Discos', status: 'PENDING' },
        { id: 3, title: 'Teste de Frenagem', status: 'PENDING' }
    ]);
    const [parts, setParts] = useState([
        { name: 'Jogo de Pastilhas Dianteiras', quantity: 1, code: 'PST-9988' }
    ]);

    // Estado do modo de edição e rascunhos temporários
    const [isEditing, setIsEditing] = useState(false);
    const [tempTasks, setTempTasks] = useState([...tasks]);
    const [tempParts, setTempParts] = useState([...parts]);

    // Inputs para novas adições
    const [newServiceTitle, setNewServiceTitle] = useState('');
    const [selectedStockItemId, setSelectedStockItemId] = useState('');
    const [newPartQty, setNewPartQty] = useState(1);

    // Itens de estoque carregados dinamicamente
    const [stockItems, setStockItems] = useState<StockItem[]>([]);

    // Carregar itens do estoque na abertura do modal
    useEffect(() => {
        const fetchStock = async () => {
            try {
                const items = await stockService.getAllItems();
                setStockItems(items);
            } catch (err) {
                console.error("Erro ao carregar estoque:", err);
            }
        };
        if (isOpen) {
            fetchStock();
        }
    }, [isOpen]);

    // Mock Data para cabeçalho e info geral
    const mockOrder = {
        id: workOrderId || 'WO-2024-001',
        created: '12/05/2026 14:30',
        technician: 'Carlos Silva',
        description: 'Veículo apresentando ruído metálico ao frear. Suspeita de pastilhas gastas.',
    };

    // Controle do Modo de Edição
    const handleStartEditing = () => {
        setTempTasks([...tasks]);
        setTempParts([...parts]);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
    };

    const handleSaveChanges = () => {
        setTasks(tempTasks);
        setParts(tempParts);
        setIsEditing(false);
        toast({
            title: "Ordem de Serviço Atualizada",
            description: "Os itens da O.S. foram atualizados com sucesso.",
            variant: "default",
        });
    };

    // Operações de Serviços (Tasks)
    const handleAddService = () => {
        if (!newServiceTitle.trim()) return;
        setTempTasks([...tempTasks, { id: Date.now(), title: newServiceTitle.trim(), status: 'PENDING' }]);
        setNewServiceTitle('');
    };

    const handleRemoveService = (id: number) => {
        setTempTasks(tempTasks.filter(t => t.id !== id));
    };

    // Operações de Peças (Parts)
    const availableItems = stockItems.length > 0 ? stockItems : FALLBACK_STOCK_ITEMS;

    const handleAddPart = () => {
        if (!selectedStockItemId) return;
        const item = availableItems.find(i => i.id === selectedStockItemId);
        if (!item) return;

        // Se a peça já está adicionada no rascunho, apenas soma a quantidade
        const existingIdx = tempParts.findIndex(p => p.code === item.code);
        if (existingIdx > -1) {
            const updated = [...tempParts];
            updated[existingIdx].quantity += newPartQty;
            setTempParts(updated);
        } else {
            setTempParts([...tempParts, { name: item.name, code: item.code, quantity: newPartQty }]);
        }

        setSelectedStockItemId('');
        setNewPartQty(1);
    };

    const handleRemovePart = (index: number) => {
        setTempParts(tempParts.filter((_, idx) => idx !== index));
    };

    // Alteração de Status
    const handleStartService = () => {
        setStatus('IN_PROGRESS');
        toast({
            title: "Serviço Iniciado",
            description: "O status da Ordem de Serviço foi alterado para Em Andamento.",
            variant: "default"
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'OPEN': return 'EM ABERTO';
            case 'IN_PROGRESS': return 'EM ANDAMENTO';
            case 'COMPLETED': return 'CONCLUÍDO';
            case 'CANCELLED': return 'CANCELADO';
            default: return 'EM ABERTO';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'OPEN': return 'border-orange-500 text-orange-500 bg-orange-500/10 font-mono tracking-wider';
            case 'IN_PROGRESS': return 'border-blue-500 text-blue-500 bg-blue-500/10 font-mono tracking-wider';
            case 'COMPLETED': return 'border-emerald-500 text-emerald-500 bg-emerald-500/10 font-mono tracking-wider';
            case 'CANCELLED': return 'border-slate-500 text-slate-500 bg-slate-500/10 font-mono tracking-wider';
            default: return 'border-orange-500 text-orange-500 bg-orange-500/10 font-mono tracking-wider';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 shadow-2xl shadow-black/50">
                <DialogDescription className="sr-only">
                    Visualização e edição da ordem de serviço #{mockOrder.id}
                </DialogDescription>
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Ordem de Serviço #{mockOrder.id}</DialogTitle>
                                <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                    <Truck className="w-3 h-3" /> {vehiclePlate || 'Veículo Desconhecido'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* O botão editar só aparece para O.S. nos status OPEN ou IN_PROGRESS, e se não estiver já em modo de edição */}
                            {(status === 'OPEN' || status === 'IN_PROGRESS') && !isEditing && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white" 
                                    onClick={handleStartEditing}
                                >
                                    <Edit2 className="w-4 h-4 mr-2" /> Editar O.S.
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white" onClick={() => window.print()}>
                                <FileText className="w-4 h-4 mr-2" /> Gerar PDF
                            </Button>
                            <Badge variant="outline" className={getStatusBadgeClass(status)}>
                                {getStatusLabel(status)}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6 py-4">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-900 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Prioridade</span>
                                <div className="flex items-center gap-2 text-red-400 font-bold">
                                    <AlertTriangle className="w-4 h-4" /> ALTA
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900 rounded border border-slate-800">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Mecânico Responsável</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <User className="w-4 h-4 text-slate-500" /> {mockOrder.technician}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Relato do Problema</h3>
                            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed">
                                {mockOrder.description}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-3 h-3" /> Criado em {mockOrder.created}
                            </div>
                        </div>

                        {/* Tasks Checklist */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Wrench className="w-4 h-4 text-blue-500" /> Serviços a Executar
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    {tempTasks.map(task => (
                                        <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                                                <span className="text-sm font-medium">{task.title}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                onClick={() => handleRemoveService(task.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-2 mt-3">
                                        <Input
                                            placeholder="Nome do novo serviço a executar..."
                                            value={newServiceTitle}
                                            onChange={(e) => setNewServiceTitle(e.target.value)}
                                            className="bg-slate-950 border-slate-800 text-slate-100"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddService();
                                                }
                                            }}
                                        />
                                        <Button 
                                            type="button" 
                                            onClick={handleAddService}
                                            className="bg-blue-600 hover:bg-blue-500 h-10 w-10 p-0 flex items-center justify-center shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                                            <span className="text-sm font-medium">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Parts */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Truck className="w-4 h-4 text-blue-500" /> Peças Solicitadas
                            </h3>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-950 text-slate-500 uppercase text-xs">
                                                <tr>
                                                    <th className="p-3 font-medium">Item</th>
                                                    <th className="p-3 font-medium">Cód.</th>
                                                    <th className="p-3 font-medium text-right">Qtd.</th>
                                                    <th className="p-3 font-medium text-center w-12">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {tempParts.map((part, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3 text-slate-300">{part.name}</td>
                                                        <td className="p-3 text-slate-500 font-mono text-xs">{part.code}</td>
                                                        <td className="p-3 text-right text-slate-300">{part.quantity}</td>
                                                        <td className="p-3 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                                onClick={() => handleRemovePart(idx)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {tempParts.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-4 text-center text-slate-500 text-xs italic">
                                                            Nenhuma peça solicitada para esta O.S.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Adicionar Peça do Estoque */}
                                    <div className="flex gap-2 items-end p-3 bg-slate-900 rounded border border-slate-800">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 font-bold block mb-1">Adicionar Peça do Estoque</label>
                                            <select
                                                value={selectedStockItemId}
                                                onChange={(e) => setSelectedStockItemId(e.target.value)}
                                                className="w-full h-10 rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">Selecione uma peça do estoque...</option>
                                                {availableItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name} ({item.code}) - Disp: {item.currentQuantity}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-slate-400 font-bold block mb-1">Qtd.</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={newPartQty}
                                                onChange={(e) => setNewPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="bg-slate-950 border-slate-800 text-slate-100 h-10"
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            onClick={handleAddPart}
                                            className="bg-blue-600 hover:bg-blue-500 h-10 w-10 p-0 flex items-center justify-center shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-950 text-slate-500 uppercase text-xs">
                                            <tr>
                                                <th className="p-3 font-medium">Item</th>
                                                <th className="p-3 font-medium">Cód.</th>
                                                <th className="p-3 font-medium text-right">Qtd.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {parts.map((part, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3 text-slate-300">{part.name}</td>
                                                    <td className="p-3 text-slate-500 font-mono text-xs">{part.code}</td>
                                                    <td className="p-3 text-right text-slate-300">{part.quantity}</td>
                                                </tr>
                                            ))}
                                            {parts.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-slate-500 text-xs italic">
                                                        Nenhuma peça solicitada para esta O.S.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <Button 
                                variant="outline" 
                                className="border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white" 
                                onClick={handleCancelEditing}
                            >
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" 
                                onClick={handleSaveChanges}
                            >
                                <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={onClose}>
                                Fechar
                            </Button>
                            {status === 'OPEN' && (
                                <Button className="bg-blue-600 hover:bg-blue-500" onClick={handleStartService}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Iniciar Serviço
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
