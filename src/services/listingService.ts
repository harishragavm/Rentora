import type { ProductListing, UserLocation } from '../types/marketplace';
import { INITIAL_SEED_LISTINGS } from '../data/seedListings';
import type { UserAccount } from './authSession';
import { calculateDistanceKm } from '../utils/locationUtils';

const LISTINGS_STORAGE_KEY = 'rentora_listings';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ListingService {
  private static getStoredListings(): ProductListing[] {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_LISTINGS));
      return INITIAL_SEED_LISTINGS;
    }
    try {
      const parsed: ProductListing[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_LISTINGS));
        return INITIAL_SEED_LISTINGS;
      }
      // Deduplicate by ID and ensure owner details are normalized
      const uniqueMap = new Map<string, ProductListing>();
      // First populate with stored items
      parsed.forEach((item) => {
        if (!item || !item.id) return;
        const normalized: ProductListing = {
          ...item,
          ownerName: item.ownerName || item.owner?.name || 'Verified Owner',
          ownerMobile: item.ownerMobile || item.owner?.phone,
        };
        uniqueMap.set(normalized.id, normalized);
      });
      // Ensure seed listings are available if they were missing
      INITIAL_SEED_LISTINGS.forEach((seed) => {
        if (!uniqueMap.has(seed.id)) {
          uniqueMap.set(seed.id, seed);
        }
      });
      return Array.from(uniqueMap.values());
    } catch (e) {
      console.error('Failed to parse listings storage', e);
      return INITIAL_SEED_LISTINGS;
    }
  }

  private static saveListings(listings: ProductListing[]): void {
    // Deduplicate before saving
    const uniqueMap = new Map<string, ProductListing>();
    listings.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(Array.from(uniqueMap.values())));
  }

  /**
   * Fetch all active marketplace listings with distance calculated dynamically
   * relative to the renter's real coordinates.
   * If renter coordinates are missing, distanceKm remains undefined.
   */
  static getAllListings(renterLocation?: UserLocation | null): ProductListing[] {
    const listings = this.getStoredListings();
    
    // If no valid renter coordinates, distanceKm is strictly undefined
    if (
      !renterLocation ||
      renterLocation.latitude === undefined ||
      renterLocation.longitude === undefined ||
      isNaN(renterLocation.latitude) ||
      isNaN(renterLocation.longitude)
    ) {
      return listings.map((item) => ({
        ...item,
        distanceKm: undefined,
      }));
    }

    return listings.map((item) => {
      const productLoc = item.productLocation || item.location;
      const dist = calculateDistanceKm(
        renterLocation.latitude,
        renterLocation.longitude,
        productLoc?.latitude,
        productLoc?.longitude
      );
      return {
        ...item,
        distanceKm: dist,
      };
    });
  }

  /**
   * Fetch listing by ID.
   */
  static getListingById(id: string, renterLocation?: UserLocation | null): ProductListing | undefined {
    const all = this.getAllListings(renterLocation);
    return all.find((l) => l.id === id);
  }

  /**
   * Fetch all listings owned by a specific authenticated user.
   */
  static getMyListings(userId: string): ProductListing[] {
    const listings = this.getStoredListings();
    return listings.filter((l) => l.ownerId === userId);
  }

  /**
   * Create a new product listing under the authenticated session.
   * ownerId is derived strictly from authenticated user.
   */
  static createListing(
    input: Omit<ProductListing, 'id' | 'ownerId' | 'owner' | 'createdAt' | 'viewsCount' | 'rentalCount'>,
    authenticatedUser: UserAccount
  ): ServiceResult<ProductListing> {
    if (!authenticatedUser || !authenticatedUser.id) {
      return {
        success: false,
        statusCode: 401,
        error: '401 Unauthorized: Valid authentication session required.',
      };
    }

    const uniqueId = `rentora-item-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newListing: ProductListing = {
      ...input,
      location: { ...input.location },
      productLocation: input.productLocation ? { ...input.productLocation } : { ...input.location },
      ownerLocation: input.ownerLocation ? { ...input.ownerLocation } : undefined,
      ownerName: input.ownerName || authenticatedUser.name,
      ownerMobile: input.ownerMobile || authenticatedUser.phone,
      id: uniqueId,
      ownerId: authenticatedUser.id, // Strictly tied to authenticated user session
      owner: {
        id: authenticatedUser.id,
        name: input.ownerName || authenticatedUser.name,
        avatar: authenticatedUser.avatar,
        phone: input.ownerMobile || authenticatedUser.phone,
        email: authenticatedUser.email,
        city: input.ownerLocation?.city || authenticatedUser.city,
        rating: authenticatedUser.rating,
        totalReviews: authenticatedUser.totalReviews,
        verified: authenticatedUser.verified,
        memberSince: authenticatedUser.memberSince,
        responseRate: authenticatedUser.responseRate,
      },
      createdAt: new Date().toISOString(),
      viewsCount: 1,
      rentalCount: 0,
      status: 'active',
    };

    const listings = this.getStoredListings();
    const updated = [newListing, ...listings];
    this.saveListings(updated);

    return {
      success: true,
      statusCode: 201,
      data: newListing,
    };
  }

  /**
   * Update an existing listing.
   * Backend authorization: verifies authenticatedUser.id === listing.ownerId.
   */
  static updateListing(
    listingId: string,
    updates: Partial<Omit<ProductListing, 'id' | 'ownerId' | 'owner' | 'createdAt'>>,
    authenticatedUser: UserAccount
  ): ServiceResult<ProductListing> {
    const listings = this.getStoredListings();
    const index = listings.findIndex((l) => l.id === listingId);

    if (index === -1) {
      return {
        success: false,
        statusCode: 404,
        error: '404 Not Found: Listing does not exist.',
      };
    }

    const target = listings[index];

    // BACKEND AUTHORIZATION CHECK
    if (!authenticatedUser || target.ownerId !== authenticatedUser.id) {
      console.warn(`[AUTHORIZATION DENIED] User ${authenticatedUser?.id} attempted to modify listing ${listingId} owned by ${target.ownerId}`);
      return {
        success: false,
        statusCode: 403,
        error: '403 Forbidden: You do not have permission to modify this listing.',
      };
    }

    const updatedListing: ProductListing = {
      ...target,
      ...updates,
      location: updates.location ? { ...target.location, ...updates.location } : target.location,
      productLocation: updates.productLocation ? { ...target.productLocation, ...updates.productLocation } : (updates.location ? { ...updates.location } : target.productLocation),
      ownerLocation: updates.ownerLocation ? { ...target.ownerLocation, ...updates.ownerLocation } : target.ownerLocation,
      ownerName: updates.ownerName || target.ownerName,
      ownerMobile: updates.ownerMobile || target.ownerMobile,
      id: target.id, // Immutable ID
      ownerId: target.ownerId, // Immutable Owner
      owner: target.owner, // Immutable Owner Profile
    };

    const updatedListings = [...listings];
    updatedListings[index] = updatedListing;
    this.saveListings(updatedListings);

    return {
      success: true,
      statusCode: 200,
      data: updatedListing,
    };
  }

  /**
   * Toggle active/paused listing status.
   * Backend authorization: verifies authenticatedUser.id === listing.ownerId.
   */
  static toggleListingStatus(
    listingId: string,
    authenticatedUser: UserAccount
  ): ServiceResult<ProductListing> {
    const listings = this.getStoredListings();
    const index = listings.findIndex((l) => l.id === listingId);

    if (index === -1) {
      return {
        success: false,
        statusCode: 404,
        error: '404 Not Found',
      };
    }

    const target = listings[index];

    // BACKEND AUTHORIZATION CHECK
    if (!authenticatedUser || target.ownerId !== authenticatedUser.id) {
      return {
        success: false,
        statusCode: 403,
        error: '403 Forbidden: You do not have permission to change status for this listing.',
      };
    }

    const nextStatus = target.status === 'active' ? 'paused' : 'active';
    const updatedListing: ProductListing = {
      ...target,
      status: nextStatus,
    };

    const updatedListings = [...listings];
    updatedListings[index] = updatedListing;
    this.saveListings(updatedListings);

    return {
      success: true,
      statusCode: 200,
      data: updatedListing,
    };
  }

  /**
   * Delete a listing.
   * Backend authorization: verifies authenticatedUser.id === listing.ownerId.
   */
  static deleteListing(
    listingId: string,
    authenticatedUser: UserAccount
  ): ServiceResult<{ deletedId: string }> {
    const listings = this.getStoredListings();
    const target = listings.find((l) => l.id === listingId);

    if (!target) {
      return {
        success: false,
        statusCode: 404,
        error: '404 Not Found: Listing not found.',
      };
    }

    // BACKEND AUTHORIZATION CHECK
    if (!authenticatedUser || target.ownerId !== authenticatedUser.id) {
      console.warn(`[AUTHORIZATION DENIED] User ${authenticatedUser?.id} attempted to delete listing ${listingId} owned by ${target.ownerId}`);
      return {
        success: false,
        statusCode: 403,
        error: '403 Forbidden: You do not have permission to delete this listing.',
      };
    }

    // Filter out only this specific listing
    const updatedListings = listings.filter((l) => l.id !== listingId);
    this.saveListings(updatedListings);

    return {
      success: true,
      statusCode: 200,
      data: { deletedId: listingId },
    };
  }
}
