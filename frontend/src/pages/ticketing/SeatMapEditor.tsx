import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Armchair, Save, Trash2, Plus, Grid, Info, X, Layers, User } from 'lucide-react';
import ticketingService, { SeatTemplate } from '@/services/ticketingService';
import { useAuth } from '@/contexts/AuthContext';

interface SeatPosition {
    id: string;
    number: string;
    type: 'CONVENCIONAL' | 'LEITO' | 'EXECUTIVO';
    row: number;
    col: number;
    floor: number;
    passengerName?: string;
    passengerDoc?: string;
}

const VEHICLE_PRESETS: Record<string, { rows: number; cols: number; floors: number }> = {
    'CONVENCIONAL': { rows: 12, cols: 5, floors: 1 },
    'EXECUTIVO': { rows: 11, cols: 5, floors: 1 },
    'LEITO': { rows: 9, cols: 4, floors: 1 },
    'DD': { rows: 12, cols: 5, floors: 2 }
};

const DraggableSeat = ({ id, number }: { id: string; number: string }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = { transform: CSS.Translate.toString(transform) };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="w-10 h-10 bg-seguranca-yellow text-seguranca-black rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-50 font-bold"
        >
            <Armchair size={20} />
            <span className="text-[10px] absolute -bottom-1">{number}</span>
        </div>
    );
};

const DroppableCell = ({ id, seat, onRemove, onEdit }: {
    id: string;
    seat?: SeatPosition;
    onRemove: (id: string) => void;
    onEdit: (seat: SeatPosition) => void;
}) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`w-12 h-12 border border-seguranca-graphite rounded-md flex items-center justify-center transition-colors ${isOver ? 'bg-seguranca-yellow/20 border-seguranca-yellow' : 'bg-seguranca-black/50'
                }`}
        >
            {seat ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                    <button
                        onClick={() => onRemove(seat.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                    >
                        <X size={12} />
                    </button>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(seat);
                        }}
                        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer shadow-md ${seat.passengerName ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-seguranca-graphite text-white hover:bg-seguranca-yellow hover:text-seguranca-black'
                            }`}
                    >
                        <span className="text-xs leading-none">{seat.number}</span>
                        {seat.passengerName && <User size={10} className="mt-0.5" />}
                    </div>
                </div>
            ) : (
                <div className="text-seguranca-graphite text-[8px]">{id}</div>
            )}
        </div>
    );
};

const SeatMapEditor: React.FC = () => {
    const { user, empresa } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [vehicleType, setVehicleType] = useState('CONVENCIONAL');
    const [rows, setRows] = useState(12);
    const [cols, setCols] = useState(5);
    const [currentFloor, setCurrentFloor] = useState(1);
    const [placedSeats, setPlacedSeats] = useState<SeatPosition[]>([]);
    const [nextSeatNumber, setNextSeatNumber] = useState(1);

    // Edit Modal State
    const [editingSeat, setEditingSeat] = useState<SeatPosition | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        number: '',
        type: 'CONVENCIONAL' as any,
        passengerName: '',
        passengerDoc: ''
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleVehicleTypeChange = (type: string) => {
        setVehicleType(type);
        const preset = VEHICLE_PRESETS[type];
        if (preset) {
            setRows(preset.rows);
            setCols(preset.cols);
            setCurrentFloor(1); // Reset to first floor
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id) {
            const [r, c] = (over.id as string).split('-').map(Number);

            // Check if already occupied on ANY floor? No, only current floor
            if (placedSeats.some(s => s.row === r && s.col === c && s.floor === currentFloor)) {
                toast({ title: "Posição ocupada", variant: "destructive" });
                return;
            }

            const newSeat: SeatPosition = {
                id: `seat-${Date.now()}`,
                number: nextSeatNumber.toString(),
                type: 'CONVENCIONAL',
                row: r,
                col: c,
                floor: currentFloor
            };

            setPlacedSeats([...placedSeats, newSeat]);
            setNextSeatNumber(nextSeatNumber + 1);
        }
    };

    const removeSeat = (id: string) => {
        setPlacedSeats(placedSeats.filter(s => s.id !== id));
    };

    const openEditModal = (seat: SeatPosition) => {
        setEditingSeat(seat);
        setEditFormData({
            number: seat.number,
            type: seat.type,
            passengerName: seat.passengerName || '',
            passengerDoc: seat.passengerDoc || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSeat = () => {
        if (!editingSeat) return;

        setPlacedSeats(placedSeats.map(s =>
            s.id === editingSeat.id
                ? {
                    ...s,
                    number: editFormData.number,
                    type: editFormData.type,
                    passengerName: editFormData.passengerName,
                    passengerDoc: editFormData.passengerDoc
                }
                : s
        ));
        setIsEditModalOpen(false);
        toast({ title: "Poltrona atualizada" });
    };

    const handleSave = async () => {
        if (!name) {
            toast({ title: "Nome obrigatório", variant: "destructive" });
            return;
        }

        try {
            if (!empresa?.id) {
                toast({
                    title: "Contexto de empresa necessário",
                    description: "Como Super Admin, você deve selecionar uma empresa antes de criar templates.",
                    variant: "destructive"
                });
                return;
            }

            const template: SeatTemplate = {
                name,
                description,
                vehicleType,
                totalSeats: placedSeats.length,
                layoutJson: JSON.stringify({
                    rows,
                    cols,
                    floors: VEHICLE_PRESETS[vehicleType]?.floors || 1,
                    seats: placedSeats
                }),
                companyId: empresa.id
            };

            await ticketingService.saveTemplate(template);
            toast({ title: "Template salvo com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao salvar template", variant: "destructive" });
        }
    };

    const floorCount = VEHICLE_PRESETS[vehicleType]?.floors || 1;

    return (
        <StandardLayout title="Configurador de Mapa de Poltronas">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Configurações */}
                <Card className="lg:col-span-1 bg-seguranca-graphite border-seguranca-graphite">
                    <CardHeader>
                        <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                            <Info size={20} /> Informações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome do Template</Label>
                            <Input
                                placeholder="Ex: Convencional 46"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Ex: Configuração padrão para ônibus de linha"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Veículo</Label>
                            <Select value={vehicleType} onValueChange={handleVehicleTypeChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CONVENCIONAL">Convencional</SelectItem>
                                    <SelectItem value="EXECUTIVO">Executivo</SelectItem>
                                    <SelectItem value="LEITO">Leito</SelectItem>
                                    <SelectItem value="DD">Double Decker</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {floorCount > 1 && (
                            <div className="space-y-3 pt-2">
                                <Label className="text-seguranca-yellow flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                                    <Layers size={14} /> Selecionar Andar
                                </Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button
                                        variant={currentFloor === 1 ? "default" : "outline"}
                                        className={`justify-start h-10 px-4 rounded-xl border-2 transition-all ${currentFloor === 1
                                            ? "bg-seguranca-yellow text-seguranca-black border-seguranca-yellow shadow-lg shadow-seguranca-yellow/20"
                                            : "border-seguranca-black text-seguranca-lightgray hover:border-seguranca-yellow/50"
                                            }`}
                                        onClick={() => setCurrentFloor(1)}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-3 ${currentFloor === 1 ? 'bg-seguranca-black' : 'bg-seguranca-graphite'}`} />
                                        1º Andar (Inferior)
                                    </Button>
                                    <Button
                                        variant={currentFloor === 2 ? "default" : "outline"}
                                        className={`justify-start h-10 px-4 rounded-xl border-2 transition-all ${currentFloor === 2
                                            ? "bg-seguranca-yellow text-seguranca-black border-seguranca-yellow shadow-lg shadow-seguranca-yellow/20"
                                            : "border-seguranca-black text-seguranca-lightgray hover:border-seguranca-yellow/50"
                                            }`}
                                        onClick={() => setCurrentFloor(2)}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-3 ${currentFloor === 2 ? 'bg-seguranca-black' : 'bg-seguranca-graphite'}`} />
                                        2º Andar (Superior)
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fileiras</Label>
                                <Input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Colunas</Label>
                                <Input type="number" value={cols} onChange={e => setCols(Number(e.target.value))} />
                            </div>
                        </div>

                        <hr className="border-seguranca-black" />

                        <div className="pt-4">
                            <Label className="mb-2 block font-bold">Próxima Poltrona</Label>
                            <div className="flex items-center gap-4">
                                <DndContext sensors={sensors}>
                                    <DraggableSeat id="new-seat" number={nextSeatNumber.toString()} />
                                </DndContext>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Alterar nº</Label>
                                    <Input
                                        type="number"
                                        size={1}
                                        value={nextSeatNumber}
                                        onChange={e => setNextSeatNumber(Number(e.target.value))}
                                        className="h-8 w-16 text-xs"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-seguranca-lightgray mt-2 italic">
                                Dica: Arraste o ícone para o mapa à direita.
                            </p>
                        </div>

                        <Button className="w-full bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 mt-6 font-bold" onClick={handleSave}>
                            <Save size={18} className="mr-2" /> Salvar Template
                        </Button>
                    </CardContent>
                </Card>

                {/* Main Content: Seat Map Editor */}
                <Card className="lg:col-span-3 bg-seguranca-graphite border-seguranca-graphite overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                            <Grid size={20} /> Mapa Visual - {floorCount > 1 ? `${currentFloor}º Andar` : 'Andar Único'}
                        </CardTitle>
                        <div className="text-sm text-seguranca-lightgray">
                            Poltronas neste andar: <span className="text-seguranca-yellow font-bold">
                                {placedSeats.filter(s => s.floor === currentFloor).length}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-center p-8 bg-seguranca-black/30 min-h-[600px] overflow-auto">
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div
                                className="grid gap-2 border-4 border-seguranca-black p-6 rounded-[2rem] bg-seguranca-graphite/50 shadow-2xl relative"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                    width: 'fit-content',
                                    height: 'fit-content'
                                }}
                            >
                                {/* Cabine do Motorista (Simulada) */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-8 bg-seguranca-black rounded-t-xl flex items-center justify-center text-[10px] text-seguranca-lightgray uppercase tracking-widest border border-seguranca-graphite">
                                    Frente
                                </div>

                                {Array.from({ length: rows }).map((_, r) => (
                                    Array.from({ length: cols }).map((_, c) => {
                                        const seat = placedSeats.find(s => s.row === r && s.col === c && s.floor === currentFloor);
                                        return (
                                            <DroppableCell
                                                key={`${r}-${c}`}
                                                id={`${r}-${c}`}
                                                seat={seat}
                                                onRemove={removeSeat}
                                                onEdit={openEditModal}
                                            />
                                        );
                                    })
                                ))}
                            </div>
                        </DndContext>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-seguranca-graphite border-seguranca-graphite text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-seguranca-yellow flex items-center gap-2">
                            <Armchair size={20} /> Configurar Poltrona {editingSeat?.number}
                        </DialogTitle>
                        <DialogDescription className="text-seguranca-lightgray text-xs">
                            Ajuste as propriedades desta poltrona ou adicione um passageiro pré-definido.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-wider">Número</Label>
                                <Input
                                    value={editFormData.number}
                                    onChange={e => setEditFormData({ ...editFormData, number: e.target.value })}
                                    className="bg-seguranca-black border-seguranca-black font-bold h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-wider">Tipo</Label>
                                <Select
                                    value={editFormData.type}
                                    onValueChange={val => setEditFormData({ ...editFormData, type: val })}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-seguranca-black h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-seguranca-black text-white">
                                        <SelectItem value="CONVENCIONAL">Convencional</SelectItem>
                                        <SelectItem value="EXECUTIVO">Executivo</SelectItem>
                                        <SelectItem value="LEITO">Leito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <hr className="border-seguranca-black" />

                        <div className="space-y-3">
                            <Label className="text-seguranca-yellow text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                                <User size={14} /> Passageiro (Opcional)
                            </Label>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-seguranca-lightgray">Nome Completo</Label>
                                <Input
                                    placeholder="Ex: JOÃO DA SILVA"
                                    value={editFormData.passengerName}
                                    onChange={e => setEditFormData({ ...editFormData, passengerName: e.target.value.toUpperCase() })}
                                    className="bg-seguranca-black border-seguranca-black text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-seguranca-lightgray">Documento (CPF/RG)</Label>
                                <Input
                                    placeholder="000.000.000-00"
                                    value={editFormData.passengerDoc}
                                    onChange={e => setEditFormData({ ...editFormData, passengerDoc: e.target.value })}
                                    className="bg-seguranca-black border-seguranca-black text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            onClick={handleUpdateSeat}
                            className="w-full bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-bold h-11"
                        >
                            Confirmar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default SeatMapEditor;
