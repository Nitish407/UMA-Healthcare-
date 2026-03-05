import React from 'react';

export const NovaHeartLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    {/* Outer Glow / Pulse */}
    <div className="absolute inset-0 bg-rose-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
    
    {/* Heart Container with Heartbeat Animation */}
    <div className="relative w-full h-full animate-heartbeat filter drop-shadow-md">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* Main Body Gradient - Creating depth from top-left to bottom-right */}
          <linearGradient id="heart3d_body" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ff5c8a" /> {/* Lighter Pink-Red Highlight */}
            <stop offset="40%" stopColor="#e0002b" /> {/* Core Red */}
            <stop offset="100%" stopColor="#7a0018" /> {/* Deep Shadow Red */}
          </linearGradient>
          
          {/* Glassy Glare Gradient */}
          <radialGradient id="heart3d_glare" cx="30%" cy="30%" r="45%">
             <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
             <stop offset="40%" stopColor="rgba(255,255,255,0.2)" />
             <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        
        {/* Heart Shape */}
        <path
          d="M50 92 C20 74 5 56 5 36 C5 19 19 8 34 8 C43 8 50 14 50 20 C50 14 57 8 66 8 C81 8 95 19 95 36 C95 56 80 74 50 92 Z"
          fill="url(#heart3d_body)"
          stroke="rgba(255,0,0,0.1)"
          strokeWidth="1"
        />
        
        {/* Large Glossy Reflection (Top Left) */}
        <ellipse cx="32" cy="28" rx="14" ry="8" fill="url(#heart3d_glare)" transform="rotate(-15 32 28)" />
        
        {/* Small Specular Dot (Top Right lobe) */}
        <circle cx="72" cy="28" r="2.5" fill="rgba(255,255,255,0.5)" />
        
        {/* Rim Light (Bottom Edge) */}
        <path
          d="M25 70 Q 50 88 75 70"
          fill="none"
          stroke="rgba(255,100,100,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  </div>
);