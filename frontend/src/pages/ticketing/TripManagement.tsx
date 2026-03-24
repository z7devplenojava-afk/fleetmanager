import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Calendar, MapPin, Tag, Bus, Clock } from 'lucide-react';
import ticketingService, { RegularTrip, SeatTemplate } from '@/services/ticketingService';
import { routeService, Route } from '@/services/routeService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TripManagement: React.FC = () => {
    const { user, empresa } = useAuth();
    const { toast } = useToast();

    const [trips, setTrips] = useState<RegularTrip[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [templates, setTemplates] = useState<SeatTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        routeId: '',
        seatTemplateId: '',
        tripCode: '',
        departureTime: '',
        basePrice: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allRoutes, allTemplates] = await Promise.all([
                routeService.findAllRoutes(),
                ticketingService.getTemplates(empresa?.id || '')
            ]);
            setRoutes(allRoutes);
            setTemplates(allTemplates);
        } catch (error) {
            toast({ title: "Erro ao buscar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTrip = async () => {
        if (!formData.routeId || !formData.seatTemplateId || !formData.departureTime) {
            toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
            return;
        }

        if (!empresa?.id) {
            toast({
                title: "Contexto de empresa necessário",
                description: "Como Super Admin, você deve selecionar uma empresa antes de programar viagens.",
                variant: "destructive"
            });
            return;
        }

        try {
            await (ticketingService as any).saveTrip({
                ...formData,
                companyId: empresa.id
            });
            toast({ title: "Viagem criada com sucesso!" });
            setIsModalOpen(false);
            // reload trips (mocking for now since we don't have a list endpoint yet but search)
        } catch (error) {
            toast({ title: "Erro ao criar viagem", variant: "destructive" });
        }
    };

    return (
        <StandardLayout title="Gestão de Viagens Individuais" subtitle="Programe viagens para venda de passagens">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-seguranca-lightgray" size={18} />
                            <Input placeholder="Buscar por código..." className="pl-10 bg-seguranca-graphite border-seguranca-graphite w-72" />
                        </div>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500">
                        <Plus size={18} className="mr-2" /> Nova Viagem
                    </Button>
                </div>

                <Card className="bg-seguranca-graphite border-seguranca-graphite">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-seguranca-black">
                                    <TableHead className="text-seguranca-lightgray">Código</TableHead>
                                    <TableHead className="text-seguranca-lightgray">Rota</TableHead>
                                    <TableHead className="text-seguranca-lightgray">Partida</TableHead>
                                    <TableHead className="text-seguranca-lightgray">Template</TableHead>
                                    <TableHead className="text-seguranca-lightgray">Preço</TableHead>
                                    <TableHead className="text-seguranca-lightgray">Status</TableHead>
                                    <TableHead className="text-right text-seguranca-lightgray">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-seguranca-lightgray italic">
                                            Nenhuma viagem programada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    trips.map(trip => (
                                        <TableRow key={trip.id} className="border-seguranca-black hover:bg-seguranca-black/20">
                                            <TableCell className="font-bold">{trip.tripCode}</TableCell>
                                            <TableCell>{trip.seatTemplate?.name}</TableCell>
                                            <TableCell>{format(new Date(trip.departureTime), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell>{trip.seatTemplate?.name}</TableCell>
                                            <TableCell>R$ {trip.basePrice.toFixed(2)}</TableCell>
                                            <TableCell>{trip.status}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-seguranca-graphite border-seguranca-graphite text-white max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Programar Nova Viagem</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes abaixo para criar uma nova viagem configurada para venda de passagens.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Código da Viagem</Label>
                                <Input
                                    placeholder="Ex: RT-1001"
                                    value={formData.tripCode}
                                    onChange={e => setFormData({ ...formData, tripCode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rota</Label>
                                <Select onValueChange={id => setFormData({ ...formData, routeId: id })}>
                                    <SelectTrigger className="bg-seguranca-black">
                                        <SelectValue placeholder="Selecione a rota" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-seguranca-black">
                                        {routes.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Template de Poltronas</Label>
                                <Select onValueChange={id => setFormData({ ...formData, seatTemplateId: id })}>
                                    <SelectTrigger className="bg-seguranca-black">
                                        <SelectValue placeholder="Selecione o mapa de assentos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-seguranca-black">
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id!}>{t.name} ({t.vehicleType})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data/Hora Partida</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.departureTime}
                                        onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Preço Base (R$)</Label>
                                    <Input
                                        type="number"
                                        value={formData.basePrice}
                                        onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreateTrip} className="w-full bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 mt-4">
                                Criar Viagem
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </StandardLayout>
    );
};

export default TripManagement;
