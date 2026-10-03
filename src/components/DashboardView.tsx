import React from 'react';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  CreditCard, 
  Home, 
  Search, 
  LogOut, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  PlusCircle,
  FileCheck
} from 'lucide-react';
import type { UserRole } from '../types/auth';
import { Logo } from './Logo';

interface DashboardViewProps {
  role: UserRole;
  email: string;
  onLogout: () => void;
  onSwitchRole: (newRole: UserRole) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  role,
  email,
  onLogout,
  onSwitchRole,
}) => {
  return (
    <div className="w-full min-h-screen bg-[#0B0F17] text-slate-100 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" subtext={role === 'user' ? 'Tenant Portal' : 'Host Management'} />
            
            {/* Quick Switch Role */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => onSwitchRole('user')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  role === 'user' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                User Space
              </button>
              <button
                onClick={() => onSwitchRole('renter')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  role === 'renter' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Host Space
              </button>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-slate-200 font-semibold">{email}</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden mb-8 shadow-premium">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero-Trust Session Active (WCAG AA Compliant)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {role === 'user' ? 'Welcome to your Rentora Space' : 'Rentora Host & Property Portfolio'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                {role === 'user'
                  ? 'Manage your active lease contracts, submit seamless rent payments, and explore newly listed spaces.'
                  : 'Track monthly rental yield, approve verified applicant background checks, and manage lease agreements.'}
              </p>
            </div>

            <div className="flex-shrink-0">
              <button 
                onClick={() => alert(role === 'user' ? 'Opening Rentora Explore...' : 'Opening New Property Wizard...')}
                className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-950 transition-all"
              >
                {role === 'user' ? (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Explore Verified Spaces</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Create New Property Listing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Role Views */}
        {role === 'user' ? (
          /* USER / TENANT DASHBOARD */
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Active Lease</span>
                  <Home className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xl font-bold text-white">The Lumina Heights #4B</div>
                <div className="text-xs text-teal-400 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lease Verified (Valid until Dec 2026)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Next Rent Payment</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white">$2,450.00 / mo</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Scheduled for Sep 1st (Auto-Pay Active)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Saved Properties</span>
                  <Search className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xl font-bold text-white">12 Listings</div>
                <div className="text-xs text-slate-400 mt-1">
                  3 Price Drop Alerts in Zurich & Geneva
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Lease Documents & Payment Activity</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Residential Lease Agreement 2026</p>
                      <p className="text-[11px] text-slate-400">Cryptographically Signed via Rentora Trust Vault</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-teal-400">Signed & Valid</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">August Monthly Rent Payment</p>
                      <p className="text-[11px] text-slate-400">Transaction ID: #TX-984210 • Bank Transfer</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">Paid ($2,450)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RENTER / HOST DASHBOARD */
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Monthly Gross Yield</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">$18,750.00</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <span>+12.4% vs last quarter</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Portfolio Occupancy</span>
                  <Building2 className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xl font-bold text-white">96.8% (8/8 Units)</div>
                <div className="text-xs text-slate-400 mt-1">
                  1 Unit renewal scheduled in Nov 2026
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-medium">Pending Applications</span>
                  <User className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white">4 Verified Applicants</div>
                <div className="text-xs text-amber-400 mt-1">
                  Background & Credit check cleared
                </div>
              </div>
            </div>

            {/* Host Properties */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Active Managed Properties</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Villa Seraphina (Zurich Enge)</p>
                    <p className="text-[11px] text-slate-400">4 Bed • 3 Bath • $5,200/mo • Leased</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
                    Occupied
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Grand Horizon Loft #12 (Geneva)</p>
                    <p className="text-[11px] text-slate-400">2 Bed • 2 Bath • $3,800/mo • Leased</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
                    Occupied
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

