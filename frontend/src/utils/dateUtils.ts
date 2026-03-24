import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Utilitários para conversão de datas entre formato brasileiro e formato do banco
 */

/**
 * Converte uma data Date para string no formato do banco (yyyy-MM-dd)
 * @param date - Date object ou null
 * @returns string no formato yyyy-MM-dd ou undefined se a data for inválida
 */
export const formatDateForBackend = (date: Date | null | undefined): string | undefined => {
  if (!date || !isValid(date)) return undefined;
  return format(date, 'yyyy-MM-dd');
};

/**
 * Converte uma string de data do backend para Date object
 * @param dateString - String no formato yyyy-MM-dd ou yyyy-MM-ddTHH:mm:ss
 * @returns Date object ou null se a string for inválida
 */
export const parseDateFromBackend = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // Remove a parte de tempo se existir
    const dateOnly = dateString.split('T')[0];
    
    // Converte para Date adicionando horário meio-dia para evitar problemas de timezone
    const date = new Date(dateOnly + 'T12:00:00');
    
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Formata uma data para exibição no formato brasileiro (dd/MM/yyyy)
 * @param date - Date object
 * @returns string no formato dd/MM/yyyy
 */
export const formatDateForDisplay = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) return '';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Converte string no formato brasileiro (dd/MM/yyyy) para Date object
 * @param dateString - String no formato dd/MM/yyyy
 * @returns Date object ou null se inválida
 */
export const parseBrazilianDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Verifica se uma data está vencida (anterior à data atual)
 * @param date - Date object
 * @returns boolean
 */
export const isDateOverdue = (date: Date | null | undefined): boolean => {
  if (!date || !isValid(date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Verifica se uma data está vencendo em X dias
 * @param date - Date object
 * @param days - Número de dias
 * @returns boolean
 */
export const isDateDueSoon = (date: Date | null | undefined, days: number = 7): boolean => {
  if (!date || !isValid(date)) return false;
  
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  today.setHours(0, 0, 0, 0);
  futureDate.setHours(23, 59, 59, 999);
  
  return date >= today && date <= futureDate;
};

/**
 * Calcula a diferença em dias entre duas datas
 * @param date1 - Date object
 * @param date2 - Date object
 * @returns number de dias (positivo se date1 > date2)
 */
export const daysDifference = (date1: Date, date2: Date): number => {
  if (!isValid(date1) || !isValid(date2)) return 0;
  
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date1.getTime() - date2.getTime()) / oneDay);
};

/**
 * Obtém o primeiro dia do mês atual
 * @returns Date object
 */
export const getFirstDayOfMonth = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

/**
 * Obtém o último dia do mês atual
 * @returns Date object
 */
export const getLastDayOfMonth = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
};

/**
 * Formata uma data para exibição no formato brasileiro, lidando com valores inválidos
 * @param dateString - String de data ou Date object
 * @returns string no formato dd/MM/yyyy ou 'N/A' se inválida
 */
export const formatDateSafe = (dateString: string | Date | null | undefined): string => {
  if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '0') {
    return 'N/A';
  }
  
  try {
    let date: Date;
    
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else {
      date = dateString;
    }
    
    // Verificar se a data é válida
    if (!isValid(date) || date.getFullYear() < 1900) {
      return 'N/A';
    }
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return 'N/A';
  }
};

/**
 * Configurações padrão para DatePicker em português brasileiro
 */
export const DEFAULT_DATE_PICKER_PROPS = {
  dateFormat: 'dd/MM/yyyy',
  locale: ptBR,
  placeholderText: 'dd/mm/aaaa',
  className: 'w-full p-2 border rounded-md'
} as const;