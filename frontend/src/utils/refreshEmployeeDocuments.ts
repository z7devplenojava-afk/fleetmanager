import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/hooks/queries/queryKeys';

/** Invalida a lista de documentos gerados do funcionário após gerar um PDF. */
export function refreshEmployeeDocuments(employeeId?: string | null): Promise<void> {
  if (!employeeId?.trim()) {
    return Promise.resolve();
  }
  return queryClient.invalidateQueries({
    queryKey: queryKeys.documentosGerados.byEmployee(employeeId),
  });
}
