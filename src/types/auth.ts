export type UserRole = 'user' | 'renter';

export type AuthMode = 'signin' | 'signup';

export type AuthStage = 
  | 'portal'               // Unified landing with role selection + quick action
  | 'auth-form'            // Email + Password & Social Sign In
  | 'otp-verification'     // Email / SMS OTP step
  | 'security-check'       // Real-time risk & security inspection
  | 'step-up-challenge'    // Suspicious risk extra verification
  | 'dashboard'            // Safe authenticated experience
  | 'blocked';             // Quarantine state if blocked

export interface AuthState {
  role: UserRole;
  mode: AuthMode;
  stage: AuthStage;
  email: string;
  rememberMe: boolean;
  securityRiskMode: 'safe' | 'suspicious'; // interactive simulator toggle
  securityScore: number;
  lastLoginTime?: string;
}

export interface SecurityTelemetry {
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  fingerprintHash: string;
  velocityScore: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'ELEVATED' | 'CRITICAL';
  checks: {
    ipReputation: 'passed' | 'warning' | 'failed';
    deviceIntegrity: 'passed' | 'warning' | 'failed';
    geoVelocity: 'passed' | 'warning' | 'failed';
    credentialLeakage: 'passed' | 'warning' | 'failed';
    behavioralPattern: 'passed' | 'warning' | 'failed';
  };
}

