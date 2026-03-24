import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  GraduationCap,
  Heart,
  Loader2
} from 'lucide-react';
import { Dependent } from '@/types/dependent';

interface DependentesTableProps {
  dependents: Dependent[];
  onEdit?: (dependent: Dependent) => void;
  onDelete?: (dependent: Dependent) => void;
  onView?: (dependent: Dependent) => void;
  isLoading?: boolean;
}

export const DependentesTable: React.FC<DependentesTableProps> = ({
  dependents,
  onEdit,
  onDelete,
  onView,
  isLoading = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getRelationshipBadge = (relationship: string) => {
    const relationshipConfig = {
      'FILHO': { label: 'Filho(a)', variant: 'default' as const, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      'FILHA': { label: 'Filha', variant: 'default' as const, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      'CONJUGE': { label: 'Cônjuge', variant: 'default' as const, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      'ESPOSA': { label: 'Esposa', variant: 'default' as const, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      'ESPOSO': { label: 'Esposo', variant: 'default' as const, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
      'PAI': { label: 'Pai', variant: 'default' as const, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      'MAE': { label: 'Mãe', variant: 'default' as const, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      'IRMAO': { label: 'Irmão', variant: 'default' as const, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      'IRMA': { label: 'Irmã', variant: 'default' as const, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      'NETO': { label: 'Neto(a)', variant: 'default' as const, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
      'SOGRO': { label: 'Sogro(a)', variant: 'default' as const, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
      'OUTRO': { label: 'Outro', variant: 'default' as const, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' }
    };
    
    const config = relationshipConfig[relationship as keyof typeof relationshipConfig] || relationshipConfig['OUTRO'];
    return <Badge className={`${config.color} px-2 py-1 rounded-full text-xs font-medium`}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-red" />
            <span className="ml-2 text-seguranca-lightgray">Carregando dependentes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dependents.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <User className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-seguranca-lightgray mb-2">
              Nenhum dependente encontrado
            </h3>
            <p className="text-gray-400">
              Não há dependentes cadastrados para este funcionário.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden lg:block rounded-md border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-black/50 hover:bg-seguranca-black/50">
              <TableHead className="text-seguranca-yellow">Dependente</TableHead>
              <TableHead className="text-seguranca-yellow">Relacionamento</TableHead>
              <TableHead className="text-seguranca-yellow">Idade</TableHead>
              <TableHead className="text-seguranca-yellow">Contato</TableHead>
              <TableHead className="text-seguranca-yellow">Status</TableHead>
              <TableHead className="text-seguranca-yellow text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependents.map((dependent) => (
              <TableRow key={dependent.id} className="border-gray-700 hover:bg-seguranca-graphite/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-seguranca-red/20 border border-seguranca-red/30">
                      <User className="h-4 w-4 text-seguranca-red" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{dependent.name}</p>
                      <p className="text-sm text-gray-400">CPF: {formatCpf(dependent.cpf)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRelationshipBadge(dependent.relationship)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray">{getAge(dependent.birthDate)} anos</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {dependent.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-300">{dependent.phone}</span>
                      </div>
                    )}
                    {dependent.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-300">{dependent.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {dependent.isStudent && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 rounded-full text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Estudante
                      </Badge>
                    )}
                    {dependent.isBeneficiary && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 rounded-full text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        Beneficiário
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-600">
                      {onView && (
                        <DropdownMenuItem 
                          onClick={() => onView(dependent)}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem 
                          onClick={() => onEdit(dependent)}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(dependent)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="lg:hidden grid gap-4">
        {dependents.map((dependent) => (
          <Card key={dependent.id} className="bg-seguranca-graphite border-gray-700 shadow-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-seguranca-red/20 border border-seguranca-red/30">
                    <User className="h-5 w-5 text-seguranca-red" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{dependent.name}</h3>
                    <p className="text-sm text-gray-400">CPF: {formatCpf(dependent.cpf)}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-600">
                    {onView && (
                      <DropdownMenuItem 
                        onClick={() => onView(dependent)}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={() => onEdit(dependent)}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(dependent)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center space-x-4">
                {getRelationshipBadge(dependent.relationship)}
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{getAge(dependent.birthDate)} anos</span>
                </div>
              </div>

              {(dependent.phone || dependent.email) && (
                <div className="space-y-1">
                  {dependent.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{dependent.phone}</span>
                    </div>
                  )}
                  {dependent.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span>{dependent.email}</span>
                    </div>
                  )}
                </div>
              )}

              {(dependent.isStudent || dependent.isBeneficiary) && (
                <div className="flex flex-wrap gap-2">
                  {dependent.isStudent && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 rounded-full text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Estudante
                    </Badge>
                  )}
                  {dependent.isBeneficiary && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 py-1 rounded-full text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Beneficiário
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
