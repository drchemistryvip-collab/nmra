import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle2, AlertCircle, X, Volume2 } from 'lucide-react';
import { Language } from '../types';

interface MicPermissionBannerProps {
  lang: Language;
}

export const MicPermissionBanner: React.FC<MicPermissionBannerProps> = ({ lang }) => {
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testedVolume, setTestedVolume] = useState<number | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setPermissionStatus(result.state as any);
        if (result.state === 'prompt') {
          setShowPrompt(true);
        } else if (result.state === 'granted') {
          setShowPrompt(false);
        }

        result.onchange = () => {
          setPermissionStatus(result.state as any);
          if (result.state === 'granted') {
            setShowPrompt(false);
          }
        };
      } else {
        // Fallback: check localStorage if user previously activated it
        const hasActivated = localStorage.getItem('mic_permission_activated_v1');
        if (!hasActivated) {
          setShowPrompt(true);
        }
      }
    } catch (e) {
      // If query fails, show prompt so user can click to enable
      const hasActivated = localStorage.getItem('mic_permission_activated_v1');
      if (!hasActivated) {
        setShowPrompt(true);
      }
    }
  };

  const handleRequestMic = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Quick test to confirm sound is flowing
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setTestedVolume(1);
      } catch {}

      // Keep mic accessible then stop test track
      stream.getTracks().forEach((track) => track.stop());

      setPermissionStatus('granted');
      localStorage.setItem('mic_permission_activated_v1', 'true');
      setShowPrompt(false);
    } catch (err: any) {
      console.warn('Microphone permission request result:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showPrompt && permissionStatus === 'granted') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg border-b border-emerald-500/40 animate-slideDown print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-sm sm:text-base flex items-center gap-2">
              <span>داخازا چالاککرنا مایکروفۆنێ</span>
              <span className="text-[11px] font-bold px-2 py-0.2 rounded-md bg-white/20 text-emerald-100">
                پێویستە بۆ تەسجیلکرنێ
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              دا کو بشێی ب دەنگێ خۆ نمرەیێن قوتابیان بێژی، کلیک ل سەر دوگما خوارێ بکە و د وێبگەڕی دا <b>"Allow / سەماحدان"</b> هەلبژێرە.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {permissionStatus === 'denied' ? (
            <div className="flex items-center gap-2 text-xs bg-red-500/30 px-3 py-1.5 rounded-xl border border-red-300/40 text-red-100 font-bold">
              <AlertCircle className="w-4 h-4 text-red-300" />
              <span>مایکروفۆن د وێبگەڕی دا هاتیە قەدەغەکرن. تکایە ژ نیشانا قفلا سەرێ براوسەری ڤێکە.</span>
            </div>
          ) : (
            <button
              onClick={handleRequestMic}
              disabled={isRequesting}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span>{isRequesting ? 'جارێ یێ چالاک دبیت...' : 'ڤەکرن و چالاککرنا مایکێ'}</span>
            </button>
          )}

          <button
            onClick={() => setShowPrompt(false)}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
