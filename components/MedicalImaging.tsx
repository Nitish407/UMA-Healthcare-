import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';

export const MedicalImaging: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'image' | 'video'>('image');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(selected);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const base64 = preview.split(',')[1];
      let analysis = '';
      
      if (mode === 'image') {
        analysis = await GeminiService.analyzeImage(base64, "Analyze this medical image in detail. Identify potential anomalies.");
      } else {
        analysis = await GeminiService.analyzeVideo(base64, "Analyze this medical video clip. Describe movement, gait, or visible symptoms.", file.type);
      }
      
      setResult(analysis || "Analysis failed.");
    } catch (e) {
      setResult("Error analyzing media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Visual Diagnostics</h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => { setMode('image'); setFile(null); setPreview(null); setResult(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'image' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'}`}
            >
              Image
            </button>
            <button 
              onClick={() => { setMode('video'); setFile(null); setPreview(null); setResult(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'video' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'}`}
            >
              Video
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
            <input 
              type="file" 
              accept={mode === 'image' ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
               mode === 'image' ? (
                 <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-sm" />
               ) : (
                 <video src={preview} controls className="max-h-64 mx-auto rounded-lg shadow-sm" />
               )
            ) : (
              <div className="py-8">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                  {mode === 'image' ? 'add_photo_alternate' : 'video_library'}
                </span>
                <p className="text-slate-500">
                  Click to upload {mode === 'image' ? 'a medical scan or photo' : 'a short video clip'}
                </p>
                <p className="text-xs text-slate-400 mt-2">Supported formats: {mode === 'image' ? 'JPG, PNG' : 'MP4, WebM'}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{loading ? 'Analyzing...' : 'Run Analysis'}</span>
            </button>
          </div>

          {result && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Diagnostic Report</h3>
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-slate-800 leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
