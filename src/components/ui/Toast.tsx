import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../../context/AppContext';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: string;
  type?: ToastType;
  titleBn: string;
  titleEn: string;
  messageBn?: string;
  messageEn?: string;
  reportId?: string;
  pin?: string;
  action?: {
    labelBn: string;
    labelEn: string;
    onClick: () => void;
  };
  duration?: number | null; // null = persistent until dismissed
}

export interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  language: Language;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, language }) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!toast) return null;

  const type = toast.type || 'success';

  const handleCopyReportId = () => {
    if (!toast.reportId) return;
    navigator.clipboard.writeText(toast.reportId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-600 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 dark:border-emerald-500/30';
      case 'warning':
        return 'border-amber-500/40 dark:border-amber-500/30';
      case 'error':
        return 'border-red-500/40 dark:border-red-500/30';
      case 'info':
      default:
        return 'border-blue-500/40 dark:border-blue-500/30';
    }
  };

  return (
    <aside
      id={`toast-notification-${toast.id}`}
      aria-label={language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notification'}
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={`w-full p-4 rounded-2xl bg-surface border ${getBorderColor()} shadow-2xl text-primary space-y-3 relative overflow-hidden backdrop-blur-md`}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-primary leading-tight">
                {language === 'bn' ? toast.titleBn : toast.titleEn}
              </h4>
              {(toast.messageBn || toast.messageEn) && (
                <p className="text-[13px] text-secondary mt-1 leading-snug">
                  {language === 'bn' ? toast.messageBn : toast.messageEn}
                </p>
              )}
            </div>
          </div>

          {/* Close / Dismiss button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label={language === 'bn' ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss notification'}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report ID Quick Reference & Copy Widget */}
        {toast.reportId && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-subtle border border-subtle">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                {language === 'bn' ? 'রিপোর্ট আইডি' : 'Report ID'}
              </span>
              <span className="text-[14px] font-mono font-bold text-primary truncate block">
                {toast.reportId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyReportId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-surface text-primary hover:bg-surface-hover border border-subtle transition-colors shrink-0 cursor-pointer"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কপি' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Button */}
        {toast.action && (
          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] hover:bg-[var(--ui-primary-action-hover)] transition-colors cursor-pointer shadow-2xs"
            >
              <span>{language === 'bn' ? toast.action.labelBn : toast.action.labelEn}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
