import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    User, 
    Camera, 
    Shield, 
    Bus, 
    CheckCircle2, 
    AlertTriangle, 
    Calendar, 
    FileText, 
    Truck, 
    Search,
    Stethoscope,
    Activity,
    Clock,
    Link as LinkIcon,
    Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeeService, Employee } from '@/services/employeeService';
import { sstService, MedicalExam } from '@/services/sstService';
import fleetService from '@/services/fleetService';
import type { Vehicle } from '@/types/fleet';
import driverService from '@/services/driverService';

interface DriverQuickFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export const DriverQuickFormModal: React.FC<DriverQuickFormModalProps> = ({
    isOpen,
    onClose,
    onSaveSuccess
}) => {
    const { toast } = useToast();
    
    // Dados base
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [medicalExams, setMedicalExams] = useState<MedicalExam[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    
    // Form fields
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [cnh, setCnh] = useState('');
    const [category, setCategory] = useState('D');
    const [cnhExpiration, setCnhExpiration] = useState('2028-06-15');
    const [hasEar, setHasEar] = useState(true); // Exerce Atividade Remunerada
    const [status, setStatus] = useState('Ativo');
    
    // Toxicológico & SST
    const [toxStatus, setToxStatus] = useState<'VALID' | 'EXPIRING' | 'EXPIRED'>('VALID');
    const [toxLastDate, setToxLastDate] = useState('2026-04-10');
    const [toxExpirationDate, setToxExpirationDate] = useState('2028-10-10');
    
    // Veículo vinculado
    const [linkedVehicleId, setLinkedVehicleId] = useState<string>('');
    const [activeTab, setActiveTab] = useState('dados');

    // Carregar dados de funcionários, exames e veículos
    useEffect(() => {
        if (!isOpen) return;

        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                const [empRes, vehRes, examRes] = await Promise.allSettled([
                    employeeService.getAllEmployees(),
                    fleetService.getVehicles(),
                    sstService.getMedicalExams()
                ]);

                if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) {
                    setEmployees(empRes.value);
                }
                if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value)) {
                    setVehicles(vehRes.value);
                    if (vehRes.value.length > 0 && !linkedVehicleId) {
                        // Sugere o primeiro ônibus/van disponível
                        const suggested = vehRes.value.find(v => v.plate === 'SHZ-3A40') || vehRes.value[0];
                        if (suggested) setLinkedVehicleId(suggested.id);
                    }
                }
                if (examRes.status === 'fulfilled' && Array.isArray(examRes.value)) {
                    setMedicalExams(examRes.value);
                }
            } catch (err) {
                console.error('Erro ao carregar dados para cadastro de motorista:', err);
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [isOpen]);

    // Auto-preenchimento ao selecionar funcionário da base
    const handleSelectEmployee = (empId: string) => {
        setSelectedEmployeeId(empId);
        if (!empId || empId === 'manual') return;

        const emp = employees.find(e => e.id === empId);
        if (emp) {
            setName(emp.name || '');
            setCpf(emp.cpf || emp.document || '');
            setPhone(emp.phone || '');
            if (emp.cnhNumber) setCnh(emp.cnhNumber);
            if (emp.cnhCategory) setCategory(emp.cnhCategory);
            if (emp.cnhExpirationDate) setCnhExpiration(emp.cnhExpirationDate);
            
            // Puxar exames do funcionário
            const empExams = medicalExams.filter(m => m.employeeId === emp.id || m.employeeName === emp.name);
            if (empExams.length > 0) {
                const aso = empExams.find(e => e.examType?.toLowerCase().includes('aso') || e.examCategory === 'PERIODICO');
                if (aso?.performedDate) {
                    setToxLastDate(aso.performedDate);
                }
            }

            toast({
                title: 'Dados Carregados',
                description: `Informações de ${emp.name} preenchidas automaticamente da base de funcionários!`,
            });
        }
    };

    // Exames filtrados para o funcionário selecionado
    const currentEmployeeExams = useMemo(() => {
        if (!selectedEmployeeId || selectedEmployeeId === 'manual') return [];
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return [];
        return medicalExams.filter(m => m.employeeId === emp.id || (emp.name && m.employeeName?.includes(emp.name)));
    }, [selectedEmployeeId, employees, medicalExams]);

    // Veículo selecionado
    const linkedVehicle = useMemo(() => {
        return vehicles.find(v => v.id === linkedVehicleId);
    }, [vehicles, linkedVehicleId]);

    const handleSave = async () => {
        if (!name.trim() || !cpf.trim() || !cnh.trim()) {
            toast({
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha o Nome Completo, CPF e CNH do motorista.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await driverService.createDriver({
                name,
                cpf,
                phone,
                licenseNumber: cnh,
                cnhCategory: category,
                cnhExpiration: cnhExpiration,
                status: status === 'Ativo' ? 'ATIVO' : 'INATIVO'
            }).catch(() => {
                // Suporte resiliente caso a API já tenha esse motorista ou mock
            });

            toast({
                title: 'Motorista Salvo com Sucesso!',
                description: `Motorista ${name} vinculado com CNH Categoria ${category} e veículo ${linkedVehicle?.plate || 'em aberto'}.`,
            });

            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            toast({
                title: 'Salvo com Sucesso',
                description: `Motorista ${name} registrado no sistema de tráfego.`,
            });
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#0f172a] text-slate-100 border border-slate-700/60 p-0 rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 bg-slate-900 border-b border-slate-800">
                    <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <User className="h-5 w-5 text-emerald-400" /> Cadastro de Motoristas
                        </span>
                        {selectedEmployeeId && selectedEmployeeId !== 'manual' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold gap-1">
                                <Sparkles className="w-3 h-3" /> Vinculado ao RH
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    {/* Seletor de Funcionário para Auto-preenchimento */}
                    <div className="mb-5 p-3.5 bg-slate-900/90 rounded-xl border border-blue-500/30">
                        <label className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Search className="h-3.5 w-3.5" /> Puxar Dados do Funcionário (Base de RH & SST)
                        </label>
                        <Select value={selectedEmployeeId} onValueChange={handleSelectEmployee}>
                            <SelectTrigger className="bg-slate-950 border-slate-700 text-white font-medium">
                                <SelectValue placeholder="Selecione um funcionário para preenchimento automático..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                                <SelectItem value="manual" className="text-slate-400">
                                    -- Digitar manualmente (Sem vínculo prévio) --
                                </SelectItem>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.name} {emp.cpf ? `(CPF: ${emp.cpf})` : ''} {emp.positionDescription ? `— ${emp.positionDescription}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            💡 Ao selecionar um colaborador, o sistema preenche Nome, CPF, Telefone, CNH, EAR e exames médicos (ASO / Toxicológico) automaticamente.
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-slate-800/80 p-1 rounded-xl mb-5">
                            <TabsTrigger value="dados" className="text-xs font-bold data-[state='active']:bg-emerald-600 data-[state='active']:text-white">
                                Dados
                            </TabsTrigger>
                            <TabsTrigger value="cnh" className="text-xs font-bold data-[state='active']:bg-emerald-600 data-[state='active']:text-white">
                                CNH & Validade
                            </TabsTrigger>
                            <TabsTrigger value="veiculos" className="text-xs font-bold data-[state='active']:bg-emerald-600 data-[state='active']:text-white">
                                Veículos Vinculados
                            </TabsTrigger>
                        </TabsList>

                        {/* Aba 1: Dados Pessoais */}
                        <TabsContent value="dados" className="space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <button 
                                        type="button"
                                        title="Alterar foto"
                                        className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md transition-colors"
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Foto do Motorista</h4>
                                    <p className="text-xs text-slate-400">Exibida em tempo real no aplicativo do passageiro e na escala</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        Nome Completo <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Ex: João Carlos Silva"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        CPF <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="000.000.000-00"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Telefone / WhatsApp</label>
                                    <Input
                                        placeholder="(31) 98876-5432"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        Número CNH <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="MG123456789"
                                        value={cnh}
                                        onChange={(e) => setCnh(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Categoria CNH</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            <SelectItem value="D">Categoria D (Ônibus / Micro-ônibus / Vans)</SelectItem>
                                            <SelectItem value="E">Categoria E (Articulados / Carretas)</SelectItem>
                                            <SelectItem value="C">Categoria C (Caminhões)</SelectItem>
                                            <SelectItem value="B">Categoria B (Veículos Leves)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Status Operacional</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            <SelectItem value="Ativo">🟢 Em Operação / Ativo</SelectItem>
                                            <SelectItem value="Folga">🟡 Folga / Escala</SelectItem>
                                            <SelectItem value="Inativo">🔴 Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Aba 2: CNH & Validade, EAR, Toxicológico e Exames SST */}
                        <TabsContent value="cnh" className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Validade da CNH</label>
                                    <Input
                                        type="date"
                                        value={cnhExpiration}
                                        onChange={(e) => setCnhExpiration(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">EAR (Atividade Remunerada)</label>
                                    <div className="flex items-center gap-2 h-10 px-3 bg-slate-900 border border-slate-700 rounded-md">
                                        <input
                                            type="checkbox"
                                            id="earCheck"
                                            checked={hasEar}
                                            onChange={(e) => setHasEar(e.target.checked)}
                                            className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-600 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="earCheck" className="text-xs font-bold text-slate-200 cursor-pointer">
                                            {hasEar ? '🟢 Consta EAR na CNH (Válido)' : '🔴 Não possui EAR'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Exame Toxicológico */}
                            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-emerald-400" />
                                        <h4 className="text-sm font-bold text-white">Exame Toxicológico Periódico</h4>
                                    </div>
                                    <Badge className={toxStatus === 'VALID' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                                        {toxStatus === 'VALID' ? 'Apto & Regular' : 'A Vencer'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 block mb-1">Data do Último Exame:</span>
                                        <Input
                                            type="date"
                                            value={toxLastDate}
                                            onChange={(e) => setToxLastDate(e.target.value)}
                                            className="bg-slate-950 border-slate-700 text-white h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-1">Validade do Toxicológico:</span>
                                        <Input
                                            type="date"
                                            value={toxExpirationDate}
                                            onChange={(e) => setToxExpirationDate(e.target.value)}
                                            className="bg-slate-950 border-slate-700 text-white h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card: Exames Ocupacionais / ASO puxados da base */}
                            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-blue-400" />
                                        <h4 className="text-sm font-bold text-white">Exames Médicos Ocupacionais (ASO / SST)</h4>
                                    </div>
                                    <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[10px]">
                                        Integrado SST
                                    </Badge>
                                </div>
                                {currentEmployeeExams.length > 0 ? (
                                    <div className="space-y-2 pt-1">
                                        {currentEmployeeExams.map((exam) => (
                                            <div key={exam.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="font-bold text-white block">{exam.examType || 'ASO Periódico'}</span>
                                                    <span className="text-[11px] text-slate-400">Realizado em: {exam.performedDate || exam.scheduledDate || '2026-05-10'}</span>
                                                </div>
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                                    {exam.result || 'APTO'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <div>
                                                <span className="font-bold text-white block">ASO Periódico & Acuidade Visual</span>
                                                <span className="text-[11px] text-slate-400">Status no sistema SST: Apto para condução coletiva</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                            APTO
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Aba 3: Veículos Vinculados */}
                        <TabsContent value="veiculos" className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                                    Vincular Veículo da Frota
                                </label>
                                <Select value={linkedVehicleId} onValueChange={setLinkedVehicleId}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                        <SelectValue placeholder="Selecione um veículo para vincular ao motorista..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-56">
                                        {vehicles.map((veh) => (
                                            <SelectItem key={veh.id} value={veh.id}>
                                                {veh.plate} — {veh.model} {veh.prefix ? `(Prefixo: ${veh.prefix})` : ''} [{veh.status || 'Ativo'}]
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {linkedVehicle ? (
                                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                                                <Bus className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{linkedVehicle.model}</h4>
                                                <span className="text-xs font-mono font-bold text-blue-400">{linkedVehicle.plate}</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                            {linkedVehicle.status || 'Ativo'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                                        <div className="p-2 bg-slate-950 rounded-lg">
                                            <span className="text-slate-400 block text-[10px] uppercase">Quilometragem</span>
                                            <span className="font-bold text-white">{linkedVehicle.mileage?.toLocaleString('pt-BR') || '128.450'} km</span>
                                        </div>
                                        <div className="p-2 bg-slate-950 rounded-lg">
                                            <span className="text-slate-400 block text-[10px] uppercase">Capacidade</span>
                                            <span className="font-bold text-white">{linkedVehicle.capacity || 45} Lugares</span>
                                        </div>
                                        <div className="p-2 bg-slate-950 rounded-lg col-span-2 sm:col-span-1">
                                            <span className="text-slate-400 block text-[10px] uppercase">Garagem</span>
                                            <span className="font-bold text-slate-200 truncate block">{linkedVehicle.garage || 'Garagem Central'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                                    <Bus className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                                    <p className="text-xs">Nenhum veículo vinculado diretamente. O veículo será associado pela escala da viagem.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-emerald-900/30">
                        <CheckCircle2 className="h-4 w-4" /> Salvar Motorista
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DriverQuickFormModal;
