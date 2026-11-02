import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsiveDrawerProps {
    children?: React.ReactNode // The trigger button OR content if 'content' is missing
    content?: React.ReactNode // The form or content inside
    title: string
    description?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    // Backward compatibility
    isOpen?: boolean
    onClose?: () => void
    triggerAsChild?: boolean
    footer?: React.ReactNode
    className?: string
}

export function ResponsiveDrawer({
    children,
    content,
    title,
    description,
    open,
    onOpenChange,
    isOpen,
    onClose,
    triggerAsChild = false,
    footer,
    className
}: ResponsiveDrawerProps) {
    const isMobile = useIsMobile()

    // Controlled state logic supporting both 'open' and 'isOpen'
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = open !== undefined || isOpen !== undefined
    const actualOpen = open !== undefined ? open : (isOpen !== undefined ? isOpen : internalOpen)

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen)
        }
        onOpenChange?.(newOpen)
        if (!newOpen) {
            setTimeout(() => {
                if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }
            }, 50);
            if (onClose) {
                onClose()
            }
        }
    }

    React.useEffect(() => {
        if (!actualOpen) {
            const timer = setTimeout(() => {
                if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [actualOpen]);

    React.useEffect(() => {
        return () => {
            setTimeout(() => {
                if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }
            }, 50);
        };
    }, []);

    // Logic: If 'content' prop is provided, 'children' is the trigger.
    // If 'content' is NOT provided, 'children' is the content (modal body) and there is no trigger.
    const modalContent = content || children
    const modalTrigger = content ? children : null

    if (isMobile) {
        return (
            <Drawer open={actualOpen} onOpenChange={handleOpenChange}>
                {modalTrigger && (
                    <DrawerTrigger asChild={triggerAsChild}>
                        {modalTrigger}
                    </DrawerTrigger>
                )}
                <DrawerContent className={cn("max-h-[92vh] flex flex-col bg-[#111319] dark:bg-[#0c0e14] text-foreground border-border/60", className)} style={{ maxWidth: '100vw' }}>
                    <DrawerHeader className="text-left px-4 pt-4 pb-2 border-b border-border/40 shrink-0">
                        <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
                        {description && <DrawerDescription className="text-xs text-muted-foreground">{description}</DrawerDescription>}
                    </DrawerHeader>
                    <div className="px-3 sm:px-4 py-3 overflow-y-auto overflow-x-hidden max-h-[75vh] min-w-0 flex-1">
                        {modalContent}
                    </div>
                    {footer ? (
                        <DrawerFooter className="pt-2 px-4 pb-4 border-t border-border/40 shrink-0">
                            {footer}
                        </DrawerFooter>
                    ) : (
                        <DrawerFooter className="pt-2 px-4 pb-4 shrink-0">
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full">Cancelar</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    )}
                </DrawerContent>
            </Drawer>
        )
    }

    const hasCustomMaxWidth = className?.includes('max-w-');
    return (
        <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
            {modalTrigger && (
                <DialogTrigger asChild={triggerAsChild}>
                    {modalTrigger}
                </DialogTrigger>
            )}
            <DialogContent
                className={cn(
                    "max-h-[90vh] overflow-y-auto w-full max-w-[calc(100vw-2rem)] bg-[#111319] dark:bg-[#0c0e14] border-border/60",
                    !hasCustomMaxWidth && "sm:max-w-[500px]",
                    className
                )}
                style={{ overflowX: 'hidden' }}
            >
                <DialogHeader className="pb-2 border-b border-border/40">
                    <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                    {description && <DialogDescription className="text-xs sm:text-sm text-muted-foreground">{description}</DialogDescription>}
                </DialogHeader>
                <div className="py-2 min-w-0">
                    {modalContent}
                </div>
                {footer && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-3 border-t border-border/40">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
