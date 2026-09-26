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
            "h-11 w-full justify-between border-gray-600 bg-seguranca-black/70 text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors disabled:opacity-50 px-3",
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
        className="p-0 bg-seguranca-graphite border-gray-600 shadow-2xl z-[10500] w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command
          className="bg-seguranca-graphite text-seguranca-lightgray border-none"
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-gray-600 px-3 h-10">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50 text-seguranca-yellow" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="flex h-full w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
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
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-seguranca-black/80 aria-selected:text-seguranca-yellow hover:bg-seguranca-black/80 transition-colors gap-3"
                  >
                    <div className="flex items-center justify-center w-5">
                      <Check
                        className={cn(
                          "h-4 w-4 text-seguranca-yellow",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="font-medium truncate text-gray-100">{option.label}</span>
                      {option.description && (
                        <span className="text-[11px] text-gray-400 truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showOptions && filteredOptions.length === 0 && (
              <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                {emptyPlaceholder}
              </CommandEmpty>
            )}
            {!showOptions && (
              <div className="py-6 text-center text-sm text-gray-400 px-4">
                {resolvedMinCharsMessage}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
