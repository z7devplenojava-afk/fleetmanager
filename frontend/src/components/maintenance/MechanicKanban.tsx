import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Wrench, Camera, Building, User } from "lucide-react";

export interface KanbanTask {
    id: string;
    type: 'WORK_ORDER' | 'ALERT';
    title: string;
    vehiclePlate: string;
    vehicleFleetNumber: string;
    priority: string;
    status: string;
    description: string;
    vehicleId: string;
    mechanicName?: string;
    laborType?: string;
    photoCount?: number;
    rawWorkOrder?: any;
}

export interface KanbanColumn {
    id: string;
    title: string;
    tasks: KanbanTask[];
    color: string;
}

interface MechanicKanbanProps {
    columns: KanbanColumn[];
    onMoveTask: (taskId: string, newStatus: string) => void;
    onTaskClick: (task: KanbanTask) => void;
}

export function MechanicKanban({ columns, onMoveTask, onTaskClick }: MechanicKanbanProps) {
    return (
        <div className="flex h-full gap-4 overflow-x-auto p-4 bg-slate-950 text-slate-100 font-mono">
            {columns.map((col) => (
                <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-2">

                    {/* Header Industrial */}
                    <div className={`flex items-center justify-between p-3 border-b-2 ${col.color} bg-slate-900/60 rounded-t-md`}>
                        <h3 className="font-bold uppercase tracking-wider text-sm">{col.title}</h3>
                        <Badge variant="outline" className="bg-slate-800 text-slate-200 border-slate-700 text-xs font-bold">
                            {col.tasks.length}
                        </Badge>
                    </div>

                    {/* Task Stream */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-900/20 rounded-b-md">
                        {col.tasks.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-lg text-slate-600 text-xs">
                                Nenhuma O.S. nesta coluna
                            </div>
                        ) : (
                            col.tasks.map((task) => (
                                <Card
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className={`
                                        cursor-pointer hover:scale-[1.02] transition-transform duration-150
                                        bg-slate-900 border-l-4 border-slate-800 hover:border-l-orange-500
                                        ${task.type === 'ALERT' ? 'border-l-red-500 bg-red-950/10' : ''}
                                        ${task.laborType === 'EXTERNAL' ? 'border-l-cyan-500' : ''}
                                    `}
                                >
                                    <CardHeader className="p-3 pb-0 space-y-0">
                                        <div className="flex justify-between items-start gap-1 flex-wrap">
                                            <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'secondary'} className="rounded-none text-[10px]">
                                                {task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                {task.laborType === 'EXTERNAL' && (
                                                    <Badge variant="outline" className="text-[10px] border-cyan-700 text-cyan-400 bg-cyan-950/40">
                                                        <Building className="w-2.5 h-2.5 mr-0.5" /> Externo
                                                    </Badge>
                                                )}
                                                {(task.photoCount || 0) > 0 && (
                                                    <Badge variant="outline" className="text-[10px] border-blue-700 text-blue-400 bg-blue-950/40">
                                                        <Camera className="w-2.5 h-2.5 mr-0.5" /> {task.photoCount}
                                                    </Badge>
                                                )}
                                                {task.type === 'ALERT' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                            </div>
                                        </div>
                                        <CardTitle className="text-sm font-bold mt-2 truncate text-slate-100">
                                            {task.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3">
                                        <div className="text-xs text-slate-400 mb-1 font-mono flex items-center justify-between">
                                            <span>[{task.vehicleFleetNumber} - {task.vehiclePlate}]</span>
                                            {task.mechanicName && (
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                    {task.mechanicName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                            {task.description}
                                        </p>

                                        {/* Industrial Action Bar */}
                                        <div className="flex justify-between items-center gap-1 pt-2 border-t border-slate-800/50">
                                            <span className="text-[10px] text-slate-500 hover:text-slate-300">
                                                Ver Detalhes →
                                            </span>

                                            <div className="flex gap-1">
                                                {col.id === 'todo' && (
                                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-blue-900 hover:text-blue-100 px-2"
                                                        onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'DOING'); }}>
                                                        INICIAR <Clock className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                                {col.id === 'doing' && (
                                                    <>
                                                        <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-purple-900 hover:text-purple-100 px-1.5"
                                                            onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'WAITING_PARTS'); }}
                                                            title="Aguardando Peças">
                                                            PEÇAS <Clock className="w-3 h-3 ml-0.5" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-green-900 hover:text-green-100 px-1.5"
                                                            onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'DONE'); }}>
                                                            FINALIZAR <CheckCircle className="w-3 h-3 ml-0.5" />
                                                        </Button>
                                                    </>
                                                )}
                                                {col.id === 'parts' && (
                                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-orange-900 hover:text-orange-100 px-2"
                                                        onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'DOING'); }}>
                                                        RETOMAR <Wrench className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                                {col.id === 'external' && (
                                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-cyan-900 hover:text-cyan-100 px-2"
                                                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}>
                                                        GERENCIAR →
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
