import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExternalLink, User, AlertCircle, Search, Building2, GraduationCap, Calendar, Clock, FileText, MapPin, Loader2 } from 'lucide-react';

import { employeeService } from '@/services/employeeService';
import { positionService, type Position } from '@/services/positionService';
import { trainingService, Training } from '@/services/trainingService';
import workPostService, { WorkPost } from '@/services/workPostService';
import { useToast } from '@/hooks/use-toast';
import FuncionarioEditModal from './FuncionarioEditModal';
import { Employee } from '@/types/employee';

// Fallback enquanto carrega
const mockEmployees = [] as Array<{ id: string; name: string; cpf?: string; position?: string }>;

const cargos = ['Vigilante', 'Porteiro', 'Auxiliar Administrativo', 'Supervisor', 'Gestor'];

function addYears(dateStr, years) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

const EmployeeTrainingFormModal = ({ open, onOpenChange, onSave, editData }) => {
  const [form, setForm] = useState({
    employeeId: '',
    employee: '',
    cpf: '',
    position: '',
    validUntil: '',
    sector: '',
    workSchedule: '',
    asoDate: '',
    psicotecnicoDate: '',
    id: undefined,
  });
  const [employees, setEmployees] = useState(mockEmployees);
  const [positions, setPositions] = useState<Position[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [filteredWorkPosts, setFilteredWorkPosts] = useState<WorkPost[]>([]);
  const [workPostSearchTerm, setWorkPostSearchTerm] = useState('');
  const [showWorkPostDropdown, setShowWorkPostDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [positionSelectKey, setPositionSelectKey] = useState(0); // Key para forçar re-render do Select
  const { toast } = useToast();

  useEffect(() => {
    const loadEditData = async () => {
    if (editData) {
        console.log('📝 Modo edição - editData recebido:', editData);
        
        // Garantir que editData tenha todas as propriedades necessárias
        const safeEditData = {
          employeeId: editData.employeeId || '',
          employee: editData.employee || '',
          cpf: editData.cpf || '',
          position: editData.position || '',
          validUntil: editData.validUntil || '',
          sector: editData.sector || '',
          workSchedule: editData.workSchedule || '',
          asoDate: editData.asoDate || '',
          psicotecnicoDate: editData.psicotecnicoDate || '',
          id: editData.id,
        };
        
        setForm(safeEditData);
        console.log('✅ Form inicial definido:', safeEditData);
        
        // Se temos employeeId, buscar dados completos do funcionário
        if (safeEditData.employeeId) {
          try {
            console.log('🔍 Buscando dados completos do funcionário:', safeEditData.employeeId);
            const fullEmployee = await employeeService.getEmployeeById(safeEditData.employeeId);
            
            if (fullEmployee) {
              console.log('✅ Dados completos do funcionário carregados:', fullEmployee);
              
              // Extrair CPF
              const cpfValue = fullEmployee.cpf || (fullEmployee as any).document || safeEditData.cpf || '';
              
              // Extrair cargo
              let positionId = '';
              let positionName = '';
              if (fullEmployee.position && typeof fullEmployee.position === 'object') {
                positionId = (fullEmployee.position as any).id ? String((fullEmployee.position as any).id) : '';
                positionName = (fullEmployee.position as any).name || '';
              }
              
              // Extrair setor (unit)
              let sectorName = '';
              if (fullEmployee.unit && typeof fullEmployee.unit === 'object') {
                sectorName = (fullEmployee.unit as any).name || '';
              }
              
              // Atualizar formulário com dados do funcionário
              setForm(prev => ({
                ...prev,
                employee: fullEmployee.name,
                cpf: cpfValue,
                position: positionId || positionName || prev.position || '',
                sector: sectorName || prev.sector || '',
                workSchedule: (fullEmployee as any).workSchedule || prev.workSchedule || '',
              }));
              
              setSelectedEmployee(fullEmployee);
              console.log('✅ Formulário atualizado com dados do funcionário');
            }
          } catch (error) {
            console.error('❌ Erro ao buscar dados do funcionário:', error);
          }
        }
    } else {
      setForm({
        employeeId: '', employee: '', cpf: '', position: '', validUntil: '', sector: '', workSchedule: '', asoDate: '', psicotecnicoDate: '', id: undefined
      });
    }
      
    // Resetar selectedEmployee e positionSelectKey quando o modal abrir
      if (open && !editData) {
      setSelectedEmployee(null);
      setPositionSelectKey(0);
      }
    };
    
    if (open) {
      loadEditData();
    }
  }, [editData, open]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const list = await employeeService.getAllEmployees();
        console.log('📋 Lista de funcionários recebida (RAW):', JSON.stringify(list.slice(0, 2), null, 2));
        
        const mappedEmployees = list.map((e: any) => {
          // Extrair CPF (pode vir como cpf ou document)
          const cpfValue = e.cpf || e.document || '';
          
          // Extrair cargo - verificar múltiplas possibilidades
          let positionObj = e.position;
          let positionId = '';
          let positionName = '';
          
          // Verificar se position é um objeto
          if (positionObj && typeof positionObj === 'object') {
            positionId = positionObj.id ? String(positionObj.id) : '';
            positionName = positionObj.name || '';
          }
          
          // Verificar se position vem como string direta
          if (!positionName && typeof e.position === 'string') {
            positionName = e.position;
          }
          
          // Verificar campos alternativos
          if (!positionName) {
            positionName = e.positionName || '';
          }
          if (!positionId) {
            positionId = e.positionId ? String(e.positionId) : '';
          }
          
          const mapped = {
            id: e.id,
            name: e.name,
            document: cpfValue,
            cpf: cpfValue,
            position: positionName,
            positionId: positionId
          };
          
          if (positionName) {
            console.log(`✅ Funcionário ${e.name} - Cargo: ${positionName} (ID: ${positionId})`);
          } else {
            console.log(`⚠️ Funcionário ${e.name} - Sem cargo`);
          }
          
          return mapped;
        });
        
        setEmployees(mappedEmployees);
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        setEmployees([]);
      }
    };
    
    const loadPositions = async () => {
      try {
        console.log('📥 Carregando lista de positions...');
        const positionsList = await positionService.getPositions();
        console.log('✅ Positions carregadas:', positionsList.length, positionsList.map(p => ({ id: p.id, name: p.name })));
        setPositions(positionsList);
      } catch (error) {
        console.error('❌ Erro ao carregar positions:', error);
        setPositions([]);
      }
    };
    
    const loadWorkPosts = async () => {
      try {
        const workPostsList = await workPostService.getAllWorkPosts();
        setWorkPosts(workPostsList);
        setFilteredWorkPosts(workPostsList);
      } catch (error) {
        console.error('Erro ao carregar postos de trabalho:', error);
        setWorkPosts([]);
        setFilteredWorkPosts([]);
      }
    };
    
    if (open) { 
      loadEmployees(); 
      loadPositions();
      loadWorkPosts(); 
    }
  }, [open]);

  // Filtrar postos de trabalho conforme busca
  useEffect(() => {
    if (!workPostSearchTerm.trim()) {
      setFilteredWorkPosts(workPosts);
    } else {
      const filtered = workPosts.filter(wp => 
        wp.name.toLowerCase().includes(workPostSearchTerm.toLowerCase()) ||
        wp.postCode.toLowerCase().includes(workPostSearchTerm.toLowerCase()) ||
        (wp.description && wp.description.toLowerCase().includes(workPostSearchTerm.toLowerCase()))
      );
      setFilteredWorkPosts(filtered);
    }
  }, [workPostSearchTerm, workPosts]);

  // Ao selecionar funcionário, preenche CPF e Cargo
  const handleEmployeeChange = async (val) => {
    // Ignorar valores vazios (pode acontecer durante inicialização do componente)
    if (!val || val === '') {
      console.log('⚠️ handleEmployeeChange: valor vazio ignorado');
      return;
    }
    
    const emp = employees.find(e => String(e.id) === val);
    
    if (!emp) {
      console.error('Funcionário não encontrado:', val);
      return;
    }
    
    // Buscar dados completos do funcionário para garantir que temos o cargo atualizado
    let employeeData = emp;
    let fullEmployee = null;
    
    try {
      // Garantir que positions estão carregadas antes de processar
      let currentPositions = positions;
      if (currentPositions.length === 0) {
        console.log('⚠️ Positions não carregadas ainda, recarregando...');
        try {
          const positionsList = await positionService.getPositions();
          console.log('✅ Positions recarregadas:', positionsList.length, positionsList.map(p => ({ id: p.id, name: p.name })));
          setPositions(positionsList);
          currentPositions = positionsList; // Usar a lista recém-carregada
        } catch (error) {
          console.error('❌ Erro ao recarregar positions:', error);
        }
      }
      
      // Sempre buscar dados completos do funcionário do banco de dados
      fullEmployee = await employeeService.getEmployeeById(emp.id);
      
      if (fullEmployee) {
        console.log('📋 Dados completos do funcionário (RAW):', JSON.stringify(fullEmployee, null, 2));
        console.log('📋 Dados completos do funcionário:', {
          id: fullEmployee.id,
          name: fullEmployee.name,
          cpf: fullEmployee.cpf,
          document: (fullEmployee as any).document,
          position: fullEmployee.position,
          positionName: (fullEmployee as any).positionName,
          positionId: (fullEmployee as any).positionId,
          // Verificar se position vem em diferentes formatos
          positionObj: fullEmployee.position,
          positionType: typeof fullEmployee.position,
          positionKeys: fullEmployee.position ? Object.keys(fullEmployee.position) : []
        });
        
        // Extrair CPF (pode vir como cpf ou document)
        const cpfValue = fullEmployee.cpf || (fullEmployee as any).document || emp.document || '';
        
        // Extrair cargo - verificar múltiplas possibilidades
        let positionObj = fullEmployee.position;
        let positionId = '';
        let positionName = '';
        
        // Verificar se position é um objeto (PositionDTO do backend)
        if (positionObj && typeof positionObj === 'object' && positionObj !== null) {
          // Tentar acessar id e name de diferentes formas
          positionId = (positionObj as any).id ? String((positionObj as any).id) : '';
          positionName = (positionObj as any).name || '';
          
          // Log detalhado do objeto position
          console.log('🔍 Position object details:', {
            positionObj,
            hasId: !!(positionObj as any).id,
            hasName: !!(positionObj as any).name,
            idValue: (positionObj as any).id,
            nameValue: (positionObj as any).name,
            keys: Object.keys(positionObj),
            stringified: JSON.stringify(positionObj)
          });
        }
        
        // Verificar se position vem como string direta
        if (!positionName && typeof fullEmployee.position === 'string') {
          positionName = fullEmployee.position;
          console.log('🔍 Position é string:', positionName);
        }
        
        // Verificar campos alternativos
        if (!positionName) {
          positionName = (fullEmployee as any).positionName || '';
          if (positionName) console.log('🔍 Position encontrado em positionName:', positionName);
        }
        if (!positionId) {
          positionId = (fullEmployee as any).positionId ? String((fullEmployee as any).positionId) : '';
          if (positionId) console.log('🔍 PositionId encontrado em positionId:', positionId);
        }
        
        // Fallback para dados da lista inicial
        if (!positionName) {
          positionName = emp.position || '';
          if (positionName) console.log('🔍 Position encontrado em emp.position (fallback):', positionName);
        }
        if (!positionId) {
          positionId = emp.positionId ? String(emp.positionId) : '';
          if (positionId) console.log('🔍 PositionId encontrado em emp.positionId (fallback):', positionId);
        }
        
        employeeData = {
          ...emp,
          document: cpfValue,
          position: positionName,
          positionId: positionId
        };
        
        console.log('✅ Cargo extraído FINAL:', {
          positionId,
          positionName,
          hasPosition: !!positionObj,
          positionObjType: typeof positionObj,
          positionObjKeys: positionObj && typeof positionObj === 'object' ? Object.keys(positionObj) : [],
          willMatch: positionId || positionName ? 'SIM' : 'NÃO'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados completos do funcionário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados completos do funcionário.',
        variant: 'destructive'
      });
    }
    
    // Verificar CPF
    const cpfValue = employeeData?.document || employeeData?.cpf || '';
    if (!cpfValue) {
      toast({
        title: 'Atenção',
        description: 'Este funcionário não possui CPF cadastrado no sistema. É necessário cadastrar o CPF antes de registrar treinamentos.',
        variant: 'destructive'
      });
    }
    
    // Preencher cargo automaticamente se existir
    const positionName = employeeData?.position || '';
    const positionId = employeeData?.positionId || '';
    
    // Garantir que temos a lista de positions atualizada
    let currentPositions = positions;
    if (currentPositions.length === 0) {
      console.log('⚠️ Tentando recarregar positions novamente...');
      try {
        const positionsList = await positionService.getPositions();
        console.log('✅ Positions recarregadas (segunda tentativa):', positionsList.length, positionsList.map(p => ({ id: p.id, name: p.name })));
        setPositions(positionsList);
        currentPositions = positionsList;
      } catch (error) {
        console.error('❌ Erro ao recarregar positions:', error);
      }
    }
    
    console.log('🔍 Buscando cargo na lista de positions:', {
      positionId,
      positionName,
      positionsCount: currentPositions.length,
      positionIds: currentPositions.map(p => String(p.id)),
      positionNames: currentPositions.map(p => p.name)
    });
    
    // Encontrar o cargo correspondente na lista de positions
    // Primeiro tenta por ID, depois por nome
    let matchedPosition = null;
    if (positionId && currentPositions.length > 0) {
      matchedPosition = currentPositions.find(p => String(p.id) === String(positionId));
      console.log('🔍 Busca por ID:', matchedPosition ? `✅ Encontrado: ${matchedPosition.name}` : '❌ Não encontrado');
    }
    
    if (!matchedPosition && positionName && currentPositions.length > 0) {
      matchedPosition = currentPositions.find(p => p.name === positionName);
      console.log('🔍 Busca por nome:', matchedPosition ? `✅ Encontrado: ID ${matchedPosition.id}` : '❌ Não encontrado');
    }
    
    const finalPositionName = matchedPosition?.name || positionName;
    const finalPositionId = matchedPosition?.id ? String(matchedPosition.id) : positionId;
    
    console.log('✅ Cargo final:', {
      finalPositionName,
      finalPositionId,
      matched: !!matchedPosition,
      positionsAvailable: currentPositions.length,
      positionIdsInList: currentPositions.map(p => String(p.id)),
      willUpdateSelect: !!matchedPosition
    });
    
    // Atualizar selectedEmployee com positionId correto
    const updatedEmployee = {
      ...employeeData,
      positionId: finalPositionId,
      position: finalPositionName,
      document: cpfValue
    };
    
    console.log('🔄 Atualizando selectedEmployee:', updatedEmployee);
    setSelectedEmployee(updatedEmployee);
    
    // Atualizar form com os dados do funcionário
    setForm(f => {
      const newForm = {
        ...f,
        employeeId: val,
        employee: employeeData?.name || '',
        cpf: cpfValue,
        position: finalPositionName,
        asoDate: finalPositionName === 'Vigilante' ? f.asoDate : '',
        psicotecnicoDate: finalPositionName === 'Vigilante' ? f.psicotecnicoDate : '',
      };
      console.log('🔄 Atualizando form:', newForm);
      return newForm;
    });
    
    // Forçar atualização do Select após um pequeno delay para garantir que o estado foi atualizado
    if (finalPositionId && currentPositions.length > 0) {
      const positionStillExists = currentPositions.find(p => String(p.id) === finalPositionId);
      if (positionStillExists) {
        console.log('✅ Cargo encontrado na lista, forçando atualização do Select:', {
          positionId: finalPositionId,
          positionName: finalPositionName,
          positionExists: !!positionStillExists
        });
        
        // Forçar atualização imediata
        setTimeout(() => {
          setSelectedEmployee(prev => {
            const updated = {
              ...prev,
              positionId: finalPositionId,
              position: finalPositionName
            };
            console.log('🔄 Forçando atualização do selectedEmployee (50ms):', updated);
            return updated;
          });
          
          // Também atualizar o form para garantir sincronização
          setForm(f => {
            if (f.position !== finalPositionName) {
              console.log('🔄 Forçando atualização do form.position (50ms):', finalPositionName);
              return { ...f, position: finalPositionName };
            }
            return f;
          });
          
          // Forçar re-render do Select
          setPositionSelectKey(prev => {
            const newKey = prev + 1;
            console.log('🔄 Forçando re-render do Select com key (50ms):', newKey);
            return newKey;
          });
        }, 50);
        
        // Segunda tentativa após mais tempo
        setTimeout(() => {
          setSelectedEmployee(prev => ({
            ...prev,
            positionId: finalPositionId,
            position: finalPositionName
          }));
          // Forçar re-render do Select
          setPositionSelectKey(prev => {
            const newKey = prev + 1;
            console.log('🔄 Forçando re-render do Select com key (200ms):', newKey);
            return newKey;
          });
        }, 200);
      } else {
        console.error('❌ Cargo não encontrado na lista de positions:', {
          positionId: finalPositionId,
          positionName: finalPositionName,
          availableIds: currentPositions.map(p => String(p.id)),
          availableNames: currentPositions.map(p => p.name)
        });
      }
    } else if (finalPositionName && !finalPositionId) {
      console.warn('⚠️ Cargo encontrado por nome mas sem ID:', finalPositionName);
    } else if (!finalPositionId && !finalPositionName) {
      console.warn('⚠️ Nenhum cargo encontrado para o funcionário');
    }
  };

  // Sincronizar cargo quando selectedEmployee for atualizado
  useEffect(() => {
    if (!selectedEmployee || positions.length === 0) return;
    
    console.log('🔄 useEffect - Sincronizando cargo:', {
      selectedEmployeePositionId: selectedEmployee.positionId,
      selectedEmployeePosition: selectedEmployee.position,
      currentFormPosition: form.position,
      positionsCount: positions.length
    });
    
    if (selectedEmployee.positionId) {
      const matchedPosition = positions.find(p => String(p.id) === String(selectedEmployee.positionId));
      console.log('🔍 Busca por positionId:', matchedPosition ? `✅ ${matchedPosition.name}` : '❌ Não encontrado');
      
      if (matchedPosition) {
        if (form.position !== matchedPosition.name) {
          console.log('✅ Atualizando form.position para:', matchedPosition.name);
          setForm(f => ({
            ...f,
            position: matchedPosition.name
          }));
        }
        // Garantir que selectedEmployee.position está sincronizado
        if (selectedEmployee.position !== matchedPosition.name) {
          console.log('✅ Atualizando selectedEmployee.position para:', matchedPosition.name);
          setSelectedEmployee(prev => ({
            ...prev,
            position: matchedPosition.name,
            positionId: String(matchedPosition.id)
          }));
          // Forçar re-render do Select
          setPositionSelectKey(prev => prev + 1);
        }
      }
    } else if (selectedEmployee.position && positions.length > 0) {
      // Se não tiver positionId mas tiver position name, tentar encontrar
      const matchedPosition = positions.find(p => p.name === selectedEmployee.position);
      console.log('🔍 Busca por position name:', matchedPosition ? `✅ ID: ${matchedPosition.id}` : '❌ Não encontrado');
      
      if (matchedPosition) {
        if (form.position !== matchedPosition.name) {
          console.log('✅ Atualizando form.position por nome para:', matchedPosition.name);
          setForm(f => ({
            ...f,
            position: matchedPosition.name
          }));
        }
        // Atualizar também o selectedEmployee com o positionId
        setSelectedEmployee(prev => ({
          ...prev,
          positionId: String(matchedPosition.id),
          position: matchedPosition.name
        }));
        // Forçar re-render do Select
        setPositionSelectKey(prev => prev + 1);
      }
    }
  }, [selectedEmployee?.positionId, selectedEmployee?.position, positions, form.position]);

  // Validação automática das datas de validade
  useEffect(() => {
    if (form.position === 'Vigilante') {
      setForm(f => ({
        ...f,
        asoDate: f.asoDate,
        psicotecnicoDate: f.psicotecnicoDate,
      }));
    }
  }, [form.position]);

  // Função para abrir modal de edição de funcionário
  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      // Buscar dados completos do funcionário
      const employeeData = await employeeService.getEmployeeById(selectedEmployee.id);
      setEmployeeToEdit(employeeData);
      setShowEditEmployeeModal(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do funcionário.',
        variant: 'destructive'
      });
    }
  };

  // Função chamada quando o funcionário é editado com sucesso
  const handleEmployeeEditSuccess = async () => {
    if (!selectedEmployee) return;
    
    console.log('🔄 handleEmployeeEditSuccess - Recarregando dados do funcionário:', selectedEmployee.id);
    
    // Recarregar lista de funcionários para obter dados atualizados
    try {
      // Buscar dados completos do funcionário atualizado
      const updatedEmployeeData = await employeeService.getEmployeeById(selectedEmployee.id);
      
      console.log('📋 Dados atualizados do funcionário:', {
        id: updatedEmployeeData?.id,
        name: updatedEmployeeData?.name,
        position: updatedEmployeeData?.position,
        positionName: (updatedEmployeeData as any)?.positionName
      });
      
      if (updatedEmployeeData) {
        // Extrair cargo - verificar múltiplas possibilidades
        let positionObj = updatedEmployeeData.position;
        let positionId = '';
        let positionName = '';
        
        // Verificar se position é um objeto
        if (positionObj && typeof positionObj === 'object') {
          positionId = positionObj.id ? String(positionObj.id) : '';
          positionName = positionObj.name || '';
        }
        
        // Verificar campos alternativos
        if (!positionName) {
          positionName = (updatedEmployeeData as any).positionName || '';
        }
        if (!positionId) {
          positionId = (updatedEmployeeData as any).positionId ? String((updatedEmployeeData as any).positionId) : '';
        }
        
        // Encontrar o cargo correspondente na lista de positions
        let matchedPosition = null;
        if (positionId && positions.length > 0) {
          matchedPosition = positions.find(p => String(p.id) === String(positionId));
        }
        if (!matchedPosition && positionName && positions.length > 0) {
          matchedPosition = positions.find(p => p.name === positionName);
        }
        
        const finalPositionName = matchedPosition?.name || positionName;
        const finalPositionId = matchedPosition?.id ? String(matchedPosition.id) : positionId;
        
        console.log('✅ Cargo encontrado após edição:', {
          finalPositionName,
          finalPositionId,
          matched: !!matchedPosition
        });
        
        // Extrair CPF
        const cpfValue = updatedEmployeeData.cpf || (updatedEmployeeData as any).document || selectedEmployee.document || '';
        
        // Atualizar o funcionário selecionado com dados completos
        const updatedEmployee = {
          ...selectedEmployee,
          document: cpfValue,
          position: finalPositionName,
          positionId: finalPositionId
        };
        
        console.log('🔄 Atualizando selectedEmployee:', updatedEmployee);
        setSelectedEmployee(updatedEmployee);
        
        // Atualizar o formulário com os novos dados, especialmente o cargo
        setForm(f => {
          const newForm = {
            ...f,
            cpf: cpfValue,
            position: finalPositionName
          };
          console.log('🔄 Atualizando form:', newForm);
          return newForm;
        });
        
        // Recarregar lista completa de funcionários
        const list = await employeeService.getAllEmployees();
        const mappedEmployees = list.map((e: any) => {
          const cpfVal = e.cpf || e.document || '';
          let posObj = e.position;
          let posId = '';
          let posName = '';
          
          if (posObj && typeof posObj === 'object') {
            posId = posObj.id ? String(posObj.id) : '';
            posName = posObj.name || '';
          }
          
          if (!posName) {
            posName = e.positionName || '';
          }
          if (!posId) {
            posId = e.positionId ? String(e.positionId) : '';
          }
          
          return {
            id: e.id,
            name: e.name,
            document: cpfVal,
            cpf: cpfVal,
            position: posName,
            positionId: posId
          };
        });
        
        setEmployees(mappedEmployees);
        
        toast({
          title: 'Sucesso',
          description: 'Funcionário atualizado com sucesso! O cargo foi carregado automaticamente.'
        });
        
        // Forçar atualização do Select após um pequeno delay
        if (finalPositionId && positions.length > 0) {
          setTimeout(() => {
            console.log('✅ Forçando atualização do Select após edição com positionId:', finalPositionId);
            setSelectedEmployee(prev => ({
              ...prev,
              positionId: finalPositionId,
              position: finalPositionName
            }));
          }, 200);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao recarregar dados do funcionário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao recarregar dados do funcionário.',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.validUntil) return;
    
    // Validação adicional de CPF antes de salvar
    if (!form.cpf) {
      toast({
        title: 'Erro',
        description: 'Funcionário deve ter CPF cadastrado para registrar treinamento. Clique no link para editar o funcionário.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // MODO EDIÇÃO: atualizar certificação existente
      if (form.id) {
        console.log('🔄 Modo edição - atualizando certificação:', form.id);
        
        // Buscar TODAS as certificações para encontrar a que está sendo editada
        const allCertifications = await trainingService.getEmployeeCertifications();
        const existingCert = allCertifications.find(c => c.id === form.id);
        
        if (!existingCert) {
          console.error('❌ Certificação não encontrada. ID:', form.id);
          console.error('📋 Certificações disponíveis:', allCertifications.map(c => c.id));
          throw new Error('Certificação não encontrada');
        }
        
        console.log('✅ Certificação encontrada:', existingCert);
        
        // Atualizar certificação existente
        const certification = await trainingService.updateEmployeeCertification(form.id, {
          employeeId: form.employeeId,
          trainingId: existingCert.trainingId,
          certificationNumber: existingCert.certificationNumber,
          issueDate: existingCert.issueDate,
          expirationDate: form.validUntil,
          workPostName: form.sector, // Enviar o nome do posto de trabalho atualizado
        });
        
        console.log('✅ Certificação atualizada:', certification);
        toast({ title: 'Sucesso', description: 'Treinamento atualizado com sucesso!' });
        onSave({ ...form });
        onOpenChange(false);
        return;
      }
      
      // MODO CRIAÇÃO: criar novo treinamento e certificação
      const training = await trainingService.createTraining({
        name: `Treinamento ${form.position} - ${form.sector || 'Geral'}`,
        description: `Treinamento específico para ${form.position}`,
        provider: 'Empresa',
        duration: 40
      });
      
      // Criar certificação para o funcionário
      const certification = await trainingService.createEmployeeCertification({
        employeeId: form.employeeId,
        trainingId: training.id,
        certificationNumber: `CERT-${Date.now()}`,
        issueDate: new Date().toISOString().slice(0,10),
        expirationDate: form.validUntil,
        workPostName: form.sector, // Enviar o nome do posto de trabalho
      });
      console.log('✅ Treinamento e certificação criados:', { training, certification });
      toast({ title: 'Sucesso', description: 'Treinamento registrado com sucesso!' });
      onSave({ ...form, id: certification.id });
      // Fechar o modal após salvar
      onOpenChange(false);
    } catch (e) {
      console.error('❌ Erro ao salvar treinamento/certificação:', e);
      const isEdit = !!form.id;
      toast({ 
        title: 'Erro', 
        description: `Falha ao ${isEdit ? 'atualizar' : 'criar'} treinamento.`, 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            {form.id ? 'Editar Treinamento' : 'Novo Treinamento'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {form.id ? 'Atualize as informações do treinamento' : 'Preencha os dados para cadastrar um novo treinamento'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Seção: Informações do Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funcionário */}
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium">
                  Funcionário <span className="text-seguranca-red">*</span>
                </Label>
                <Select value={form.employeeId} onValueChange={handleEmployeeChange}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={String(e.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CPF e Cargo em linha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">CPF</Label>
                  <div className="relative">
                    <Input 
                      value={form.cpf} 
                      disabled 
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray h-11 pr-10" 
                    />
                    {selectedEmployee && !selectedEmployee.document && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <button
                          onClick={handleEditEmployee}
                          className="text-seguranca-yellow hover:text-seguranca-yellow/80"
                          title="Editar funcionário para cadastrar CPF"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedEmployee && !selectedEmployee.document && (
                    <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span>CPF não cadastrado. </span>
                        <button
                          onClick={handleEditEmployee}
                          className="text-seguranca-yellow hover:underline inline-flex items-center gap-1"
                        >
                          <User className="h-3 w-3" />
                          Editar funcionário
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Cargo</Label>
                  <div className="relative">
                    <Select 
                      key={`position-select-${positionSelectKey}-${selectedEmployee?.positionId || 'empty'}-${form.position || 'empty'}`}
                      value={(() => {
                        // Priorizar positionId do selectedEmployee
                        if (selectedEmployee?.positionId) {
                          const posId = String(selectedEmployee.positionId);
                          const positionExists = positions.find(p => String(p.id) === posId);
                          if (positionExists) {
                            console.log('🔍 Select value (from selectedEmployee.positionId):', posId, '->', positionExists.name);
                            return posId;
                          } else {
                            console.log('⚠️ Select value: positionId não encontrado na lista:', posId);
                          }
                        }
                        
                        // Se não tiver positionId, tentar encontrar por nome
                        if (form.position && positions.length > 0) {
                          const foundPosition = positions.find(p => p.name === form.position);
                          if (foundPosition) {
                            const posId = String(foundPosition.id);
                            console.log('🔍 Select value (from form.position):', posId, '->', foundPosition.name);
                            return posId;
                          } else {
                            console.log('⚠️ Select value: position name não encontrado na lista:', form.position);
                          }
                        }
                        
                        console.log('🔍 Select value: empty');
                        return '';
                      })()}
                      onValueChange={(value) => {
                        console.log('🔍 Select onValueChange:', value);
                        
                        // Ignorar valores vazios (pode acontecer durante inicialização)
                        if (!value || value === '') {
                          console.log('⚠️ Valor vazio ignorado no onValueChange do cargo');
                          return;
                        }
                        
                        const position = positions.find(p => String(p.id) === String(value));
                        const positionName = position?.name || '';
                        console.log('🔍 Position encontrada:', positionName);
                        setForm(f => ({ ...f, position: positionName }));
                        // Atualizar também o selectedEmployee para manter sincronizado
                        if (selectedEmployee) {
                          setSelectedEmployee({
                            ...selectedEmployee,
                            position: positionName,
                            positionId: position?.id ? String(position.id) : ''
                          });
                        }
                      }}
                      disabled={!selectedEmployee}
                    >
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow h-11 [&>span]:text-white [&>span[data-placeholder]]:text-gray-400">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                        {positions.length > 0 ? (
                          positions.map(position => (
                            <SelectItem key={position.id} value={String(position.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                              {position.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Nenhum cargo disponível
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedEmployee && !selectedEmployee.position && !form.position && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <button
                          onClick={handleEditEmployee}
                          className="text-seguranca-yellow hover:text-seguranca-yellow/80"
                          title="Editar funcionário para cadastrar cargo"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedEmployee && !selectedEmployee.position && !form.position && (
                    <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span>Cargo não cadastrado. </span>
                        <button
                          onClick={handleEditEmployee}
                          className="text-seguranca-yellow hover:underline inline-flex items-center gap-1"
                        >
                          <User className="h-3 w-3" />
                          Editar funcionário
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Informações do Treinamento */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações do Treinamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data de Validade */}
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium">
                  Data de Validade <span className="text-seguranca-red">*</span>
                </Label>
                <Input 
                  type="date" 
                  value={form.validUntil} 
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} 
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11" 
                />
              </div>

              {/* Setor/Posto de Trabalho com busca */}
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium">Setor/Posto de Trabalho</Label>
                <div className="relative">
                  <div className="relative">
                    <Input
                      type="text"
                      value={workPostSearchTerm}
                      onChange={(e) => {
                        setWorkPostSearchTerm(e.target.value);
                        setShowWorkPostDropdown(true);
                      }}
                      onFocus={() => setShowWorkPostDropdown(true)}
                      onBlur={() => setTimeout(() => setShowWorkPostDropdown(false), 200)}
                      placeholder="Buscar posto de trabalho..."
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
              
                  {/* Dropdown de postos de trabalho */}
                  {showWorkPostDropdown && filteredWorkPosts.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredWorkPosts.map((workPost) => (
                        <div
                          key={workPost.id}
                          className="px-3 py-2.5 hover:bg-seguranca-black cursor-pointer border-b border-gray-700 last:border-b-0"
                          onClick={() => {
                            setForm(f => ({ ...f, sector: workPost.name }));
                            setWorkPostSearchTerm(workPost.name);
                            setShowWorkPostDropdown(false);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-seguranca-yellow mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-seguranca-lightgray truncate">
                                {workPost.name}
                              </div>
                              {workPost.postCode && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Código: {workPost.postCode}
                                </div>
                              )}
                              {workPost.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {workPost.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showWorkPostDropdown && workPostSearchTerm.trim() !== '' && filteredWorkPosts.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg p-3">
                      <p className="text-sm text-gray-400">Nenhum posto de trabalho encontrado</p>
                    </div>
                  )}
                </div>
                
                {/* Exibir posto selecionado */}
                {form.sector && (
                  <div className="bg-seguranca-graphite border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-seguranca-yellow flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-seguranca-lightgray truncate">
                          {form.sector}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setForm(f => ({ ...f, sector: '' }));
                          setWorkPostSearchTerm('');
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Horário de Trabalho */}
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Trabalho
                </Label>
                <Input 
                  value={form.workSchedule} 
                  onChange={e => setForm(f => ({ ...f, workSchedule: e.target.value }))} 
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11" 
                  placeholder="Ex: 06h às 18h"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção: Documentos (apenas para Vigilante) */}
          {form.position === 'Vigilante' && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <FileText className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Documentos Obrigatórios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data do ASO
                  </Label>
                  <Input 
                    type="date" 
                    value={form.asoDate} 
                    onChange={e => setForm(f => ({ ...f, asoDate: e.target.value }))} 
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11" 
                  />
                  {form.asoDate && (
                    <p className="text-xs text-gray-400">
                      Validade: {addYears(form.asoDate, 1)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data do Psicotécnico
                  </Label>
                  <Input 
                    type="date" 
                    value={form.psicotecnicoDate} 
                    onChange={e => setForm(f => ({ ...f, psicotecnicoDate: e.target.value }))} 
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11" 
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-seguranca-red hover:bg-seguranca-darkred"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              form.id ? 'Salvar Alterações' : 'Cadastrar Treinamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Edição de Funcionário */}
    <FuncionarioEditModal
      open={showEditEmployeeModal}
      onOpenChange={setShowEditEmployeeModal}
      funcionario={employeeToEdit}
      onSuccess={handleEmployeeEditSuccess}
    />
    </>
  );
};

export default EmployeeTrainingFormModal; 