import React, { useEffect, useRef, useState } from 'react';
import { GeminiService } from '../services/gemini';
import { createPcmBlob, decodeAudioData } from '../utils/audio';

export const LiveConsultation: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate average intensity for global pulsing
      let sum = 0;
      for(let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const intensity = average / 255;

      // Breathing animation (independent of audio)
      const time = Date.now() / 2000;
      const breathe = (Math.sin(time * Math.PI) * 0.5 + 0.5); // 0 to 1 oscillating
      
      // Base radius breathes, plus audio reaction
      const baseRadius = 40 + (breathe * 10) + (intensity * 20);
      
      // Create organic shape
      ctx.beginPath();
      
      // We'll use a subset of frequencies to keep the shape smoother
      // and mirror it for symmetry
      const points = [];
      const segments = 60; // Number of points on the circle
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        
        // Map segment to frequency index (focusing on lower-mid frequencies)
        // We wrap around the data to make it continuous
        const dataIndex = Math.floor(Math.abs(Math.sin(angle * 2)) * (bufferLength * 0.8));
        const value = dataArray[dataIndex] || 0;
        
        // Radius variation based on frequency
        const r = baseRadius + (value / 255) * 40;
        
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            // Smooth curve could be better, but small segments work well
            ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();

      // Gradient fill
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius + 40);
      gradient.addColorStop(0, `rgba(14, 165, 233, ${0.8 + intensity * 0.2})`); // Primary blue
      gradient.addColorStop(0.6, `rgba(99, 102, 241, ${0.4 + intensity * 0.4})`); // Indigo
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)'); // Transparent edge

      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Soft glow stroke
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner core
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + intensity * 0.2})`;
      ctx.fill();
    };
    draw();
  };

  const startSession = async () => {
    try {
      setConnecting(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const inputSource = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      inputSource.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioCtx.destination);
      
      drawVisualizer();

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Fix: Use a mutable ref for the promise to avoid circular dependency in closure
      const sessionPromiseRef: { current: Promise<any> | null } = { current: null };

      // Initialize Gemini Live Session
      const sessionPromise = GeminiService.connectLive({
        onopen: () => {
          setConnected(true);
          setConnecting(false);
          // Audio Processing Loop
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            
            if (sessionPromiseRef.current) {
              sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            }
          };
        },
        onmessage: async (message: any) => {
          // Handle Audio Output
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            setIsSpeaking(true);
            const buffer = await decodeAudioData(
                new Uint8Array(atob(audioData).split('').map(c => c.charCodeAt(0))),
                outputCtx
            );
            
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            
            const currentTime = outputCtx.currentTime;
            const startTime = Math.max(nextStartTimeRef.current, currentTime);
            source.start(startTime);
            nextStartTimeRef.current = startTime + buffer.duration;
            
            source.onended = () => {
                if (outputCtx.currentTime >= nextStartTimeRef.current) {
                    setIsSpeaking(false);
                }
            }
          }
        },
        onclose: () => {
          setConnected(false);
          setConnecting(false);
          cleanup();
        },
        onerror: (err: any) => {
          console.error(err);
          setError("Connection lost or failed.");
          setConnected(false);
          setConnecting(false);
          cleanup();
        }
      });
      
      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or connect to Gemini.");
      setConnecting(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setConnected(false);
    setConnecting(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50 z-10">
        <div className="p-8 md:p-12 text-center space-y-8">
          
          <div className="relative mx-auto h-48 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
             {connected ? (
               <canvas ref={canvasRef} width="600" height="200" className="w-full h-full object-cover" />
             ) : (
               <div className="flex flex-col items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-6xl mb-2">graphic_eq</span>
                  <span className="text-sm">Audio Visualizer Ready</span>
               </div>
             )}
             
             {/* Status overlay */}
             {connected && (
               <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-medium text-green-600 border border-green-100">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>Live</span>
               </div>
             )}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              {connected ? 'Dr. Nova is Listening' : 'Medical Consultation'}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              {connected 
                ? 'Speak naturally about your symptoms. The AI doctor is analyzing your voice in real-time.' 
                : 'Experience a low-latency voice conversation with our advanced medical AI agent.'}
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={connected ? cleanup : startSession}
              disabled={connecting}
              className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${
                connected 
                  ? 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100' 
                  : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg hover:shadow-primary-500/30'
              }`}
            >
              {connecting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl">
                    {connected ? 'call_end' : 'medical_services'}
                  </span>
                  <span>{connected ? 'End Consultation' : 'Start Consultation'}</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50/50 p-4 text-xs text-center text-slate-400 border-t border-slate-100 flex justify-center gap-4">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">speed</span> 16kHz Audio Input</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">graphic_eq</span> 24kHz Audio Output</span>
        </div>
      </div>
    </div>
  );
};