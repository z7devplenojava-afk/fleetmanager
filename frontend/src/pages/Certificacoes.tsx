import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Shield,
  Settings,
  BookOpen,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import certificationService from '@/services/certificationService';
import { Certification, CertificationType, CertificationStatus } from '@/types/certification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Certificacoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CertificationType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<CertificationStatus | 'ALL'>('ALL');

  // Buscar certificações
  const { 
    data: certifications, 
    isLoading: certificationsLoading, 
    error: certificationsError,
    refetch: refetchCertifications 
  } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => certificationService.getCertifications()
  });

  // Buscar estatísticas
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['certificationStats'],
    queryFn: () => certificationService.getCertificationStats()
  });

  // Filtrar certificações
  const filteredCertifications = certifications?.filter(cert => {
    const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.issuingOrganization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'ALL' || cert.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || cert.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  // Funções auxiliares
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: CertificationStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12} />Ativa</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12} />Expirada</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12} />Pendente</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1"><XCircle size={12} />Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: CertificationType) => {
    switch (type) {
      case 'SAFETY':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'TECHNICAL':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'MANAGEMENT':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'COMPLIANCE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: CertificationType): string => {
    switch (type) {
      case 'SAFETY':
        return 'Segurança';
      case 'TECHNICAL':
        return 'Técnica';
      case 'MANAGEMENT':
        return 'Gestão';
      case 'COMPLIANCE':
        return 'Conformidade';
      default:
        return 'Outra';
    }
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  };

  // Loading state
  if (certificationsLoading || statsLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando certificações...</span>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (certificationsError) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-seguranca-red mx-auto mb-2" />
            <p className="text-seguranca-lightgray">Erro ao carregar certificações</p>
            <Button 
              onClick={() => refetchCertifications()}
              className="mt-2 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Gestão de Certificações</h1>
            <p className="text-gray-400 mt-1">Controle de certificações e treinamentos dos funcionários</p>
          </div>
          <Button 
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Plus size={16} className="mr-2" />
            Nova Certificação
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total</CardTitle>
                <Award className="h-4 w-4 text-seguranca-yellow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</div>
                <p className="text-xs text-gray-400">Valor: {formatCurrency(stats.totalCost)}</p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Ativas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.active}</div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Expiradas</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.expired}</div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Expirando em 30 dias</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.expiringSoon}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Buscar certificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as CertificationType | 'ALL')}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Tipo de certificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  <SelectItem value="SAFETY">Segurança</SelectItem>
                  <SelectItem value="TECHNICAL">Técnica</SelectItem>
                  <SelectItem value="MANAGEMENT">Gestão</SelectItem>
                  <SelectItem value="COMPLIANCE">Conformidade</SelectItem>
                  <SelectItem value="OTHER">Outra</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as CertificationStatus | 'ALL')}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="ACTIVE">Ativa</SelectItem>
                  <SelectItem value="EXPIRED">Expirada</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Certificações */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              Certificações ({filteredCertifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCertifications.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                  Nenhuma certificação encontrada
                </h3>
                <p className="text-gray-400">
                  {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Não há certificações cadastradas no sistema.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertifications.map((cert) => (
                  <div key={cert.id} className={`flex items-center justify-between p-4 bg-seguranca-black rounded-lg border transition-colors ${
                    isExpired(cert.expiryDate) 
                      ? 'border-red-500 hover:border-red-400' 
                      : isExpiringSoon(cert.expiryDate)
                      ? 'border-yellow-500 hover:border-yellow-400'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(cert.type)}
                        <div>
                          <h4 className="font-medium text-seguranca-lightgray">{cert.name}</h4>
                          <p className="text-sm text-gray-400">{cert.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">{cert.certificateNumber}</span>
                            <span className="text-xs text-gray-500">{getTypeLabel(cert.type)}</span>
                            <span className="text-xs text-gray-500">{cert.issuingOrganization}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusBadge(cert.status)}
                          {isExpiringSoon(cert.expiryDate) && !isExpired(cert.expiryDate) && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Expira em breve
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User size={12} />
                            <span>{cert.employeeName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign size={12} />
                            <span>{formatCurrency(cert.cost)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Emitida em {formatDate(cert.issueDate)}
                        </div>

                        <div className={`flex items-center space-x-1 text-xs mt-1 ${
                          isExpired(cert.expiryDate) 
                            ? 'text-red-400' 
                            : isExpiringSoon(cert.expiryDate)
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }`}>
                          <Calendar size={12} />
                          <span>Expira: {formatDate(cert.expiryDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                          <FileText size={14} />
                        </Button>
                        {cert.status === 'ACTIVE' && (
                          <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Zap size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default Certificacoes; 