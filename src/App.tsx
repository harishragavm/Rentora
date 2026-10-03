import { useState, useCallback, useEffect } from 'react';
import type { ProductListing, UserLocation } from './types/marketplace';
import { AuthSessionService, type UserAccount } from './services/authSession';
import { AuthService } from './services/authService';
import { supabase } from './lib/supabase';
import { ListingService } from './services/listingService';
import { Navbar } from './components/marketplace/Navbar';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { MyListingsView } from './components/marketplace/MyListingsView';
import { ListProductWizard } from './components/listing/ListProductWizard';
import { ProductDetailModal } from './components/marketplace/ProductDetailModal';
import { ProfileAddressModal } from './components/profile/ProfileAddressModal';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Clean Stale Location Data on Initial Boot
  const [renterLocation, setRenterLocation] = useState<UserLocation>(() => {
    const saved = AuthSessionService.getRenterLocation();
    if (saved && (saved.city?.toLowerCase().includes('mahindra') || saved.area?.toLowerCase().includes('mahindra') || saved.city?.toLowerCase().includes('chengalpattu'))) {
      localStorage.removeItem('rentora_renter_location');
      return { city: 'Select your location manually', area: '', district: '', permissionState: 'unavailable' };
    }
    if (saved && saved.city && !saved.city.includes('Select your location')) {
      return saved;
    }
    return {
      city: 'Select your location manually',
      area: '',
      district: '',
      permissionState: 'unavailable',
    };
  });

  const [currentTab, setCurrentTab] = useState<'marketplace' | 'my-listings'>('marketplace');
  const [listings, setListings] = useState<ProductListing[]>(() => ListingService.getAllListings(renterLocation));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isListWizardOpen, setIsListWizardOpen] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<ProductListing | null>(null);
  const [selectedModalProduct, setSelectedModalProduct] = useState<ProductListing | null>(null);
  
  // Profile & Address Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileModalMode, setProfileModalMode] = useState<'user' | 'renter'>('renter');

  // Refresh listings helper with active renter location
  const reloadListings = useCallback((loc?: UserLocation | null) => {
    const activeLoc = loc !== undefined ? loc : renterLocation;
    const fresh = ListingService.getAllListings(activeLoc);
    setListings(fresh);
  }, [renterLocation]);

  // Protected Action Guard Helper
  const requireAuth = useCallback((action: () => void) => {
    if (currentUser) {
      action();
    } else {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  }, [currentUser]);

  // Supabase Auth Session Initialization & Subscription
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const userAccount = AuthService.hydrateUserFromSupabase(session.user);
        setCurrentUser(userAccount);
        if (userAccount.city && userAccount.address) {
          const userLoc: UserLocation = {
            city: userAccount.city,
            area: userAccount.city,
            address: userAccount.address,
            pincode: userAccount.pincode,
            district: userAccount.city,
            formattedAddress: `${userAccount.address}, ${userAccount.city}`,
            isManual: true,
            isLive: false,
            permissionState: 'granted',
          };
          setRenterLocation(userLoc);
        }
      } else {
        const localUser = AuthService.getActiveUser();
        if (localUser) {
          setCurrentUser(localUser);
          if (localUser.city && localUser.address) {
            const userLoc: UserLocation = {
              city: localUser.city,
              area: localUser.city,
              address: localUser.address,
              pincode: localUser.pincode,
              district: localUser.city,
              formattedAddress: `${localUser.address}, ${localUser.city}`,
              isManual: true,
              isLive: false,
              permissionState: 'granted',
            };
            setRenterLocation(userLoc);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    }).catch((err) => {
      console.warn('[Rentora Auth] getSession check warning:', err);
      if (isMounted) {
        const localUser = AuthService.getActiveUser();
        if (localUser) {
          setCurrentUser(localUser);
        } else {
          setCurrentUser(null);
        }
        setIsAuthLoading(false);
      }
    });

    // 2. Reactive Auth State Listener (handles OAuth callbacks, logins, logouts, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const userAccount = AuthService.hydrateUserFromSupabase(session.user);
        setCurrentUser(userAccount);
        setIsAuthLoading(false);
        setIsAuthModalOpen(false);

        // Sync user's own saved location to active session if present
        if (userAccount.city && userAccount.address) {
          const userLoc: UserLocation = {
            city: userAccount.city,
            area: userAccount.city,
            address: userAccount.address,
            pincode: userAccount.pincode,
            district: userAccount.city,
            formattedAddress: `${userAccount.address}, ${userAccount.city}`,
            isManual: true,
            isLive: false,
            permissionState: 'granted',
          };
          setRenterLocation(userLoc);
          AuthSessionService.setRenterLocation(userLoc);
        } else {
          const defaultLoc: UserLocation = {
            city: 'Select your location manually',
            area: '',
            district: '',
            permissionState: 'unavailable',
          };
          setRenterLocation(defaultLoc);
          localStorage.removeItem('rentora_renter_location');
        }

        // Clean URL hash/query without reloading if returning from OAuth
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthLoading(false);
        setIsAuthModalOpen(false);
        setIsProfileModalOpen(false);
        setIsListWizardOpen(false);
        setPendingAction(null);
        setSelectedModalProduct(null);
        setCurrentTab('marketplace');
        const defaultLoc: UserLocation = {
          city: 'Select your location manually',
          area: '',
          district: '',
          permissionState: 'unavailable',
        };
        setRenterLocation(defaultLoc);
        localStorage.removeItem('rentora_renter_location');
        setListings(ListingService.getAllListings(defaultLoc));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Run ONCE on mount to avoid infinite auth re-render loop

  // Handle Manual Renter Location Change (e.g. from search or modal)
  const handleLocationChange = (newLoc: UserLocation) => {
    const manualLoc: UserLocation = {
      ...newLoc,
      lat: newLoc.latitude,
      lng: newLoc.longitude,
      isManual: true,
      isLive: false,
      permissionState: 'granted',
    };
    setRenterLocation(manualLoc);
    AuthSessionService.setRenterLocation(manualLoc);
    reloadListings(manualLoc);
  };

  // Handle User Profile Update
  const handleUpdateUserAccount = (updated: UserAccount) => {
    setCurrentUser({ ...updated });
    reloadListings();
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsAuthLoading(false);
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(false);
    setIsListWizardOpen(false);
    setPendingAction(null);
    setSelectedModalProduct(null);
    setCurrentUser(null);
    setCurrentTab('marketplace');
    const defaultLoc: UserLocation = {
      city: 'Select your location manually',
      area: '',
      district: '',
      permissionState: 'unavailable',
    };
    setRenterLocation(defaultLoc);
    localStorage.removeItem('rentora_renter_location');
    await AuthService.signOut();
    reloadListings(defaultLoc);
  };

  // Open Profile & Address Modal
  const handleOpenProfileModal = (mode: 'user' | 'renter') => {
    if (mode === 'user') {
      requireAuth(() => {
        setProfileModalMode('user');
        setIsProfileModalOpen(true);
      });
      return;
    }
    setProfileModalMode(mode);
    setIsProfileModalOpen(true);
  };

  // Protected: Open List Product Wizard
  const handleOpenListProduct = () => {
    requireAuth(() => {
      setEditingListing(null);
      setIsListWizardOpen(true);
    });
  };

  // Create Listing Handler
  const handleCreateListing = (
    listingData: Omit<ProductListing, 'id' | 'ownerId' | 'owner' | 'createdAt' | 'viewsCount' | 'rentalCount'>
  ) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const result = ListingService.createListing(listingData, currentUser);
    if (result.success && result.data) {
      reloadListings();
      setCurrentTab('my-listings');
    } else {
      alert(result.error || 'Failed to create product listing.');
    }
  };

  // Update Listing Handler (with backend authorization enforcement)
  const handleUpdateListing = (listingId: string, updates: Partial<ProductListing>) => {
    if (!currentUser) return;
    const result = ListingService.updateListing(listingId, updates, currentUser);
    if (result.success && result.data) {
      reloadListings();
      setEditingListing(null);
      if (selectedModalProduct?.id === listingId) {
        setSelectedModalProduct(result.data);
      }
    } else {
      alert(result.error || 'Unauthorized: Failed to update listing.');
    }
  };

  // Toggle Status Handler (with backend authorization enforcement)
  const handleToggleStatus = (id: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const result = ListingService.toggleListingStatus(id, currentUser);
    if (result.success && result.data) {
      reloadListings();
      if (selectedModalProduct?.id === id) {
        setSelectedModalProduct(result.data);
      }
    } else {
      alert(result.error || 'Unauthorized: Failed to change listing status.');
    }
  };

  // Delete Listing Handler (with backend authorization enforcement)
  const handleDeleteListing = (id: string) => {
    if (!currentUser) return;
    const target = listings.find((l) => l.id === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to delete "${target.title}"? This cannot be undone.`)) {
      const result = ListingService.deleteListing(id, currentUser);
      if (result.success) {
        reloadListings();
        if (selectedModalProduct?.id === id) {
          setSelectedModalProduct(null);
        }
      } else {
        alert(result.error || 'Unauthorized: Failed to delete listing.');
      }
    }
  };

  // Open Edit Flow
  const handleStartEdit = (listing: ProductListing) => {
    requireAuth(() => {
      setEditingListing(listing);
      setIsListWizardOpen(true);
    });
  };

  // Filter listings owned by current user
  const myListings = currentUser ? listings.filter((l) => l.ownerId === currentUser.id) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Top Marketplace Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'my-listings') {
            requireAuth(() => setCurrentTab('my-listings'));
            return;
          }
          setCurrentTab(tab);
        }}
        onOpenListProduct={handleOpenListProduct}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        isAuthLoading={isAuthLoading}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        renterLocation={renterLocation}
        onLocationChange={handleLocationChange}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* Main View Area */}
      <div className="flex-1">
        {currentTab === 'marketplace' ? (
          <MarketplaceView
            listings={listings}
            searchQuery={searchQuery}
            renterLocation={renterLocation}
            onOpenListProduct={handleOpenListProduct}
            currentUser={currentUser}
            onRequireAuth={requireAuth}
          />
        ) : (
          <MyListingsView
            myListings={myListings}
            onOpenListProduct={handleOpenListProduct}
            onEditListing={handleStartEdit}
            onToggleStatus={handleToggleStatus}
            onDeleteListing={handleDeleteListing}
            onViewDetails={setSelectedModalProduct}
          />
        )}
      </div>

      {/* Real Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          if (pendingAction) {
            const action = pendingAction;
            setPendingAction(null);
            action();
          }
          reloadListings();
        }}
      />

      {/* Owner Listing Wizard Modal (Create & Edit) */}
      {currentUser && (
        <ListProductWizard
          isOpen={isListWizardOpen}
          onClose={() => {
            setIsListWizardOpen(false);
            setEditingListing(null);
          }}
          currentUser={currentUser}
          editingListing={editingListing}
          onPublishSuccess={handleCreateListing}
          onUpdateSuccess={handleUpdateListing}
        />
      )}

      {/* Manual User & Renter Profile Contact & Address Modal */}
      {currentUser && (
        <ProfileAddressModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateUserAccount={handleUpdateUserAccount}
          onUpdateRenterLocation={handleLocationChange}
          mode={profileModalMode}
        />
      )}

      {/* Global Product Detail Modal */}
      <ProductDetailModal
        listing={selectedModalProduct}
        isOpen={!!selectedModalProduct}
        onClose={() => setSelectedModalProduct(null)}
        currentUser={currentUser || undefined}
        onRequireAuth={requireAuth}
        onEditListing={handleStartEdit}
        onToggleStatus={handleToggleStatus}
        onDeleteListing={handleDeleteListing}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="text-emerald-700">RENTORA</span>
            <span>•</span>
            <span className="text-slate-500 font-normal">Peer-to-Peer Physical Rental Marketplace</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <span>Production Supabase Auth</span>
            <span>Escrow Protected Deposits</span>
            <span>Real Owner Profiles & Verified Handovers</span>
          </div>

          <p className="text-slate-400 text-[11px]">
            © 2026 Rentora Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
