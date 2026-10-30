import React, { useState, useEffect } from 'react';
import { 
  googleSyncService, 
  GoogleUserProfile, 
  SyncDataPayload 
} from '../services/googleSyncService';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  FileSpreadsheet, 
  LogOut, 
  LogIn, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  getSyncPayload: () => SyncDataPayload;
  onRestoreData: (payload: SyncDataPayload) => void;
  onExportSheets: () => Promise<string>;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  getSyncPayload,
  onRestoreData,
  onExportSheets,
}) => {
  const [user, setUser] = useState<GoogleUserProfile | null>(googleSyncService.getUserProfile());
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('gdrive_last_synced_at') || null;
  });

  useEffect(() => {
    if (isOpen) {
      setUser(googleSyncService.getUserProfile());
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const profile = await googleSyncService.signIn();
      setUser(profile);
      setMessage({
        text: `تە ب سەرکەفتن ب هەژمارا (${profile.email}) بەستن ئەنجامدا!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setMessage({
        text: err.message || 'خەلەتیەک ڕوودا د چوونە ژوور دا ب هەژمارا Google',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    googleSyncService.signOut();
    setUser(null);
    setMessage({
      text: 'ژ هەژمارا Google دەرکەفتی.',
      type: 'info',
    });
  };

  const handleBackupToDrive = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const payload = getSyncPayload();
      const res = await googleSyncService.backupToDrive(payload);
      const now = new Date().toLocaleTimeString('ku-IQ', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(now);
      localStorage.setItem('gdrive_last_synced_at', now);

      setMessage({
        text: `داتایێن تە ب سەرکەفتن ل سەر Google Drive وەک پەڕگەیا (${res.fileName}) هاتنە پاشەکەفتکرن!`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'سەرنەکەفت د پاشەکەفتکرنا داتایان ل سەر Google Drive',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const payload = await googleSyncService.restoreFromDrive();
      if (!payload) {
        setMessage({
          text: 'چ پەڕگەیێن پشتیڤانیێ (Backup) ل سەر Google Drive هەتا نوکە نینن.',
          type: 'info',
        });
        return;
      }

      onRestoreData(payload);
      setMessage({
        text: 'داتایێن سجمێ ب سەرکەفتن ژ Google Drive هاتنە زڤڕاندن و نووکرن!',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'سەرنەکەفت د دابەزاندنا داتایان ژ Google Drive',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportToGoogleSheets = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const url = await onExportSheets();
      setMessage({
        text: `خشتێ تە ب سەرکەفتن ل سەر Google Sheets دروست بوو!`,
        type: 'success',
      });
      window.open(url, '_blank');
    } catch (err: any) {
      setMessage({
        text: err.message || 'سەرنەکەفت د دروستکرنا خشتێ Google Sheets دا',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>هەڤدەمسازیا Google (Drive & Sheets)</span>
              </h2>
              <p className="text-xs text-slate-400">پاشەکەفتکرن و زڤڕاندنا نمران ب ڕێکا Gmail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status message */}
          {message && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-start gap-3 transition-all ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : message.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
              }`}
            >
              {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {message.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {message.type === 'info' && <UserCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
              <div className="leading-relaxed">{message.text}</div>
            </div>
          )}

          {/* Account Status Card */}
          {user ? (
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-11 h-11 rounded-full ring-2 ring-sky-500/30" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-sky-500/20 text-sky-400 font-extrabold flex items-center justify-center text-base">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                      چوویە ژوور
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                  {lastSyncedAt && (
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      <span>دووا هەڤدەمسازی: {lastSyncedAt}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="دەرکەڤتن ژ هەژمارێ"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">دەرکەڤتن</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تۆڕا هەژمارا Google تە چالاک نینە</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  ب هەژمارا خو یا Gmail بچە ژوور دا کو هەمی داتایێن تە ئۆتۆماتیکی بێنە هەلبگرتن و ل سەر هەر مۆبایلەکێ بێنە زڤڕاندن.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>چوونە ژوور ب Gmail</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">کردارێن Google Drive & Sheets</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Backup to Drive */}
              <button
                onClick={handleBackupToDrive}
                disabled={loading}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-right group active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 transition-colors">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">پاشەکەفتکرن ب Drive</div>
                  <div className="text-[10px] text-slate-400">Save Backup to Drive</div>
                </div>
              </button>

              {/* Restore from Drive */}
              <button
                onClick={handleRestoreFromDrive}
                disabled={loading}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-right group active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">دابەزاندن ژ Drive</div>
                  <div className="text-[10px] text-slate-400">Restore Data from Drive</div>
                </div>
              </button>
            </div>

            {/* Export to Google Sheets */}
            <button
              onClick={handleExportToGoogleSheets}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 text-right group active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-200">هنارتن بۆ Google Sheets (خشتێ ئۆنلاین)</div>
                <div className="text-[10px] text-emerald-400/80">دروستکرنا خشتەکێ ڕاستەوخۆ ل سەر Google Sheets و ڤەکرنا وی</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
          <span>هاریکار ژ لایێ خودایێ مەزن ڤە</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
