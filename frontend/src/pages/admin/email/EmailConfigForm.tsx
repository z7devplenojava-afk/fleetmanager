import React, { useEffect, useState } from 'react';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { emailConfigService, EmailConfig, EmailContextType } from '../../../services/emailConfigService';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

const EmailConfigForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmailConfig>({
        defaultValues: {
            contextType: EmailContextType.GLOBAL,
            isActive: true,
            smtpPort: 587,
            properties: { auth: true, starttls: true }
        }
    });

    const contextType = watch('contextType');

    useEffect(() => {
        if (id) {
            loadConfig(id);
        }
    }, [id]);

    const loadConfig = async (configId: string) => {
        try {
            setLoading(true);
            const data = await emailConfigService.getById(configId);
            // Reset form with data needed? React Hook Form reset() is better but setValue works too
            Object.keys(data).forEach(key => {
                setValue(key as any, (data as any)[key]);
            });
            // Password usually comes encrypted or empty, we might want to clear it if it's strictly write-only for security UI
            setValue('smtpPassword', '');
        } catch (error) {
            console.error('Failed to load config', error);
            alert('Erro ao carregar configuração');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: EmailConfig) => {
        try {
            setLoading(true);
            if (id) {
                await emailConfigService.update(id, data);
            } else {
                await emailConfigService.create(data);
            }
            navigate('/admin/email');
        } catch (error) {
            console.error('Failed to save', error);
            alert('Erro ao salvar configuração');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/admin/email')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar para lista
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-800">
                        {id ? 'Editar Configuração SMTP' : 'Nova Configuração SMTP'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

                    {/* Context Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contexto</label>
                            <select
                                {...register('contextType')}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value={EmailContextType.GLOBAL}>Global (Padrão do Sistema)</option>
                                <option value={EmailContextType.COMPANY}>Por Empresa</option>
                                <option value={EmailContextType.DEPARTMENT}>Por Departamento</option>
                            </select>
                        </div>

                        {contextType !== EmailContextType.GLOBAL && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ID do Contexto (Empresa/Depto)</label>
                                <input
                                    type="text"
                                    {...register('contextId')}
                                    placeholder={contextType === EmailContextType.COMPANY ? "UUID da Empresa" : "UUID do Departamento"}
                                    className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Cole o ID da Empresa ou Departamento aqui.</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* Sender Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Remetente</label>
                            <input
                                type="text"
                                {...register('senderName', { required: 'Nome é obrigatório' })}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Ex: RH Empresa X"
                            />
                            {errors.senderName && <span className="text-xs text-red-500">{errors.senderName.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail do Remetente (From)</label>
                            <input
                                type="email"
                                {...register('senderEmail', { required: 'E-mail é obrigatório' })}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Ex: rh@empresa.com.br"
                            />
                            {errors.senderEmail && <span className="text-xs text-red-500">{errors.senderEmail.message}</span>}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* SMTP Config */}
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Servidor SMTP</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Host SMTP</label>
                            <input
                                type="text"
                                {...register('smtpHost', { required: 'Host é obrigatório' })}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Ex: smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Porta</label>
                            <input
                                type="number"
                                {...register('smtpPort', { required: 'Porta é obrigatória' })}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="587"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário SMTP</label>
                            <input
                                type="text"
                                {...register('smtpUsername')}
                                className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha SMTP</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('smtpPassword')}
                                    className="w-full text-zinc-800 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
                                    placeholder={id ? "Deixe em branco para não alterar" : ""}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {id && <p className="text-xs text-amber-600 mt-1">Preencha apenas se quiser alterar a senha.</p>}
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('isActive')}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Ativo</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/email')}
                            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                            Salvar Configuração
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailConfigForm;
