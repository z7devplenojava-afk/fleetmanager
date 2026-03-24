import * as React from "react"
import { Check, ChevronsUpDown, Car } from "lucide-react"
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
import fleetService from "@/services/fleetService"

interface VehicleComboboxProps {
    value?: string
    onChange: (value: string) => void
    className?: string
}

export function VehicleCombobox({ value, onChange, className }: VehicleComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [vehicles, setVehicles] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        loadVehicles()
    }, [])

    const loadVehicles = async () => {
        try {
            setLoading(true)
            const data = await fleetService.getVehicles()
            setVehicles(data || [])
        } catch (error) {
            console.error('Erro ao carregar veículos:', error)
            setVehicles([])
        } finally {
            setLoading(false)
        }
    }

    const selectedVehicle = vehicles.find((v) => v.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite",
                        className
                    )}
                >
                    {selectedVehicle ? (
                        <span className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {selectedVehicle.plate} - {selectedVehicle.model}
                        </span>
                    ) : (
                        <span className="text-gray-400">Selecione um veículo...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-seguranca-graphite border-gray-600">
                <Command className="bg-seguranca-graphite">
                    <CommandInput
                        placeholder="Buscar veículo..."
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                    <CommandList>
                        <CommandEmpty className="text-gray-400 py-6 text-center">
                            {loading ? "Carregando..." : "Nenhum veículo encontrado."}
                        </CommandEmpty>
                        <CommandGroup>
                            {vehicles.map((vehicle) => (
                                <CommandItem
                                    key={vehicle.id}
                                    value={`${vehicle.plate} ${vehicle.model}`}
                                    onSelect={() => {
                                        onChange(vehicle.id)
                                        setOpen(false)
                                    }}
                                    className="text-seguranca-lightgray hover:bg-seguranca-black cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === vehicle.id ? "opacity-100 text-seguranca-yellow" : "opacity-0"
                                        )}
                                    />
                                    <Car className="mr-2 h-4 w-4 text-gray-400" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{vehicle.plate}</span>
                                        <span className="text-xs text-gray-400">{vehicle.model}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
