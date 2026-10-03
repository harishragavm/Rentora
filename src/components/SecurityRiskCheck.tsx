import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Laptop, 
  Fingerprint, 
  ArrowRight, 
  Lock, 
  Key,
  Smartphone
} from 'lucide-react';
import type { UserRole, SecurityTelemetry } from '../types/auth';

interface SecurityRiskCheckProps {
  role: UserRole;
  email?: string;
  forceRiskMode?: 'safe' | 'suspicious';
  onPassSafe: () => void;
  onPassVerified: () => void;
  onBlock: () => void;
  onChangeMode: (mode: 'safe' | 'suspicious') => void;
}

export const SecurityRiskCheck: React.FC<SecurityRiskCheckProps> = ({
  role,
  forceRiskMode = 'safe',
  onPassSafe,
  onPassVerified,
  onBlock,
  onChangeMode,
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Initializing Rentora Zero-Trust Engine...');
  const [completedScan, setCompletedScan] = useState(false);
  const [showStepUp, setShowStepUp] = useState(false);
  const [stepUpMethod, setStepUpMethod] = useState<'biometric' | 'passkey' | 'totp'>('biometric');
  const [isVerifyingStepUp, setIsVerifyingStepUp] = useState(false);

  // Dynamic telemetry based on safe vs suspicious mode
  const telemetry: SecurityTelemetry = forceRiskMode === 'safe' ? {
    ipAddress: '198.51.100.42 (Residential ISP)',
    location: 'Zurich, Switzerland (Matched Historical Profile)',
    device: 'Apple MacBook Pro (M3 Max, macOS 14.5)',
    browser: 'Chrome 128.0 (Encrypted TLS 1.3)',
    fingerprintHash: 'sha256-8f9a2b7c4d1e',
    velocityScore: 98,
    threatLevel: 'LOW',
    checks: {
      ipReputation: 'passed',
      deviceIntegrity: 'passed',
      geoVelocity: 'passed',
      credentialLeakage: 'passed',
      behavioralPattern: 'passed',
    }
  } : {
    ipAddress: '185.220.101.5 (High-Risk Tor/Proxy Exit Node)',
    location: 'Bucharest, Romania (Impossible Travel: +8,200 km in 4m)',
    device: 'Unknown Linux Workstation (Headless UA)',
    browser: 'Chromium / Python-Requests Emulator',
    fingerprintHash: 'sha256-unknown-spoof-alert',
    velocityScore: 34,
    threatLevel: 'CRITICAL',
    checks: {
      ipReputation: 'failed',
      deviceIntegrity: 'warning',
      geoVelocity: 'failed',
      credentialLeakage: 'passed',
      behavioralPattern: 'failed',
    }
  };

  const handleModeChange = (mode: 'safe' | 'suspicious') => {
    setScanProgress(0);
    setCurrentStageText('Initializing Rentora Zero-Trust Engine...');
    setCompletedScan(false);
    setShowStepUp(false);
    onChangeMode(mode);
  };

  useEffect(() => {
    const steps = [
      { progress: 25, text: 'Inspecting IP Reputation & ASN Integrity...' },
      { progress: 50, text: 'Verifying Hardware Device Fingerprint & Enclave...' },
      { progress: 75, text: 'Analyzing Geolocation Velocity & Impossible Travel...' },
      { progress: 100, text: 'Evaluating Rentora Risk Score Matrix...' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setScanProgress(steps[stepIndex].progress);
        setCurrentStageText(steps[stepIndex].text);
        stepIndex++;
      } else {
        clearInterval(interval);
        setCompletedScan(true);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [forceRiskMode]);

  const handleStepUpVerification = (action: 'allow' | 'block') => {
    setIsVerifyingStepUp(true);
    setTimeout(() => {
      setIsVerifyingStepUp(false);
      if (action === 'allow') {
        onPassVerified();
      } else {
        onBlock();
      }
    }, 1000);
  };

  return (
    <div className="w-full">
      {/* Mode Selector for Evaluation/Demo */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-slate-200">Risk Engine Mode:</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => handleModeChange('safe')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              forceRiskMode === 'safe'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            Safe (98/100)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('suspicious')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              forceRiskMode === 'suspicious'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            Suspicious (34/100)
          </button>
        </div>
      </div>

      {/* Main Analysis Card */}
      {!completedScan ? (
        /* SCANNING IN PROGRESS */
        <div className="text-center py-8">
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-teal-500 animate-spin"></div>
            <ShieldCheck className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Zero-Trust Security Verification
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-mono">{currentStageText}</p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 mt-6 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-teal-600 to-teal-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2">
            <span>Adaptive Engine</span>
            <span>{scanProgress}% Completed</span>
          </div>
        </div>
      ) : showStepUp ? (
        /* EXTRA STEP-UP VERIFICATION (SUSPICIOUS PATH) */
        <div className="animate-fadeIn">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">Elevated Risk Anomaly Detected</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Session initiated from a proxy endpoint ({telemetry.ipAddress}). Step-up authentication required.
              </p>
            </div>
          </div>

          {/* Step-up Method Selector */}
          <div className="space-y-3 mb-6">
            <div 
              onClick={() => setStepUpMethod('biometric')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                stepUpMethod === 'biometric' 
                  ? 'bg-slate-900 border-teal-500/80 ring-1 ring-teal-500/40' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Device Touch ID / Face ID</p>
                  <p className="text-[11px] text-slate-400">Biometric hardware security enclave</p>
                </div>
              </div>
              <input type="radio" checked={stepUpMethod === 'biometric'} readOnly className="accent-teal-500" />
            </div>

            <div 
              onClick={() => setStepUpMethod('passkey')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                stepUpMethod === 'passkey' 
                  ? 'bg-slate-900 border-teal-500/80 ring-1 ring-teal-500/40' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Key className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">FIDO2 Hardware Passkey / YubiKey</p>
                  <p className="text-[11px] text-slate-400">Physical cryptographic security token</p>
                </div>
              </div>
              <input type="radio" checked={stepUpMethod === 'passkey'} readOnly className="accent-teal-500" />
            </div>

            <div 
              onClick={() => setStepUpMethod('totp')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                stepUpMethod === 'totp' 
                  ? 'bg-slate-900 border-teal-500/80 ring-1 ring-teal-500/40' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Rentora Authenticator App</p>
                  <p className="text-[11px] text-slate-400">Time-based 6-digit backup token</p>
                </div>
              </div>
              <input type="radio" checked={stepUpMethod === 'totp'} readOnly className="accent-teal-500" />
            </div>
          </div>

          {/* Action Choice: Allow vs Block */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleStepUpVerification('allow')}
              disabled={isVerifyingStepUp}
              className="py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isVerifyingStepUp ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Allow</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleStepUpVerification('block')}
              disabled={isVerifyingStepUp}
              className="py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ShieldX className="w-4 h-4" />
              <span>Flag & Block</span>
            </button>
          </div>
        </div>
      ) : (
        /* EVALUATION RESULT SUMMARY */
        <div className="animate-fadeIn">
          {/* Header Status */}
          <div className="text-center mb-6">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
              forceRiskMode === 'safe'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {forceRiskMode === 'safe' ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>

            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {forceRiskMode === 'safe' ? 'Security Verification Passed' : 'Suspicious Velocity Flagged'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trust Score: <strong className={forceRiskMode === 'safe' ? 'text-emerald-400 font-mono text-sm' : 'text-rose-400 font-mono text-sm'}>
                {telemetry.velocityScore}/100 ({telemetry.threatLevel} THREAT)
              </strong>
            </p>
          </div>

          {/* Telemetry Breakdown Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs mb-6">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Network & Location</span>
              </div>
              <span className="text-slate-200 font-medium text-right max-w-[200px] truncate">
                {telemetry.location}
              </span>
            </div>

            <div className="flex items-start justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400">
                <Laptop className="w-3.5 h-3.5 text-teal-400" />
                <span>Device Fingerprint</span>
              </div>
              <span className="text-slate-200 font-medium text-right max-w-[200px] truncate">
                {telemetry.device}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
                <span>Behavioral Risk Check</span>
              </div>
              <span className={`font-semibold uppercase ${
                telemetry.checks.behavioralPattern === 'passed' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {telemetry.checks.behavioralPattern === 'passed' ? 'Verified Safe' : 'Anomaly Flagged'}
              </span>
            </div>
          </div>

          {/* Navigation Action */}
          {forceRiskMode === 'safe' ? (
            <button
              onClick={onPassSafe}
              className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Continue to {role === 'user' ? 'Tenant Workspace' : 'Host Dashboard'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={() => setShowStepUp(true)}
              className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Perform Extra Verification</span>
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

