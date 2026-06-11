import { create } from 'zustand';

const TOAST_LIMIT = 5;
const DEFAULT_DURATION = 5000;

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration: number;
  open: boolean;
}

interface AddToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (input: AddToastInput) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
}

let toastCount = 0;

function generateId(): string {
  toastCount += 1;
  return `toast-${toastCount}-${Date.now()}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (input) => {
    const id = generateId();
    const t: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'default',
      action: input.action,
      duration: input.duration ?? DEFAULT_DURATION,
      open: true,
    };

    set((state) => ({
      toasts: [t, ...state.toasts].slice(0, TOAST_LIMIT),
    }));

    return id;
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, open: false } : t
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 200);
  },

  remove: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

export function toast(input: ToastInput): string {
  return useToastStore.getState().addToast(input);
}

export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  const addToast = useToastStore((s) => s.addToast);
  const dismiss = useToastStore((s) => s.dismiss);

  return {
    toasts,
    toast: (input: ToastInput) => addToast(input),
    dismiss,
  };
}
