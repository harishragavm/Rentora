import React from 'react';
import { ShieldX, AlertOctagon, RotateCcw, HelpCircle } from 'lucide-react';
import type { UserRole } from '../types/auth';

interface BlockedQuarantineProps {
  role: UserRole;
  email: string;
  onRestart: () => void;
}

export const BlockedQuarantine: React.FC<BlockedQuarantineProps> = ({
  role,
  email,
  onRestart,
}) => {
  const [incidentRef] = React.useState(() => Math.floor(100000 + Math.random() * 900000));

  return (
    <div className="w-full text-center py-4">
      {/* Alert Icon */}
      <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5">
        <ShieldX className="w-9 h-9" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
        <AlertOctagon className="w-3.5 h-3.5" />
        <span>Access Suspended (Policy Code 403-RT)</span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white">
        Authentication Quarantined
      </h2>
      <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
        High-velocity risk anomalies and unverified hardware signatures were flagged for account{' '}
        <span className="text-slate-200 font-semibold">{email || 'current session'}</span>. 
        Access to Rentora {role === 'user' ? 'tenant databases' : 'host portfolios'} has been blocked to protect assets.
      </p>

      {/* Incident Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-6 text-left text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Incident Reference:</span>
          <span className="font-mono text-slate-200">#RT-SEC-{incidentRef}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Enforcement Action:</span>
          <span className="text-rose-400 font-semibold">Zero-Trust Step-Up Failed</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Resolution Window:</span>
          <span className="text-slate-300">24 Hours Concierge Appeal</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={onRestart}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart Authentication Flow</span>
        </button>

        <button
          type="button"
          onClick={() => alert('Support ticket logged with Rentora Trust & Safety.')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Contact Rentora Trust & Safety Concierge</span>
        </button>
      </div>
    </div>
  );
};

