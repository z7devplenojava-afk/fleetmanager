'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Info } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface DamagePoint {
    x: number;
    y: number;
    description: string;
    type: 'scratch' | 'dent' | 'broken' | 'other';
}

interface DamageMapProps {
    points: DamagePoint[];
    onChange: (points: DamagePoint[]) => void;
    readOnly?: boolean;
}

const DamageMap: React.FC<DamageMapProps> = ({ points, onChange, readOnly = false }) => {
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readOnly) return;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            const newPoint: DamagePoint = {
                x,
                y,
                description: '',
                type: 'scratch',
            };

            onChange([...points, newPoint]);
            setSelectedPoint(points.length);
        }
    };

    const updatePoint = (index: number, updates: Partial<DamagePoint>) => {
        const newPoints = [...points];
        newPoints[index] = { ...newPoints[index], ...updates };
        onChange(newPoints);
    };

    const removePoint = (index: number) => {
        onChange(points.filter((_, i) => i !== index));
        setSelectedPoint(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <Label>Mapa de Avarias (Clique no veículo para marcar)</Label>
                <div
                    ref={containerRef}
                    onClick={handleMapClick}
                    className="relative aspect-video bg-seguranca-black rounded-lg border border-gray-700 overflow-hidden cursor-crosshair"
                >
                    {/* Simple Vehicle SVG (Side view) */}
                    <svg viewBox="0 0 800 300" className="w-full h-full opacity-30 fill-gray-400">
                        <path d="M100,200 L150,100 L600,100 L700,150 L750,200 L750,250 L100,250 Z" />
                        <circle cx="200" cy="250" r="40" />
                        <circle cx="600" cy="250" r="40" />
                        <rect x="250" y="120" width="150" height="60" />
                        <rect x="420" y="120" width="150" height="60" />
                    </svg>

                    {points.map((pt, i) => (
                        <div
                            key={i}
                            className={`absolute w-4 h-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${selectedPoint === i ? 'bg-seguranca-yellow scale-125 border-white' : 'bg-red-500 border-red-700'
                                }`}
                            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPoint(i);
                            }}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Toque no local da avaria para adicionar um marcador.
                </p>
            </div>

            <div className="space-y-4">
                <Label>Detalhes das Avarias ({points.length})</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {points.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                            Nenhuma avaria marcada no mapa.
                        </div>
                    ) : (
                        points.map((pt, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-lg border transition-colors ${selectedPoint === i ? 'bg-seguranca-yellow/10 border-seguranca-yellow' : 'bg-seguranca-black border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <Badge className="bg-red-500">Marcador {i + 1}</Badge>
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePoint(i)}
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Select
                                        disabled={readOnly}
                                        value={pt.type}
                                        onValueChange={(v) => updatePoint(i, { type: v as any })}
                                    >
                                        <SelectTrigger className="h-8 bg-seguranca-black border-gray-600 text-xs">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scratch">Arranhão / Risco</SelectItem>
                                            <SelectItem value="dent">Amassado</SelectItem>
                                            <SelectItem value="broken">Quebrado / Trincado</SelectItem>
                                            <SelectItem value="other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        disabled={readOnly}
                                        placeholder="Descrição da avaria..."
                                        value={pt.description}
                                        onChange={(e) => updatePoint(i, { description: e.target.value })}
                                        className="h-8 bg-seguranca-black border-gray-600 text-xs"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Internal Badge and Select to avoid complex imports in this snippet
const Badge = ({ children, className }: any) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${className}`}>
        {children}
    </span>
);

export default DamageMap;
