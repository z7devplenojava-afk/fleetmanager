"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { employeeService, SimpleEmployee } from "@/services/employeeService"

interface EmployeeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  disabled?: boolean;
}

export function EmployeeCombobox({ 
  value,
  onChange,
  placeholder = "Selecione um funcionário...",
  searchPlaceholder = "Buscar funcionário...",
  emptyPlaceholder = "Nenhum funcionário encontrado.",
  disabled = false
}: EmployeeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [employees, setEmployees] = React.useState<SimpleEmployee[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Buscar funcionários quando o termo de busca mudar
  React.useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      setLoading(true)
      employeeService.searchSimpleEmployees(debouncedSearchTerm)
        .then(setEmployees)
        .catch(error => {
          console.error('Erro ao buscar funcionários:', error)
          setEmployees([])
        })
        .finally(() => setLoading(false))
    } else if (debouncedSearchTerm.length === 0) {
      setEmployees([])
    }
  }, [debouncedSearchTerm])

  // Converter funcionários para opções do combobox
  const options = employees.map(emp => ({
    label: `${emp.name}${emp.positionName ? ` - ${emp.positionName}` : ''}${emp.unitName ? ` (${emp.unitName})` : ''}`,
    value: emp.id,
    employee: emp
  }))

  const selectedEmployee = employees.find(emp => emp.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors disabled:opacity-50"
        >
          {selectedEmployee ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                {selectedEmployee.name}
                {selectedEmployee.positionName && ` - ${selectedEmployee.positionName}`}
                {selectedEmployee.unitName && ` (${selectedEmployee.unitName})`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-seguranca-graphite border-gray-600">
        <Command className="bg-seguranca-graphite text-seguranca-lightgray">
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="bg-seguranca-graphite text-seguranca-lightgray border-b border-gray-600"
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-seguranca-lightgray">
                Buscando funcionários...
              </div>
            ) : (
              <>
                <CommandEmpty className="text-seguranca-lightgray">
                  {searchTerm.length < 2 
                    ? "Digite pelo menos 2 caracteres para buscar..." 
                    : emptyPlaceholder
                  }
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? "" : currentValue)
                        setOpen(false)
                        setSearchTerm("")
                      }}
                      className="text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-lightgray"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{option.employee.name}</span>
                        <span className="text-sm text-gray-400">
                          {option.employee.positionName && `${option.employee.positionName}`}
                          {option.employee.unitName && ` • ${option.employee.unitName}`}
                          {option.employee.registrationNumber && ` • ${option.employee.registrationNumber}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
