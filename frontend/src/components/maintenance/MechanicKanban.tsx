import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";

interface Task {
    id: string;
    type: 'WORK_ORDER' | 'ALERT';
    title: string;
    vehiclePlate: string;
    vehicleFleetNumber: string;
    priority: string;
    status: string;
    description: string;
    vehicleId: string;
}

interface Column {
    id: string;
    title: string;
    tasks: Task[];
    color: string;
}

interface MechanicKanbanProps {
    columns: Column[];
    onMoveTask: (taskId: string, newStatus: string) => void;
    onTaskClick: (task: Task) => void;
}

export function MechanicKanban({ columns, onMoveTask, onTaskClick }: MechanicKanbanProps) {
    return (
        <div className="flex h-full gap-4 overflow-x-auto p-4 bg-slate-950 text-slate-100 font-mono">
            {columns.map((col) => (
                <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-2">

                    {/* Header Industrial */}
                    <div className={`flex items-center justify-between p-3 border-b-2 ${col.color} bg-slate-900/50`}>
                        <h3 className="font-bold uppercase tracking-wider">{col.title}</h3>
                        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                            {col.tasks.length}
                        </Badge>
                    </div>

                    {/* Task Stream */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-900/20 rounded-sm">
                        {col.tasks.map((task) => (
                            <Card
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={`
                  cursor-pointer hover:scale-[1.02] transition-transform duration-150
                  bg-slate-900 border-l-4 border-slate-800 hover:border-l-orange-500
                  ${task.type === 'ALERT' ? 'border-l-red-500 bg-red-950/10' : ''}
                `}
                            >
                                <CardHeader className="p-3 pb-0 space-y-0">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'secondary'} className="rounded-none text-xs">
                                            {task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                                        </Badge>
                                        {task.type === 'ALERT' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2 truncate">
                                        {task.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="text-xs text-slate-400 mb-2 font-mono">
                                        [{task.vehicleFleetNumber} - {task.vehiclePlate}]
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {task.description}
                                    </p>

                                    {/* Industrial Action Bar */}
                                    <div className="flex justify-end gap-1 pt-2 border-t border-slate-800/50">
                                        {col.id === 'todo' && (
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-blue-900 hover:text-blue-100"
                                                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'DOING'); }}>
                                                INICIAR <Clock className="w-3 h-3 ml-1" />
                                            </Button>
                                        )}
                                        {col.id === 'doing' && (
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-green-900 hover:text-green-100"
                                                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'DONE'); }}>
                                                FINALIZAR <CheckCircle className="w-3 h-3 ml-1" />
                                            </Button>
                                        )}
                                        {col.id === 'alerts' && (
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-orange-900 hover:text-orange-100"
                                                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, 'TODO'); }}>
                                                ACEITAR <Wrench className="w-3 h-3 ml-1" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
