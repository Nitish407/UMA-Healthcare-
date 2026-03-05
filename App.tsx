import React, { useState, useEffect } from 'react';
import { View } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LiveConsultation } from './components/LiveConsultation';
import { SymptomChat } from './components/SymptomChat';
import { MedicalImaging } from './components/MedicalImaging';
import { HealthcareLocator } from './components/HealthcareLocator';
import { ResearchLab } from './components/ResearchLab';
import { AnatomyStudio } from './components/AnatomyStudio';
import { VoiceRecords } from './components/VoiceRecords';
import { UserProfileView } from './components/UserProfile';
import { NovaHeartLogo } from './components/Logo';
import { EmergencyButton } from './components/EmergencyButton';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on view change (for mobile)
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      
      {/* Emergency Button - Persistent Overlay */}
      <EmergencyButton />
      
      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar currentView={currentView} onViewChange={handleViewChange} />
        
        {/* Mobile Close Button (Inside Sidebar) */}
        <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-slate-600 p-2"
        >
            <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between flex-shrink-0">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
             >
                <span className="material-symbols-outlined">menu</span>
             </button>
             
             <div className="flex items-center gap-2">
                <NovaHeartLogo className="w-8 h-8" />
                <span className="font-bold text-slate-800">Nova Healthcare</span>
             </div>
             
             <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-hidden relative">
            {currentView !== View.DASHBOARD && (
                <button
                    onClick={() => setCurrentView(View.DASHBOARD)}
                    className="absolute top-4 right-4 md:top-6 md:right-8 z-50 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-all duration-200 group"
                    title="Exit to Dashboard"
                >
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">close</span>
                </button>
            )}
            
            {(() => {
                switch (currentView) {
                case View.DASHBOARD: return <Dashboard onViewChange={handleViewChange} />;
                case View.LIVE_CONSULT: return <LiveConsultation />;
                case View.SYMPTOM_CHAT: return <SymptomChat />;
                case View.IMAGING: return <MedicalImaging />;
                case View.LOCATOR: return <HealthcareLocator />;
                case View.RESEARCH: return <ResearchLab />;
                case View.ANATOMY: return <AnatomyStudio />;
                case View.RECORDS: return <VoiceRecords />;
                case View.PROFILE: return <UserProfileView />;
                default: return <Dashboard onViewChange={handleViewChange} />;
                }
            })()}
        </div>
      </main>
    </div>
  );
};

export default App;