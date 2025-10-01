import React from 'react';
import { X, MapPin, Users, Clock, Building, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { WorkPost } from '@/services/workPostService';

interface WorkPostViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPost: WorkPost | null;
  onStatusChange: (workPostId: string, newStatus: string) => void;
}

const WorkPostViewModal: React.FC<WorkPostViewModalProps> = ({
  open,
  onOpenChange,
  workPost,
  onStatusChange
}) => {
  if (!workPost) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'EM_IMPLANTACAO': return 'bg-blue-100 text-blue-800';
      case 'INATIVO': return 'bg-gray-100 text-gray-800';
      case 'SUSPENSO': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      case 'EM_ANALISE': return 'bg-purple-100 text-purple-800';
      case 'PENDENTE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'Ativo';
      case 'EM_IMPLANTACAO': return 'Em Implantação';
      case 'INATIVO': return 'Inativo';
      case 'SUSPENSO': return 'Suspenso';
      case 'CANCELADO': return 'Cancelado';
      case 'EM_ANALISE': return 'Em Análise';
      case 'PENDENTE': return 'Pendente';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'POSTO_24H': return 'Posto 24h';
      case 'POSTO_SDF': return 'Posto SDF';
      case 'POSTO_12H_NOTURNO': return '12h Noturno';
      case 'POSTO_12H_DIURNO': return '12h Diurno';
      case 'POSTO_6H': return 'Posto 6h';
      case 'POSTO_8H': return 'Posto 8h';
      case 'OUTROS': return 'Outros';
      default: return type;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(workPost.id, newStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Detalhes do Posto de Trabalho
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header com informações principais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{workPost.name}</h2>
                <p className="text-gray-600">Código: {workPost.postCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(workPost.status)}>
                  {getStatusText(workPost.status)}
                </Badge>
                <Select value={workPost.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM_IMPLANTACAO">Em Implantação</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Tipo</label>
                <p>{getTypeText(workPost.type)}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Cliente</label>
                <p>{workPost.clientName || 'N/A'}</p>
                {workPost.clientCnpj && (
                  <p className="text-sm text-gray-500">CNPJ: {workPost.clientCnpj}</p>
                )}
              </div>
              
              {workPost.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-sm">{workPost.description}</p>
                </div>
              )}
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Endereço</label>
                <p className="text-sm">{workPost.address}</p>
              </div>
              
              {(workPost.city || workPost.state) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Cidade/Estado</label>
                  <p className="text-sm">
                    {workPost.city && workPost.state 
                      ? `${workPost.city}, ${workPost.state}`
                      : workPost.city || workPost.state
                    }
                  </p>
                </div>
              )}
              
              {workPost.zipCode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">CEP</label>
                  <p className="text-sm">{workPost.zipCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Configuração de Pessoal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Configuração de Pessoal
            </h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Vigilantes Necessários</label>
                <p className="text-lg font-semibold">{workPost.requiredVigilantes}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Escala de Trabalho</label>
                <p>{workPost.workSchedule}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Horário do Turno</label>
                <p>{workPost.shiftStart} - {workPost.shiftEnd}</p>
                {workPost.shiftDescription && (
                  <p className="text-sm text-gray-500">{workPost.shiftDescription}</p>
                )}
              </div>
            </div>
          </div>

          {/* Benefícios */}
          {(workPost.transportVoucher || workPost.costAllowance || workPost.intrajourney || 
            workPost.localMeal || workPost.mealTicket || workPost.healthPlan || workPost.dentalPlan) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Benefícios e Condições</h3>
              
              <div className="grid gap-2 md:grid-cols-2">
                {workPost.transportVoucher && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Vale Transporte</span>
                  </div>
                )}
                
                {workPost.costAllowance && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Ajuda de Custo
                      {workPost.costAllowanceValue && ` - R$ ${workPost.costAllowanceValue}`}
                    </span>
                  </div>
                )}
                
                {workPost.intrajourney && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Intrajornada</span>
                  </div>
                )}
                
                {workPost.localMeal && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Alimentação no Local</span>
                  </div>
                )}
                
                {workPost.mealTicket && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Ticket Alimentação</span>
                  </div>
                )}
                
                {workPost.healthPlan && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Plano de Saúde</span>
                  </div>
                )}
                
                {workPost.dentalPlan && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Plano Odontológico</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recursos e Equipamentos */}
          {(workPost.cars || workPost.motorcycles || workPost.radios || 
            workPost.corporates || workPost.documentBank) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recursos e Equipamentos</h3>
              
              <div className="grid gap-2 md:grid-cols-2">
                {workPost.cars && workPost.cars > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Carros:</span>
                    <span className="text-sm">{workPost.cars}</span>
                  </div>
                )}
                
                {workPost.motorcycles && workPost.motorcycles > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Motos:</span>
                    <span className="text-sm">{workPost.motorcycles}</span>
                  </div>
                )}
                
                {workPost.radios && workPost.radios > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rádios:</span>
                    <span className="text-sm">{workPost.radios}</span>
                  </div>
                )}
                
                {workPost.corporates && workPost.corporates > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Corporativos:</span>
                    <span className="text-sm">{workPost.corporates}</span>
                  </div>
                )}
                
                {workPost.documentBank && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Banco DOC</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conformidade Legal */}
          {(workPost.pgr || workPost.pcmso || workPost.nrs?.length || 
            workPost.epis?.length || workPost.trainings?.length) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Conformidade Legal</h3>
              
              <div className="space-y-3">
                {(workPost.pgr || workPost.pcmso) && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {workPost.pgr && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">PGR</span>
                      </div>
                    )}
                    
                    {workPost.pcmso && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">PCMSO</span>
                      </div>
                    )}
                  </div>
                )}
                
                {workPost.nrs && workPost.nrs.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Normas Regulamentadoras</label>
                    <div className="flex flex-wrap gap-1">
                      {workPost.nrs.map((nr, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {nr}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {workPost.epis && workPost.epis.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">EPIs Necessários</label>
                    <div className="flex flex-wrap gap-1">
                      {workPost.epis.map((epi, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {epi}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {workPost.trainings && workPost.trainings.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Treinamentos Necessários</label>
                    <div className="flex flex-wrap gap-1">
                      {workPost.trainings.map((training, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {training}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Implantação */}
          {(workPost.implementationDate || workPost.implementationTime) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Implantação
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {workPost.implementationDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Data de Implantação</label>
                    <p>{new Date(workPost.implementationDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                
                {workPost.implementationTime && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Horário de Implantação</label>
                    <p>{workPost.implementationTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {workPost.observations && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Observações</label>
              <p className="text-sm bg-gray-50 p-3 rounded">{workPost.observations}</p>
            </div>
          )}

          {/* Informações de Auditoria */}
          <div className="border-t pt-4">
            <div className="grid gap-2 md:grid-cols-2 text-sm text-gray-500">
              <div>
                <span className="font-medium">Criado em:</span> {new Date(workPost.createdAt).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span> {new Date(workPost.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkPostViewModal; 