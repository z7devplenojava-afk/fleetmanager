import { Employee } from '@/types/employee';

export type AsoSituation = 'VALIDO' | 'VENCIDO' | 'PENDENTE';

export type EmployeeReportFilters = {
  status: string[]; // Employee.status values
  aso: AsoSituation[];
  laudo: AsoSituation[];
  ferias: string; // 'all' | 'on' | 'off'
  empresas: string[];
  setores: string[];
  cargos: string[];
  genero: string; // 'all' | value
  hireStart: string;
  hireEnd: string;
  termStart: string;
  termEnd: string;
  motivoDemissao: string; // 'all' | afastamentoMotivo value
};

export const emptyEmployeeReportFilters = (): EmployeeReportFilters => ({
  status: [],
  aso: [],
  laudo: [],
  ferias: 'all',
  empresas: [],
  setores: [],
  cargos: [],
  genero: 'all',
  hireStart: '',
  hireEnd: '',
  termStart: '',
  termEnd: '',
  motivoDemissao: 'all',
});

export const getEmployeeTerminationDate = (employee: Employee): string | undefined =>
  employee.terminationDate || employee.dataRescisao || undefined;

export const getAsoSituation = (employee: Employee, today = new Date()): AsoSituation => {
  if (!employee.nextExameMedico) return 'PENDENTE';
  const d = new Date(`${employee.nextExameMedico.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(d.getTime())) return 'PENDENTE';
  return d.getTime() >= today.getTime() ? 'VALIDO' : 'VENCIDO';
};

export const getLaudoSituation = (employee: Employee, today = new Date()): AsoSituation => {
  if (!employee.nextLaudoPsicologico) return 'PENDENTE';
  const d = new Date(`${employee.nextLaudoPsicologico.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(d.getTime())) return 'PENDENTE';
  return d.getTime() >= today.getTime() ? 'VALIDO' : 'VENCIDO';
};

export const getEmployeeGender = (employee: Employee): string =>
  (employee.gender || employee.sexo || '').trim();

export const getEmployeeCompany = (employee: Employee): string =>
  (employee.company?.name || employee.empresaNome || '').trim();

export const getEmployeeSector = (employee: Employee): string =>
  (employee.department?.name || employee.unit?.name || '').trim();

export const getEmployeePosition = (employee: Employee): string =>
  (employee.position?.name || employee.positionDescription || '').trim();

export const filterEmployeesForReport = (
  employees: Employee[],
  filters: EmployeeReportFilters
): Employee[] => {
  const today = new Date();
  return employees.filter(employee => {
    if (filters.status.length && (!employee.status || !filters.status.includes(employee.status))) {
      return false;
    }

    if (filters.aso.length && !filters.aso.includes(getAsoSituation(employee, today))) {
      return false;
    }

    if (filters.laudo.length && !filters.laudo.includes(getLaudoSituation(employee, today))) {
      return false;
    }

    if (filters.ferias === 'on' && employee.status !== 'VACATION') return false;
    if (filters.ferias === 'off' && employee.status === 'VACATION') return false;

    if (filters.empresas.length) {
      const company = getEmployeeCompany(employee);
      if (!company || !filters.empresas.includes(company)) return false;
    }

    if (filters.setores.length) {
      const sector = getEmployeeSector(employee);
      if (!sector || !filters.setores.includes(sector)) return false;
    }

    if (filters.cargos.length) {
      const position = getEmployeePosition(employee);
      if (!position || !filters.cargos.includes(position)) return false;
    }

    if (filters.genero !== 'all') {
      if (getEmployeeGender(employee) !== filters.genero) return false;
    }

    const hireDate = employee.hireDate || '';
    const terminationDate = getEmployeeTerminationDate(employee) || '';
    if (filters.hireStart && (!hireDate || hireDate < filters.hireStart)) return false;
    if (filters.hireEnd && (!hireDate || hireDate > filters.hireEnd)) return false;
    if (filters.termStart && (!terminationDate || terminationDate < filters.termStart)) return false;
    if (filters.termEnd && (!terminationDate || terminationDate > filters.termEnd)) return false;

    if (filters.motivoDemissao !== 'all') {
      const motivo = (employee.afastamentoMotivo || '').trim();
      if (!motivo || motivo !== filters.motivoDemissao) return false;
    }

    return true;
  });
};

export type ReportColumnKey =
  | 'nome'
  | 'matricula'
  | 'cargo'
  | 'setor'
  | 'empresa'
  | 'status'
  | 'statusAnterior'
  | 'cpf'
  | 'rg'
  | 'dataNasc'
  | 'admissao'
  | 'dataRescisao'
  | 'motivoDemissao'
  | 'email'
  | 'telefone'
  | 'genero'
  | 'estadoCivil'
  | 'salario'
  | 'ctps'
  | 'pis'
  | 'cbo'
  | 'matriculaEsocial'
  | 'cnh'
  | 'categoriaCnh'
  | 'validadeCnh'
  | 'proximoAsol'
  | 'dataLaudo'
  | 'vencLaudo'
  | 'resultadoLaudo'
  | 'vencFerias'
  | 'endereco'
  | 'nacionalidade'
  | 'nomeMae'
  | 'nomePai'
  | 'escala';

export type EmployeeReportColumnDef = {
  key: ReportColumnKey;
  label: string;
  value: (employee: Employee) => string | number;
};

export type EmployeeReportOrganization = {
  sortBy: 'nome' | 'admissao' | 'rescisao' | 'cargo' | 'status';
  sortDir: 'asc' | 'desc';
  groupBy: 'nenhum' | 'setor' | 'empresa' | 'cargo' | 'status';
};

export const emptyEmployeeReportOrganization = (): EmployeeReportOrganization => ({
  sortBy: 'nome',
  sortDir: 'asc',
  groupBy: 'nenhum',
});

const formatDateBR = (value?: string) => {
  if (!value) return '';
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
};

const formatAddress = (employee: Employee): string => {
  const addr = employee.address;
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.street, addr.number, addr.complement, addr.neighborhood, addr.city, addr.state, addr.zipCode]
    .filter(Boolean)
    .join(', ');
};

export const EMPLOYEE_REPORT_COLUMNS: EmployeeReportColumnDef[] = [
  { key: 'nome', label: 'Nome', value: e => e.name || '' },
  { key: 'matricula', label: 'Matrícula', value: e => e.registrationNumber || '' },
  { key: 'cargo', label: 'Cargo', value: e => getEmployeePosition(e) },
  { key: 'setor', label: 'Setor de Trabalho', value: e => getEmployeeSector(e) },
  { key: 'empresa', label: 'Empresa', value: e => getEmployeeCompany(e) },
  { key: 'status', label: 'Status', value: e => e.status || '' },
  { key: 'statusAnterior', label: 'Status/Vínculo Anterior', value: e => e.notes || '' },
  { key: 'cpf', label: 'CPF', value: e => e.cpf || e.document || '' },
  { key: 'rg', label: 'RG', value: e => e.rg || '' },
  { key: 'dataNasc', label: 'Data Nasc.', value: e => formatDateBR(e.birthDate) },
  { key: 'admissao', label: 'Admissão', value: e => formatDateBR(e.hireDate) },
  { key: 'dataRescisao', label: 'Data Rescisão', value: e => formatDateBR(getEmployeeTerminationDate(e)) },
  { key: 'motivoDemissao', label: 'Motivo Demissão', value: e => e.afastamentoMotivo || '' },
  { key: 'email', label: 'E-mail', value: e => e.email || '' },
  { key: 'telefone', label: 'Telefone', value: e => e.phone || '' },
  { key: 'genero', label: 'Gênero', value: e => getEmployeeGender(e) },
  { key: 'estadoCivil', label: 'Estado Civil', value: e => e.maritalStatus || '' },
  { key: 'salario', label: 'Salário', value: e => e.salario ?? '' },
  { key: 'ctps', label: 'CTPS', value: e => e.ctps || '' },
  { key: 'pis', label: 'PIS', value: e => e.pis || '' },
  { key: 'cbo', label: 'CBO', value: e => e.cbo || '' },
  { key: 'matriculaEsocial', label: 'Matr. eSocial', value: e => e.matriculaEsocial || '' },
  { key: 'cnh', label: 'CNH', value: e => e.cnhNumber || '' },
  { key: 'categoriaCnh', label: 'Categ. CNH', value: e => e.cnhCategory || '' },
  { key: 'validadeCnh', label: 'Validade CNH', value: e => formatDateBR(e.cnhExpirationDate) },
  { key: 'proximoAsol', label: 'Próx. ASO', value: e => formatDateBR(e.nextExameMedico) },
  { key: 'dataLaudo', label: 'Data Laudo Psicológico', value: e => formatDateBR(e.laudoPsicologicoData) },
  { key: 'vencLaudo', label: 'Venc. Laudo Psicológico', value: e => formatDateBR(e.nextLaudoPsicologico) },
  { key: 'resultadoLaudo', label: 'Res. Laudo Psicológico', value: e => e.laudoPsicologicoData ? 'Registrado' : '' },
  { key: 'vencFerias', label: 'Venc. Férias', value: e => '' },
  { key: 'endereco', label: 'Endereço', value: e => formatAddress(e) },
  { key: 'nacionalidade', label: 'Nacionalidade', value: e => e.nationality || '' },
  { key: 'nomeMae', label: 'Nome Mãe', value: e => e.nomeMae || e.mae || '' },
  { key: 'nomePai', label: 'Nome Pai', value: e => e.nomePai || e.pai || '' },
  { key: 'escala', label: 'Escala', value: e => e.escalaTrabalho || e.diasTrabalho || '' },
];

export const DEFAULT_REPORT_COLUMNS: ReportColumnKey[] = [
  'nome',
  'matricula',
  'cargo',
  'setor',
  'empresa',
  'status',
];

export const ALL_REPORT_COLUMNS: ReportColumnKey[] = EMPLOYEE_REPORT_COLUMNS.map(c => c.key);

export const sortEmployeesForReport = (
  employees: Employee[],
  org: EmployeeReportOrganization
): Employee[] => {
  const dir = org.sortDir === 'desc' ? -1 : 1;
  return [...employees].sort((a, b) => {
    let cmp = 0;
    switch (org.sortBy) {
      case 'admissao':
        cmp = (a.hireDate || '').localeCompare(b.hireDate || '');
        break;
      case 'rescisao':
        cmp = (getEmployeeTerminationDate(a) || '').localeCompare(getEmployeeTerminationDate(b) || '');
        break;
      case 'cargo':
        cmp = getEmployeePosition(a).localeCompare(getEmployeePosition(b), 'pt-BR');
        break;
      case 'status':
        cmp = (a.status || '').localeCompare(b.status || '');
        break;
      case 'nome':
      default:
        cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
    }
    if (cmp === 0) cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
    return cmp * dir;
  });
};

export const buildEmployeeReportRows = (
  employees: Employee[],
  selectedKeys: ReportColumnKey[] = DEFAULT_REPORT_COLUMNS,
  organization?: EmployeeReportOrganization
): Array<Record<string, string | number>> => {
  const columns = EMPLOYEE_REPORT_COLUMNS.filter(c => selectedKeys.includes(c.key));
  if (!columns.length) return [];
  const sorted = organization ? sortEmployeesForReport(employees, organization) : employees;
  return sorted.map(emp => {
    const row: Record<string, string | number> = {};
    columns.forEach(col => {
      row[col.label] = col.value(emp);
    });
    return row;
  });
};

export const countActiveReportFilters = (filters: EmployeeReportFilters): number => {
  let n = 0;
  if (filters.status.length) n++;
  if (filters.aso.length) n++;
  if (filters.laudo.length) n++;
  if (filters.ferias !== 'all') n++;
  if (filters.empresas.length) n++;
  if (filters.setores.length) n++;
  if (filters.cargos.length) n++;
  if (filters.genero !== 'all') n++;
  if (filters.hireStart || filters.hireEnd) n++;
  if (filters.termStart || filters.termEnd) n++;
  if (filters.motivoDemissao !== 'all') n++;
  return n;
};
