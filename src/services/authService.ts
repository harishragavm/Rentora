import { supabase } from '../lib/supabase';
import type { UserAccount } from './authSession';
import type { UserRole } from '../types/auth';
import { OtpService } from './otpService';

const LOCAL_ACCOUNTS_KEY = 'rentora_real_registered_accounts';
const ACTIVE_SESSION_USER_KEY = 'rentora_real_active_user';

export interface AuthResponse {
  success: boolean;
  user?: UserAccount;
  error?: string;
  needsEmailVerification?: boolean;
}

export class AuthService {
  /**
   * Helper to retrieve all registered accounts from storage
   */
  private static getStoredAccounts(): UserAccount[] {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private static saveAccounts(accounts: UserAccount[]): void {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  /**
   * Retrieve saved Rentora profile for a specific user ID
   */
  static getUserProfile(userId: string): Partial<UserAccount> | null {
    const raw = localStorage.getItem(`rentora_profile_${userId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Save or update a user's Rentora profile record strictly by user ID
   */
  static saveUserProfile(userId: string, updates: Partial<UserAccount>): void {
    const existing = this.getUserProfile(userId) || {};
    const merged = { ...existing, ...updates, id: userId };
    localStorage.setItem(`rentora_profile_${userId}`, JSON.stringify(merged));
  }

  /**
   * Hydrate a complete Rentora UserAccount from Supabase Auth User data
   */
  static hydrateUserFromSupabase(supabaseUser: any): UserAccount {
    const meta = supabaseUser.user_metadata || {};
    const userId = supabaseUser.id;
    const email = supabaseUser.email || meta.email || '';
    const storedProfile = this.getUserProfile(userId) || {};

    const name = storedProfile.name || meta.full_name || meta.name || email.split('@')[0] || 'User';
    const avatar = storedProfile.avatar || meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=047857`;
    const phone = storedProfile.phone || meta.mobile_number || meta.phone || '';
    const city = storedProfile.city || meta.city || '';
    const address = storedProfile.address || meta.address || '';
    const pincode = storedProfile.pincode || meta.pincode || '';
    const role = storedProfile.role || (meta.role === 'owner' ? 'owner' : 'user');
    
    // Isolated OTP Verification flags
    const phoneVerified = Boolean(storedProfile.phoneVerified ?? meta.phone_verified ?? false);
    const emailVerified = Boolean(
      storedProfile.emailVerified ?? 
      meta.email_verified ?? 
      (supabaseUser.app_metadata?.provider === 'google' || Boolean(supabaseUser.email_confirmed_at))
    );

    const userAccount: UserAccount = {
      id: userId,
      name,
      username: email ? email.split('@')[0] : name.toLowerCase().replace(/\s+/g, '_'),
      email,
      phone,
      city,
      address,
      pincode,
      avatar,
      rating: storedProfile.rating ?? 5.0,
      totalReviews: storedProfile.totalReviews ?? 0,
      verified: Boolean(supabaseUser.email_confirmed_at || supabaseUser.app_metadata?.provider === 'google' || true),
      phoneVerified,
      emailVerified,
      memberSince: storedProfile.memberSince || new Date(supabaseUser.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      responseRate: storedProfile.responseRate || '100%',
      role,
    };

    // Save profile cache
    this.saveUserProfile(userId, userAccount);
    this.persistActiveUser(userAccount);

    return userAccount;
  }

  /**
   * Request Mobile OTP via secure backend RPC
   */
  static async sendMobileOTP(phone: string): Promise<{ success: boolean; message?: string; error?: string; retryAfterSeconds?: number }> {
    return OtpService.requestOtp('phone', phone);
  }

  /**
   * Request Email OTP via secure backend RPC
   */
  static async sendEmailOTP(email: string): Promise<{ success: boolean; message?: string; error?: string; retryAfterSeconds?: number }> {
    return OtpService.requestOtp('email', email);
  }

  /**
   * Verify OTP code via secure backend RPC
   */
  static async verifyOTP(
    targetType: 'phone' | 'email',
    targetValue: string,
    otpCode: string
  ): Promise<{ success: boolean; message?: string; error?: string; attemptsRemaining?: number }> {
    return OtpService.verifyOtp(targetType, targetValue, otpCode);
  }

  /**
   * Sign Up with Email, Password, Full Name, Mobile, and Role
   */
  static async signUp(
    email: string,
    password: string,
    fullName: string,
    mobile: string,
    role: UserRole
  ): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const cleanName = fullName.trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            mobile_number: cleanMobile,
            role: role,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.warn('[Rentora Auth] Supabase signup error:', error.message);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const userAccount = this.hydrateUserFromSupabase(data.user);
        const needsVerification = Boolean(!data.session && data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at);
        return {
          success: true,
          user: userAccount,
          needsEmailVerification: needsVerification,
        };
      }
    } catch (err: any) {
      console.warn('[Rentora Auth] Supabase signup exception:', err);
    }

    // Local fallback persistence
    const existing = this.getStoredAccounts();
    if (existing.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const uniqueId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newAccount: UserAccount = {
      id: uniqueId,
      name: cleanName,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: cleanMobile,
      city: '',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=047857`,
      rating: 5.0,
      totalReviews: 0,
      verified: true,
      phoneVerified: false,
      emailVerified: false,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      responseRate: '100%',
      role: role === 'user' ? 'user' : 'owner',
    };

    existing.push(newAccount);
    this.saveAccounts(existing);
    this.saveUserProfile(uniqueId, newAccount);

    localStorage.setItem(`rentora_cred_${cleanEmail}`, btoa(password));
    this.persistActiveUser(newAccount);

    return {
      success: true,
      user: newAccount,
      needsEmailVerification: false,
    };
  }

  /**
   * Sign In with Email & Password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        console.warn('[Rentora Auth] Supabase login error:', error.message);
        return { success: false, error: 'Invalid email or password.' };
      }

      if (data?.user) {
        const userAccount = this.hydrateUserFromSupabase(data.user);
        return { success: true, user: userAccount };
      }
    } catch (err: any) {
      console.warn('[Rentora Auth] Supabase sign in exception:', err);
    }

    // Local fallback check
    const accounts = this.getStoredAccounts();
    const match = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!match) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const storedPassHash = localStorage.getItem(`rentora_cred_${cleanEmail}`);
    if (storedPassHash && storedPassHash !== btoa(password)) {
      return { success: false, error: 'Invalid email or password.' };
    }

    this.persistActiveUser(match);
    return { success: true, user: match };
  }

  /**
   * Real Google OAuth Login via Supabase
   */
  static async signInWithGoogle(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Rentora Auth] Supabase Google OAuth Error:', error.message);
        return { error: error.message || 'Google sign-in failed. Please try again.' };
      }

      return {};
    } catch (err: any) {
      console.error('[Rentora Auth] Google OAuth exception:', err);
      return { error: err.message || 'Failed to initialize Google Sign In.' };
    }
  }

  /**
   * Password Reset Email
   */
  static async resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/?type=recovery`,
      });
      if (error) {
        console.warn('[Rentora Auth] Password reset error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[Rentora Auth] Password reset exception:', err);
      return { success: false, error: 'Unable to connect. Please try again.' };
    }
  }

  /**
   * Update User Password
   */
  static async updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.warn('[Rentora Auth] Update password error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[Rentora Auth] Update password exception:', err);
      return { success: false, error: 'Unable to connect. Please try again.' };
    }
  }

  /**
   * Sign Out
   */
  static async signOut(): Promise<void> {
    localStorage.removeItem(ACTIVE_SESSION_USER_KEY);
    localStorage.removeItem('rentora_authenticated_session');
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 400))
      ]);
    } catch (e) {
      console.warn('[Rentora Auth] Supabase sign out warning:', e);
    }
  }

  /**
   * Get Active Session User
   */
  static getActiveUser(): UserAccount | null {
    const raw = localStorage.getItem(ACTIVE_SESSION_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Persist Active Session User
   */
  static persistActiveUser(user: UserAccount): void {
    localStorage.setItem(ACTIVE_SESSION_USER_KEY, JSON.stringify(user));
    localStorage.setItem('rentora_authenticated_session', JSON.stringify(user));
  }

  /**
   * Update Active User Profile strictly for a specific user ID
   */
  static updateProfile(userId: string, updates: Partial<UserAccount>): UserAccount {
    const existing = this.getUserProfile(userId) || this.getActiveUser() || {};
    const name = updates.name || existing.name || 'User';
    const email = updates.email || existing.email || '';
    const username = updates.username || existing.username || (email ? email.split('@')[0] : name.toLowerCase().replace(/\s+/g, '_'));

    const updated: UserAccount = {
      id: userId,
      name,
      username,
      email,
      phone: updates.phone ?? existing.phone ?? '',
      city: updates.city ?? existing.city ?? '',
      address: updates.address ?? existing.address ?? '',
      pincode: updates.pincode ?? existing.pincode ?? '',
      avatar: updates.avatar || existing.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=047857`,
      rating: updates.rating ?? existing.rating ?? 5.0,
      totalReviews: updates.totalReviews ?? existing.totalReviews ?? 0,
      verified: updates.verified ?? existing.verified ?? true,
      phoneVerified: updates.phoneVerified ?? existing.phoneVerified ?? false,
      emailVerified: updates.emailVerified ?? existing.emailVerified ?? false,
      memberSince: updates.memberSince || existing.memberSince || '2026',
      responseRate: updates.responseRate || existing.responseRate || '100%',
      role: updates.role || existing.role || 'user',
    };

    this.saveUserProfile(userId, updated);
    this.persistActiveUser(updated);

    const accounts = this.getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === userId || (updated.email && a.email === updated.email));
    if (idx !== -1) {
      accounts[idx] = updated;
      this.saveAccounts(accounts);
    }

    supabase.auth.updateUser({
      data: {
        full_name: updated.name,
        mobile_number: updated.phone,
        city: updated.city,
        address: updated.address,
        pincode: updated.pincode,
        role: updated.role,
        avatar_url: updated.avatar,
        phone_verified: updated.phoneVerified,
        email_verified: updated.emailVerified,
      },
    }).catch((e) => console.warn('Supabase profile update warning:', e));

    return updated;
  }
}
