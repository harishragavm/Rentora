import React from 'react';
import { Layers } from 'lucide-react';
import type { AuthStage, UserRole } from '../types/auth';

interface FlowNavbarProps {
  currentStage: AuthStage;
  currentRole: UserRole;
  onJumpStage: (stage: AuthStage) => void;
  onToggleRole: (role: UserRole) => void;
}

export const FlowNavbar: React.FC<FlowNavbarProps> = ({
  currentStage,
  currentRole,
  onJumpStage,
  onToggleRole,
}) => {
  const stages: { id: AuthStage; label: string; step: number }[] = [
    { id: 'portal', label: '1. Role Selection', step: 1 },
    { id: 'auth-form', label: '2. Authentication', step: 2 },
    { id: 'otp-verification', label: '3. OTP Verification', step: 3 },
    { id: 'security-check', label: '4. Risk & Security', step: 4 },
    { id: 'dashboard', label: '5. Dashboard', step: 5 },
  ];

  return (
    <nav aria-label="Authentication Flow Controls" className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Flow Stage Indicator Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-teal-400" /> Pipeline:
          </span>
          {stages.map((st) => {
            const isActive = currentStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => onJumpStage(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600/90 text-white shadow-sm ring-1 ring-teal-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Persona quick switch */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Role:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => onToggleRole('user')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                currentRole === 'user' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              User (Tenant)
            </button>
            <button
              type="button"
              onClick={() => onToggleRole('renter')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                currentRole === 'renter' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Renter (Host)
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

