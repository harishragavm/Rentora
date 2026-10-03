import React from 'react';
import type { ProductListing } from '../../types/marketplace';
import { MapPin, Star, ChevronRight, Navigation, Phone } from 'lucide-react';
import { formatDistance } from '../../utils/locationUtils';

interface ProductCardProps {
  listing: ProductListing;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  listing,
  onClick,
}) => {
  const primaryImg = listing.images[listing.primaryImageIndex || 0] || listing.images[0];
  const productLoc = listing.productLocation || listing.location;
  const ownerMobile = listing.ownerMobile || listing.owner.phone;

  const conditionBadges: Record<string, { label: string; bg: string }> = {
    brand_new: { label: 'Like New', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    like_new: { label: 'Excellent', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
    good: { label: 'Good', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    fair: { label: 'Working Wear', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  const cond = conditionBadges[listing.condition] || { label: listing.condition, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  const distanceFormatted = formatDistance(listing.distanceKm);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Viewport */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={primaryImg}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Condition & Category Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs ${cond.bg}`}>
            {cond.label}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md">
            {listing.category.toUpperCase()}
          </span>
        </div>

        {/* Product Location & Real Distance Overlay on Image */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-md z-10">
          <div className="flex items-center gap-1 text-slate-200">
            <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="truncate max-w-[110px]">{productLoc.area || productLoc.city}</span>
          </div>
          {distanceFormatted && (
            <div className="flex items-center gap-1 text-emerald-400 font-extrabold border-l border-slate-700 pl-2">
              <Navigation className="w-2.5 h-2.5 fill-current" />
              <span>{distanceFormatted}</span>
            </div>
          )}
        </div>

        {/* Photos Count Indicator */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {listing.images.length} Photos
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Verified Owner & Mobile Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-medium truncate text-slate-700 text-[11px] leading-tight">
                Listed by <strong className="text-slate-900">{listing.ownerName || listing.owner.name}</strong>
              </span>
              {ownerMobile && (
                <span className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1 mt-0.5">
                  <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>{ownerMobile}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-800 font-bold text-[11px] flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{listing.owner.rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {listing.title}
          </h3>

          {/* Model info snippet */}
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
            {listing.brand} • {listing.model}
          </p>

          {/* Highlights / Accessories snippet */}
          {listing.accessoriesIncluded && listing.accessoriesIncluded.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {listing.accessoriesIncluded.slice(0, 2).map((acc, i) => (
                <span
                  key={i}
                  className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]"
                >
                  +{acc}
                </span>
              ))}
              {listing.accessoriesIncluded.length > 2 && (
                <span className="text-[10px] text-slate-400 px-1 py-0.5">
                  +{listing.accessoriesIncluded.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="text-base font-extrabold text-slate-900">
              ₹{listing.pricing.price.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {listing.pricing.period}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Deposit: ₹{listing.pricing.securityDeposit.toLocaleString()} (Refundable)
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Rent</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
