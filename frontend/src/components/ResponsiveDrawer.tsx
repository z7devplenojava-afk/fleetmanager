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
        if (!newOpen && onClose) {
            onClose()
        }
    }

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
                <DrawerContent className={className} style={{ maxWidth: '100vw' }}>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        {description && <DrawerDescription>{description}</DrawerDescription>}
                    </DrawerHeader>
                    <div className="px-4 pb-4 overflow-y-auto overflow-x-hidden max-h-[70vh] min-w-0">
                        {modalContent}
                    </div>
                    <DrawerFooter className="pt-2">
                        {footer}
                        <DrawerClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
            {modalTrigger && (
                <DialogTrigger asChild={triggerAsChild}>
                    {modalTrigger}
                </DialogTrigger>
            )}
            <DialogContent className={`sm:max-w-[425px] max-h-[85vh] overflow-y-auto max-w-[calc(100vw-2rem)] ${className || ''}`} style={{ overflowX: 'hidden' }}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {modalContent}
                {footer && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
