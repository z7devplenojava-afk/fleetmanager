import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Briefcase,
  CreditCard,
  Building,
  UserCircle,
  Shield,
  FileCheck,
  CheckCircle2,
  Clock,
  Car,
  Landmark,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface EmployeeProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  position?: string;
  department?: string;
  admissionDate?: string;
  registrationNumber?: string;
  status?: string;
  workPost?: string;
  workShift?: string;
  salary?: number;
  bank?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpirationDate?: string;
}

export const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee-portal/profile');
      if (response.data) {
        setProfile(response.data);
      } else {
        // Fallback básico se não houver funcionário vinculado
        setProfile({
          id: user?.id || '1',
          name: user?.name || 'Colaborador',
          email: user?.email || '',
          position: (user as any)?.role || 'Colaborador',
          department: 'Operações'
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Aviso',
        description: 'Dados parciais carregados do usuário ativo.',
      });
      setProfile({
        id: user?.id || '1',
        name: user?.name || 'Colaborador',
        email: user?.email || '',
        position: (user as any)?.role || 'Colaborador',
        department: 'Operações'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const calculateServiceTime = (admissionDate?: string) => {
    if (!admissionDate) return null;
    try {
      const adm = new Date(admissionDate);
      const now = new Date();
      let months = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth());
      if (months < 0) months = 0;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (years > 0) {
        return `${years} ano${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` e ${remainingMonths} m` : ''}`;
      }
      return `${months} mês${months !== 1 ? 'es' : ''}`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Carregando dados cadastrais da base de funcionários...</p>
      </div>
    );
  }

  const serviceTime = calculateServiceTime(profile?.admissionDate);

  return (
    <div className="space-y-6">
      {/* Banner de Identificação do Colaborador */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-primary/20 p-6 border border-border shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'CO'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">{profile?.name}</h2>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                  ATIVO
                </Badge>
              </div>
              <p className="text-sm text-slate-300 font-medium mt-0.5">
                {profile?.position || 'Cargo não definido'} • {profile?.department || 'Departamento Geral'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                {profile?.registrationNumber && (
                  <span className="font-mono bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60 text-slate-200">
                    Matrícula: {profile.registrationNumber}
                  </span>
                )}
                {serviceTime && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="h-3.5 w-3.5" /> Tempo de Empresa: {serviceTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">Viação São Silvestre LTDA</span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
              <BadgeCheck className="h-3.5 w-3.5" /> Cadastro Integrado RH
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Dados Pessoais & Documentos */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Documentos & Dados Pessoais
            </CardTitle>
            <CardDescription className="text-xs">
              Documentação civil e qualificação cadastrada na empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">CPF:</span>
                <span className="font-mono font-bold text-foreground text-sm">{profile?.cpf || 'Não cadastrado'}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">RG / Identidade:</span>
                <span className="font-mono font-bold text-foreground text-sm">{profile?.rg || 'Não cadastrado'}</span>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-muted-foreground block text-[11px]">Data de Nascimento:</span>
              <span className="font-bold text-foreground">{formatDate(profile?.birthDate)}</span>
            </div>

            {/* CNH se aplicável */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Car className="h-4 w-4" /> Carteira Nacional de Habilitação (CNH)
                </span>
                {profile?.cnhCategory && (
                  <Badge className="bg-blue-600 text-white font-bold text-[11px]">
                    Cat. {profile.cnhCategory}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nº do Registro:</span>
                  <span className="font-mono font-bold text-foreground">{profile?.cnhNumber || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Validade:</span>
                  <span className="font-mono font-bold text-foreground">{formatDate(profile?.cnhExpirationDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Vínculo Empregatício */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Vínculo Empregatício & Contrato
            </CardTitle>
            <CardDescription className="text-xs">
              Informações do contrato de trabalho e alocação operacional
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Data de Admissão:</span>
                <span className="font-bold text-foreground text-sm">{formatDate(profile?.admissionDate)}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Matrícula Funcional:</span>
                <span className="font-mono font-bold text-primary text-sm">{profile?.registrationNumber || 'VSS-001'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Cargo / Função:</span>
                <span className="font-bold text-foreground">{profile?.position || 'Motorista'}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Departamento:</span>
                <span className="font-bold text-foreground">{profile?.department || 'Operacional'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Posto de Trabalho:</span>
                <span className="font-bold text-foreground">{profile?.workPost || 'Garagem Central / Linha'}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Horário / Escala:</span>
                <span className="font-bold text-foreground">{profile?.workShift || 'Turno Integral (44h sem)'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Dados Bancários para Pagamento */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Dados Bancários & Pagamento
            </CardTitle>
            <CardDescription className="text-xs">
              Conta de crédito de salários, adiantamentos e benefícios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 col-span-2">
                <span className="text-muted-foreground block text-[11px]">Instituição Financeira:</span>
                <span className="font-bold text-foreground text-sm">{profile?.bank || 'Banco Itaú / Santander'}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Agência:</span>
                <span className="font-mono font-bold text-foreground text-sm">{profile?.bankAgency || '0001'}</span>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-muted-foreground block text-[11px]">Conta Salário / Corrente:</span>
              <span className="font-mono font-bold text-foreground">{profile?.bankAccount || 'Conta Cadastrada no RH'}</span>
            </div>

            {profile?.pixKey && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-emerald-400 block text-[11px] font-bold">Chave PIX Cadastrada:</span>
                <span className="font-mono font-bold text-foreground">{profile.pixKey}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Contatos & Endereço Residencial */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Contato & Endereço Residencial
            </CardTitle>
            <CardDescription className="text-xs">
              Informações para notificações e correspondências oficiais
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">E-mail Corporativo:</span>
                <span className="font-bold text-foreground truncate block">{profile?.email}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Telefone Principal:</span>
                <span className="font-bold text-foreground">{profile?.phone || 'Não informado'}</span>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
              <span className="text-muted-foreground block text-[11px]">Endereço Completo:</span>
              <span className="font-medium text-foreground block">
                {profile?.address 
                  ? `${profile.address}${profile.city ? ` - ${profile.city}` : ''}${profile.state ? `/${profile.state}` : ''}${profile.zipCode ? ` - CEP: ${profile.zipCode}` : ''}`
                  : 'Endereço registrado na ficha de registro do empregado.'}
              </span>
            </div>

            {profile?.emergencyPhone && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-amber-400 block text-[11px] font-bold">Contato de Emergência:</span>
                <span className="font-bold text-foreground">{profile.emergencyPhone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeProfile;
