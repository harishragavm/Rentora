import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  subtext?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'light',
  subtext,
  onClick
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const subtextClass = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Precision Geometric Monogram */}
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 shadow-subtle group`}>
        <svg 
          viewBox="0 0 40 40" 
          className="w-3/4 h-3/4 transition-transform duration-300 group-hover:scale-105" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Architectural Archway & R monogram */}
          <path 
            d="M12 10H22C26.4183 10 30 13.5817 30 18C30 22.4183 26.4183 26 22 26H12V10Z" 
            stroke="#0D9488" 
            strokeWidth="3.2" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path 
            d="M19 26L28 35" 
            stroke="#0D9488" 
            strokeWidth="3.2" 
            strokeLinecap="round"
          />
          <path 
            d="M12 24V35" 
            stroke="#0D9488" 
            strokeWidth="3.2" 
            strokeLinecap="round"
          />
          {/* Trust node core dot */}
          <circle cx="21" cy="18" r="2.5" fill="#F8FAFC" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold tracking-tight ${textClass} ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>
            RENTORA
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"></span>
        </div>
        {subtext ? (
          <span className={`font-medium tracking-wide uppercase text-slate-400 mt-0.5 ${subtextClass}`}>
            {subtext}
          </span>
        ) : (
          <span className={`font-medium tracking-wide uppercase text-slate-400 mt-0.5 ${subtextClass}`}>
            Rental & Living Platform
          </span>
        )}
      </div>
    </div>
  );
};

