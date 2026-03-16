import { X, Trash2, Download, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onAssign?: () => void;
}

export function BulkActionToolbar({ selectedCount, onClear, onDelete, onExport, onAssign }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700">
        <span className="text-sm font-medium">{selectedCount} selected</span>
        <div className="w-px h-5 bg-slate-700" />
        {onAssign && (
          <button onClick={onAssign} className="flex items-center gap-1.5 text-sm text-muted-foreground/50 hover:text-white transition-colors">
            <UserPlus className="w-4 h-4" /> Assign
          </button>
        )}
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1.5 text-sm text-muted-foreground/50 hover:text-white transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1.5 text-sm text-error-400 hover:text-error-300 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
        <div className="w-px h-5 bg-slate-700" />
        <button onClick={onClear} className="text-muted-foreground/70 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
