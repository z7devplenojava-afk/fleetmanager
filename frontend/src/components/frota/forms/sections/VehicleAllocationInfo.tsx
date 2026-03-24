import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Settings, User } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import { workPostService, WorkPost } from '@/services/workPostService';
import { companyService } from '@/services/companyService';
import { departmentService, Department } from '@/services/departmentService';
import { employeeService } from '@/services/employeeService';
import { useQuery } from '@tanstack/react-query';

export const VehicleAllocationInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {

    // Queries
    const { data: companies, isLoading: companiesLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: () => companyService.getAllCompanies(),
        retry: 2
    });

    const { data: workPosts, isLoading: workPostsLoading } = useQuery({
        queryKey: ['workPosts'],
        queryFn: () => workPostService.getWorkPosts(),
        retry: 2
    });

    const { data: departments, isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => departmentService.listActive(),
        retry: 2
    });

    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees', 'ACTIVE'],
        queryFn: () => employeeService.getEmployeesByStatus('ACTIVE'),
        retry: 2
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Empresa */}
            <div className="space-y-2">
                <Label htmlFor="empresa" className="text-gray-300 font-medium">Empresa</Label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.empresaId}
                        onValueChange={(value) => {
                            const selectedCompany = companies?.find(c => c.id === value);
                            handleInputChange('empresaId', value);
                            handleInputChange('empresa', selectedCompany?.name || '');
                        }}
                        disabled={companiesLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {companies?.map((company) => (
                                <SelectItem key={company.id} value={company.id} className="text-white hover:bg-gray-700">
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Posto */}
            <div className="space-y-2">
                <Label htmlFor="postoDeTrabalho" className="text-gray-300 font-medium">Posto de Trabalho</Label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.postoDeTrabalho}
                        onValueChange={(value) => handleInputChange('postoDeTrabalho', value)}
                        disabled={workPostsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um posto" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {workPosts?.map((wp: WorkPost) => (
                                <SelectItem key={wp.id} value={wp.id} className="text-white hover:bg-gray-700">
                                    {wp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
                <Label htmlFor="departamento" className="text-gray-300 font-medium">Departamento</Label>
                <div className="relative">
                    <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.departmentId}
                        onValueChange={(value) => {
                            const selectedDepartment = departments?.find(d => d.id === value);
                            handleInputChange('departmentId', value);
                            handleInputChange('departamento', selectedDepartment?.name || '');
                        }}
                        disabled={departmentsLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {departments?.map((dept: Department) => (
                                <SelectItem key={dept.id} value={dept.id} className="text-white hover:bg-gray-700">
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-gray-300 font-medium">Responsável</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                        value={formData.responsavel}
                        onValueChange={(value) => handleInputChange('responsavel', value)}
                        disabled={employeesLoading}
                    >
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {employees?.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id} className="text-white hover:bg-gray-700">
                                    {emp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

        </div>
    );
};
