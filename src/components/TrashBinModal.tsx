import React, { useState } from 'react';
import { ClearedRecordTrashItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  Layers, 
  Users,
  CheckCircle2,
  Trash
} from 'lucide-react';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: ClearedRecordTrashItem[];
  onRestoreItem: (item: ClearedRecordTrashItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAllTrash: () => void;
  lang: Language;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  onRestoreItem,
  onDeleteItem,
  onClearAllTrash,
  lang,
}) => {
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ckb-IQ', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        dir={lang === 'ku' ? 'rtl' : 'rtl'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 sm:p-6 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">
                  نمرەیێن ژێبری (سەلا زبڵێ)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 font-extrabold text-xs shadow-sm">
                  {trashItems.length}
                </span>
              </div>
              <p className="text-xs text-rose-100/90 font-medium mt-0.5">
                تۆمار و نمرەیێن ژێبری دەمکی ل سەر سجلێ هاتینە پاشەکەوتکرن دا کو بشێی دوبارە ب زڤڕینی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {trashItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                سەلا زبڵێ یا ڤالا یە!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                چ نمرەیێن ژێبری نینن. دەمێ تو نمرەیەکی یان ستوونەکێ پاک دکەی دێ ل ڤێرێ بۆ تە هێنە پاراستن.
              </p>
            </div>
          ) : (
            trashItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.type === 'g10_column' ? (
                      <FileSpreadsheet className="w-5 h-5" />
                    ) : item.type === 'g10_section' ? (
                      <Layers className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-800 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {item.sectionName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {item.studentCount} قوتابی / نمرە
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
                  {/* Restore Button */}
                  <button
                    onClick={() => onRestoreItem(item)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="دوبارە زڤڕاندن بۆ سەر سجلێ"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>دوبارە زڤڕاندن</span>
                  </button>

                  {/* Permanent Delete Button */}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer"
                    title="ژێبرنا دائیمی"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          {trashItems.length > 0 && (
            <div>
              {!confirmClearAll ? (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/80 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>پاقژکرنا سەرانسەری یا سەلا زبڵێ</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    دڵنیایی؟
                  </span>
                  <button
                    onClick={() => {
                      onClearAllTrash();
                      setConfirmClearAll(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    بەڵێ، هەمیا بسڕە
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    نەخێر
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer mr-auto"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
