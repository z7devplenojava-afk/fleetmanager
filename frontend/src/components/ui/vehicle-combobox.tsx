import * as React from "react"
import { Check, ChevronsUpDown, Car, RefreshCw } from "lucide-react"
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
    onChange: (value: string, vehicle?: any) => void
    clientId?: string
    className?: string
}

export function VehicleCombobox({ value, onChange, clientId, className }: VehicleComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [vehicles, setVehicles] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const [showAllVehicles, setShowAllVehicles] = React.useState(false)

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

    // Filtrar veículos alocados para o cliente selecionado, se houver clientId
    const displayVehicles = React.useMemo(() => {
        if (!clientId || showAllVehicles) return vehicles;
        
        const filtered = vehicles.filter((v) => {
            if (!v) return false;
            const vClientId = v.clientId || v.client?.id || v.clienteId;
            return vClientId === clientId || String(vClientId) === String(clientId);
        });

        return filtered;
    }, [vehicles, clientId, showAllVehicles]);

    const selectedVehicle = vehicles.find((v) => v.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-slate-950 border-slate-700/80 text-white hover:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm font-medium transition-all shadow-inner",
                        className
                    )}
                >
                    {selectedVehicle ? (
                        <span className="flex items-center gap-2 truncate">
                            <Car className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-semibold text-white">{selectedVehicle.plate || selectedVehicle.placa}</span>
                            <span className="text-slate-400 text-xs truncate">- {selectedVehicle.model || selectedVehicle.modelo}</span>
                        </span>
                    ) : (
                        <span className="text-slate-500">
                            {clientId && displayVehicles.length > 0
                                ? `Selecione um veículo deste cliente (${displayVehicles.length} alocado(s))...`
                                : "Selecione um veículo..."}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] sm:w-[400px] p-0 bg-slate-900 border-slate-700 text-slate-100 shadow-2xl rounded-xl z-[10080]">
                <Command className="bg-slate-900 text-slate-100">
                    <CommandInput
                        placeholder="Buscar placa ou modelo..."
                        className="bg-slate-950 border-b border-slate-800 text-white placeholder:text-slate-500 text-sm"
                    />
                    <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty className="text-slate-400 py-6 text-center text-xs">
                            {loading ? "Carregando frota..." : "Nenhum veículo encontrado."}
                        </CommandEmpty>
                        {clientId && !showAllVehicles && displayVehicles.length === 0 && (
                            <div className="p-3 text-center space-y-2 border-b border-slate-800 bg-slate-950/60">
                                <p className="text-xs text-amber-400 font-medium">Nenhum veículo vinculado a este cliente no momento.</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAllVehicles(true)}
                                    className="text-xs h-7 border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
                                >
                                    <RefreshCw className="w-3 h-3 mr-1" /> Exibir todos os veículos
                                </Button>
                            </div>
                        )}
                        <CommandGroup heading={clientId && !showAllVehicles ? "Veículos Alocados ao Cliente" : "Todos os Veículos"}>
                            {displayVehicles.slice(0, 100).map((vehicle) => {
                                const plate = vehicle.plate || vehicle.placa || '';
                                const model = vehicle.model || vehicle.modelo || '';
                                return (
                                    <CommandItem
                                        key={vehicle.id}
                                        value={`${plate} ${model}`}
                                        onSelect={() => {
                                            onChange(vehicle.id, vehicle)
                                            setOpen(false)
                                        }}
                                        className="text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer py-2.5 px-3 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    value === vehicle.id ? "opacity-100 text-emerald-400 font-bold" : "opacity-0"
                                                )}
                                            />
                                            <Car className="h-4 w-4 text-slate-400 shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-white text-sm truncate">{plate}</span>
                                                <span className="text-xs text-slate-400 truncate">{model}</span>
                                            </div>
                                        </div>
                                        {vehicle.clientName && (
                                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full truncate max-w-[110px]">
                                                {vehicle.clientName}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
