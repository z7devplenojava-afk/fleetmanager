import React from 'react';
import { motion } from 'framer-motion';
import { Tire } from '@/services/tireService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRightLeft, Move } from 'lucide-react';

interface BusTireMapperProps {
    tires: Tire[];
    onTireClick: (tire: Tire) => void;
    onRotation: (fromTire: Tire, toPosition: { axle: number, index: number }) => void;
}

export const BusTireMapper: React.FC<BusTireMapperProps> = ({ tires, onTireClick, onRotation }) => {

    // Filtra pneus que estão na frota (IN_USE)
    const inUseTires = tires.filter(t => t.status === 'IN_USE');

    const renderTirePlace = (axle: number, index: number, label: string) => {
        const tire = inUseTires.find(t => t.axleNumber === axle && t.positionIndex === index);

        return (
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`relative w-24 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${tire ? 'bg-seguranca-black/40 border-seguranca-yellow/50 shadow-lg shadow-yellow-900/10' : 'bg-seguranca-black/10 border-gray-600 hover:border-seguranca-yellow/30'}
                `}
                onClick={() => tire && onTireClick(tire)}
            >
                {tire ? (
                    <>
                        <div className="absolute top-1 right-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-seguranca-yellow text-seguranca-yellow">
                                {tire.recapCount}V
                            </Badge>
                        </div>

                        <div className="bg-seguranca-black w-14 h-24 rounded-md border border-gray-700 flex flex-col items-center justify-center overflow-hidden">
                            <div className="w-full h-1/2 flex flex-col items-center justify-center border-b border-gray-800">
                                <span className="text-[10px] text-gray-500 font-mono leading-none">SERIAL</span>
                                <span className="text-[11px] font-bold text-seguranca-lightgray">{tire.serialNumber.slice(-4)}</span>
                            </div>
                            <div className="w-full h-1/2 flex flex-col items-center justify-center bg-seguranca-yellow/5">
                                <span className="text-[10px] text-gray-500 font-mono leading-none">KM</span>
                                <span className="text-[10px] font-bold text-seguranca-yellow">{(tire.currentMileage / 1000).toFixed(1)}k</span>
                            </div>
                        </div>

                        <div className="mt-2 text-[10px] font-mono text-gray-400 text-center px-1">
                            {label}
                        </div>

                        {tire.currentMileage > 40000 && (
                            <div className="absolute -bottom-2 -right-1">
                                <AlertCircle size={14} className="text-seguranca-red fill-seguranca-black" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-600">
                        <Move size={18} className="mb-1 opacity-40" />
                        <span className="text-[10px] font-mono">{label}</span>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-12 p-8 bg-seguranca-black/30 rounded-2xl border border-gray-800 relative overflow-hidden">
            {/* Background HUD Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ffcc00,transparent_70%)]" />
            </div>

            {/* Axle 1 - Front */}
            <div className="flex justify-between w-full max-w-md relative">
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-800/50 -translate-y-1/2 rounded-full -z-10" />
                {renderTirePlace(1, 0, "1. ESQ")}
                <div className="flex flex-col items-center justify-center">
                    <div className="w-48 h-8 bg-gray-700/30 rounded-t-xl border-x border-t border-gray-600" />
                    <span className="text-[10px] font-mono text-gray-500 mt-1 tracking-tighter">AXLE_01 / FRONT</span>
                </div>
                {renderTirePlace(1, 1, "1. DIR")}
            </div>

            {/* Axle 2 - Drive (Dual) */}
            <div className="flex justify-between w-full max-w-xl relative">
                <div className="absolute top-1/2 left-0 right-0 h-6 bg-seguranca-yellow/5 -translate-y-1/2 rounded-full -z-10 border-y border-seguranca-yellow/10" />

                {/* Left Dual */}
                <div className="flex gap-2">
                    {renderTirePlace(2, 0, "2. ESQ. EXT")}
                    {renderTirePlace(2, 1, "2. ESQ. INT")}
                </div>

                <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-10 bg-gray-800/40 border border-gray-700 flex items-center justify-center">
                        <ArrowRightLeft size={16} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 mt-1">AXLE_02 / DRIVE</span>
                </div>

                {/* Right Dual */}
                <div className="flex gap-2">
                    {renderTirePlace(2, 2, "2. DIR. INT")}
                    {renderTirePlace(2, 3, "2. DIR. EXT")}
                </div>
            </div>

            {/* Axle 3 - Tag */}
            <div className="flex justify-between w-full max-w-md relative">
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-800/50 -translate-y-1/2 rounded-full -z-10" />
                {renderTirePlace(3, 0, "3. ESQ")}
                <div className="flex flex-col items-center justify-center">
                    <div className="w-40 h-6 bg-gray-700/20 border-x border-b border-gray-600 rounded-b-xl" />
                    <span className="text-[10px] font-mono text-gray-500 mt-1">AXLE_03 / TAG</span>
                </div>
                {renderTirePlace(3, 1, "3. DIR")}
            </div>

            {/* Visual Bus Frame Outline (Optional/Stylized) */}
            <div className="absolute top-10 bottom-10 left-1/2 -translate-x-1/2 w-32 border-x-2 border-dashed border-gray-800/30 pointer-events-none -z-20" />
        </div>
    );
};
