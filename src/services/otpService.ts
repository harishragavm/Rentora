import { supabase } from '../lib/supabase';

export interface OtpRequestResponse {
  success: boolean;
  message?: string;
  error?: string;
  expiresInSeconds?: number;
  retryAfterSeconds?: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  message?: string;
  error?: string;
  attemptsRemaining?: number;
}

export class OtpService {
  /**
   * Request a real 6-digit OTP from the backend
   * For Email: Triggers the send-otp Supabase Edge Function with Resend email delivery.
   * For Mobile/Phone: Triggers the request_otp Supabase RPC function.
   * Plaintext OTP is generated and hashed strictly on the backend.
   */
  static async requestOtp(
    targetType: 'phone' | 'email',
    targetValue: string
  ): Promise<OtpRequestResponse> {
    try {
      const cleanValue = targetType === 'phone' 
        ? targetValue.replace(/\D/g, '').slice(-10) 
        : targetValue.trim().toLowerCase();

      if (targetType === 'phone' && cleanValue.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number.',
        };
      }

      if (targetType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
        return {
          success: false,
          error: 'Please enter a valid email address.',
        };
      }

      // Email OTP flow: Trigger send-otp Supabase Edge Function
      if (targetType === 'email') {
        try {
          const { data: funcData, error: funcError } = await supabase.functions.invoke('send-otp', {
            body: { email: cleanValue },
          });

          if (!funcError && funcData) {
            const result = typeof funcData === 'string' ? JSON.parse(funcData) : funcData;
            if (result.success) {
              return {
                success: true,
                message: result.message || 'Verification code sent to your email successfully.',
                expiresInSeconds: result.expires_in_seconds || 60,
              };
            }
            if (result.error) {
              return {
                success: false,
                error: result.error,
                retryAfterSeconds: result.retry_after_seconds,
              };
            }
          }
        } catch (edgeErr) {
          console.warn('[OtpService] Edge function invoke warning, attempting RPC fallback:', edgeErr);
        }
      }

      // Default / Phone flow: Call request_otp database RPC
      const { data, error } = await supabase.rpc('request_otp', {
        p_target_type: targetType,
        p_target_value: cleanValue,
      });

      if (error) {
        console.warn('[OtpService] Supabase request_otp error:', error.message);
        return {
          success: false,
          error: error.message || 'Unable to request verification code. Please try again.',
        };
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result?.success) {
        return {
          success: false,
          error: result?.error || 'Failed to request OTP code.',
          retryAfterSeconds: result?.retry_after_seconds,
        };
      }

      return {
        success: true,
        message: result.message || 'Verification code requested successfully.',
        expiresInSeconds: result.expires_in_seconds || 60,
      };
    } catch (err: any) {
      console.warn('[OtpService] requestOtp exception:', err);
      return {
        success: false,
        error: err.message || 'Network error requesting verification code.',
      };
    }
  }

  /**
   * Verify an entered 6-digit OTP code against the backend RPC
   * Verification and immediate consumption happens atomically on the database.
   */
  static async verifyOtp(
    targetType: 'phone' | 'email',
    targetValue: string,
    otpCode: string
  ): Promise<OtpVerifyResponse> {
    try {
      const cleanValue = targetType === 'phone' 
        ? targetValue.replace(/\D/g, '').slice(-10) 
        : targetValue.trim().toLowerCase();

      const cleanCode = otpCode.replace(/\D/g, '').slice(0, 6);

      if (cleanCode.length !== 6) {
        return {
          success: false,
          error: 'Please enter the complete 6-digit verification code.',
        };
      }

      const { data, error } = await supabase.rpc('verify_otp', {
        p_target_type: targetType,
        p_target_value: cleanValue,
        p_otp_code: cleanCode,
      });

      if (error) {
        console.warn('[OtpService] Supabase verify_otp error:', error.message);
        return {
          success: false,
          error: error.message || 'Unable to verify code. Please try again.',
        };
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result?.success) {
        return {
          success: false,
          error: result?.error || 'Invalid verification code.',
          attemptsRemaining: result?.attempts_remaining,
        };
      }

      return {
        success: true,
        message: result.message || 'Verification successful.',
      };
    } catch (err: any) {
      console.warn('[OtpService] verifyOtp exception:', err);
      return {
        success: false,
        error: err.message || 'Network error verifying code.',
      };
    }
  }
}
