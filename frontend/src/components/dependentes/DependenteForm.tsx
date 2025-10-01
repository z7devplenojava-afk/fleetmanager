import React, { useState, useEffect } from 'react';
import { Dependent, CreateDependentDTO, UpdateDependentDTO, RELATIONSHIP_TYPES } from '@/types/dependent';
import { dependentService } from '@/services/dependentService';

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
  const [formData, setFormData] = useState<CreateDependentDTO | UpdateDependentDTO>({
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
        await dependentService.createDependent(formData as CreateDependentDTO);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">
        {dependent ? 'Editar Dependente' : 'Adicionar Dependente'}
      </h2>
      
      {errors.form && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.form}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome Completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
            Parentesco *
          </label>
          <select
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.relationship ? 'border-red-500' : ''}`}
          >
            <option value="">Selecione...</option>
            {Object.entries(RELATIONSHIP_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.relationship && <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>}
        </div>
        
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Data de Nascimento *
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.birthDate ? 'border-red-500' : ''}`}
          />
          {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
        </div>
        
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
            CPF *
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleCpfChange}
            maxLength={14}
            placeholder="000.000.000-00"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.cpf ? 'border-red-500' : ''}`}
          />
          {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
        </div>
        
        <div>
          <label htmlFor="rg" className="block text-sm font-medium text-gray-700">
            RG
          </label>
          <input
            type="text"
            id="rg"
            name="rg"
            value={formData.rg || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : dependent ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
};

export default DependenteForm;