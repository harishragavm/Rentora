import React from 'react';
import { User, Building2, Check, Sparkles } from 'lucide-react';
import type { UserRole } from '../types/auth';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  compact?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => onSelectRole('user')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            selectedRole === 'user'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>User / Tenant</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('renter')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            selectedRole === 'renter'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Renter / Host</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Option 1: User / Tenant */}
      <div
        onClick={() => onSelectRole('user')}
        className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left ${
          selectedRole === 'user'
            ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
        role="radio"
        aria-checked={selectedRole === 'user'}
        tabIndex={0}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${selectedRole === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <User className="w-5 h-5" />
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            selectedRole === 'user' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
          }`}>
            {selectedRole === 'user' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">User / Tenant</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
              Seeker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Discover verified rentals, manage leases, and submit seamless payments.
          </p>
        </div>
      </div>

      {/* Option 2: Renter / Host */}
      <div
        onClick={() => onSelectRole('renter')}
        className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left ${
          selectedRole === 'renter'
            ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
        role="radio"
        aria-checked={selectedRole === 'renter'}
        tabIndex={0}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${selectedRole === 'renter' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            selectedRole === 'renter' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
          }`}>
            {selectedRole === 'renter' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Renter / Host</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Host
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            List properties, verify applicant profiles, and track occupancy & revenue.
          </p>
        </div>
      </div>
    </div>
  );
};
