import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { UserRole, AuthMode } from '../../types/auth';
import { PortalLanding } from '../PortalLanding';
import { AuthForm } from '../AuthForm';
import { ForgotPasswordModal } from '../ForgotPasswordModal';
import type { UserAccount } from '../../services/authSession';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialRole?: UserRole;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'user',
  initialMode = 'signin',
}) => {
  const [view, setView] = useState<'portal' | 'form'>('portal');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleProceedToAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setView('form');
  };

  const handleAuthSuccess = (user: UserAccount) => {
    onSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-6">
        
        {/* Subtle Green Top Brand Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Close authentication"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'portal' ? (
          <PortalLanding
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onProceedToAuth={handleProceedToAuth}
          />
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setView('portal')}
              className="text-xs text-slate-500 hover:text-emerald-700 mb-4 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
            >
              ← Back to Portal Selection
            </button>

            <AuthForm
              role={selectedRole}
              mode={authMode}
              onToggleMode={() => setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))}
              onSuccess={handleAuthSuccess}
              onForgotPassword={() => setIsForgotModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccess={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
