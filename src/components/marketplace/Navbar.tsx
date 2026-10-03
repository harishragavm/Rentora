import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  PlusCircle, 
  ShieldCheck, 
  Package, 
  ChevronDown,
  AlertCircle,
  Loader2,
  Edit3,
  LogOut,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { Logo } from '../Logo';
import type { UserAccount } from '../../services/authSession';
import type { UserLocation } from '../../types/marketplace';
import { searchLocationsReal, type GeocodedLocation } from '../../utils/locationUtils';

interface NavbarProps {
  currentTab: 'marketplace' | 'my-listings';
  onTabChange: (tab: 'marketplace' | 'my-listings') => void;
  onOpenListProduct: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: UserAccount | null;
  isAuthLoading?: boolean;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  renterLocation: UserLocation;
  onLocationChange: (location: UserLocation) => void;
  onOpenProfileModal: (mode: 'user' | 'renter') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenListProduct,
  searchQuery,
  onSearchChange,
  currentUser,
  isAuthLoading = false,
  onLogout,
  onOpenAuthModal,
  renterLocation,
  onLocationChange,
  onOpenProfileModal,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real Geocoding Search Debounce
  useEffect(() => {
    const query = searchLocationQuery.trim();
    if (query.length < 2) return;

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocationsReal(query);
        if (active) {
          setSearchResults(results);
        }
      } catch (err) {
        console.warn('[Navbar] Search location error:', err);
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setIsSearchingLocation(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchLocationQuery]);

  const handleSelectSearchResult = (res: GeocodedLocation) => {
    const newLoc: UserLocation = {
      city: res.district || res.city,
      area: res.area,
      district: res.district || res.city,
      address: res.displayName,
      formattedAddress: res.area && res.district && res.area !== res.district ? `${res.area}, ${res.district}` : res.area || res.district,
      latitude: res.latitude,
      longitude: res.longitude,
      lat: res.latitude,
      lng: res.longitude,
      isLive: false,
      isManual: true,
      permissionState: 'granted',
    };
    onLocationChange(newLoc);
    setIsLocationModalOpen(false);
    setSearchLocationQuery('');
    setSearchResults([]);
  };

  const hasLocation = Boolean(renterLocation.city && !renterLocation.city.includes('Select your location'));

  // Formatted location string
  let displayLocationText = renterLocation.formattedAddress;
  if (!displayLocationText) {
    if (renterLocation.area && renterLocation.district && renterLocation.area.toLowerCase() !== renterLocation.district.toLowerCase()) {
      displayLocationText = `${renterLocation.area}, ${renterLocation.district}`;
    } else {
      displayLocationText = renterLocation.city || renterLocation.address || '';
    }
  }

  const mainLocationTitle = hasLocation
    ? displayLocationText || renterLocation.city
    : 'Select your location manually';

  const locationSubtitle = hasLocation
    ? 'Manual address set'
    : 'Click to enter address';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Trust Microbar */}
      <div className="bg-emerald-900 text-white text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Rentora Verified P2P Marketplace: Real Production Auth & Escrow-Protected Deposits</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <div className="cursor-pointer" onClick={() => onTabChange('marketplace')}>
            <Logo size="md" variant="dark" subtext="Peer-to-Peer Rental" />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onTabChange('marketplace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'marketplace'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Explore Rentals
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  return;
                }
                onTabChange('my-listings');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'my-listings'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              <span>My Listed Products</span>
            </button>
          </nav>
        </div>

        {/* Manual Location Selector & Global Search */}
        <div className="flex-1 max-w-lg hidden lg:flex items-center gap-2">
          
          {/* Location Selector Dropdown */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-3 pr-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors text-left cursor-pointer"
              title="Click to set your manual contact & address info"
            >
              {!hasLocation ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              )}

              <div className="leading-tight max-w-[160px] truncate">
                <span className={`block font-bold truncate ${!hasLocation ? 'text-emerald-800' : 'text-slate-900'}`}>
                  {mainLocationTitle}
                </span>
                <span className="block text-[10px] truncate text-slate-500">
                  {locationSubtitle}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Location Selector Dropdown Modal */}
            {isLocationModalOpen && (
              <div className="absolute left-0 mt-2 w-84 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Renter Address & Contact</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Manual Profile</span>
                </div>

                {/* Option 1: Open Manual Address Form */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocationModalOpen(false);
                      onOpenProfileModal('renter');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Enter Contact & Address Details</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Name, mobile number, address, city, & pincode
                  </p>
                </div>

                {/* Option 2: Search Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Or Search City / Town / Area:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchLocationQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchLocationQuery(val);
                        if (val.trim().length < 2) {
                          setSearchResults([]);
                        }
                      }}
                      placeholder="Search city or town"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    {isSearchingLocation && (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-2.5 top-2.5" />
                    )}
                  </div>
                </div>

                {/* Search Results List */}
                {searchResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border-t border-slate-100 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Matching Locations:
                    </p>
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full text-left p-2 rounded-xl text-xs hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 flex flex-col transition-all group cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 group-hover:text-emerald-800">
                          {res.area} {res.district && res.district !== res.area ? `(${res.district})` : ''}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">
                          {res.displayName}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchLocationQuery.trim().length >= 2 && !isSearchingLocation ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                    No matching location found. Try another search.
                  </div>
                ) : null}

                {/* Status Notice */}
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-snug">
                  {hasLocation ? (
                    <span>
                      Active: <strong>{displayLocationText}</strong>
                    </span>
                  ) : (
                    <span>Please enter your contact and address details.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products for rent"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          {/* List Your Product CTA Button */}
          <button
            type="button"
            onClick={onOpenListProduct}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>List Your Product</span>
          </button>

          {/* Authenticated User Profile / Sign In Button */}
          {isAuthLoading ? (
            <div className="w-24 h-8 rounded-xl bg-slate-100 animate-pulse border border-slate-200"></div>
          ) : currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-slate-700 font-medium cursor-pointer"
                title="Account and Profile Settings"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                />
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold text-slate-900 truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Authenticated</span>
                </div>
              </button>

              {/* Real User Profile Popover */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-76 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-3 z-50 animate-fadeIn">
                  <div className="pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        {currentUser.phone && (
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">📞 +91 {currentUser.phone}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {currentUser.phoneVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Phone Verified (OTP)
                            </span>
                          )}
                          {currentUser.emailVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Email Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentUser.address && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        📍 {currentUser.address}, {currentUser.city} {currentUser.pincode ? `- ${currentUser.pincode}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onTabChange('my-listings');
                      }}
                      className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-700" />
                      <span>My Listed Products</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenProfileModal('user');
                      }}
                      className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Contact & Address</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">
                      Real Supabase Authentication
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Join</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Location & Search Bar */}
      <div className="p-3 border-t border-slate-100 lg:hidden flex flex-col gap-2">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 truncate flex-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-slate-800 truncate">{mainLocationTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenProfileModal('renter')}
            className="text-[11px] text-emerald-700 font-bold ml-2 flex-shrink-0 cursor-pointer"
          >
            Enter Address
          </button>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products for rent"
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>
    </header>
  );
};
