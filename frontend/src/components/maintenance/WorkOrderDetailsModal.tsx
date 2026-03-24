import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, User, Truck, Wrench, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface WorkOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId?: string; // ID for fetching data
    vehiclePlate?: string;
}

export function WorkOrderDetailsModal({ isOpen, onClose, workOrderId, vehiclePlate }: WorkOrderDetailsModalProps) {
    // Mock Data for MVP
    const mockOrder = {
        id: workOrderId || 'WO-2024-001',
        status: 'OPEN',
        priority: 'HIGH',
        created: '12/05/2026 14:30',
        technician: 'Carlos Silva',
        description: 'Veículo apresentando ruído metálico ao frear. Suspeita de pastilhas gastas.',
        tasks: [
            { id: 1, title: 'Troca de Pastilhas de Freio', status: 'PENDING' },
            { id: 2, title: 'Verificação de Discos', status: 'PENDING' },
            { id: 3, title: 'Teste de Frenagem', status: 'PENDING' }
        ],
        parts: [
            { name: 'Jogo de Pastilhas Dianteiras', quantity: 1, code: 'PST-9988' }
        ]
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800">
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
                            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white" onClick={() => window.print()}>
                                <FileText className="w-4 h-4 mr-2" /> Gerar PDF
                            </Button>
                            <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10">
                                EM ABERTO
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
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4" /> Serviços a Executar
                            </h3>
                            <div className="space-y-2">
                                {mockOrder.tasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                                        <span className="text-sm font-medium">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Parts */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Peças Solicitadas
                            </h3>
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
                                        {mockOrder.parts.map((part, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 text-slate-300">{part.name}</td>
                                                <td className="p-3 text-slate-500 font-mono text-xs">{part.code}</td>
                                                <td className="p-3 text-right text-slate-300">{part.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <Button variant="outline" className="border-slate-700 text-slate-300" onClick={onClose}>
                        Fechar
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500">
                        <CheckCircle className="w-4 h-4 mr-2" /> Iniciar Serviço
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
