import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { employeeService, CreateEmployeeRequest } from '@/services/employeeService';

const initialState: CreateEmployeeRequest = {
  name: '',
  cpf: '',
  rg: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  maritalStatus: 'SINGLE',
  nationality: 'Brasileiro',
  registrationNumber: '',
  hireDate: '',
  status: 'ACTIVE',
  positionId: '',
  unitId: '',
  userId: '',
};

const FuncionarioNovo: React.FC = () => {
  const [form, setForm] = useState<CreateEmployeeRequest>(initialState);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await employeeService.createEmployee(form);
      setSuccess(true);
      setForm(initialState);
      setPhotoPreview(null);
    } catch (err) {
      setError('Erro ao cadastrar funcionário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandardLayout title="Novo Funcionário">
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Cadastrar Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Foto 3x4</label>
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
              {photoPreview && <img src={photoPreview} alt="Prévia" className="mt-2 w-24 h-24 rounded object-cover border" />}
            </div>
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">CPF</label>
                <Input name="cpf" value={form.cpf} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">RG</label>
                <Input name="rg" value={form.rg} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Telefone</label>
                <Input name="phone" value={form.phone} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Endereço</label>
              <Input name="address" value={form.address} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Data de Nascimento</label>
                <Input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Data de Admissão</label>
                <Input name="hireDate" type="date" value={form.hireDate} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Estado Civil</label>
                <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="w-full bg-seguranca-black border-gray-600 rounded px-3 py-2 text-seguranca-lightgray" required>
                  <option value="SINGLE">Solteiro</option>
                  <option value="MARRIED">Casado</option>
                  <option value="DIVORCED">Divorciado</option>
                  <option value="WIDOWED">Viúvo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Nacionalidade</label>
                <Input name="nationality" value={form.nationality} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Número de Registro</label>
                <Input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full bg-seguranca-black border-gray-600 rounded px-3 py-2 text-seguranca-lightgray" required>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="VACATION">Férias</option>
                  <option value="TERMINATED">Demitido</option>
                </select>
              </div>
            </div>
            {/* Dados bancários e documentos podem ser implementados aqui */}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Funcionário cadastrado com sucesso!</div>}
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </form>
        </CardContent>
      </Card>
    </StandardLayout>
  );
};

export default FuncionarioNovo; 