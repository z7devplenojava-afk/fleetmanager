import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, X } from 'lucide-react';
import { defaultShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customShortcuts?: typeof defaultShortcuts;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ 
  isOpen, 
  onClose, 
  customShortcuts = defaultShortcuts 
}) => {
  const shortcuts = [...defaultShortcuts, ...(customShortcuts || [])];

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.description.includes('funcionário') ? 'Funcionários' :
                    shortcut.description.includes('busca') ? 'Navegação' :
                    shortcut.description.includes('tema') ? 'Interface' :
                    shortcut.description.includes('salvar') ? 'Ações' : 'Geral';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground/80">{category}</h3>
              <div className="grid gap-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.keyCombo}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Pressione <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">?</kbd> a qualquer momento para ver esta lista
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsModal; 