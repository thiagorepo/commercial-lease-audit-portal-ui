import { useEffect } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastAction,
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast';
import { useToastStore } from '@/hooks/use-toast';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

interface ToastItemProps {
  toast: {
    id: string;
    title: string;
    description?: string;
    variant: 'default' | 'success' | 'error' | 'warning' | 'info';
    action?: { label: string; onClick: () => void };
    duration: number;
    open: boolean;
  };
  onDismiss: (id: string) => void;
}

function ToastItem({ toast: t, onDismiss }: ToastItemProps) {
  useEffect(() => {
    if (t.duration <= 0) return undefined;
    const timer = setTimeout(() => onDismiss(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onDismiss]);

  return (
    <Toast
      open={t.open}
      onOpenChange={(open) => {
        if (!open) onDismiss(t.id);
      }}
      variant={t.variant}
    >
      <div className="grid gap-1">
        <ToastTitle>{t.title}</ToastTitle>
        {t.description && <ToastDescription>{t.description}</ToastDescription>}
      </div>
      {t.action && (
        <ToastAction altText={t.action.label} onClick={t.action.onClick}>
          {t.action.label}
        </ToastAction>
      )}
      <ToastClose />
    </Toast>
  );
}
