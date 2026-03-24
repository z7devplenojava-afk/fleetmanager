'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { ChecklistResponse } from '@/types/clientChecklist';

interface ChecklistItemRowProps {
  itemId: string;
  title: string;
  value?: ChecklistResponse;
  onChange: (itemId: string, value: ChecklistResponse) => void;
  required?: boolean;
  disabled?: boolean;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  itemId,
  title,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const btnClass = (v: ChecklistResponse) => {
    const base = 'flex-1 min-w-0 text-xs font-medium py-2 transition-colors';
    if (value === v) {
      if (v === 'C') return `${base} bg-green-600 text-white border-green-600`;
      if (v === 'NC') return `${base} bg-red-600 text-white border-red-600`;
      return `${base} bg-gray-600 text-white border-gray-600`;
    }
    return `${base} bg-seguranca-black border border-gray-600 text-gray-400 hover:border-gray-500`;
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-700/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-seguranca-lightgray">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass('C')}
          onClick={() => onChange(itemId, 'C')}
          disabled={disabled}
        >
          C
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass('NC')}
          onClick={() => onChange(itemId, 'NC')}
          disabled={disabled}
        >
          NC
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass('NA')}
          onClick={() => onChange(itemId, 'NA')}
          disabled={disabled}
        >
          NA
        </Button>
      </div>
    </div>
  );
};

export default ChecklistItemRow;
