import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DailyDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    dateLabel?: string
    icon?: LucideIcon
    children: React.ReactNode
    className?: string
    maxWidth?: string
}

export function DailyDetailsModal({
    open,
    onOpenChange,
    title,
    dateLabel,
    icon: Icon,
    children,
    className,
    maxWidth = "max-w-4xl"
}: DailyDetailsModalProps) {
    const isMobile = useIsMobile()

    const header = (
        <div className="flex items-center gap-3">
            {Icon && (
                <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-seguranca-yellow" />
                </div>
            )}
            <div className="flex flex-col text-left">
                <span className="text-xl font-semibold text-seguranca-yellow leading-tight">{title}</span>
                {dateLabel && <span className="text-sm text-gray-400 mt-1">{dateLabel}</span>}
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="bg-seguranca-graphite text-seguranca-lightgray border-gray-700">
                    <DrawerHeader className="pb-4">
                        <DrawerTitle asChild>
                            {header}
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className={cn("px-4 pb-8 overflow-y-auto max-h-[80vh]", className)}>
                        {children}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("bg-seguranca-graphite text-seguranca-lightgray border-gray-700 max-h-[85vh] overflow-y-auto p-0", maxWidth, className)}>
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle asChild>
                            {header}
                        </DialogTitle>
                    </DialogHeader>
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}
