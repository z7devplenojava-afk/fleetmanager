import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mic, ChevronRight, AlertCircle, Clock } from "lucide-react";

interface Task {
    id: string;
    type: 'WORK_ORDER' | 'ALERT';
    title: string;
    vehiclePlate: string;
    vehicleFleetNumber: string;
    priority: string;
    status: string;
    description: string;
}

interface MechanicMobileFeedProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export function MechanicMobileFeed({ tasks, onTaskClick }: MechanicMobileFeedProps) {
    const activeTask = tasks.find(t => t.status === 'IN_PROGRESS');
    const otherTasks = tasks.filter(t => t.id !== activeTask?.id);

    return (
        <div className="flex flex-col h-screen bg-black text-white pb-20 overflow-y-auto">

            {/* 1. Header Brutalista */}
            <div className="p-6 bg-yellow-400 text-black">
                <h1 className="text-4xl font-black uppercase tracking-tighter">TOOLBELT</h1>
                <p className="text-sm font-bold opacity-80 mt-1">MOBILE WORKSTATION</p>
            </div>

            <div className="p-4 space-y-6">

                {/* 2. Active Job (Hero Card) */}
                {activeTask && (
                    <div className="animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <h2 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">NOW WORKING ON</h2>
                        <Card className="bg-slate-900 border-l-4 border-yellow-400 rounded-none overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-3xl font-bold text-white mb-1">{activeTask.vehicleFleetNumber}</div>
                                        <div className="text-slate-400 font-mono text-sm">{activeTask.vehiclePlate}</div>
                                    </div>
                                    <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                                </div>

                                <div className="py-4 border-y border-slate-800">
                                    <p className="text-xl font-medium leading-tight text-slate-100">{activeTask.title}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button className="h-14 text-lg font-bold bg-slate-800 hover:bg-slate-700 rounded-none">
                                        <Camera className="w-6 h-6 mr-2" /> FOTO
                                    </Button>
                                    <Button className="h-14 text-lg font-bold bg-slate-800 hover:bg-slate-700 rounded-none">
                                        <Mic className="w-6 h-6 mr-2" /> ÁUDIO
                                    </Button>
                                </div>

                                <Button className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-none mt-2">
                                    CONCLUIR SERVIÇO
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 3. Up Next Feed */}
                <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">UP NEXT</h2>
                    <div className="space-y-3">
                        {otherTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className="group flex items-center justify-between p-4 bg-slate-900 border border-slate-800 active:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {task.type === 'ALERT' ? (
                                        <div className="w-10 h-10 bg-red-900/50 flex items-center justify-center rounded-full">
                                            <AlertCircle className="w-6 h-6 text-red-500" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-slate-800 flex items-center justify-center rounded-full text-slate-400 font-bold">
                                            {task.vehicleFleetNumber.substring(0, 2)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-slate-200">{task.title}</h3>
                                        <p className="text-xs text-slate-500">{task.vehiclePlate} • {task.priority}</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600 group-hover:text-yellow-400" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
