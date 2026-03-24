import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash, Settings } from 'lucide-react';
import { emailConfigService, EmailConfig, EmailContextType } from '../../../services/emailConfigService';
import { useNavigate } from 'react-router-dom';

const EmailConfigList: React.FC = () => {
    const [configs, setConfigs] = useState<EmailConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await emailConfigService.getAll();
            setConfigs(data);
        } catch (error) {
            console.error('Failed to load configs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta configuração?')) {
            try {
                await emailConfigService.delete(id);
                loadConfigs();
            } catch (error) {
                console.error('Failed to delete', error);
                alert('Erro ao excluir configuração');
            }
        }
    };

    const getContextBadge = (type: EmailContextType) => {
        switch (type) {
            case EmailContextType.GLOBAL:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Global</span>;
            case EmailContextType.COMPANY:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Empresa</span>;
            case EmailContextType.DEPARTMENT:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Departamento</span>;
            default:
                return type;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Settings className="w-8 h-8 text-slate-700" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Configurações de E-mail</h1>
                        <p className="text-slate-500">Gerencie contas SMTP para envio de notificações</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/email/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Nova Configuração
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-slate-600">Contexto</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Remetente</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">SMTP Host</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Nenhuma configuração encontrada.
                                    </td>
                                </tr>
                            ) : (
                                configs.map((config) => (
                                    <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="p-4">
                                            {getContextBadge(config.contextType)}
                                            {config.contextId && <span className="ml-2 text-xs text-slate-400">({config.contextId})</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{config.senderName}</div>
                                            <div className="text-sm text-slate-500">{config.senderEmail}</div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {config.smtpHost}:{config.smtpPort}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {config.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/email/edit/${config.id}`)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(config.id!)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Excluir"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmailConfigList;
