import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, FileSpreadsheet, History, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PassengerQuickFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export const PassengerQuickFormModal: React.FC<PassengerQuickFormModalProps> = ({
    isOpen,
    onClose,
    onSaveSuccess
}) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [type, setType] = useState('Estudante');
    const [status, setStatus] = useState('Ativo');
    const [activeTab, setActiveTab] = useState('dados');

    const handleSave = () => {
        if (!name.trim() || !cpf.trim()) {
            toast({
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha o Nome Completo e CPF do passageiro.',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Passageiro Cadastrado',
            description: `${name} foi adicionado à base com sucesso!`,
        });

        setName('');
        setCpf('');
        setPhone('');
        setAddress('');
        if (onSaveSuccess) onSaveSuccess();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl bg-[#0f172a] text-slate-100 border border-slate-700/60 p-0 rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 bg-slate-900 border-b border-slate-800">
                    <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-400" /> Cadastro de Passageiros
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-slate-800/80 p-1 rounded-xl mb-6">
                            <TabsTrigger value="dados" className="text-xs font-bold data-[state='active']:bg-blue-600 data-[state='active']:text-white">
                                Dados
                            </TabsTrigger>
                            <TabsTrigger value="historico" className="text-xs font-bold data-[state='active']:bg-blue-600 data-[state='active']:text-white">
                                Histórico
                            </TabsTrigger>
                            <TabsTrigger value="importar" className="text-xs font-bold data-[state='active']:bg-blue-600 data-[state='active']:text-white">
                                Importar Planilha
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dados" className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        Nome Completo <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Maria Aparecida Souza"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        CPF <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="123.456.789-00"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Telefone</label>
                                    <Input
                                        placeholder="(31) 98765-4321"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Endereço</label>
                                    <Input
                                        placeholder="Rua das Flores, 123 - BH/MG"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Tipo</label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            <SelectItem value="Estudante">Estudante</SelectItem>
                                            <SelectItem value="CLT">CLT / Colaborador</SelectItem>
                                            <SelectItem value="Terceiro">Terceirizado</SelectItem>
                                            <SelectItem value="Avulso">Passageiro Avulso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            <SelectItem value="Ativo">🟢 Ativo</SelectItem>
                                            <SelectItem value="Inativo">🔴 Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="historico" className="space-y-3 py-4 text-center">
                            <History className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Nenhum histórico de viagens registrado para novo passageiro.</p>
                        </TabsContent>

                        <TabsContent value="importar" className="space-y-4 py-4 text-center">
                            <div className="border-2 border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer">
                                <FileSpreadsheet className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-200">Arraste ou selecione a planilha de passageiros (.XLSX ou .CSV)</p>
                                <p className="text-xs text-slate-500 mt-1">Colunas sugeridas: Nome, CPF, Telefone, Linha, Ponto</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Salvar Passageiro
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PassengerQuickFormModal;
