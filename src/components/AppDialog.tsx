import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2, CheckCircle, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDialog — substituto in-app de window.confirm()
// ─────────────────────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog panel */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[60] px-4 pb-6"
          >
            <div className={`bg-white rounded-2xl border shadow-2xl overflow-hidden ${
              isDanger ? 'border-rose-200' : 'border-amber-200'
            }`}>
              {/* Top accent bar */}
              <div className={`h-1 w-full ${isDanger ? 'bg-rose-500' : 'bg-amber-400'}`} />

              <div className="p-6 space-y-4">
                {/* Icon + title */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isDanger ? 'bg-rose-50' : 'bg-amber-50'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onCancel}
                    className="flex-1 h-11 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`flex-1 h-11 text-white text-sm font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                      isDanger
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {isDanger && <Trash2 className="w-4 h-4" />}
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineAlert — substituto in-app de toasts e mensagens de erro/sucesso
// ─────────────────────────────────────────────────────────────────────────────
interface InlineAlertProps {
  type: 'error' | 'success' | 'info';
  message: string | null;
  onClose?: () => void;
}

export function InlineAlert({ type, message, onClose }: InlineAlertProps) {
  if (!message) return null;

  const styles = {
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />,
    },
    info: {
      container: 'bg-primary/5 border-primary/20 text-primary',
      icon: <Info className="w-4 h-4 text-primary shrink-0" />,
    },
  };

  const { container, icon } = styles[type];

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold ${container}`}
        >
          {icon}
          <span className="flex-1">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
