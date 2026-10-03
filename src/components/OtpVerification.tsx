import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, MailCheck } from 'lucide-react';
import type { UserRole } from '../types/auth';

interface OtpVerificationProps {
  email: string;
  role: UserRole;
  onVerify: (otpCode: string) => void;
  onBack: () => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  role,
  onVerify,
  onBack,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(45);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const canResend = countdown <= 0;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (error) setError('');
    
    // Handle paste of 6 digits
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pasted.length > 0) {
        const newDigits = [...digits];
        pasted.forEach((char, i) => {
          if (index + i < 6) newDigits[index + i] = char;
        });
        setDigits(newDigits);
        const nextFocus = Math.min(index + pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (newDigits.every((d) => d !== '')) {
          triggerVerification(newDigits.join(''));
        }
        return;
      }
    }

    const singleDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      triggerVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = (code: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerify(code);
    }, 700);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(45);
    setDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to sign in</span>
      </button>

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
          <MailCheck className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Verify Your Identity
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          To protect your {role === 'user' ? 'tenant workspace' : 'host property portfolio'}, enter the 6-digit authentication token sent to{' '}
          <span className="text-slate-200 font-semibold">{email || 'your email'}</span>.
        </p>
      </div>

      {/* 6 OTP Inputs */}
      <div className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl font-bold rounded-xl border bg-slate-950/70 text-white focus:outline-none transition-all ${
                error
                  ? 'border-rose-500/80 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs text-rose-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {error}
          </p>
        )}

        <button
          onClick={() => triggerVerification(digits.join(''))}
          disabled={digits.some((d) => !d) || isVerifying}
          className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-40"
        >
          {isVerifying ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Confirm & Proceed</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        {/* Resend status */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Encrypted Token</span>
          </div>

          <div>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-teal-400 hover:text-teal-300 font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            ) : (
              <span>Resend in <strong className="text-slate-200 font-mono">{countdown}s</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

