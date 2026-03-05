import React, { useState, useEffect, useCallback } from 'react';
import { GeminiService } from '../services/gemini';

const QUICK_FILTERS = [
  { id: 'pharmacy', label: 'Medical Stores', icon: 'storefront', query: 'medical stores and pharmacies with opening hours and phone numbers' },
  { id: 'hospital', label: 'Hospitals', icon: 'local_hospital', query: 'hospitals and emergency centers' },
  { id: 'clinic', label: 'Clinics', icon: 'medical_services', query: 'specialist clinics' },
  { id: 'lab', label: 'Pathology Labs', icon: 'biotech', query: 'diagnostic pathology labs' },
];

export const HealthcareLocator: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ text: string; chunks: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string, filterId: string | null = null) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setStatus('Acquiring your location...');

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setStatus('Scanning nearby facilities via Google Maps...');
          
          // Refined prompt to explicitly request phone numbers and hours with visual formatting
          const enhancedQuery = `Find ${searchQuery} near me. 
For each location, strictly provide the following details in this format:

📍 **[Location Name]**
🕒 **Hours:** [Open/Closed Status] - [Specific Opening Hours]
📞 **Phone:** [Contact Number] (Please explicitly state "Not available" if missing)
maps_home_work **Address:** [Short Address]

If searching for **Medical Stores** or **Pharmacies**, prioritize those that are **Open Now** or **24 Hours**.
`;
          
          const data = await GeminiService.findNearby(enhancedQuery, location);
          setResults(data);
          if (filterId) setActiveFilter(filterId);
        } catch (e) {
          setError("Failed to connect to Nova services.");
        } finally {
          setLoading(false);
          setStatus('');
        }
      },
      (err) => {
        let msg = "Location access denied.";
        if (err.code === 1) msg = "Please allow location access to find nearby hospitals.";
        else if (err.code === 2) msg = "Location unavailable. Please check your GPS.";
        else if (err.code === 3) msg = "Location request timed out.";
        setError(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Initial search
  useEffect(() => {
    // Default search on mount
    performSearch('hospitals, pharmacies, and medical stores');
  }, [performSearch]);

  const handleManualSearch = () => {
    if (!query.trim()) return;
    setActiveFilter(null);
    performSearch(query);
  };

  const handleFilterClick = (filter: typeof QUICK_FILTERS[0]) => {
    setQuery(filter.query);
    performSearch(filter.query, filter.id);
  };

  // Helper to render text with basic formatting
  const renderResultText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Phone Number
      const phoneMatch = line.match(/📞 \*\*Phone:\*\* (.*)/);
      if (phoneMatch) {
        const number = phoneMatch[1];
        const cleanNumber = number.replace(/[^\d+]/g, '');
        const isNotAvailable = number.toLowerCase().includes('not available');
        
        return (
          <div key={i} className="mb-2 flex items-center text-sm ml-1">
             <span className="material-symbols-outlined text-emerald-600 mr-2 text-[18px]">call</span>
             <span className="font-semibold text-slate-700 mr-2">Phone:</span>
             {!isNotAvailable && cleanNumber.length > 5 ? (
               <a href={`tel:${cleanNumber}`} className="text-emerald-600 hover:text-emerald-700 hover:underline font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 transition-colors">
                 {number}
               </a>
             ) : (
               <span className="text-slate-500 italic">{number}</span>
             )}
          </div>
        );
      }
      
      // Location Name (Header)
      if (line.startsWith('📍')) {
          const name = line.replace('📍', '').replace(/\*\*/g, '').trim();
          return (
            <div key={i} className="mt-6 first:mt-0 mb-3 pb-2 border-b border-slate-100">
                <h4 className="font-bold text-lg text-slate-800 flex items-center">
                    <span className="material-symbols-outlined text-rose-500 mr-2">location_on</span>
                    {name}
                </h4>
            </div>
          );
      }
      
      // Hours
      if (line.startsWith('🕒')) {
          const hours = line.replace('🕒', '').replace(/\*\*/g, '').replace('Hours:', '').trim();
          return (
            <div key={i} className="mb-1 flex items-start text-sm ml-1">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">schedule</span>
                <span className="font-semibold text-slate-700 mr-2">Hours:</span>
                <span className="text-slate-600">{hours}</span>
            </div>
          );
      }

      // Address
      if (line.includes('maps_home_work')) {
         const address = line.replace('maps_home_work', '').replace(/\*\*/g, '').replace('Address:', '').trim();
         return (
            <div key={i} className="mb-1 flex items-start text-sm ml-1">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">map</span>
                <span className="font-semibold text-slate-700 mr-2">Address:</span>
                <span className="text-slate-600">{address}</span>
            </div>
         );
      }

      // Empty lines or other text
      if (!line.trim()) return <div key={i} className="h-2"></div>;

      return <div key={i} className="text-slate-600 text-sm pl-8">{line}</div>;
    });
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-6">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">add_location_alt</span>
             </div>
             <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Care Locator</h2>
                <p className="text-slate-500 text-xs md:text-sm">Find nearby medical services with real-time Google Maps data.</p>
             </div>
          </div>
          
          {/* Quick Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {QUICK_FILTERS.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        activeFilter === filter.id 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                >
                    <span className="material-symbols-outlined text-2xl mb-1">{filter.icon}</span>
                    <span className="text-xs font-semibold">{filter.label}</span>
                </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 relative">
            <div className="flex-1 relative">
                <span className="absolute left-4 top-3.5 text-slate-400 material-symbols-outlined">search</span>
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (e.g., 'Medical Store', '24hr Pharmacy', 'Cardiologist')"
                className="w-full pl-12 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
            </div>
            <button
              onClick={handleManualSearch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Scanning...</span>
                  </>
              ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    <span>Find</span>
                  </>
              )}
            </button>
          </div>
          
          {status && loading && (
            <div className="mt-4 flex items-center justify-center text-emerald-600 text-sm animate-pulse bg-emerald-50 p-2 rounded-lg">
                <span className="material-symbols-outlined text-base mr-2">satellite_alt</span>
                {status}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined">location_disabled</span>
                {error}
                <button onClick={() => performSearch(query)} className="ml-auto text-sm underline hover:text-red-900">Retry</button>
            </div>
          )}
        </div>

        {results && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in pb-8">
             {/* Gemini Text Summary */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-emerald-600">smart_toy</span>
                    <h3 className="font-bold text-slate-800">Nova Intelligence Report</h3>
                </div>
                <div className="text-slate-700 leading-relaxed text-sm md:text-base font-medium">
                    {renderResultText(results.text)}
                </div>
             </div>

             {/* No Results Found State */}
             {(!results.chunks || results.chunks.length === 0) && (
               <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <span className="material-symbols-outlined text-3xl">location_off</span>
                  </div>
                  <h3 className="text-slate-600 font-bold mb-1">No medical facilities found</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                      We couldn't locate any facilities matching your criteria in this area. Try adjusting your search terms.
                  </p>
               </div>
             )}

             {/* Maps Grounding Chunks */}
             {results.chunks && results.chunks.length > 0 && (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">map</span>
                        Verified Locations
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">Google Maps Data</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {results.chunks.map((chunk, idx) => {
                   const place = chunk.web?.uri ? chunk.web : chunk.maps;
                   if (!place) return null;
                   
                   return (
                     <a 
                       key={idx} 
                       href={place.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden"
                     >
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-emerald-600">storefront</span>
                       </div>
                       
                       <div className="relative z-10">
                         <div className="flex justify-between items-start">
                             <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">location_on</span>
                             </div>
                         </div>
                         
                         <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 text-lg mb-1 line-clamp-1">{place.title}</h4>
                         <p className="text-xs text-slate-400 truncate mb-4 font-mono">{place.uri}</p>
                         
                         <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-full group-hover:bg-emerald-100 transition-colors">
                            <span>Open in Maps</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                         </div>
                       </div>
                     </a>
                   );
                 })}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};