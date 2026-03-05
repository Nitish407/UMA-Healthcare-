import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';

export const AnatomyStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Zoom and Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog closes, or re-check
      const has = await window.aistudio.hasSelectedApiKey();
      setHasKey(has);
    } else {
      alert("API Key selection is not available in this environment.");
    }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    
    if (!hasKey) {
        await handleConnectKey();
        if (!await window.aistudio.hasSelectedApiKey()) return;
    }

    setLoading(true);
    setImage(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    
    try {
      const imgData = await GeminiService.generateAnatomyImage(prompt, aspectRatio);
      if (imgData) setImage(imgData);
    } catch (e) {
      console.error(e);
      alert('Failed to generate image. Ensure you have selected a Paid API Key.');
    } finally {
      setLoading(false);
    }
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (!image) return;
    // e.preventDefault(); // React synthetic events might not support this depending on attachment, but often fine.
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + scaleAmount), 5);
    setZoom(newZoom);
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const ratios = [
    { value: '1:1', label: 'Square', description: 'Social media & avatars' },
    { value: '3:4', label: 'Portrait', description: 'Mobile displays' },
    { value: '4:3', label: 'Standard', description: 'Classic presentations' },
    { value: '16:9', label: 'Widescreen', description: 'Presentations & video' },
    { value: '9:16', label: 'Vertical', description: 'Stories & mobile' }
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-1/3 space-y-6 flex-shrink-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Anatomy Studio</h2>
            <p className="text-slate-500 text-sm mb-6">Generate detailed medical illustrations for patient education.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Detailed cross-section of the human heart, showing valves and chambers..."
                  className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-1 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        aspectRatio === r.value 
                          ? 'bg-pink-50 border-pink-500 ring-1 ring-pink-500' 
                          : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className={`block text-xs font-bold ${aspectRatio === r.value ? 'text-pink-700' : 'text-slate-700'}`}>
                          {r.value} - {r.label}
                        </span>
                        <span className={`block text-[10px] ${aspectRatio === r.value ? 'text-pink-600/80' : 'text-slate-500'}`}>
                          {r.description}
                        </span>
                      </div>
                      {aspectRatio === r.value && (
                        <span className="material-symbols-outlined text-pink-600 text-lg">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 mt-4 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Generating Illustration...</span>
                    </>
                ) : 'Generate 3D Model'}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Interactive Viewer</p>
                    <p className="text-blue-700/80 text-xs">Use your mouse wheel to zoom in/out. Click and drag to pan around the generated image to inspect details.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Panel: Viewer */}
        <div className="w-full lg:w-2/3 h-full min-h-[500px] flex flex-col">
          <div 
            className={`
                relative flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center
                ${image ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}
            `}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Grid Background Pattern for professional look */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {loading ? (
              <div className="text-center z-10">
                 <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-slate-500 font-medium animate-pulse">Rendering high-fidelity anatomy...</p>
              </div>
            ) : image ? (
              <>
                  <img 
                    src={image} 
                    alt="Generated Anatomy" 
                    draggable={false}
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0,0,0.2,1)'
                    }}
                    className="max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg select-none pointer-events-none origin-center" 
                  />
                  
                  {/* Floating Controls */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full shadow-lg px-4 py-2 flex items-center gap-4 z-20">
                     <button 
                        onClick={() => adjustZoom(-0.25)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Zoom Out"
                     >
                        <span className="material-symbols-outlined text-xl">remove</span>
                     </button>
                     <span className="text-xs font-mono font-medium text-slate-500 min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
                     <button 
                        onClick={() => adjustZoom(0.25)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                        title="Zoom In"
                     >
                        <span className="material-symbols-outlined text-xl">add</span>
                     </button>
                     <div className="w-px h-4 bg-slate-300 mx-1"></div>
                     <button 
                        onClick={resetView}
                        className="text-xs font-bold text-slate-500 hover:text-pink-600 uppercase tracking-wider px-2"
                     >
                        Reset
                     </button>
                  </div>
              </>
            ) : (
              <div className="text-center text-slate-400 z-10">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <span className="material-symbols-outlined text-5xl text-slate-400">human_body</span>
                </div>
                <p className="text-lg font-medium text-slate-500">Ready to Visualize</p>
                <p className="text-sm opacity-70">Enter a prompt to generate a 3D anatomical model</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};