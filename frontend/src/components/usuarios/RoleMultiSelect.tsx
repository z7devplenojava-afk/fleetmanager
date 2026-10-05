import React, { useState, useMemo } from 'react';
import { UserRole } from '@/types/user';
import { ROLE_CATEGORIES, getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface RoleMultiSelectProps {
  selectedRoles: UserRole[];
  onChange: (roles: UserRole[]) => void;
  isSuperAdmin: boolean;
  disabled?: boolean;
}

export const RoleMultiSelect: React.FC<RoleMultiSelectProps> = ({
  selectedRoles,
  onChange,
  isSuperAdmin,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    diretoria: true,
    rh_dp: true,
    comercial: true,
    compras: true,
    almoxarifado: true,
    manutencao: true,
    operacional: true,
    financeiro: true,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleToggleRole = (role: UserRole) => {
    if (disabled) return;
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter(r => r !== role));
    } else {
      onChange([...selectedRoles, role]);
    }
  };

  const handleRemoveRole = (role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedRoles.filter(r => r !== role));
  };

  // Filtragem de roles de acordo com o termo de busca e permissões
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return ROLE_CATEGORIES.map(category => {
      const allowedRoles = category.roles.filter(role => {
        // Regra de segurança: apenas SuperAdmin ou FlexAdmin podem conceder SUPER_ADMIN, FLEX_ADMIN e TI_SUPORTE
        if (!isSuperAdmin) {
          if (role === 'FLEX_ADMIN' || role === 'SUPER_ADMIN' || role === 'TI_SUPORTE') {
            return false;
          }
        }
        if (!term) return true;
        const displayName = getRoleDisplayName(role).toLowerCase();
        const roleKey = role.toLowerCase();
        return displayName.includes(term) || roleKey.includes(term);
      });

      return {
        ...category,
        roles: allowedRoles,
      };
    }).filter(cat => cat.roles.length > 0);
  }, [searchTerm, isSuperAdmin]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-seguranca-lightgray flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-seguranca-red" />
          Funções & Acessos (Roles) *
        </Label>
        <span className="text-xs text-gray-400">
          {selectedRoles.length === 0
            ? 'Nenhuma selecionada'
            : `${selectedRoles.length} função(ões) selecionada(s)`}
        </span>
      </div>

      {/* Chips de funções selecionadas */}
      <div className="min-h-[46px] p-2 bg-seguranca-black rounded-md border border-gray-600 flex flex-wrap items-center gap-1.5">
        {selectedRoles.length === 0 ? (
          <span className="text-xs text-gray-500 italic pl-1">
            Selecione uma ou mais funções abaixo para habilitar os módulos correspondentes...
          </span>
        ) : (
          selectedRoles.map(role => (
            <Badge
              key={role}
              className={`${getRoleColor(role)} flex items-center gap-1 px-2.5 py-1 text-xs font-semibold shadow-sm`}
            >
              <span>{getRoleDisplayName(role)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveRole(role, e)}
                  className="ml-1 hover:bg-black/30 rounded-full p-0.5 text-white/90 hover:text-white transition-colors"
                  title={`Remover ${getRoleDisplayName(role)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {/* Campo de pesquisa rápida */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Filtrar funções (ex: Comercial, Manutenção, Compras, RH...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-seguranca-black border-gray-600 pl-9 text-xs text-seguranca-lightgray h-9"
          disabled={disabled}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista categorizada de funções */}
      <div className="max-h-64 overflow-y-auto rounded-md border border-gray-700 bg-seguranca-black/60 divide-y divide-gray-800 p-1">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            Nenhuma função encontrada para "{searchTerm}".
          </div>
        ) : (
          filteredCategories.map(cat => {
            const isExpanded = expandedCategories[cat.id] ?? true;
            const selectedInCatCount = cat.roles.filter(r => selectedRoles.includes(r)).length;

            return (
              <div key={cat.id} className="py-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs font-semibold text-gray-300 hover:bg-white/5 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{cat.name}</span>
                    {selectedInCatCount > 0 && (
                      <span className="bg-seguranca-red text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {selectedInCatCount}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-2.5 py-1.5">
                    {cat.roles.map(role => {
                      const isChecked = selectedRoles.includes(role);
                      return (
                        <div
                          key={role}
                          onClick={() => handleToggleRole(role)}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-seguranca-red/10 border-seguranca-red/50 text-white'
                              : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleRole(role)}
                            disabled={disabled}
                            className="data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                          />
                          <span className="text-xs truncate" title={getRoleDisplayName(role)}>
                            {getRoleDisplayName(role)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
