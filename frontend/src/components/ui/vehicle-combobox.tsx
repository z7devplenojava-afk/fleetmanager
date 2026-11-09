import * as React from "react"
import { Check, ChevronsUpDown, Car, RefreshCw, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import fleetService from "@/services/fleetService"

interface VehicleComboboxProps {
    value?: string
    onChange: (value: string, vehicle?: any) => void
    clientId?: string
    clientName?: string
    className?: string
}

function normalizeText(text?: string): string {
    if (!text) return ""
    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

export function VehicleCombobox({
    value,
    onChange,
    clientId,
    clientName,
    className
}: VehicleComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [vehicles, setVehicles] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const [showAllVehicles, setShowAllVehicles] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        loadVehicles()
    }, [])

    React.useEffect(() => {
        setShowAllVehicles(false)
    }, [clientId])

    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                inputRef.current?.focus()
            }, 25)
            return () => clearTimeout(timer)
        } else {
            setSearchQuery("")
        }
    }, [open])

    React.useEffect(() => {
        if (!open) return

        const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation()
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleOutsideClick, true)
        document.addEventListener("touchstart", handleOutsideClick, true)
        document.addEventListener("keydown", handleKeyDown, true)

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick, true)
            document.removeEventListener("touchstart", handleOutsideClick, true)
            document.removeEventListener("keydown", handleKeyDown, true)
        }
    }, [open])

    const loadVehicles = async () => {
        try {
            setLoading(true)
            const data = await fleetService.getVehicles()
            setVehicles(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Erro ao carregar veículos:", error)
            setVehicles([])
        } finally {
            setLoading(false)
        }
    }

    const isVehicleAllocatedToClient = React.useCallback(
        (v: any): boolean => {
            if (!v || !clientId) return false
            const vClientId = v.clientId || v.client?.id || v.clienteId
            if (vClientId && String(vClientId) === String(clientId)) return true
            if (clientName && v.clientName) {
                const normTarget = normalizeText(clientName).trim()
                const normVeh = normalizeText(v.clientName).trim()
                if (normTarget && normVeh && (normVeh === normTarget || normVeh.includes(normTarget) || normTarget.includes(normVeh))) {
                    return true
                }
            }
            return false
        },
        [clientId, clientName]
    )

    const clientVehicles = React.useMemo(() => {
        if (!clientId) return []
        return vehicles.filter(isVehicleAllocatedToClient)
    }, [vehicles, clientId, isVehicleAllocatedToClient])

    // Filtra em TODA a base de veículos antes de limitar a exibição,
    // permitindo digitar os 3 primeiros caracteres de qualquer placa/modelo da frota
    const filteredVehicles = React.useMemo(() => {
        const rawQuery = searchQuery.trim()
        const normQuery = normalizeText(rawQuery)
        const cleanAlphaNum = rawQuery.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()

        const matchesVehicle = (v: any): boolean => {
            if (!v) return false
            if (!normQuery) return true
            const plate = String(v.plate || v.placa || "")
            const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
            const model = normalizeText(v.model || v.modelo)
            const brand = normalizeText(v.brand || v.marca)
            const prefix = normalizeText(v.fleetNumber || v.prefixo)
            const cName = normalizeText(v.clientName || v.workPostName || v.location)

            return (
                normalizeText(plate).includes(normQuery) ||
                (cleanAlphaNum.length > 0 && cleanPlate.includes(cleanAlphaNum)) ||
                model.includes(normQuery) ||
                brand.includes(normQuery) ||
                `${brand} ${model}`.includes(normQuery) ||
                prefix.includes(normQuery) ||
                cName.includes(normQuery)
            )
        }

        // Se há filtro de cliente e o usuário não pediu todos nem digitou busca que extrapole os do cliente
        if (clientId && !showAllVehicles) {
            const matchedAllocated = clientVehicles.filter(matchesVehicle)
            if (matchedAllocated.length > 0) {
                // Se digitou 3+ caracteres, inclui também outros veículos da frota que batam com a busca logo abaixo dos alocados
                if (normQuery.length >= 3) {
                    const allocatedIds = new Set(matchedAllocated.map((v) => v.id))
                    const otherMatches = vehicles.filter((v) => !allocatedIds.has(v.id) && matchesVehicle(v))
                    return [...matchedAllocated, ...otherMatches]
                }
                return matchedAllocated
            }
            // Se o cliente não tem veículos alocados ou a busca por 3+ caracteres é de outro veículo da frota, busca na frota geral
            if (clientVehicles.length === 0 || normQuery.length >= 1) {
                return vehicles.filter(matchesVehicle)
            }
            return []
        }

        return vehicles.filter(matchesVehicle)
    }, [vehicles, clientVehicles, clientId, showAllVehicles, searchQuery])

    const selectedVehicle = React.useMemo(
        () => vehicles.find((v) => String(v.id) === String(value) || (value && (v.plate === value || v.placa === value))),
        [vehicles, value]
    )

    const handleSelectVehicle = (vehicle: any) => {
        onChange(vehicle.id, vehicle)
        setOpen(false)
        setSearchQuery("")
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (!open && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        setOpen(true)
                        setSearchQuery(e.key)
                    }
                }}
                className={cn(
                    "w-full justify-between bg-slate-950 border-slate-700/80 text-white hover:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm font-medium transition-all shadow-inner",
                    open && "border-emerald-500 ring-2 ring-emerald-500/20",
                    className
                )}
            >
                {selectedVehicle ? (
                    <span className="flex items-center gap-2 truncate">
                        <Car className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white">{selectedVehicle.plate || selectedVehicle.placa}</span>
                        <span className="text-slate-400 text-xs truncate">
                            - {[selectedVehicle.brand || selectedVehicle.marca, selectedVehicle.model || selectedVehicle.modelo].filter(Boolean).join(" ")}
                        </span>
                    </span>
                ) : (
                    <span className="text-slate-400 truncate">
                        {clientId && clientVehicles.length > 0
                            ? `Selecione ou digite a placa (${clientVehicles.length} alocado(s))...`
                            : "Selecione ou digite os 3 primeiros caracteres..."}
                    </span>
                )}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {selectedVehicle && (
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange("", undefined)
                            }}
                            className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            title="Limpar veículo"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                </div>
            </Button>

            {open && (
                <div
                    className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl rounded-xl z-[10095] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
                        <Search className="w-4 h-4 text-amber-400 shrink-0" />
                        <Input
                            ref={inputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && filteredVehicles.length > 0) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleSelectVehicle(filteredVehicles[0])
                                }
                            }}
                            placeholder="Digite os 3 primeiros caracteres da placa ou modelo..."
                            className="h-8 bg-transparent border-none text-white text-xs placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {clientId && !showAllVehicles && clientVehicles.length > 0 && (
                        <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-emerald-400 font-semibold">
                                Exibindo veículos do cliente ({clientVehicles.length})
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowAllVehicles(true)}
                                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                <RefreshCw className="w-3 h-3" /> Ver toda a frota ({vehicles.length})
                            </button>
                        </div>
                    )}

                    <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-800/60 overscroll-contain">
                        {loading ? (
                            <div className="text-slate-400 py-6 text-center text-xs">Carregando frota...</div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="text-slate-400 py-6 text-center text-xs space-y-2">
                                <p>Nenhum veículo encontrado para "{searchQuery}".</p>
                                {clientId && !showAllVehicles && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAllVehicles(true)}
                                        className="text-xs h-7 border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" /> Buscar em toda a frota
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredVehicles.slice(0, 100).map((vehicle) => {
                                const plate = vehicle.plate || vehicle.placa || ""
                                const brand = vehicle.brand || vehicle.marca || ""
                                const model = vehicle.model || vehicle.modelo || ""
                                const isAllocated = isVehicleAllocatedToClient(vehicle)
                                const isSelected = String(value) === String(vehicle.id)

                                return (
                                    <div
                                        key={vehicle.id}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleSelectVehicle(vehicle)
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleSelectVehicle(vehicle)
                                        }}
                                        className={cn(
                                            "text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer py-2 px-3 flex items-center justify-between gap-2 transition-colors",
                                            isSelected && "bg-emerald-950/40 text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    isSelected ? "opacity-100 text-emerald-400 font-bold" : "opacity-0"
                                                )}
                                            />
                                            <Car className="h-4 w-4 text-amber-400 shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-white text-sm">{plate}</span>
                                                    {(vehicle.fleetNumber || vehicle.prefixo) && (
                                                        <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0 rounded">
                                                            Frota {vehicle.fleetNumber || vehicle.prefixo}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400 truncate">
                                                    {[brand, model].filter(Boolean).join(" ") || "Veículo"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isAllocated && (
                                                <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-1.5 py-0">
                                                    Alocado ao Cliente
                                                </Badge>
                                            )}
                                            {vehicle.clientName && !isAllocated && (
                                                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                    {vehicle.clientName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                        <span>
                            {filteredVehicles.length > 100
                                ? `Exibindo 100 de ${filteredVehicles.length} veículos encontrados`
                                : `${filteredVehicles.length} veículo(s) na lista`}
                        </span>
                        <span>Digite 3+ caracteres para filtrar</span>
                    </div>
                </div>
            )}
        </div>
    )
}
