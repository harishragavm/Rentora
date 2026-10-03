import React, { useState } from 'react';
import type { ProductListing, OwnerProfile } from '../../types/marketplace';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  Trash2,
  PauseCircle,
  PlayCircle,
  Navigation,
  Activity,
  Lock,
  User,
  Phone
} from 'lucide-react';
import { formatDistance } from '../../utils/locationUtils';

interface ProductDetailModalProps {
  listing: ProductListing | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: OwnerProfile;
  onRequireAuth?: (onSuccessAction: () => void) => void;
  onEditListing?: (listing: ProductListing) => void;
  onToggleStatus?: (id: string) => void;
  onDeleteListing?: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  currentUser,
  onRequireAuth,
  onEditListing,
  onToggleStatus,
  onDeleteListing,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rentalDays, setRentalDays] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !listing) return null;

  const isOwner = Boolean(currentUser && listing.ownerId === currentUser.id);
  const isPaused = listing.status === 'paused';
  const totalRent = listing.pricing.price * rentalDays;
  const deposit = listing.pricing.securityDeposit;
  const grandTotal = totalRent + deposit;
  const distanceFormatted = formatDistance(listing.distanceKm);
  const productLoc = listing.productLocation || listing.location;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const ratingBadgeClass = (rating?: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'good':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'poor':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && onRequireAuth) {
      onRequireAuth(() => {
        setIsSubmitting(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setBookingSuccess(true);
        }, 600);
      });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {listing.category.toUpperCase()}
            </span>
            {isOwner ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                Your Listing (Owner)
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Listing ID: #{listing.id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
              {isCopied && <span className="text-emerald-700 font-bold text-[10px]">Copied!</span>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Main Grid: Left Gallery + Right Key Booking Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Photo Gallery & Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Image Viewport */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={listing.images[activeImageIndex] || listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />

                {/* Navigation arrows if multiple photos */}
                {listing.images.length > 1 && (
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : listing.images.length - 1))}
                      className="pointer-events-auto p-2 rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev < listing.images.length - 1 ? prev + 1 : 0))}
                      className="pointer-events-auto p-2 rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-16 h-12 rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                        activeImageIndex === i ? 'ring-2 ring-emerald-600 border-emerald-600' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Core Meta */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {productLoc.area || productLoc.city}, {productLoc.city}
                  </span>
                  {distanceFormatted && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      {distanceFormatted}
                    </span>
                  )}
                  <span>•</span>
                  <span>Brand: <strong className="text-slate-800">{listing.brand}</strong></span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {listing.title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Model: {listing.model}</p>
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                <p className="font-bold text-slate-900">Owner Description:</p>
                <p className="whitespace-pre-line">{listing.description}</p>
              </div>
            </div>

            {/* RIGHT: Rental Calculator OR Owner Management Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-lg space-y-5">
                {/* Pricing Header */}
                <div className="flex items-end justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      ₹{listing.pricing.price.toLocaleString()}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      per {listing.pricing.period} (24-hour rental)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Refundable Deposit
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      ₹{listing.pricing.securityDeposit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {isOwner ? (
                  /* OWNER MANAGEMENT CONTROLS */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Owner Controls</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        You created this listing. You can update details, toggle availability, or delete it from the marketplace.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {onEditListing && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditListing(listing);
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Product Information</span>
                        </button>
                      )}

                      {onToggleStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(listing.id)}
                          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                            isPaused
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          <span>{isPaused ? 'Resume / Activate Listing' : 'Pause Listing'}</span>
                        </button>
                      )}

                      {onDeleteListing && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDeleteListing(listing.id);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Listing</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* RENTER FLOW (NON-OWNER) */
                  <>
                    {!bookingSuccess ? (
                      <form onSubmit={handleBooking} className="space-y-4 text-xs">
                        {/* Duration Select */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1.5">
                            Rental Duration ({listing.pricing.period}s)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={listing.availability.minDuration || 1}
                              max={30}
                              value={rentalDays}
                              onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <span className="text-slate-500">
                              {rentalDays} {listing.pricing.period}(s) selected
                            </span>
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
                          <div className="flex justify-between text-slate-600">
                            <span>₹{listing.pricing.price} × {rentalDays} {listing.pricing.period}(s)</span>
                            <span className="font-semibold text-slate-900">₹{totalRent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Refundable Security Deposit</span>
                            <span className="font-semibold text-slate-900">₹{deposit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Rentora P2P Protection Fee</span>
                            <span className="font-semibold text-emerald-700">₹0 (Free)</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                            <span>Total Payable at Handover</span>
                            <span>₹{grandTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Deposit Protection Notice */}
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-emerald-900 leading-snug">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                          <span>Security deposit is protected by Rentora Escrow and automatically refunded after return inspection.</span>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span>Request Rental from Owner</span>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Success State */
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-900">Rental Request Dispatched!</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Owner <strong className="text-slate-800">{listing.ownerName || listing.owner.name}</strong> has been notified. Handover location: <strong className="text-slate-800">{productLoc.area || productLoc.city}, {productLoc.city}</strong>.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Controlled "Listed By" Section */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-xs flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900">{listing.ownerName || listing.owner.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700">Verified Owner</span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>★ {listing.owner.rating} ({listing.owner.totalReviews} reviews)</span>
                      <span>•</span>
                      <span>{listing.ownerLocation?.city || listing.owner.city}</span>
                    </p>
                    {(listing.ownerMobile || listing.owner.phone) && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{listing.ownerMobile || listing.owner.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTIONS: Category Condition Breakdown, Specifications, Rules, Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            
            {/* 1. Category Condition Checklist Sheet */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Physical Component Condition Report</span>
              </h3>

              {listing.categoryCondition ? (
                <div className="space-y-2 text-xs divide-y divide-slate-200/60">
                  {Object.entries(listing.categoryCondition).map(([k, v]) => {
                    if (typeof v !== 'string' || k === 'additionalDescription' || k === 'accessoriesNotes') return null;
                    const label = k.replace(/([A-Z])/g, ' $1').trim();
                    return (
                      <div key={k} className="pt-2 first:pt-0 flex justify-between items-center gap-2">
                        <span className="text-slate-600 capitalize font-medium">{label}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${ratingBadgeClass(v)}`}>
                          {v}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Overall Condition: <strong className="text-slate-800 capitalize">{listing.condition.replace('_', ' ')}</strong></p>
              )}

              {listing.healthStatus && (
                <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">Operating Health Status:</span>
                  <span className="text-slate-600">{listing.healthStatus}</span>
                </div>
              )}
            </div>

            {/* 2. Product Rental Location Privacy & Pickup Timing */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Product Pickup Handover & Location</span>
              </h3>

              {/* Handover location note */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{productLoc.area || productLoc.city}, {productLoc.city}</span>
                  {distanceFormatted && (
                    <span className="text-emerald-700 font-bold text-[11px]">{distanceFormatted}</span>
                  )}
                </div>
                {productLoc.pickupInstructions && (
                  <p className="text-slate-600 text-[11px] pt-1">
                    <strong>Pickup Guidance: </strong>{productLoc.pickupInstructions}
                  </p>
                )}
              </div>

              {/* Operating Hours */}
              <div className="flex items-center gap-4 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Operating Handover Window:</p>
                  <p className="text-slate-500">
                    Daily {listing.availability.pickupTimeStart} to {listing.availability.pickupTimeEnd}
                  </p>
                </div>
              </div>

              {/* Privacy protection notice */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Exact address & contact details released upon owner confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
