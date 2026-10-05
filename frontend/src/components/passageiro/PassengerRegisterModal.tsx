import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    User, 
    ShieldCheck, 
    Phone, 
    Mail, 
    CreditCard, 
    Bus, 
    MapPin, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft,
    Lock,
    FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface PassengerProfile {
    id: string;
    name: string;
    cpf: string;
    phone: string;
    email: string;
    type: string;
    preferredLine: string;
    address?: string;
    lgpdAcceptedAt: string;
}

interface PassengerRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (profile: PassengerProfile) => void;
    initialData?: Partial<PassengerProfile>;
}

export const PassengerRegisterModal: React.FC<PassengerRegisterModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData
}) => {
    const { toast } = useToast();
    const [step, setStep] = useState<'lgpd' | 'form'>('lgpd');
    const [lgpdAccepted, setLgpdAccepted] = useState(true);

    const [name, setName] = useState(initialData?.name || '');
    const [cpf, setCpf] = useState(initialData?.cpf || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [type, setType] = useState(initialData?.type || 'Comum');
    const [preferredLine, setPreferredLine] = useState(initialData?.preferredLine || 'Rosa - Serra Verde');
    const [address, setAddress] = useState(initialData?.address || 'Rua das Flores, 123 - Centro');

    // Máscara de CPF simples
    const handleCpfChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 11);
        if (cleaned.length <= 3) setCpf(cleaned);
        else if (cleaned.length <= 6) setCpf(`${cleaned.slice(0, 3)}.${cleaned.slice(3)}`);
        else if (cleaned.length <= 9) setCpf(`${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`);
        else setCpf(`${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`);
    };

    // Máscara de Telefone
    const handlePhoneChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 11);
        if (cleaned.length <= 2) setPhone(cleaned);
        else if (cleaned.length <= 7) setPhone(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`);
        else setPhone(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`);
    };

    const handleSave = () => {
        if (!lgpdAccepted) {
            toast({
                title: 'Termos LGPD Obrigatórios',
                description: 'Você precisa aceitar os termos de consentimento para prosseguir com o cadastro.',
                variant: 'destructive',
            });
            return;
        }

        if (!name.trim() || !cpf.trim() || !phone.trim() || !email.trim()) {
            toast({
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha Nome Completo, CPF, WhatsApp e E-mail.',
                variant: 'destructive',
            });
            return;
        }

        const profile: PassengerProfile = {
            id: `pass_${Date.now()}`,
            name: name.trim(),
            cpf: cpf.trim(),
            phone: phone.trim(),
            email: email.trim(),
            type,
            preferredLine,
            address,
            lgpdAcceptedAt: new Date().toISOString()
        };

        // Salvar perfil no localStorage para persistência do app do passageiro
        try {
            localStorage.setItem('passenger_profile', JSON.stringify(profile));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }

        toast({
            title: 'Cadastro Concluído!',
            description: `Seja bem-vindo(a), ${profile.name.split(' ')[0]}! Seu bilhete digital já está ativo.`,
        });

        onSuccess(profile);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#0b1329] text-slate-100 border border-slate-700/70 p-0 rounded-3xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-5 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800">
                    <DialogTitle className="text-base font-black text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Bus className="h-5 w-5 text-blue-400" />
                            {step === 'lgpd' ? 'Consentimento & Privacidade' : 'Cadastro do Passageiro'}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/40">
                            {step === 'lgpd' ? 'Passo 1 de 2' : 'Passo 2 de 2'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-5 space-y-4">
                    {/* Passo 1: LGPD */}
                    {step === 'lgpd' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-500/30 flex items-start gap-3">
                                <ShieldCheck className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white">Privacidade e Proteção de Dados (LGPD)</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Em cumprimento à Lei Federal nº 13.709/2018 (LGPD), a Viação São Silvestre solicita seus dados para garantir seu embarque seguro e comunicação operacional.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5 text-xs text-slate-300 max-h-48 overflow-y-auto">
                                <p className="font-bold text-slate-200">Finalidade do Tratamento:</p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                                    <li>Identificação nos pontos de embarque e no validador QR Code do ônibus.</li>
                                    <li>Notificações em tempo real sobre partidas, atrasos e previsão de chegada.</li>
                                    <li>Controle de lotação e segurança dos passageiros e colaboradores.</li>
                                    <li>Seus dados são criptografados e não são compartilhados com terceiros para fins comerciais.</li>
                                </ul>
                            </div>

                            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    id="lgpdConsent"
                                    checked={lgpdAccepted}
                                    onChange={(e) => setLgpdAccepted(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 text-blue-600 rounded bg-slate-800 border-slate-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="lgpdConsent" className="text-xs text-slate-200 font-medium cursor-pointer leading-tight">
                                    Declaro que li e concordo com o tratamento dos meus dados pessoais (Nome, CPF, WhatsApp e E-mail) para uso do transporte.
                                </label>
                            </div>

                            <Button 
                                onClick={() => setStep('form')}
                                disabled={!lgpdAccepted}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl gap-2 shadow-lg shadow-blue-900/30 text-sm"
                            >
                                Avançar para o Cadastro <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Passo 2: Formulário de Dados */}
                    {step === 'form' && (
                        <div className="space-y-3.5">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Nome Completo <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Ex: Maria Aparecida Souza"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-9 bg-slate-900 border-slate-700 text-white text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        CPF <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            placeholder="000.000.000-00"
                                            value={cpf}
                                            onChange={(e) => handleCpfChange(e.target.value)}
                                            className="pl-9 bg-slate-900 border-slate-700 text-white text-xs h-10 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">
                                        WhatsApp / Celular <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            placeholder="(31) 98765-4321"
                                            value={phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            className="pl-9 bg-slate-900 border-slate-700 text-white text-xs h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    E-mail <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="email"
                                        placeholder="maria.souza@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 bg-slate-900 border-slate-700 text-white text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Tipo de Passageiro</label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white text-xs">
                                            <SelectItem value="Comum">Comum / Geral</SelectItem>
                                            <SelectItem value="Estudante">Estudante (Meia-tarifa)</SelectItem>
                                            <SelectItem value="Colaborador">Colaborador / Empresa</SelectItem>
                                            <SelectItem value="Preferencial">Preferencial (60+)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Linha Principal</label>
                                    <Select value={preferredLine} onValueChange={setPreferredLine}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white text-xs">
                                            <SelectItem value="Verde - Farofa">Verde - Farofa</SelectItem>
                                            <SelectItem value="Azul - Belo Vale">Azul - Belo Vale</SelectItem>
                                            <SelectItem value="Rosa - Serra Verde">Rosa - Serra Verde</SelectItem>
                                            <SelectItem value="Amarela - FHEMIG">Amarela - FHEMIG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Endereço / Ponto Habitual</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Ex: Rua das Flores, 123 - Belo Horizonte"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="pl-9 bg-slate-900 border-slate-700 text-white text-xs h-10"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setStep('lgpd')} 
                                    className="border-slate-700 text-slate-400 hover:text-white text-xs h-10"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar
                                </Button>
                                <Button 
                                    onClick={handleSave} 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 gap-1.5 shadow-lg shadow-emerald-900/30"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Concluir & Acessar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PassengerRegisterModal;
