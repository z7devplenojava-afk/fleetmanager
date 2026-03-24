import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalExam, CreateMedicalExamDTO, sstService } from '@/services/sstService';
import { Loader2, User, Stethoscope, Calendar, FileText, Building2, Search } from 'lucide-react';
import { employeeService, SimpleEmployee } from '@/services/employeeService';
import { doctorService } from '@/services/doctorService';
import { useDebounce } from '@/hooks/use-debounce';

interface MedicalExamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: MedicalExam | null;
  onSubmit: (data: CreateMedicalExamDTO) => Promise<void>;
}

interface Doctor {
  id: string;
  name: string;
  crmNumber: string;
  crmState: string;
}

export default function MedicalExamFormModal({
  open,
  onOpenChange,
  exam,
  onSubmit,
}: MedicalExamFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados do formulário
  const [employeeId, setEmployeeId] = useState('');
  const [examType, setExamType] = useState('');
  const [examCategory, setExamCategory] = useState('ADMISSIONAL');
  const [scheduledDate, setScheduledDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [notes, setNotes] = useState('');

  // Estados para busca
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SimpleEmployee | null>(null);

  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [clinicSearchTerm, setClinicSearchTerm] = useState('');
  const [clinics, setClinics] = useState<string[]>([]);
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);

  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);
  const debouncedDoctorSearch = useDebounce(doctorSearchTerm, 300);
  const debouncedClinicSearch = useDebounce(clinicSearchTerm, 300);

  // Buscar funcionários
  useEffect(() => {
    if (debouncedEmployeeSearch.length >= 2) {
      setLoadingEmployees(true);
      employeeService.searchSimpleEmployees(debouncedEmployeeSearch)
        .then(setEmployees)
        .catch(() => setEmployees([]))
        .finally(() => setLoadingEmployees(false));
    } else if (debouncedEmployeeSearch.length === 0) {
      setEmployees([]);
    }
  }, [debouncedEmployeeSearch]);

  // Buscar médicos
  useEffect(() => {
    if (debouncedDoctorSearch.length >= 2) {
      setLoadingDoctors(true);
      doctorService.searchByName(debouncedDoctorSearch)
        .then(setDoctors)
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
    } else if (debouncedDoctorSearch.length === 0) {
      setDoctors([]);
    }
  }, [debouncedDoctorSearch]);

  // Buscar clínicas (do histórico de exames)
  useEffect(() => {
    const loadClinics = async () => {
      try {
        const clinicNames = await sstService.getDistinctClinicNames();
        setClinics(clinicNames);
      } catch (error) {
        console.error('Erro ao carregar clínicas:', error);
        setClinics([]);
      }
    };

    if (open) {
      loadClinics();
    }
  }, [open]);

  // Filtrar clínicas baseado no termo de busca
  const filteredClinics = React.useMemo(() => {
    if (!clinicSearchTerm || clinicSearchTerm.length < 2) {
      return [];
    }
    return clinics.filter(clinic =>
      clinic.toLowerCase().includes(clinicSearchTerm.toLowerCase())
    );
  }, [clinics, clinicSearchTerm]);

  // Carregar dados do exame quando for edição
  useEffect(() => {
    if (exam) {
      setEmployeeId(exam.employeeId || '');
      setExamType(exam.examType || '');
      setExamCategory(exam.examCategory || 'ADMISSIONAL');
      setScheduledDate(exam.scheduledDate ? new Date(exam.scheduledDate).toISOString().slice(0, 16) : '');
      setDoctorName(exam.doctorName || '');
      setClinicName(exam.clinicName || '');
      setNotes(exam.notes || '');
      
      if (exam.employeeName) {
        setSelectedEmployee({ id: exam.employeeId || '', name: exam.employeeName, document: '' });
        setEmployeeSearchTerm(exam.employeeName);
      }
    } else {
      // Reset form
      setEmployeeId('');
      setExamType('');
      setExamCategory('ADMISSIONAL');
      setScheduledDate('');
      setDoctorName('');
      setDoctorId('');
      setClinicName('');
      setNotes('');
      setEmployeeSearchTerm('');
      setDoctorSearchTerm('');
      setClinicSearchTerm('');
      setSelectedEmployee(null);
      setSelectedDoctor(null);
      setEmployees([]);
      setDoctors([]);
      setClinics([]);
    }
  }, [exam, open]);

  const handleEmployeeSelect = (employee: SimpleEmployee) => {
    setSelectedEmployee(employee);
    setEmployeeId(employee.id);
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDoctorId(doctor.id);
    setDoctorName(doctor.name);
    setDoctorSearchTerm(`${doctor.name} - CRM ${doctor.crmNumber}/${doctor.crmState}`);
    setShowDoctorDropdown(false);
  };

  const handleClinicSelect = (clinic: string) => {
    setClinicName(clinic);
    setClinicSearchTerm(clinic);
    setShowClinicDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !examType || !scheduledDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId,
        examType,
        examCategory: examCategory as any,
        scheduledDate: new Date(scheduledDate).toISOString(),
        doctorName: doctorName || undefined,
        clinicName: clinicName || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar exame médico:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 sm:p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            {exam ? 'Editar Exame Médico' : 'Novo Exame Médico'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm sm:text-base">
            {exam ? 'Atualize as informações do exame médico' : 'Registre um novo exame médico (ASO) para o funcionário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Seção: Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Funcionário <span className="text-seguranca-red">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="employeeId"
                    placeholder="Buscar funcionário..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                  {showEmployeeDropdown && (employeeSearchTerm.length >= 2 || employees.length > 0) && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingEmployees ? (
                        <div className="p-2 text-sm text-gray-400 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando...
                        </div>
                      ) : employees.length > 0 ? (
                        employees.map((emp) => (
                          <div
                            key={emp.id}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-seguranca-lightgray text-xs sm:text-sm border-b border-gray-700 last:border-0"
                            onClick={() => handleEmployeeSelect(emp)}
                          >
                            <div className="font-medium">{emp.name}</div>
                            {emp.document && (
                              <div className="text-xs text-gray-400">CPF: {emp.document}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-xs sm:text-sm text-gray-400">
                          {employeeSearchTerm.length >= 2 ? 'Nenhum funcionário encontrado' : 'Digite pelo menos 2 caracteres para buscar'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Dados do Exame */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Dados do Exame
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="examType" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Tipo de Exame <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="examType"
                    placeholder="Ex: Clínico, Audiometria, Espirometria"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examCategory" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Categoria <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select value={examCategory} onValueChange={setExamCategory}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="ADMISSIONAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Admissional
                      </SelectItem>
                      <SelectItem value="PERIODICO" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Periódico
                      </SelectItem>
                      <SelectItem value="RETORNO" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Retorno
                      </SelectItem>
                      <SelectItem value="MUDANCA_FUNCAO" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Mudança de Função
                      </SelectItem>
                      <SelectItem value="DEMISSIONAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Demissional
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data Agendada <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção: Médico e Clínica */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Médico e Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Médico
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="doctorName"
                    placeholder="Buscar médico..."
                    value={doctorSearchTerm || doctorName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDoctorSearchTerm(value);
                      if (!value) {
                        setDoctorName('');
                        setDoctorId('');
                        setSelectedDoctor(null);
                      }
                      setShowDoctorDropdown(true);
                    }}
                    onFocus={() => setShowDoctorDropdown(true)}
                    className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  />
                  {showDoctorDropdown && (doctorSearchTerm.length >= 2 || doctors.length > 0) && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingDoctors ? (
                        <div className="p-2 text-sm text-gray-400 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando...
                        </div>
                      ) : doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-seguranca-lightgray text-xs sm:text-sm border-b border-gray-700 last:border-0"
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            <div className="font-medium">{doctor.name}</div>
                            <div className="text-xs text-gray-400">CRM {doctor.crmNumber}/{doctor.crmState}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-xs sm:text-sm text-gray-400">
                          {doctorSearchTerm.length >= 2 ? 'Nenhum médico encontrado' : 'Digite pelo menos 2 caracteres para buscar'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clínica
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="clinicName"
                    placeholder="Nome da clínica"
                    value={clinicSearchTerm || clinicName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClinicSearchTerm(value);
                      setClinicName(value);
                      setShowClinicDropdown(value.length >= 2 && clinics.length > 0);
                    }}
                    onFocus={() => setShowClinicDropdown(clinicSearchTerm.length >= 2 && filteredClinics.length > 0)}
                    className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  />
                  {showClinicDropdown && filteredClinics.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredClinics.map((clinic, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-700 cursor-pointer text-seguranca-lightgray text-xs sm:text-sm border-b border-gray-700 last:border-0"
                          onClick={() => handleClinicSelect(clinic)}
                        >
                          {clinic}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Observações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais sobre o exame (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px] text-sm sm:text-base resize-y"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                exam ? 'Atualizar Exame' : 'Criar Exame'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

