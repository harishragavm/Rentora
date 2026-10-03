import React, { useState, useMemo } from 'react';
import type { ProductListing, UserLocation } from '../../types/marketplace';
import { CATEGORIES_LIST } from '../../data/categoryFields';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { 
  PlusCircle, 
  ShieldCheck, 
  PackageX,
  Bike,
  Camera,
  Laptop,
  Plane,
  Gamepad2,
  Wrench,
  Tent,
  Speaker,
  Package,
  Navigation,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react';

import type { UserAccount } from '../../services/authSession';

interface MarketplaceViewProps {
  listings: ProductListing[];
  searchQuery: string;
  renterLocation: UserLocation;
  onOpenListProduct: () => void;
  currentUser?: UserAccount | null;
  onRequireAuth?: (action: () => void) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Bike: <Bike className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Plane: <Plane className="w-4 h-4" />,
  Gamepad2: <Gamepad2 className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Tent: <Tent className="w-4 h-4" />,
  Speaker: <Speaker className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
};

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  searchQuery,
  renterLocation,
  onOpenListProduct,
  currentUser,
  onRequireAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'nearby' | 'featured' | 'price_low' | 'price_high' | 'rating'>('nearby');
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);

  const hasRenterCoords = Boolean(
    renterLocation.latitude !== undefined &&
    renterLocation.longitude !== undefined &&
    !isNaN(renterLocation.latitude) &&
    !isNaN(renterLocation.longitude)
  );

  // Filter & Sort listings
  const filteredListings = useMemo(() => {
    // Deduplicate listings by id
    const uniqueMap = new Map<string, ProductListing>();
    listings.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    const uniqueListings = Array.from(uniqueMap.values());

    return uniqueListings
      .filter((item) => {
        // Status check
        if (item.status === 'paused') return false;

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Condition filter
        if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
          return false;
        }

        // Distance filter (Only apply if renter has coordinates and maxDistanceKm is not 'all')
        if (maxDistanceKm !== 'all') {
          if (item.distanceKm === undefined || item.distanceKm > maxDistanceKm) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchModel = item.model.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchArea = (item.location?.area || '').toLowerCase().includes(q);
          const matchCity = (item.location?.city || '').toLowerCase().includes(q);
          return matchTitle || matchBrand || matchModel || matchCategory || matchDesc || matchArea || matchCity;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nearby') {
          // If renter coordinates exist, sort closest first
          if (hasRenterCoords) {
            const distA = a.distanceKm ?? 999999;
            const distB = b.distanceKm ?? 999999;
            return distA - distB;
          }
          return 0; // fallback to natural order if no GPS
        }
        if (sortBy === 'price_low') return a.pricing.price - b.pricing.price;
        if (sortBy === 'price_high') return b.pricing.price - a.pricing.price;
        if (sortBy === 'rating') return b.owner.rating - a.owner.rating;
        return 0; // featured / default
      });
  }, [listings, selectedCategory, selectedCondition, maxDistanceKm, searchQuery, sortBy, hasRenterCoords]);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16">
      
      {/* Hero Welcome Banner */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Peer-to-Peer Rental Network</span>
              </div>

              {renterLocation.permissionState === 'loading' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>Detecting your location...</span>
                </div>
              ) : hasRenterCoords ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Location: <strong>{renterLocation.area || renterLocation.city}</strong>{' '}
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      ({renterLocation.isLive ? 'Live GPS' : 'Selected'})
                    </span>
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Location unavailable • Enable in top bar to calculate distance</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Rent Real Physical Products from Verified Owners
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Bikes, cinema cameras, high-end laptops, drones, tools, camping gear, and gaming rigs. Rent what you need from verified owners with calculated distance and protected security deposits.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onOpenListProduct}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>List Your Product</span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Pills Strip */}
      <div className="bg-white border-b border-slate-200 sticky top-[95px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* All Category Pill */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Rentals</span>
          </button>

          {/* Dynamic Categories */}
          {CATEGORIES_LIST.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCatActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_ICONS[cat.iconName]}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Controls Toolbar: Result Count + Distance + Condition filter + Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">{filteredListings.length}</span>
            <span>products available</span>
            {hasRenterCoords && (
              <span>• Near <strong className="text-slate-900">{renterLocation.area || renterLocation.city}</strong></span>
            )}
            {selectedCategory !== 'all' && (
              <span>• <strong className="text-emerald-700">{CATEGORIES_LIST.find((c) => c.id === selectedCategory)?.label}</strong></span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Distance Radius Filter (Active if renter has coordinates) */}
            {hasRenterCoords && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 hidden sm:inline flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span>Radius:</span>
                </span>
                <select
                  value={maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Any Distance</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="150">Within 150 km</option>
                </select>
              </div>
            )}

            {/* Condition Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 hidden sm:inline">Condition:</span>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
              >
                <option value="all">All Conditions</option>
                <option value="brand_new">Like New</option>
                <option value="like_new">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Working Wear</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600"
              >
                <option value="nearby">Nearby (Closest First)</option>
                <option value="featured">Featured First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated Owner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredListings.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                onClick={() => setSelectedProduct(listing)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <PackageX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No active listings match your current filters or distance radius. Try expanding the radius or resetting filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedCondition('all');
                setMaxDistanceKm('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        listing={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        currentUser={currentUser || undefined}
        onRequireAuth={onRequireAuth}
      />
    </div>
  );
};
