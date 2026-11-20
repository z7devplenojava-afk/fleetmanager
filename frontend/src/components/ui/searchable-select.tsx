"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search as SearchIcon } from "lucide-react"
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

export interface Option {
  value: string;
  label: string;
  description?: string;
  searchTerms?: string[];
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  disabled?: boolean;
  /** Mostrar opções apenas após digitar este número de caracteres (default: 0 = mostra sempre). */
  minSearchChars?: number;
  /** Mensagem exibida enquanto o usuário não atingiu minSearchChars. */
  minCharsMessage?: string;
  /** Callback para busca server-side (debounced opcional). */
  onSearchChange?: (query: string) => void;
  /** Label de fallback caso a opção não esteja na lista de opções atual */
  fallbackLabel?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyPlaceholder = "Nenhum item encontrado.",
  disabled = false,
  minSearchChars = 0,
  minCharsMessage,
  onSearchChange,
  fallbackLabel,
  className,
  theme = 'dark',
}: Readonly<SearchableSelectProps>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((opt) => opt && opt.value === value)
  const displayLabel = selectedOption
    ? selectedOption.label
    : (value && fallbackLabel ? fallbackLabel : placeholder)

  const tooltipText = selectedOption
    ? `${selectedOption.label}${selectedOption.description ? ` — ${selectedOption.description}` : ''}`
    : (value && fallbackLabel ? fallbackLabel : (displayLabel !== placeholder ? displayLabel : ''))

  // Notifica busca externa (server-side) com debounce simples
  React.useEffect(() => {
    if (!onSearchChange) return
    const t = setTimeout(() => onSearchChange(search), 250)
    return () => clearTimeout(t)
  }, [search, onSearchChange])

  // Aplica o filtro mínimo de caracteres
  const showOptions = search.length >= minSearchChars
  const filteredOptions = React.useMemo(() => {
    if (!showOptions) return [] as Option[]
    if (!search) return options
    const q = search.toLowerCase().trim()
    const qClean = q.replace(/[^a-zA-Z0-9]/g, '')
    return options.filter((o) => {
      if (!o) return false
      const label = (o.label || "").toLowerCase()
      const desc = o.description ? o.description.toLowerCase() : ""
      const terms = Array.isArray(o.searchTerms) ? o.searchTerms.join(' ').toLowerCase() : ""
      
      const labelClean = label.replace(/[^a-zA-Z0-9]/g, '')
      const descClean = desc.replace(/[^a-zA-Z0-9]/g, '')
      const termsClean = terms.replace(/[^a-zA-Z0-9]/g, '')
      
      const labelMatch = label.includes(q) || (qClean !== '' && labelClean.includes(qClean))
      const descMatch = desc.includes(q) || (qClean !== '' && descClean.includes(qClean))
      const termsMatch = terms.includes(q) || (qClean !== '' && termsClean.includes(qClean))
      return labelMatch || descMatch || termsMatch
    })
  }, [options, search, showOptions])

  const resolvedMinCharsMessage =
    minCharsMessage ?? `Digite ao menos ${minSearchChars} caracteres para buscar...`

  // Resetar a busca ao fechar
  React.useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          title={tooltipText || undefined}
          className={cn(
            theme === 'light'
              ? "h-11 w-full justify-between border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-500 transition-colors disabled:opacity-50 px-3"
              : "h-11 w-full justify-between border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors disabled:opacity-50 px-3",
            className
          )}
        >
          <div
            className="flex items-center gap-2 truncate font-medium text-sm sm:text-base text-left flex-1"
            title={tooltipText || undefined}
          >
            {displayLabel}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 shadow-2xl z-[10500] w-[var(--radix-popover-trigger-width)]", theme === 'light' ? 'bg-white border-slate-200' : 'bg-seguranca-graphite border-gray-600')}
        align="start"
      >
        <Command
          className={cn("border-none", theme === 'light' ? 'bg-white text-slate-900' : 'bg-seguranca-graphite text-seguranca-lightgray')}
          shouldFilter={false}
        >
          <div className={cn("flex items-center border-b px-3 h-10", theme === 'light' ? 'border-slate-200' : 'border-gray-600')}>
            <SearchIcon className={cn("mr-2 h-4 w-4 shrink-0 opacity-70", theme === 'light' ? 'text-slate-500' : 'text-seguranca-yellow')} />
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className={cn("flex h-full w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0", theme === 'light' ? 'text-slate-900 placeholder:text-slate-500' : 'placeholder:text-gray-500')}
            />
          </div>
          <CommandList className="max-h-80 overflow-y-auto">
            {showOptions && filteredOptions.length > 0 && (
              <CommandGroup className="p-1">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "all" : currentValue)
                      setOpen(false)
                    }}
                    className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none transition-colors gap-3", theme === 'light' ? 'aria-selected:bg-blue-50 aria-selected:text-blue-900 hover:bg-slate-100' : 'aria-selected:bg-seguranca-black/80 aria-selected:text-seguranca-yellow hover:bg-seguranca-black/80')}
                  >
                    <div className="flex items-center justify-center w-5">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          theme === 'light' ? 'text-blue-700' : 'text-seguranca-yellow',
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className={cn("font-medium truncate", theme === 'light' ? 'text-slate-900' : 'text-gray-100')}>{option.label}</span>
                      {option.description && (
                        <span className={cn("text-[11px] truncate mt-0.5", theme === 'light' ? 'text-slate-600' : 'text-gray-400')}>
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showOptions && filteredOptions.length === 0 && (
              <CommandEmpty className={cn("py-6 text-center text-sm", theme === 'light' ? 'text-slate-600' : 'text-gray-400')}>
                {emptyPlaceholder}
              </CommandEmpty>
            )}
            {!showOptions && (
              <div className={cn("py-6 text-center text-sm px-4", theme === 'light' ? 'text-slate-600' : 'text-gray-400')}>
                {resolvedMinCharsMessage}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
