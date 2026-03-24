import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { CompanyFormModal } from '@/components/comercial/CompanyFormModal';
import { CompanyViewModal } from '@/components/comercial/CompanyViewModal';
import { companyService } from '@/services/companyService';
import { useEffect } from 'react';
import { Company } from '@/types/company';

const Empresas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<Company | null>(null);

  const load = async () => {
    try {
      const list = await companyService.getAllCompanies();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatCnpj = (value?: string) => {
    if (!value) return '-';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 14) {
      return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  return (
    <StandardLayout title="Empresas" subtitle="Cadastre os dados da empresa para contratos e integrações.">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div />
          <Button className="bg-seguranca-red hover:bg-seguranca-darkred" onClick={() => setOpen(true)}>
            <Plus className="mr-2" size={18} /> Nova Empresa
          </Button>
        </div>

        <Card className="bg-seguranca-graphite border-gray-600 p-6 text-seguranca-lightgray">
          {items.length === 0 ? (
            <p>Nenhuma empresa cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">CNPJ</th>
                    <th className="py-2 pr-4">Sigla</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-b border-gray-800">
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4">{formatCnpj(c.cnpj)}</td>
                      <td className="py-2 pr-4">{(c.sigla || '-').toString().toUpperCase()}</td>
                      <td className="py-2 pr-4">{(c.status || '-').toString().toUpperCase()}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setViewing(c as Company); setViewOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={async () => { await companyService.deleteCompany(c.id); await load(); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <CompanyFormModal
          open={open}
          onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
          onSuccess={async () => { await load(); }}
          initialData={editing}
        />
        <CompanyViewModal
          open={viewOpen}
          onOpenChange={(o) => { setViewOpen(o); if (!o) setViewing(null); }}
          company={viewing}
        />
      </div>
    </StandardLayout>
  );
};

export default Empresas;