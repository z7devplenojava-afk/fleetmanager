import React, { useEffect, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Mail, CheckCircle2, RotateCcw, XCircle, FileText as FilePdfIcon } from 'lucide-react';
import { unitService, type Unit } from '@/services/unitService';
import { employeeService } from '@/services/employeeService';
import { payrollService, type Payroll } from '@/services/payrollService';

const PayrollPage: React.FC = () => {
  const [items, setItems] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState<string>('');
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [totalNet, setTotalNet] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await payrollService.getPayrolls({ referenceMonth, unitId: unitId || undefined, employeeId: employeeId || undefined });
      const filtered = query
        ? data.filter(p => (p.employee?.name || '').toLowerCase().includes(query.toLowerCase()))
        : data;
      setItems(filtered);
      const sum = filtered.reduce((acc, p) => acc + (p.netSalary || 0), 0);
      setTotalNet(sum);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceMonth, unitId, employeeId]);

  useEffect(() => {
    // carregar comboboxes
    unitService.getAllUnits().then(setUnits).catch(() => setUnits([]));
    employeeService.getAllEmployees?.().then((arr: any[]) => {
      setEmployees(arr.map(e => ({ id: e.id, name: e.name })));
    }).catch(() => setEmployees([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: string) => {
    await payrollService.approvePayroll(id);
    await load();
  };

  const handleMarkPaid = async (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    await payrollService.markAsPaid(id, today);
    await load();
  };

  const handleCancel = async (id: string) => {
    await payrollService.cancelPayroll(id);
    await load();
  };

  const handleReopen = async (id: string) => {
    await fetch(`/api/payrolls/${id}/reopen`, { method: 'PUT' });
    await load();
  };

  const handleDownload = async (id: string) => {
    const blob = await payrollService.downloadPayroll(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holerite_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmail = async (id: string) => {
    await payrollService.sendPayrollByEmail(id, '');
  };

  const handleExportCsv = async () => {
    const res = await fetch(`/api/payrolls/report${referenceMonth ? `?referenceMonth=${referenceMonth}` : ''}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folha_${referenceMonth || 'todas'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Folha de Pagamento</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="AAAA-MM"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="w-32"
              />
              <select className="border rounded px-2 py-2" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                <option value="">Todas as Unidades</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <select className="border rounded px-2 py-2" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Todos os Funcionários</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <Input
                placeholder="Buscar funcionário"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-56"
              />
              <Button variant="secondary" onClick={handleExportCsv} title="Exportar CSV">
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const params = new URLSearchParams();
                  if (referenceMonth) params.append('referenceMonth', referenceMonth);
                  if (unitId) params.append('unitId', unitId);
                  if (employeeId) params.append('employeeId', employeeId);
                  const res = await fetch(`/api/reports/payroll/pdf?${params.toString()}`);
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `relatorio-folha-${referenceMonth || 'periodo'}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                title="Gerar PDF"
              >
                <FilePdfIcon className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Input
                placeholder="email da contabilidade"
                value={(window as any).__accEmail || ''}
                onChange={(e) => { (window as any).__accEmail = e.target.value; }}
                className="w-64"
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  const params = new URLSearchParams();
                  const to = (window as any).__accEmail;
                  if (to) params.append('to', to);
                  if (referenceMonth) params.append('referenceMonth', referenceMonth);
                  if (unitId) params.append('unitId', unitId);
                  if (employeeId) params.append('employeeId', employeeId);
                  await fetch(`/api/reports/payroll/send-email?${params.toString()}`, { method: 'POST' });
                }}
                title="Enviar para Contabilidade"
              >
                <Mail className="mr-2 h-4 w-4" /> Enviar Contabilidade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground flex items-center gap-6">
              <div>Total de itens: <strong>{items.length}</strong></div>
              <div>Total líquido {referenceMonth || ''}: <strong>{totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            </div>
            {loading ? (
              <div>Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th>Funcionário</th>
                      <th>Competência</th>
                      <th>Bruto</th>
                      <th>Líquido</th>
                      <th>Status</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td>{p.employee?.name}</td>
                        <td>{p.referenceMonth}</td>
                        <td>{p.grossSalary?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>{p.netSalary?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>{p.status}</td>
                        <td className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleApprove(p.id)} title="Aprovar">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(p.id)} title="Marcar como Pago">
                            R$
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(p.id)} title="Cancelar">
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReopen(p.id)} title="Reabrir">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(p.id)} title="Baixar Holerite">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSendEmail(p.id)} title="Enviar por Email">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default PayrollPage;


