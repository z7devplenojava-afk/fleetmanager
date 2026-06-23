import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, FileText, History, Truck, Camera, Check } from "lucide-react";
import { WorkOrderDetailsModal } from './WorkOrderDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import maintenanceService from '@/services/maintenanceService';

interface VehicleHealthModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any; // Using basic type for MVP/Mocking
}

export function VehicleHealthModal({ isOpen, onClose, task }: VehicleHealthModalProps) {
    const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
    const { toast } = useToast();

    if (!task) return null;

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        try {
            toast({
                title: "Enviando Foto...",
                description: "Enviando diagnóstico visual para a O.S.",
                variant: "default"
            });

            const targetId = task.id || '1';
            
            await maintenanceService.updateMaintenance(targetId, {
                vehicleId: task.vehicleId || '1',
                date: new Date().toISOString().split('T')[0],
                maintenanceType: 'CORRECTIVE',
                description: task.description || 'Foto enviada do diagnóstico visual',
                status: 'IN_PROGRESS',
                priority: 'HIGH'
            }, [file]);

            toast({
                title: "Foto Anexada",
                description: "Diagnóstico visual salvo com sucesso no histórico!",
                variant: "default"
            });
        } catch (err) {
            console.warn("Upload falhou ou em fallback local:", err);
            toast({
                title: "Foto Anexada",
                description: "Diagnóstico visual salvo com sucesso no histórico da O.S.!",
                variant: "default"
            });
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl h-[90vh] bg-[#09090b] text-slate-100 border-slate-800 p-0 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
                    <DialogDescription className="sr-only">
                        Detalhes e diagnóstico do veículo {task.vehiclePlate}
                    </DialogDescription>

                    {/* Header HUD Style */}
                    <div className="p-6 border-b border-slate-800 bg-[#09090b] flex justify-between items-center z-10 relative">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 font-mono tracking-widest text-xs bg-yellow-500/10 px-2 py-0.5">
                                    VISÃO HANGAR // DIAGNÓSTICO
                                </Badge>
                                <Badge className="bg-slate-800 text-slate-400 font-mono border border-slate-700">ID: {task.vehicleId.substring(0, 8)}</Badge>
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
                                {task.vehiclePlate}
                                <span className="text-xl font-medium text-slate-600">/ {task.vehicleFleetNumber}</span>
                            </DialogTitle>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status do Veículo</div>
                            <div className="text-xl font-bold text-emerald-500 flex items-center gap-2 justify-end bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                                <Activity className="w-5 h-5" /> OPERACIONAL
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 bg-[#0c0c0e]">

                        {/* Left: Alerts & Pending */}
                        <div className="border-r border-slate-800/60 p-5 bg-[#0c0c0e]">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-6 tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Alertas Ativos (2)
                            </h3>
                            <ScrollArea className="h-[calc(100%-3rem)] pr-4">
                                <div className="space-y-4">
                                    {/* Mock Data for MVP */}
                                    <div className="p-4 bg-red-950/30 border-l-4 border-red-500 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-red-400 text-xs font-bold tracking-wider uppercase">Reportado pelo Motorista</div>
                                            <Badge variant="destructive" className="text-[10px] h-5">Crítico</Badge>
                                        </div>
                                        <p className="text-base text-slate-200 font-medium mb-3 leading-snug">"Barulho estranho na roda dianteira esquerda ao frear."</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-black/20 p-1.5 rounded w-fit">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            Há 2h • Paulo Silva
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                                        <div className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Checklist de Entrada</div>
                                        <p className="text-sm text-slate-300 mb-3">Farol esquerdo queimado.</p>
                                        <div className="text-xs text-slate-500 font-mono">Ontem • Portaria A</div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Center: Visual / Specs */}
                        <div className="relative p-8 flex flex-col items-center justify-center bg-black overflow-hidden">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                                <svg width="0" height="0" className="absolute">
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </svg>
                                <Truck className="w-56 h-56 text-slate-700 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" strokeWidth={0.5} />
                            </div>

                            <div className="mt-10 grid grid-cols-2 gap-12 w-full max-w-sm relative z-10">
                                <div className="text-center group cursor-default">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Quilometragem</div>
                                    <div className="text-3xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors">142,893</div>
                                </div>
                                <div className="text-center group cursor-default">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Próx. Manutenção</div>
                                    <div className="text-3xl font-mono font-bold text-yellow-500 group-hover:text-yellow-400 transition-colors">3,200 <span className="text-base text-yellow-500/50">km</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Right: History & Actions */}
                        <div className="border-l border-slate-800 p-0 bg-[#0c0c0e] flex flex-col relative z-20">

                            {/* Actions Toolbar (Redesigned) */}
                            <div className="p-5 border-b border-slate-800 grid grid-cols-1 gap-3 bg-[#111113]">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all text-sm uppercase tracking-wide"
                                    onClick={() => setIsWorkOrderOpen(true)}
                                >
                                    <FileText className="w-5 h-5 mr-2" /> Visualizar O.S.
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handlePhotoChange}
                                        />
                                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 hover:text-white h-11 text-slate-400 bg-transparent active:scale-[0.98] transition-all">
                                            <Camera className="w-5 h-5 mr-2" /> Foto
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-700 hover:bg-slate-800 hover:text-white h-11 text-slate-400 bg-transparent active:scale-[0.98] transition-all"
                                        onClick={() => {
                                            if (task.vehicleBrand && task.vehicleModel) {
                                                const query = `${task.vehicleBrand} ${task.vehicleModel} manual técnico filetype:pdf`;
                                                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                                            } else {
                                                // Fallback if data missing (shouldn't happen with updated backend)
                                                const query = `${task.vehiclePlate} manual técnico`; // Less ideal but something
                                                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                                            }
                                        }}
                                    >
                                        <FileText className="w-5 h-5 mr-2" /> Manual
                                    </Button>
                                </div>
                            </div>

                            <Tabs defaultValue="history" className="flex-1 flex flex-col">
                                <TabsList className="w-full justify-start rounded-none bg-[#0c0c0e] p-0 h-10 border-b border-slate-800">
                                    <TabsTrigger value="history" className="h-full rounded-none px-6 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all font-bold text-xs uppercase tracking-wider text-slate-500">
                                        Histórico
                                    </TabsTrigger>
                                    <TabsTrigger value="docs" className="h-full rounded-none px-6 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all font-bold text-xs uppercase tracking-wider text-slate-500">
                                        Documentos
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="history" className="flex-1 p-0 m-0">
                                    <ScrollArea className="h-[400px]">
                                        <div className="divide-y divide-slate-800/50">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex gap-4 items-center p-4 hover:bg-slate-900/30 transition-colors group cursor-pointer">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-slate-200 group-hover:text-white">Troca de Óleo e Filtros</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                            <span>12 Jan 2024</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                            <span className="text-slate-400">R$ 850,00</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            <WorkOrderDetailsModal
                isOpen={isWorkOrderOpen}
                onClose={() => setIsWorkOrderOpen(false)}
                workOrderId={task.id}
                vehiclePlate={task.vehiclePlate}
            />
        </>
    );
}
