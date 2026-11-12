import React from 'react';
import { ShieldAlert, Lock, CheckSquare, MailCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface FrontAxleSecurityApprovalBoxProps {
    recapCount: number;
    approverUsernameOrEmail: string;
    onChangeApproverUsernameOrEmail: (val: string) => void;
    approverPassword: string;
    onChangeApproverPassword: (val: string) => void;
    riskTermAccepted: boolean;
    onChangeRiskTermAccepted: (val: boolean) => void;
}

export const FrontAxleSecurityApprovalBox: React.FC<FrontAxleSecurityApprovalBoxProps> = ({
    recapCount,
    approverUsernameOrEmail,
    onChangeApproverUsernameOrEmail,
    approverPassword,
    onChangeApproverPassword,
    riskTermAccepted,
    onChangeRiskTermAccepted,
}) => {
    return (
        <div className="rounded-xl border-2 border-red-500/80 bg-red-950/40 p-4 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                        Regra Crítica de Segurança — Eixo Dianteiro (Direcional)
                    </h4>
                    <p className="text-xs text-red-100/90 leading-relaxed">
                        Este pneu possui <strong>{recapCount}ª Recapagem</strong>. A legislação e as boas práticas de segurança determinam que o eixo dianteiro de ônibus utilize <strong>pneus novos</strong>. Alocar pneu recapado nesta posição não é recomendado e compromete diretamente a segurança dos passageiros e a dirigibilidade do veículo.
                    </p>
                </div>
            </div>

            <div className="border-t border-red-500/30 pt-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Alçada de Aprovação Obrigatória (Gestor de Manutenção / Administrador)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-gray-200">Usuário ou E-mail do Gestor Autorizador *</Label>
                        <Input
                            value={approverUsernameOrEmail}
                            onChange={(e) => onChangeApproverUsernameOrEmail(e.target.value)}
                            placeholder="Login ou e-mail do gestor"
                            className="bg-seguranca-black/90 border-red-500/40 text-xs text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-gray-200">Senha de Liberação do Gestor *</Label>
                        <Input
                            type="password"
                            value={approverPassword}
                            onChange={(e) => onChangeApproverPassword(e.target.value)}
                            placeholder="Digite a senha para liberar"
                            autoComplete="new-password"
                            className="bg-seguranca-black/90 border-red-500/40 text-xs text-white"
                        />
                    </div>
                </div>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-seguranca-black/60 border border-red-500/40 cursor-pointer select-none">
                    <Checkbox
                        checked={riskTermAccepted}
                        onCheckedChange={(checked) => onChangeRiskTermAccepted(Boolean(checked))}
                        className="mt-0.5 border-red-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <span className="text-xs text-gray-100 leading-snug">
                        <strong className="text-red-300 flex items-center gap-1 mb-0.5">
                            <CheckSquare className="h-3.5 w-3.5" /> Termo de Ciência de Risco Operacional
                        </strong>
                        Declaro que estou ciente dos riscos operacionais, de segurança e de dirigibilidade ao autorizar a montagem deste pneu recapado no eixo dianteiro e assumo responsabilidade pela liberação para auditoria.
                    </span>
                </label>

                <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1.5 rounded-lg">
                    <MailCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                        Ao confirmar, será registrado no <strong>Relatório de Exceções</strong> e disparado alerta automático (E-mail + Gestão de Mensagens) para Diretoria, Operações, Encarregado de Transportes e Manutenção.
                    </span>
                </div>
            </div>
        </div>
    );
};

