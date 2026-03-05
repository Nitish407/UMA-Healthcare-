import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { arrayBufferToBase64, decodeAudioData } from '../utils/audio';

interface TranscriptionRecord {
  id: string;
  text: string;
  date: string;
}

export const VoiceRecords: React.FC = () => {
  const [mode, setMode] = useState<'transcribe' | 'tts'>('transcribe');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textRef = useRef(text);

  // Sync ref with text for interval access
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Load history and draft on mount, setup auto-save
  useEffect(() => {
    const saved = localStorage.getItem('nova_transcription_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Load auto-saved draft if exists
    const draft = localStorage.getItem('nova_voice_draft');
    if (draft) {
      setText(draft);
    }

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (textRef.current) {
        localStorage.setItem('nova_voice_draft', textRef.current);
        setLastSaved(new Date());
      }
    }, 30000);

    return () => {
        clearInterval(interval);
        stopAudio(); // Cleanup audio on unmount
    };
  }, []);

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const saveToHistory = (newText: string) => {
    const record: TranscriptionRecord = {
      id: Date.now().toString(),
      text: newText,
      date: new Date().toLocaleString()
    };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('nova_transcription_history', JSON.stringify(newHistory));
    
    // Also update draft immediately when saving to history
    localStorage.setItem('nova_voice_draft', newText);
  };

  const deleteRecord = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('nova_transcription_history', JSON.stringify(newHistory));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        
        mr.ondataavailable = (e) => chunksRef.current.push(e.data);
        mr.onstop = async () => {
          setLoading(true);
          const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
          const buffer = await blob.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);
          
          try {
            const result = await GeminiService.transcribeAudio(base64);
            const transcribedText = result || "Transcription empty.";
            
            setText(prev => {
                const newContent = prev ? prev + '\n\n' + transcribedText : transcribedText;
                localStorage.setItem('nova_voice_draft', newContent);
                return newContent;
            });

            if (transcribedText && transcribedText !== "Transcription empty.") {
                saveToHistory(transcribedText); 
            }
          } catch (e) {
            console.error(e);
            alert("Error transcribing audio.");
          } finally {
            setLoading(false);
            stream.getTracks().forEach(t => t.stop());
          }
        };
        mr.start();
        setIsRecording(true);
      } catch (e) {
        alert("Microphone access denied.");
      }
    }
  };

  const handleTTS = async () => {
    if (isPlaying) {
        stopAudio();
        return;
    }

    if (!text.trim()) return;
    setLoading(true);
    
    try {
      const base64 = await GeminiService.generateSpeech(text);
      if (base64) {
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for(let i=0; i<binary.length; i++) array[i] = binary.charCodeAt(i);
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;

        const audioBuffer = await decodeAudioData(array, audioCtx, 24000);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        sourceRef.current = source;
        
        source.onended = () => {
            setIsPlaying(false);
            sourceRef.current = null;
        };

        source.start();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
      alert("TTS Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => { setMode('transcribe'); stopAudio(); }}
              className={`flex-1 py-4 font-medium transition-colors ${mode === 'transcribe' ? 'bg-slate-50 text-slate-800 border-b-2 border-slate-800' : 'text-slate-500'}`}
            >
              Dictation (Speech to Text)
            </button>
            <button 
              onClick={() => { setMode('tts'); stopAudio(); }}
              className={`flex-1 py-4 font-medium transition-colors ${mode === 'tts' ? 'bg-slate-50 text-slate-800 border-b-2 border-slate-800' : 'text-slate-500'}`}
            >
              Read Aloud (Text to Speech)
            </button>
          </div>

          <div className="p-8">
            {mode === 'transcribe' ? (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                    <div 
                        className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${isRecording ? 'bg-red-500 animate-pulse' : loading ? 'bg-blue-100 cursor-wait' : 'bg-slate-100 hover:bg-slate-200'}`} 
                        onClick={!loading ? toggleRecording : undefined}
                    >
                        {loading ? (
                             <span className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>
                        ) : (
                            <span className={`material-symbols-outlined text-4xl ${isRecording ? 'text-white' : 'text-slate-600'}`}>
                                {isRecording ? 'stop' : 'mic'}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500">
                    {loading ? 'Transcribing audio... Please wait.' : isRecording ? 'Recording... Tap to stop.' : 'Tap mic to start dictating patient notes.'}
                    </p>
                    {text && (
                    <div className="text-left p-6 bg-slate-50 rounded-xl border border-slate-200 relative group">
                        <div className="absolute top-2 right-2 flex items-center space-x-2">
                             {lastSaved && (
                                <span className="text-[10px] text-slate-400 opacity-60">
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                             )}
                             <button 
                                onClick={() => {navigator.clipboard.writeText(text)}}
                                className="p-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy to clipboard"
                            >
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                        <p className="whitespace-pre-wrap text-slate-800">{text}</p>
                    </div>
                    )}
                </div>
                
                {/* History List */}
                {history.length > 0 && (
                    <div className="border-t border-slate-100 pt-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Transcriptions</h3>
                        <div className="space-y-4">
                            {history.map(record => (
                                <div key={record.id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors bg-white flex justify-between gap-4 group">
                                    <div className="flex-1">
                                        <div className="text-xs text-slate-400 mb-1">{record.date}</div>
                                        <p className="text-slate-700 text-sm line-clamp-2">{record.text}</p>
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => { setText(record.text); setMode('tts'); }}
                                            className="text-blue-500 hover:text-blue-700" 
                                            title="Read Aloud"
                                        >
                                            <span className="material-symbols-outlined text-lg">volume_up</span>
                                        </button>
                                        <button 
                                            onClick={() => setText(record.text)}
                                            className="text-slate-500 hover:text-slate-700" 
                                            title="View / Edit"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => deleteRecord(record.id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to convert to speech..."
                  className="w-full h-40 border border-slate-300 rounded-lg p-4 focus:ring-2 focus:ring-slate-500 outline-none resize-none"
                />
                
                <div className="flex flex-col items-center justify-center pt-4">
                    <button
                    onClick={handleTTS}
                    disabled={loading || !text.trim()}
                    className={`
                        relative flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all
                        ${isPlaying 
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl'
                        }
                        disabled:opacity-50 disabled:shadow-none
                    `}
                    >
                    {loading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Synthesizing...</span>
                        </>
                    ) : isPlaying ? (
                        <>
                           <span className="material-symbols-outlined animate-pulse">stop_circle</span>
                           <span>Stop Reading</span>
                        </>
                    ) : (
                        <>
                           <span className="material-symbols-outlined">volume_up</span>
                           <span>Read Aloud</span>
                        </>
                    )}
                    </button>

                    {isPlaying && (
                        <div className="mt-4 flex gap-1 h-4 items-end">
                            <div className="w-1 bg-slate-400 animate-[bounce_1s_infinite] h-2"></div>
                            <div className="w-1 bg-slate-400 animate-[bounce_1.2s_infinite] h-3"></div>
                            <div className="w-1 bg-slate-400 animate-[bounce_0.8s_infinite] h-4"></div>
                            <div className="w-1 bg-slate-400 animate-[bounce_1.1s_infinite] h-2"></div>
                            <div className="w-1 bg-slate-400 animate-[bounce_0.9s_infinite] h-3"></div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                     <span className="material-symbols-outlined text-blue-600">info</span>
                     <p className="text-xs text-blue-800 leading-relaxed">
                        This feature uses Gemini's advanced Text-to-Speech model to read your clinical notes aloud. 
                        Useful for reviewing dictations or auditory learning. The audio is generated in real-time.
                     </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};