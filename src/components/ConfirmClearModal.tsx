import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmClearModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmClearModal: React.FC<ConfirmClearModalProps> = ({
  isOpen,
  title = 'دوپاتکرنا مسحکرنێ',
  message,
  subMessage,
  confirmLabel = 'بەڵێ',
  cancelLabel = 'نەخێر',
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative transform transition-all scale-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2">
            {title}
          </h3>

          <p className="text-base sm:text-lg font-black text-red-600 mb-1">
            {message}
          </p>

          {subMessage && (
            <p className="text-xs text-slate-500 font-semibold mt-1 mb-4">
              {subMessage}
            </p>
          )}

          <div className="flex items-center gap-3 w-full mt-4">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmLabel}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
