/**
 * Componente de Tabela Responsiva
 * 
 * Exibe uma tabela tradicional em desktop e cards empilhados em mobile
 * para melhor experiência do usuário em dispositivos pequenos.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean; // Ocultar coluna em mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado'
}: ResponsiveTableProps<T>) {
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Versão Desktop - Tabela tradicional */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-seguranca-graphite border-b border-gray-600">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left p-3 text-sm font-semibold text-seguranca-lightgray ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-gray-700 hover:bg-seguranca-graphite/50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`p-3 text-sm text-seguranca-lightgray ${column.className || ''}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Versão Mobile - Cards empilhados */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-seguranca-graphite border-gray-600 ${
              onRowClick ? 'cursor-pointer hover:bg-seguranca-graphite/70' : ''
            }`}
          >
            <CardContent className="p-4">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="mb-2 last:mb-0">
                    <div className="text-xs text-gray-400 mb-1">
                      {column.header}
                    </div>
                    <div className="text-sm text-seguranca-lightgray">
                      {column.render(item)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/**
 * EXEMPLO DE USO:
 * 
 * import { ResponsiveTable } from '@/components/ui/responsive-table';
 * 
 * const columns = [
 *   {
 *     key: 'name',
 *     header: 'Nome',
 *     render: (item) => item.name,
 *   },
 *   {
 *     key: 'email',
 *     header: 'Email',
 *     render: (item) => item.email,
 *     hideOnMobile: true, // Não aparece em mobile
 *   },
 *   {
 *     key: 'status',
 *     header: 'Status',
 *     render: (item) => (
 *       <Badge variant={item.active ? 'success' : 'secondary'}>
 *         {item.active ? 'Ativo' : 'Inativo'}
 *       </Badge>
 *     ),
 *   },
 * ];
 * 
 * <ResponsiveTable
 *   data={users}
 *   columns={columns}
 *   keyExtractor={(user) => user.id}
 *   onRowClick={(user) => handleUserClick(user)}
 *   emptyMessage="Nenhum usuário encontrado"
 * />
 */

