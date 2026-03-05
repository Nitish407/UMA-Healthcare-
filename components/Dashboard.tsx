
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { View } from '../types';

export const Dashboard: React.FC<{ onViewChange: (v: View) => void }> = ({ onViewChange }) => {
  const [triageInput, setTriageInput] = useState('');
  const [triageResult, setTriageResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTriage = async () => {
    if (!triageInput.trim()) return;
    setLoading(true);
    try {
      const result = await GeminiService.quickTriage(triageInput);
      setTriageResult(result || "No response generated.");
    } catch (e) {
      setTriageResult("Error connecting to triage service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 h-full overflow-y-auto">
      <header className="flex justify-between items-end pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight drop-shadow-sm">
            Good Morning
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Your intelligent medical command center is ready.</p>
        </div>
      </header>

      {/* Quick Triage Widget - Glassmorphism 3D Floating Card */}
      <div className="relative group perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-3xl blur-2xl opacity-30 transform group-hover:scale-105 transition-all duration-700"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(252,211,77,0.3)] hover:-translate-y-1">
          {/* Decorative 3D elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-rose-300 to-orange-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          
          <div className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
                {/* 3D Icon Box */}
                <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30 transform rotate-3 border-t border-white/50">
                    <span className="material-symbols-outlined text-5xl text-white drop-shadow-md">bolt</span>
                </div>

                <div className="flex-1 space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Rapid AI Triage
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">Instant</span>
                    </h2>
                    <p className="text-slate-600">Describe your symptoms for an immediate assessment. Powered by Gemini Flash Lite for sub-second latency.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <div className="flex-1 relative group/input">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-xl blur opacity-25 group-hover/input:opacity-50 transition-opacity"></div>
                            <input 
                            type="text" 
                            value={triageInput}
                            onChange={(e) => setTriageInput(e.target.value)}
                            placeholder="e.g., Throbbing headache on the left side..."
                            className="relative w-full pl-5 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all shadow-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleTriage()}
                            />
                        </div>
                        <button 
                        onClick={handleTriage}
                        disabled={loading}
                        className="relative bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px] overflow-hidden group/btn"
                        >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Analyze</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </>
                        )}
                        </button>
                    </div>
                </div>
            </div>

            {triageResult && (
                <div className="mt-8 relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 to-yellow-300 rounded-2xl blur opacity-20"></div>
                    <div className="relative p-6 bg-white/60 backdrop-blur-md rounded-xl border border-amber-100/50 shadow-inner">
                         <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-1">Assessment Complete</h4>
                                <p className="text-slate-700 leading-relaxed text-sm md:text-base">{triageResult}</p>
                            </div>
                         </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Grid - 3D Cards */}
      <div>
          <div className="flex items-center gap-4 mb-6">
             <h3 className="text-xl font-bold text-slate-800">Modules</h3>
             <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            <DashboardCard 
              title="Live Doctor" 
              desc="Real-time consultation"
              subDesc="Voice Mode" 
              icon="graphic_eq" 
              fromColor="from-violet-500"
              toColor="to-fuchsia-600"
              shadowColor="shadow-fuchsia-500/40"
              onClick={() => onViewChange(View.LIVE_CONSULT)} 
            />
            <DashboardCard 
              title="Symptom Chat" 
              desc="Deep diagnostic history" 
              subDesc="Multimodal"
              icon="chat_bubble" 
              fromColor="from-blue-400"
              toColor="to-cyan-500"
              shadowColor="shadow-cyan-500/40"
              onClick={() => onViewChange(View.SYMPTOM_CHAT)} 
            />
            <DashboardCard 
              title="Medical Imaging" 
              desc="X-Ray & MRI Analysis"
              subDesc="Vision Pro" 
              icon="radiology" 
              fromColor="from-indigo-500"
              toColor="to-blue-600"
              shadowColor="shadow-indigo-500/40"
              onClick={() => onViewChange(View.IMAGING)} 
            />
            <DashboardCard 
              title="Find Care" 
              desc="Locate nearby specialists" 
              subDesc="Maps Grounding"
              icon="location_on" 
              fromColor="from-emerald-400"
              toColor="to-teal-600"
              shadowColor="shadow-teal-500/40"
              onClick={() => onViewChange(View.LOCATOR)} 
            />
            <DashboardCard 
              title="Research Hub" 
              desc="Search AIIMS Protocols"
              subDesc="Search Grounding" 
              icon="science" 
              fromColor="from-orange-400"
              toColor="to-red-500"
              shadowColor="shadow-orange-500/40"
              onClick={() => onViewChange(View.RESEARCH)} 
            />
            <DashboardCard 
              title="Anatomy Studio" 
              desc="Generate 3D Illustrations" 
              subDesc="Imagen 3"
              icon="human_body" 
              fromColor="from-pink-500"
              toColor="to-rose-600"
              shadowColor="shadow-rose-500/40"
              onClick={() => onViewChange(View.ANATOMY)} 
            />
             <DashboardCard 
              title="Voice Records" 
              desc="Dictation & TTS"
              subDesc="Auto-Save" 
              icon="mic" 
              fromColor="from-cyan-400"
              toColor="to-sky-500"
              shadowColor="shadow-sky-500/40"
              onClick={() => onViewChange(View.RECORDS)} 
            />
          </div>
      </div>
    </div>
  );
};

// The 3D Card Component
const DashboardCard = ({ title, desc, subDesc, icon, fromColor, toColor, shadowColor, onClick }: any) => (
  <button 
    onClick={onClick} 
    className="relative group perspective-1000 w-full text-left outline-none"
  >
    {/* 3D Hover Lift Container */}
    <div className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
        
        {/* Background Gradient Splash (Subtle) */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${fromColor} ${toColor} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>

        {/* 3D Icon Container - The "Object" */}
        <div className={`
            relative w-16 h-16 rounded-2xl mb-5 flex items-center justify-center
            bg-gradient-to-br ${fromColor} ${toColor}
            shadow-lg ${shadowColor}
            transform transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110
            border-t border-white/30
        `}>
            {/* Inner Glare */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50"></div>
            <span className="material-symbols-outlined text-3xl text-white drop-shadow-md relative z-10">{icon}</span>
        </div>

        {/* Content */}
        <div className="relative z-10">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{subDesc}</span>
            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>

        {/* Action Arrow */}
        <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${fromColor} ${toColor} flex items-center justify-center shadow-md`}>
                <span className="material-symbols-outlined text-white text-sm">arrow_forward</span>
            </div>
        </div>
    </div>
  </button>
);
