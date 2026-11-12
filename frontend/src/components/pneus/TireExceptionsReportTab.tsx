import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Mail, MessageSquare, ShieldAlert } from 'lucide-react';
import { TireFrontAxleException } from '@/services/tireService';

interface TireExceptionsReportTabProps {
    exceptions: TireFrontAxleException[];
}

export const TireExceptionsReportTab: React.FC<TireExceptionsReportTabProps> = ({ exceptions }) => {
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    const visibleExceptions = showActiveOnly
        ? exceptions.filter((e) => e.active)
        : exceptions;

    const activeCount = exceptions.filter((e) => e.active).length;

    return (
        <Card className="bg-seguranca-black/50 border-gray-700">
            <CardHeader className="py-3 px-4 border-b border-gray-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <CardTitle className="text-base font-bold text-red-400 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        Relatório de Exceções — Pneus Recapados no Eixo Dianteiro
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Auditoria completa de veículos com exceção operacional autorizada mediante senha de gestor e Termo de Ciência de Risco.
                    </p>
                </div>

                <div className="flex gap-1.5 bg-seguranca-black p-1 rounded-lg border border-gray-700">
                    <Button
                        size="sm"
                        variant={showActiveOnly ? 'default' : 'ghost'}
                        className={`h-7 px-3 text-xs ${showActiveOnly ? 'bg-red-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setShowActiveOnly(true)}
                    >
                        Rodando Agora ({activeCount})
                    </Button>
                    <Button
                        size="sm"
                        variant={!showActiveOnly ? 'default' : 'ghost'}
                        className={`h-7 px-3 text-xs ${!showActiveOnly ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setShowActiveOnly(false)}
                    >
                        Histórico Completo ({exceptions.length})
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="border border-gray-700 rounded-xl overflow-x-auto bg-seguranca-black">
                    <Table>
                        <TableHeader className="bg-seguranca-graphite">
                            <TableRow className="border-gray-700">
                                <TableHead className="text-xs font-bold text-white">STATUS</TableHead>
                                <TableHead className="text-xs font-bold text-white">VEÍCULO / FROTA</TableHead>
                                <TableHead className="text-xs font-bold text-white">POSIÇÃO</TableHead>
                                <TableHead className="text-xs font-bold text-white">PNEU (FOGO / SÉRIE)</TableHead>
                                <TableHead className="text-xs font-bold text-white">RECAPAGEM</TableHead>
                                <TableHead className="text-xs font-bold text-right text-white">KM MONTAGEM</TableHead>
                                <TableHead className="text-xs font-bold text-white">GESTOR AUTORIZADOR</TableHead>
                                <TableHead className="text-xs font-bold text-white">DATA / HORA</TableHead>
                                <TableHead className="text-xs font-bold text-white">ALERTAS DISPARADOS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleExceptions.length > 0 ? (
                                visibleExceptions.map((ex) => (
                                    <TableRow key={ex.id} className="border-gray-800 hover:bg-seguranca-graphite/40 text-xs">
                                        <TableCell>
                                            {ex.active ? (
                                                <Badge className="bg-red-950/80 text-red-300 border border-red-500/70 text-[10px]">
                                                    Em Operação
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-800 text-gray-300 border border-gray-600 text-[10px]">
                                                    Encerrada
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-white">
                                            {ex.vehicleFleetNumber ? `Frota ${ex.vehicleFleetNumber}` : ex.vehiclePlate}
                                            {ex.vehicleFleetNumber && ex.vehiclePlate && (
                                                <span className="block text-[10px] text-gray-400 font-normal">{ex.vehiclePlate}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-red-300">
                                            Eixo 1 ({ex.positionCode || 'DE/DD'})
                                        </TableCell>
                                        <TableCell className="font-mono text-seguranca-yellow">
                                            {ex.tireFireNumber || ex.tireSerialNumber}
                                            {ex.tireFireNumber && ex.tireSerialNumber && (
                                                <span className="block text-[10px] text-gray-400">Série: {ex.tireSerialNumber}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-amber-950/60 text-amber-300 border border-amber-500/50 text-[10px]">
                                                {ex.recapCount}ª Recapagem
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-gray-200">
                                            {(ex.vehicleKmAtMount || 0).toLocaleString()} km
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-white">{ex.authorizedByName}</div>
                                            <span className="text-[10px] text-gray-400">{ex.authorizedByRole}</span>
                                            {ex.riskAcknowledged && (
                                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                                                    <CheckCircle2 size={10} /> Termo assinado
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-300">
                                            {new Date(ex.approvedAt).toLocaleString('pt-BR')}
                                            {ex.clearedAt && (
                                                <span className="block text-[10px] text-gray-500">
                                                    Removido: {new Date(ex.clearedAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className={`flex items-center gap-1 text-[10px] ${ex.messageSent ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    <MessageSquare size={10} /> {ex.messageSent ? 'Mensagens/Push OK' : 'Sem mensagem'}
                                                </span>
                                                <span className={`flex items-center gap-1 text-[10px] ${ex.emailSent ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    <Mail size={10} /> {ex.emailSent ? 'E-mail OK' : 'SMTP pendente/off'}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-gray-400 text-xs">
                                        {showActiveOnly
                                            ? 'Nenhum veículo rodando atualmente com pneu recapado no eixo dianteiro.'
                                            : 'Nenhuma exceção registrada no histórico.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

