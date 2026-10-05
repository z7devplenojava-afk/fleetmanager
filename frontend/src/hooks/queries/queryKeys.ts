export const queryKeys = {
  documentosGerados: {
    all: ['documentosGerados'] as const,
    byEmployee: (employeeId: string) => ['documentosGerados', employeeId] as const,
  },
};
