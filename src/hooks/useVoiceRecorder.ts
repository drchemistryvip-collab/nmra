import { useState, useRef, useEffect, useCallback } from 'react';

export interface VoiceRecorderState {
  status: 'idle' | 'recording' | 'paused' | 'processing' | 'done' | 'error';
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioBase64: string | null;
  mimeType: string;
  volumeLevel: number; // 0 to 1 for soundwave
  error: string | null;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    status: 'idle',
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    audioBase64: null,
    mimeType: 'audio/webm',
    volumeLevel: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const updateVolume = useCallback(() => {
    if (!analyserRef.current || state.status !== 'recording') return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(1, avg / 80); // 0 to 1

    setState((prev) => ({ ...prev, volumeLevel: normalized }));
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, [state.status]);

  const startRecording = async () => {
    try {
      stopTracks();
      chunksRef.current = [];

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('وێبگەڕێ تە پشتەڤانییا دەستپێگەیشتنا مایکروفۆنی ناکەت.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (errFallback) {
        // Fallback to basic audio constraint without advanced processing
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Determine best supported mimeType
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      // Audio analysis for volume meter
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (e) {
        console.warn('AudioContext volume analysis not supported', e);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setState((prev) => ({
            ...prev,
            status: 'done',
            audioBlob: blob,
            audioUrl: url,
            audioBase64: base64String,
            mimeType,
            volumeLevel: 0,
            error: null,
          }));
        };
      };

      recorder.start(250); // collect in 250ms chunks

      setState({
        status: 'recording',
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        audioBase64: null,
        mimeType,
        volumeLevel: 0,
        error: null,
      });

      // Start duration timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.status !== 'recording') return prev;
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);

      // Start volume analysis
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    } catch (err: any) {
      console.warn('Error starting audio recorder:', err);
      const isDenied = err.name === 'NotAllowedError' || 
                       err.name === 'PermissionDeniedError' || 
                       String(err.message).toLowerCase().includes('permission denied');

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: isDenied
          ? 'رێپێدانا مایکروفۆنێ رەتکرایە. تکایە ل سەر نیشانا قفلێ یان مایکروفۆنێ ل سەرێ براوسەری بدە و "Allow / سەماحدان" هەلبژێرە، یان فایلا دەنگی باربکە.'
          : 'دەستپێگەیشتنا مایکروفۆنێ سەرنەکەفت: ' + (err.message || 'خەلەتیا نەدیار'),
      }));
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    stopTracks();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, status: 'paused' }));
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, status: 'recording' }));
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    }
  };

  const resetRecording = () => {
    stopRecording();
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      status: 'idle',
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      audioBase64: null,
      mimeType: 'audio/webm',
      volumeLevel: 0,
      error: null,
    });
  };

  const loadAudioFile = (file: File) => {
    stopRecording();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const url = URL.createObjectURL(file);
      setState({
        status: 'done',
        duration: 0,
        audioBlob: file,
        audioUrl: url,
        audioBase64: base64String,
        mimeType: file.type || 'audio/mp3',
        volumeLevel: 0,
        error: null,
      });
    };
  };

  const setProcessing = () => {
    setState((prev) => ({ ...prev, status: 'processing' }));
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    loadAudioFile,
    setProcessing,
  };
}
