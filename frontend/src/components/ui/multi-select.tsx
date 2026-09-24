"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  emptyPlaceholder = "Nenhuma opção encontrada.",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const selectedLabels = value
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean) as string[]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors min-h-11 h-auto py-2",
            className
          )}
        >
          <span className="flex flex-wrap gap-1 items-center text-left">
            {selectedLabels.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selectedLabels.map(label => (
                <Badge
                  key={label}
                  className="bg-seguranca-yellow/15 text-seguranca-yellow border border-seguranca-yellow/30 mr-1"
                >
                  {label}
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-seguranca-graphite border-gray-600">
        <Command className="bg-seguranca-graphite text-seguranca-lightgray">
          <CommandInput
            placeholder={searchPlaceholder}
            className="bg-seguranca-graphite text-seguranca-lightgray border-b border-gray-600"
          />
          <CommandList>
            <CommandEmpty className="text-seguranca-lightgray">{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const checked = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                    className="text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-lightgray"
                  >
                    <span
                      role="presentation"
                      className="mr-2 flex h-4 w-4 items-center justify-center border border-gray-500"
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {value.length > 0 && (
          <div className="border-t border-gray-600 p-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => onChange([])}
            >
              <X className="h-3 w-3 mr-1" />
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
