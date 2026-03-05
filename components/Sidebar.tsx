import React, { useState } from 'react';
import { View } from '../types';
import { NovaHeartLogo } from './Logo';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavItem = ({ view, label, icon, current, onClick }: any) => {
    const isActive = current === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${
            isActive 
                ? 'bg-gradient-to-r from-rose-50 to-white text-rose-600 font-bold shadow-[0_4px_12px_rgba(253,164,175,0.3)] translate-x-1' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1'
            }`}
        >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-rose-500 rounded-r-full shadow-lg shadow-rose-200"></div>}
            
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <span className={`material-symbols-outlined text-xl ${isActive ? 'filled-icon' : ''}`}>{icon}</span>
            </div>
            
            <span className="text-sm tracking-wide">{label}</span>
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const NAV_ITEMS = [
    { view: View.DASHBOARD, label: "Dashboard", icon: "dashboard" },
    { view: View.LIVE_CONSULT, label: "Live Doctor", icon: "graphic_eq" },
    { view: View.SYMPTOM_CHAT, label: "Symptom Chat", icon: "chat_bubble" },
    { view: View.IMAGING, label: "Medical Imaging", icon: "radiology" },
    { view: View.RECORDS, label: "Voice Records", icon: "mic" },
    { view: View.LOCATOR, label: "Find Care", icon: "location_on" },
    { view: View.RESEARCH, label: "Research Hub", icon: "science" },
    { view: View.ANATOMY, label: "Anatomy Studio", icon: "human_body" },
  ];

  const filteredItems = NAV_ITEMS.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 h-full bg-[#f8f9fa] border-r border-slate-200/60 flex flex-col py-6 flex-shrink-0 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <div className="flex items-center space-x-3 px-6 mb-6">
        <NovaHeartLogo className="w-12 h-12" />
        <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              Nova
            </h1>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">Healthcare</span>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
            <input 
                type="text" 
                placeholder="Search modules..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
            />
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto px-4 custom-scrollbar">
        {searchQuery ? (
            <div className="space-y-1">
                <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Search Results</div>
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <NavItem key={item.view} view={item.view} label={item.label} icon={item.icon} current={currentView} onClick={onViewChange} />
                    ))
                ) : (
                    <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        No modules found
                    </div>
                )}
            </div>
        ) : (
            <>
                <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Core Modules</div>
                <NavItem view={View.DASHBOARD} label="Dashboard" icon="dashboard" current={currentView} onClick={onViewChange} />
                <NavItem view={View.LIVE_CONSULT} label="Live Doctor" icon="graphic_eq" current={currentView} onClick={onViewChange} />
                
                {/* Features Section (Combines Diagnostics & Tools) */}
                <div className="mt-4 pt-2 border-t border-slate-100">
                    <button 
                        onClick={() => setFeaturesOpen(!featuresOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all group"
                    >
                        <span className="group-hover:text-slate-600 transition-colors">All Features</span>
                        <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${featuresOpen ? 'rotate-180' : ''} text-slate-400 group-hover:text-slate-600`}>expand_more</span>
                    </button>
                    
                    <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${featuresOpen ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <NavItem view={View.SYMPTOM_CHAT} label="Symptom Chat" icon="chat_bubble" current={currentView} onClick={onViewChange} />
                        <NavItem view={View.IMAGING} label="Medical Imaging" icon="radiology" current={currentView} onClick={onViewChange} />
                        <NavItem view={View.RECORDS} label="Voice Records" icon="mic" current={currentView} onClick={onViewChange} />
                        <NavItem view={View.LOCATOR} label="Find Care" icon="location_on" current={currentView} onClick={onViewChange} />
                        <NavItem view={View.RESEARCH} label="Research Hub" icon="science" current={currentView} onClick={onViewChange} />
                        <NavItem view={View.ANATOMY} label="Anatomy Studio" icon="human_body" current={currentView} onClick={onViewChange} />
                    </div>
                </div>
            </>
        )}
      </div>

      <div className="mt-auto px-6 pt-6 border-t border-slate-200/60">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm mb-4 relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute -right-4 -top-4 w-12 h-12 bg-green-100 rounded-full blur-xl group-hover:bg-green-200 transition-colors"></div>
             <div className="flex items-center space-x-2 mb-2">
                 <div className="relative flex h-2.5 w-2.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-lg shadow-green-500/50"></span>
                 </div>
                 <span className="text-xs font-bold text-slate-700">System Online</span>
             </div>
             <div className="text-[10px] text-slate-500 font-medium leading-tight">
                Powered by Gemini 3.0 Pro & Flash
             </div>
        </div>

        <div className="text-[10px] text-slate-400 space-y-1 pb-2 border-t border-slate-100 pt-4">
            <p className="font-bold text-slate-500">Developed by Nitish Mishra</p>
            <p className="font-medium text-slate-500">UMA Tech AI Gorakhpur</p>
            <p className="leading-tight">Gram Post Majhauna Campierganj<br/>Utter Pradesh 273165</p>
            <p className="pt-1 break-all">nitishmishranitishmishra94@gmail.com</p>
            <p>+91 91292 22016, +91 72359 64954</p>
        </div>
      </div>
    </div>
  );
};