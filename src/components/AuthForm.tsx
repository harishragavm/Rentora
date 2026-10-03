import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, User as UserIcon, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserRole, AuthMode } from '../types/auth';
import { validateIndianMobile, validateFullName } from '../utils/validationUtils';
import { AuthService } from '../services/authService';
import type { UserAccount } from '../services/authSession';

interface AuthFormProps {
  role: UserRole;
  mode: AuthMode;
  onToggleMode: () => void;
  onSuccess: (user: UserAccount) => void;
  onForgotPassword: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  role,
  mode,
  onToggleMode,
  onSuccess,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    mobileNumber?: string;
  }>({});

  const validate = (): boolean => {
    const errs: typeof errors = {};
    setGlobalError(null);
    setVerificationNotice(null);

    if (mode === 'signup') {
      const nameVal = validateFullName(fullName);
      if (!nameVal.isValid) errs.fullName = nameVal.error;

      const mobileVal = validateIndianMobile(mobileNumber);
      if (!mobileVal.isValid) errs.mobileNumber = mobileVal.error;

      if (!password) {
        errs.password = 'Password is required';
      } else if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }

      if (!confirmPassword) {
        errs.confirmPassword = 'Confirm your password';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    } else {
      if (!password) {
        errs.password = 'Password is required';
      }
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGlobalError(null);

    try {
      if (mode === 'signup') {
        const res = await AuthService.signUp(email, password, fullName, mobileNumber, role);
        if (!res.success) {
          setGlobalError(res.error || 'Failed to create account. Please try again.');
          return;
        }

        if (res.needsEmailVerification) {
          setVerificationNotice('Check your email to verify your account.');
          return;
        }

        if (res.user) {
          onSuccess(res.user);
        }
      } else {
        const res = await AuthService.signIn(email, password);
        if (!res.success) {
          setGlobalError(res.error || 'Invalid email or password.');
          return;
        }

        if (res.user) {
          onSuccess(res.user);
        }
      }
    } catch (err: any) {
      console.warn('[AuthForm] submission error:', err);
      setGlobalError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const res = await AuthService.signInWithGoogle();
      if (res.error) {
        setGlobalError(res.error);
      }
    } catch (err: any) {
      console.warn('[AuthForm] Google sign in error:', err);
      setGlobalError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Role Badge Context */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            role === 'user' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {role === 'user' ? <UserIcon className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
            {role === 'user' ? 'TENANT PORTAL' : 'HOST / LANDLORD PORTAL'}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {mode === 'signin' 
            ? (role === 'user' ? 'Welcome Back' : 'Host Sign In') 
            : (role === 'user' ? 'Create Tenant Account' : 'Create Host Account')}
        </h1>
      </div>

      {/* Global Error Notice */}
      {globalError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Verification Notice */}
      {verificationNotice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{verificationNotice}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-800 font-bold text-xs gap-3 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
            or continue with email
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                  errors.fullName 
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600' 
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setMobileNumber(digits);
                    if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: undefined });
                  }}
                  className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                    errors.mobileNumber 
                      ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600' 
                      : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.mobileNumber}</p>
              )}
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {role === 'user' ? 'Email Address' : 'Business / Host Email'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                errors.email 
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600' 
                  : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-emerald-700 hover:text-emerald-800 transition-colors font-bold cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={`w-full pl-9 pr-9 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                errors.password 
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600' 
                  : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                className={`w-full pl-9 pr-9 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                  errors.confirmPassword 
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600' 
                    : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In Securely' : 'Create Rentora Account'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Mode Switcher Footer */}
      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500">
          {mode === 'signin' ? "Don't have a Rentora account yet?" : "Already have a verified account?"}{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors cursor-pointer"
          >
            {mode === 'signin' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};
