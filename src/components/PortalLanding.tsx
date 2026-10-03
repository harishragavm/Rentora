import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { UserRole } from '../types/auth';
import { Logo } from './Logo';
import { RoleSelector } from './RoleSelector';

interface PortalLandingProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onProceedToAuth: (mode: 'signin' | 'signup') => void;
}

export const PortalLanding: React.FC<PortalLandingProps> = ({
  selectedRole,
  onSelectRole,
  onProceedToAuth,
}) => {
  return (
    <div className="w-full">
      {/* Header Brand */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Logo size="lg" variant="dark" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 max-w-lg mx-auto">
          Select Your Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Choose whether you are renting items or listing products as an owner.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="mb-6">
        <RoleSelector
          selectedRole={selectedRole}
          onSelectRole={onSelectRole}
          compact={false}
        />
      </div>

      {/* Primary CTAs */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onProceedToAuth('signin')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Continue as {selectedRole === 'user' ? 'Tenant / Renter' : 'Property Host / Owner'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => onProceedToAuth('signup')}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors py-1 cursor-pointer font-medium"
          >
            New to Rentora? <span className="text-emerald-700 font-bold hover:underline">Create a free account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
