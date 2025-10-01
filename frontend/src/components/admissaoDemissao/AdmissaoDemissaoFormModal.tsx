import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdmissaoDemissaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const mockFuncionarios = [
  { id: '1', name: 'João da Silva' },
  { id: '2', name: 'Maria Oliveira' },
  { id: '3', name: 'Carlos Souza' },
];

const mockPostos = [
  { id: '1', name: 'Portaria Central' },
  { id: '2', name: 'Recepção Prédio A' },
  { id: '3', name: 'Guarita Sul' },
];

const mockEmpresas = [
  { id: '1', name: 'Empresa Alpha' },
  { id: '2', name: 'Empresa Beta' },
];
const mockUnidades = [
  { id: '1', name: 'Unidade Centro' },
  { id: '2', name: 'Unidade Norte' },
];

const AdmissaoDemissaoFormModal: React.FC<AdmissaoDemissaoFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    tipo: 'admissao',
    funcionario: '',
    data: '',
    solicitante: '',
    empresa: '',
    unidade: '',
    posto: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (isOpen) {
      setForm({ tipo: 'admissao', funcionario: '', data: '', solicitante: '', empresa: '', unidade: '', posto: '', motivo: '' });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.tipo) errs.tipo = 'Selecione o tipo.';
    if (!form.funcionario) errs.funcionario = 'Selecione o funcionário.';
    if (!form.data) errs.data = 'Informe a data.';
    if (!form.solicitante.trim()) errs.solicitante = 'Informe o solicitante.';
    if (!form.empresa) errs.empresa = 'Selecione a empresa.';
    if (!form.unidade) errs.unidade = 'Selecione a unidade.';
    if (!form.posto) errs.posto = 'Selecione o posto de trabalho.';
    if (!form.motivo.trim()) errs.motivo = 'Informe o motivo.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess(form);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-seguranca-graphite text-seguranca-lightgray rounded-lg shadow-xl w-full max-w-2xl relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Nova Solicitação de Admissão/Demissão</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                className={`w-full rounded bg-seguranca-black text-seguranca-lightgray border-gray-600 p-2 ${errors.tipo ? 'border-red-500' : ''}`}
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              >
                <option value="admissao">Admissão</option>
                <option value="demissao">Demissão</option>
              </select>
              {errors.tipo && <span className="text-xs text-red-500">{errors.tipo}</span>}
            </div>
            {/* Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="funcionario">Funcionário *</Label>
              <select
                id="funcionario"
                className={`w-full rounded bg-seguranca-black text-seguranca-lightgray border-gray-600 p-2 ${errors.funcionario ? 'border-red-500' : ''}`}
                value={form.funcionario}
                onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {mockFuncionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              {errors.funcionario && <span className="text-xs text-red-500">{errors.funcionario}</span>}
            </div>
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className={`bg-seguranca-black text-seguranca-lightgray border-gray-600 ${errors.data ? 'border-red-500' : ''}`}
              />
              {errors.data && <span className="text-xs text-red-500">{errors.data}</span>}
            </div>
            {/* Solicitante */}
            <div className="space-y-2">
              <Label htmlFor="solicitante">Solicitante *</Label>
              <Input
                id="solicitante"
                type="text"
                value={form.solicitante}
                onChange={e => setForm(f => ({ ...f, solicitante: e.target.value }))}
                className={`bg-seguranca-black text-seguranca-lightgray border-gray-600 ${errors.solicitante ? 'border-red-500' : ''}`}
                placeholder="Nome do solicitante"
              />
              {errors.solicitante && <span className="text-xs text-red-500">{errors.solicitante}</span>}
            </div>
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <select
                id="empresa"
                className={`w-full rounded bg-seguranca-black text-seguranca-lightgray border-gray-600 p-2 ${errors.empresa ? 'border-red-500' : ''}`}
                value={form.empresa}
                onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
              >
                <option value="">Selecione a empresa...</option>
                {mockEmpresas.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {errors.empresa && <span className="text-xs text-red-500">{errors.empresa}</span>}
            </div>
            {/* Unidade */}
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <select
                id="unidade"
                className={`w-full rounded bg-seguranca-black text-seguranca-lightgray border-gray-600 p-2 ${errors.unidade ? 'border-red-500' : ''}`}
                value={form.unidade}
                onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
              >
                <option value="">Selecione a unidade...</option>
                {mockUnidades.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.unidade && <span className="text-xs text-red-500">{errors.unidade}</span>}
            </div>
            {/* Posto de Trabalho Atual */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="posto">Posto de Trabalho Atual *</Label>
              <select
                id="posto"
                className={`w-full rounded bg-seguranca-black text-seguranca-lightgray border-gray-600 p-2 ${errors.posto ? 'border-red-500' : ''}`}
                value={form.posto}
                onChange={e => setForm(f => ({ ...f, posto: e.target.value }))}
              >
                <option value="">Selecione o posto...</option>
                {mockPostos.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.posto && <span className="text-xs text-red-500">{errors.posto}</span>}
            </div>
            {/* Motivo */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Textarea
                id="motivo"
                value={form.motivo}
                onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                rows={3}
                className={`bg-seguranca-black text-seguranca-lightgray border-gray-600 ${errors.motivo ? 'border-red-500' : ''}`}
                placeholder="Descreva o motivo da solicitação..."
              />
              {errors.motivo && <span className="text-xs text-red-500">{errors.motivo}</span>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissaoDemissaoFormModal; 