import React, { useState } from 'react';

const EMERGENCY_CONTACTS = [
  { name: 'Emergency Services', number: '112', icon: 'local_police' },
  { name: 'Ambulance', number: '102', icon: 'ambulance' },
  { name: 'Fire', number: '101', icon: 'fire_truck' },
  { name: 'Women Helpline', number: '1091', icon: 'woman' },
  { name: 'Poison Control', number: '1066', icon: 'skull' },
];

export const EmergencyButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group animate-pulse hover:animate-none"
        title="Emergency Contacts"
      >
        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">sos</span>
        <span className="font-bold text-sm hidden group-hover:block whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs">
          EMERGENCY
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <span className="material-symbols-outlined">emergency_share</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-700">Emergency Contacts</h2>
                  <p className="text-xs text-red-500 font-medium">Tap to call immediately</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contact List */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {EMERGENCY_CONTACTS.map((contact, idx) => (
                <a
                  key={idx}
                  href={`tel:${contact.number}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 text-2xl">
                      {contact.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-red-700">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono group-hover:text-red-600">
                        {contact.number}
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Only use these numbers in case of genuine emergencies.
              </p>
            </div>
          </div>
          
          {/* Close on click outside */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
};
