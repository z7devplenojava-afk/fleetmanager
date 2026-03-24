import React, { useState, useEffect } from 'react';
import { Dependent, DependentCreateRequest, DependentUpdateRequest, RELATIONSHIP_OPTIONS } from '@/types/dependent';
import dependentService from '@/services/dependentService';

interface DependenteFormProps {
  employeeId: string;
  dependent?: Dependent;
  onSuccess: () => void;
  onCancel: () => void;
}

const DependenteForm: React.FC<DependenteFormProps> = ({
  employeeId,
  dependent,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<DependentCreateRequest | DependentUpdateRequest>({
    employeeId,
    name: '',
    relationship: '',
    birthDate: '',
    cpf: '',
    rg: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dependent) {
      setFormData({
        id: dependent.id,
        employeeId: dependent.employee.id,
        name: dependent.name,
        relationship: dependent.relationship,
        birthDate: dependent.birthDate,
        cpf: dependent.cpf,
        rg: dependent.rg
      });
    }
  }, [dependent]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.relationship?.trim()) {
      newErrors.relationship = 'Parentesco é obrigatório';
    }
    
    if (!formData.cpf?.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf.replace(/[^0-9]/g, ''))) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando o campo é preenchido
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if ('id' in formData) {
        // Atualizar dependente existente
        await dependentService.updateDependent(formData.id, formData);
      } else {
        // Criar novo dependente
        await dependentService.createDependent(formData as DependentCreateRequest);
      }
      
      onSuccess();
    } catch (error: any) {
      if (error.message.includes('CPF já cadastrado')) {
        setErrors(prev => ({
          ...prev,
          cpf: 'CPF já cadastrado para outro dependente'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          form: error.message || 'Erro ao salvar dependente'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData(prev => ({
      ...prev,
      cpf: formattedCpf
    }));
    
    if (errors.cpf) {
      setErrors(prev => ({
        ...prev,
        cpf: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 text-red-400 rounded-lg">
          <p className="font-semibold">{errors.form}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2.5">
          <label htmlFor="name" className="block text-sm font-bold text-white flex items-center gap-2">
            <span>Nome Completo</span>
            <span className="text-red-500 text-lg">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite o nome completo do dependente"
            className={`block w-full h-12 px-4 rounded-lg bg-white text-gray-900 border-2 ${errors.name ? 'border-red-500' : 'border-gray-400'} shadow-md transition-all text-base font-semibold placeholder:text-gray-700 placeholder:font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-400 font-medium">{errors.name}</p>}
        </div>
        
        <div className="space-y-2.5">
          <label htmlFor="relationship" className="block text-sm font-bold text-white flex items-center gap-2">
            <span>Parentesco</span>
            <span className="text-red-500 text-lg">*</span>
          </label>
          <select
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            className={`block w-full h-12 px-4 rounded-lg bg-white border-2 ${errors.relationship ? 'border-red-500' : 'border-gray-400'} shadow-md transition-all text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600 ${formData.relationship ? 'text-gray-900' : 'text-gray-700'}`}
          >
            <option value="" className="text-gray-700 font-semibold">Selecione o parentesco...</option>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          {errors.relationship && <p className="mt-1 text-sm text-red-400 font-medium">{errors.relationship}</p>}
        </div>
        
        <div className="space-y-2.5">
          <label htmlFor="birthDate" className="block text-sm font-bold text-white flex items-center gap-2">
            <span>Data de Nascimento</span>
            <span className="text-red-500 text-lg">*</span>
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={`block w-full h-12 px-4 rounded-lg bg-white text-gray-900 border-2 ${errors.birthDate ? 'border-red-500' : 'border-gray-400'} shadow-md transition-all text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600`}
          />
          {errors.birthDate && <p className="mt-1 text-sm text-red-400 font-medium">{errors.birthDate}</p>}
        </div>
        
        <div className="space-y-2.5">
          <label htmlFor="cpf" className="block text-sm font-bold text-white flex items-center gap-2">
            <span>CPF</span>
            <span className="text-red-500 text-lg">*</span>
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleCpfChange}
            maxLength={14}
            placeholder="000.000.000-00"
            className={`block w-full h-12 px-4 rounded-lg bg-white text-gray-900 border-2 ${errors.cpf ? 'border-red-500' : 'border-gray-400'} shadow-md transition-all text-base font-semibold placeholder:text-gray-700 placeholder:font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600`}
          />
          {errors.cpf && <p className="mt-1 text-sm text-red-400 font-medium">{errors.cpf}</p>}
        </div>
        
        <div className="space-y-2.5">
          <label htmlFor="rg" className="block text-sm font-bold text-white">
            RG
          </label>
          <input
            type="text"
            id="rg"
            name="rg"
            value={formData.rg || ''}
            onChange={handleChange}
            placeholder="Digite o número do RG"
            className="block w-full h-12 px-4 rounded-lg bg-white text-gray-900 border-2 border-gray-400 shadow-md transition-all text-base font-semibold placeholder:text-gray-700 placeholder:font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 h-11 border-2 border-gray-600 rounded-lg text-sm font-semibold text-gray-300 bg-transparent hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 h-11 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 transition-all focus:outline-none focus:ring-2 focus:ring-seguranca-red disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : dependent ? 'Atualizar Dependente' : 'Adicionar Dependente'}
        </button>
      </div>
    </form>
  );
};

export default DependenteForm;