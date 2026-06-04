'use client';

import React from 'react';
import { useToastStore, Toast } from '../store/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-danger shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-gold shrink-0" />;
    }
  };

  const getBorderColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-success/30 bg-parchment';
      case 'error':
        return 'border-danger/30 bg-parchment';
      default:
        return 'border-gold/30 bg-parchment';
    }
  };

  return (
    <div className="fixed z-9999 flex flex-col gap-3 w-full max-w-sm p-4 pointer-events-none sm:top-4 sm:right-4 top-auto bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-stardust-reveal ${getBorderColor(
            toast.type
          )}`}
        >
          {getIcon(toast.type)}
          
          <div className="flex-1 font-sans text-xs text-ink leading-relaxed">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-mist hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
