import type { OwnerProfile, UserLocation, RenterProfile } from '../types/marketplace';
import { AuthService } from './authService';

export interface UserAccount extends OwnerProfile {
  username: string;
  role: 'user' | 'owner' | 'renter';
  address?: string;
  pincode?: string;
  activeLocation?: UserLocation;
}

const RENTER_LOCATION_STORAGE_KEY = 'rentora_renter_location';
const RENTER_PROFILE_STORAGE_KEY = 'rentora_renter_profile';

export class AuthSessionService {
  /**
   * Initialize and get the active authenticated session user
   */
  static init(): UserAccount | null {
    return AuthService.getActiveUser();
  }

  static getCurrentUser(): UserAccount | null {
    return AuthService.getActiveUser();
  }

  static updateUserProfile(userId: string, updates: Partial<UserAccount>): UserAccount {
    return AuthService.updateProfile(userId, updates);
  }

  static getRenterProfile(userId?: string): RenterProfile | null {
    const key = userId ? `rentora_renter_profile_${userId}` : RENTER_PROFILE_STORAGE_KEY;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse renter profile', e);
      }
    }
    return null;
  }

  static setRenterProfile(profile: RenterProfile, userId?: string): void {
    const key = userId ? `rentora_renter_profile_${userId}` : RENTER_PROFILE_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(profile));
  }

  static getRenterLocation(): UserLocation | null {
    const saved = localStorage.getItem(RENTER_LOCATION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: UserLocation = JSON.parse(saved);
        if (parsed && (parsed.city || parsed.address)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse renter location', e);
      }
    }
    return null;
  }

  static setRenterLocation(loc: UserLocation): void {
    localStorage.setItem(RENTER_LOCATION_STORAGE_KEY, JSON.stringify(loc));
  }
}
