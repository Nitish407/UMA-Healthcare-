import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { ChatMessage } from '../types';

export const SymptomChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Camera Error State
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDisabled, setCameraDisabled] = useState(!navigator.mediaDevices?.getUserMedia);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, selectedImages]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Restart camera when facing mode changes if it's already open
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
  }, [facingMode]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setSelectedImages(prev => [...prev, ev.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Camera Functions
  const startCamera = async () => {
    setCameraError(null);
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait for render cycle to attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera Error:", err);
      let errorMessage = "Could not access camera. Please check your device settings.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         errorMessage = "Camera access denied. Please enable camera permissions in your browser.";
         setCameraDisabled(true);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
         errorMessage = "No camera device found on this system.";
         setCameraDisabled(true);
      }
      
      setCameraError(errorMessage);
      setIsCameraOpen(false);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => setCameraError(null), 5000);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImages(prev => [...prev, dataUrl]);
        stopCamera();
      }
    }
  };

  const analyzeMessageSentiment = async (msgId: string, text: string) => {
    try {
      const sentiment = await GeminiService.analyzeSentiment(text);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, sentiment } : m));
    } catch (e) {
      console.error("Sentiment analysis failed", e);
    }
  };

  const toggleResolved = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isResolved: !m.isResolved } : m));
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;
    
    const currentImages = [...selectedImages];
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      images: currentImages.length > 0 ? currentImages : undefined,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImages([]);
    setLoading(true);

    // Analyze User Sentiment in background
    if (userMsg.text) {
        analyzeMessageSentiment(userMsg.id, userMsg.text);
    }

    try {
      const response = await GeminiService.chat(userMsg.text, currentImages, messages);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || "I couldn't generate a response.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Analyze Model Sentiment
      analyzeMessageSentiment(aiMsg.id, aiMsg.text);
      
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch(sentiment) {
        case 'positive': return 'bg-emerald-400 shadow-emerald-200';
        case 'negative': return 'bg-rose-500 shadow-rose-200';
        case 'neutral': return 'bg-slate-400 shadow-slate-200';
        default: return 'bg-transparent';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <video 
              ref={videoRef} 
              className="w-full h-auto object-cover" 
              autoPlay 
              playsInline 
              muted
            />
            
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-8">
               <button 
                 onClick={stopCamera}
                 className="p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors backdrop-blur-md"
               >
                 <span className="material-symbols-outlined text-2xl">close</span>
               </button>
               
               <button 
                 onClick={capturePhoto}
                 className="p-1 rounded-full border-4 border-white/30 hover:border-white/60 transition-all"
               >
                 <div className="w-16 h-16 bg-white rounded-full hover:scale-95 transition-transform"></div>
               </button>

               <button 
                 onClick={switchCamera}
                 className="p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors backdrop-blur-md"
               >
                 <span className="material-symbols-outlined text-2xl">cameraswitch</span>
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
              <p>Start a conversation about your symptoms.</p>
              <p className="text-xs mt-2 text-slate-300">You can upload images or take photos for analysis.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : msg.isError 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
            }`}>
              {msg.images && msg.images.length > 0 && (
                <div className={`grid gap-2 mb-3 ${msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {msg.images.map((img, i) => (
                    <a 
                      key={i} 
                      href={img} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`block rounded-xl overflow-hidden focus:outline-none border ${msg.role === 'user' ? 'border-primary-400/50 hover:border-primary-300' : 'border-slate-200 hover:border-slate-300'} transition-colors`}
                    >
                      <img 
                        src={img} 
                        alt="Attachment" 
                        className={`w-full object-cover hover:opacity-90 transition-opacity ${msg.images.length === 1 ? 'max-h-72' : 'h-32 bg-slate-50'}`} 
                      />
                    </a>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              
              <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/20">
                  {/* Mark as Resolved Task Button */}
                  {msg.role === 'user' && (
                      <button
                        onClick={() => toggleResolved(msg.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
                            msg.isResolved 
                                ? 'bg-green-400 border-green-400 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                                : 'bg-transparent border-white/60 hover:bg-white/20 hover:scale-105 active:scale-95'
                        }`}
                        title={msg.isResolved ? "Symptom Marked as Resolved" : "Mark Symptom as Resolved"}
                      >
                         <span className={`material-symbols-outlined text-[14px] font-bold text-white transition-all duration-500 transform ${
                             msg.isResolved 
                                ? 'opacity-100 scale-100 rotate-0' 
                                : 'opacity-0 scale-50 -rotate-90'
                         }`}>
                             check
                         </span>
                      </button>
                  )}

                  {/* Sentiment Dot */}
                  {msg.sentiment && (
                    <div 
                        className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${getSentimentColor(msg.sentiment)}`}
                        title={`Sentiment: ${msg.sentiment}`}
                    ></div>
                  )}
                  <span className="text-[10px] opacity-70 font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        {/* Camera Error Message */}
        {cameraError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-xs text-red-800 animate-pulse">
                <span className="material-symbols-outlined text-sm mt-0.5 text-red-600">no_photography</span>
                <p><strong>Camera Error:</strong> {cameraError}</p>
            </div>
        )}

        {/* Medical Disclaimer */}
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2 text-xs text-amber-800">
            <span className="material-symbols-outlined text-sm mt-0.5 text-amber-600">warning</span>
            <p>
                <strong>Nova is an AI assistant, not a doctor.</strong> Information is for educational purposes only. 
                In case of emergency, please use the <span className="font-bold text-red-600">Emergency Button</span> or call 112 immediately.
            </p>
        </div>

        <div className="flex space-x-2 items-end">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleImageSelect}
          />
          
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Attach images"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          
          {/* Camera Button */}
          <button
            onClick={startCamera}
            disabled={cameraDisabled}
            className={`p-3 rounded-lg transition-colors ${cameraDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-primary-600 hover:bg-slate-50'}`}
            title={cameraDisabled ? "Camera unavailable or permission denied" : "Take Photo"}
          >
            <span className="material-symbols-outlined">
                {cameraDisabled ? 'no_photography' : 'photo_camera'}
            </span>
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="Describe your symptoms..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none max-h-32 min-h-[46px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && selectedImages.length === 0)}
            className="bg-primary-600 hover:bg-primary-700 text-white w-12 h-12 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-md flex-shrink-0"
          >
            {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
                <span className="material-symbols-outlined">send</span>
            )}
          </button>
        </div>

        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0 group">
                <img src={img} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-transform transform hover:scale-110"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};