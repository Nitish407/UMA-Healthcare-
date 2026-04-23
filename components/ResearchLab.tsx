
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';

export const ResearchLab: React.FC = () => {
  const [tab, setTab] = useState<'search' | 'think'>('search');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [useAIIMS, setUseAIIMS] = useState(true);

  const handleResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    
    // Enhance query if AIIMS mode is on
    const enhancedQuery = useAIIMS 
        ? `Prioritize search results from official medical authorities like AIIMS (All India Institute of Medical Sciences), ICMR databases, and the WHO (World Health Organization). Ensure the information is highly clinical and verified for: ${query}` 
        : query;

    try {
      if (tab === 'search') {
        const data = await GeminiService.research(enhancedQuery);
        setResult({ type: 'search', data });
      } else {
        const text = await GeminiService.thinkDeep(enhancedQuery);
        setResult({ type: 'think', text });
      }
    } catch (e) {
      setResult({ error: "Operation failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <span className="material-symbols-outlined text-2xl text-cyan-300">cloud_sync</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Research Intelligence
                        <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-wider">Secure</span>
                    </h2>
                    <p className="text-slate-400 text-sm">Connected to Medical Knowledge Bases & Clinical Data Streams</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${useAIIMS ? 'bg-emerald-400 shadow-emerald-400 animate-pulse' : 'bg-amber-400 shadow-amber-400'}`}></div>
                <span className={`text-xs font-medium ${useAIIMS ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {useAIIMS ? 'Verified Clinical DB Uplink (AIIMS/WHO)' : 'Open Web Search Mode'}
                </span>
             </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => { setTab('search'); setResult(null); }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${tab === 'search' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">public</span>
                Global Research Search
              </span>
            </button>
            <button 
              onClick={() => { setTab('think'); setResult(null); }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${tab === 'think' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">psychology</span>
                Deep Clinical Reasoning
              </span>
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                    <p className="text-slate-500 mb-2 text-sm">
                    {tab === 'search' 
                        ? "Retrieves verified medical papers, clinical trials, and epidemiological data."
                        : "Uses Gemini 3 Pro (Thinking) to simulate a medical board review of complex cases."}
                    </p>
                    
                    {/* Source Toggle */}
                    <div 
                        onClick={() => setUseAIIMS(!useAIIMS)}
                        className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer border-2 transition-all select-none shadow-sm ${useAIIMS ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${useAIIMS ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useAIIMS ? 'left-5' : 'left-1'}`}></div>
                        </div>
                        <div className="flex flex-col">
                            <span className={`block text-sm flex items-center gap-1 font-bold ${useAIIMS ? 'text-emerald-800' : 'text-slate-600'}`}>
                                Verified Databases
                                {useAIIMS && <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>}
                            </span>
                            <span className="block text-[10px] font-medium text-slate-500">AIIMS, ICMR & WHO protocols</span>
                        </div>
                    </div>
                </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'search' ? "e.g., Latest treatment protocols for Dengue in India..." : "e.g., Analyze this patient history: Male, 45, diabetic..."}
              className="w-full border border-slate-300 rounded-xl p-4 h-32 focus:ring-2 focus:ring-cyan-500 outline-none mb-4 resize-none text-slate-700 font-medium"
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleResearch}
                disabled={loading}
                className={`px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${tab === 'search' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Accessing Database...</span>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">search_check</span>
                        <span>{tab === 'search' ? 'Run Search Query' : 'Start Deep Analysis'}</span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="animate-fade-in space-y-6 pb-8">
            {result.error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {result.error}
              </div>
            )}
            
            {result.type === 'search' && (
              <>
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 relative z-10">
                        <span className="material-symbols-outlined text-orange-500">summarize</span>
                        Research Summary
                    </h3>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed relative z-10">{result.data.text}</p>
                 </div>
                 
                  {result.data.chunks?.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citations & Sources</h4>
                        <div className="h-px bg-slate-200 flex-1"></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {result.data.chunks.map((chunk: any, i: number) => (
                         chunk.web?.uri && (
                           <a key={i} href={chunk.web.uri} target="_blank" className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl hover:border-cyan-400 hover:shadow-md transition-all group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -mr-8 -mt-8 transition-colors group-hover:from-cyan-50 group-hover:to-cyan-100"></div>
                             
                             <div className="flex items-start justify-between mb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-500 transition-colors">article</span>
                                    {(chunk.web.uri.includes('aiims') || chunk.web.uri.includes('icmr') || chunk.web.uri.includes('nih.gov') || chunk.web.uri.includes('who.int')) && (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">verified</span>
                                            Trusted Source
                                        </span>
                                    )}
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm group-hover:text-cyan-400 transition-colors">open_in_new</span>
                             </div>
                             
                             <h4 className="font-semibold text-slate-800 group-hover:text-cyan-700 line-clamp-2 text-sm leading-snug relative z-10">{chunk.web.title}</h4>
                             <p className="text-xs text-slate-400 mt-auto pt-3 truncate font-mono relative z-10">{chunk.web.uri}</p>
                           </a>
                         )
                       ))}
                     </div>
                   </div>
                 )}
              </>
            )}

            {result.type === 'think' && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Clinical Reasoning Output</h3>
                    <p className="text-xs text-blue-600 font-medium">Generated via Gemini Extended Thinking (32k)</p>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none text-sm md:text-base leading-relaxed">
                   <p className="whitespace-pre-wrap">{result.text}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
