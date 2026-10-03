import React, { useState } from 'react';
import type { ProductListing } from '../../types/marketplace';
import { CATEGORIES_LIST } from '../../data/categoryFields';
import { 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Edit3, 
  ArrowRight, 
  FileCheck,
  Activity,
  Lock,
  User,
  Phone
} from 'lucide-react';

interface ListingReviewModalProps {
  listingData: Partial<ProductListing>;
  onEditSection: (stepIndex: number) => void;
  onConfirmPublish: () => void;
  isPublishing: boolean;
}

export const ListingReviewModal: React.FC<ListingReviewModalProps> = ({
  listingData,
  onEditSection,
  onConfirmPublish,
  isPublishing,
}) => {
  const [hasConfirmedTruth, setHasConfirmedTruth] = useState(false);
  const currentCategoryMeta = CATEGORIES_LIST.find((c) => c.id === listingData.category);

  const conditionLabels: Record<string, string> = {
    brand_new: 'Like New (Excellent)',
    like_new: 'Excellent Condition',
    good: 'Good & Functional',
    fair: 'Fair / Working Wear',
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

  const productLoc = listingData.productLocation || listingData.location;

  return (
    <div className="space-y-6">
      {/* Review Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-slate-900">Review & Confirm Before Publishing</h4>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Please verify your owner information, product condition ratings, and rental availability location below before publishing your listing.
          </p>
        </div>
      </div>

      {/* Main Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* SECTION 0: Owner / Provider Information */}
        <div className="p-6 bg-slate-50/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Product Owner & Provider</span>
            </h3>
            <button
              type="button"
              onClick={() => onEditSection(0)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Owner Info
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Full Name
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{listingData.ownerName || 'Verified Owner'}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Mobile (Encrypted)
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{listingData.ownerMobile || 'Protected'}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Owner Base Location
              </span>
              <p className="font-bold text-slate-900 mt-0.5">
                {listingData.ownerLocation?.city || 'Registered City'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Product Header & Photos */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentCategoryMeta?.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {conditionLabels[listingData.condition || 'like_new']}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {listingData.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {listingData.brand} • {listingData.model}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onEditSection(1)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Info
            </button>
          </div>

          {/* Photo Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {listingData.images?.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
              >
                <img src={img} alt="Product" className="w-full h-full object-cover" />
                {idx === (listingData.primaryImageIndex || 0) && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Description */}
          {listingData.description && (
            <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-800 mb-1">Owner Description:</p>
              <p className="leading-relaxed whitespace-pre-line">{listingData.description}</p>
            </div>
          )}
        </div>

        {/* SECTION 2: Category-Aware Component Condition Breakdown */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Category Condition & Specifications</span>
            </h3>
            <button
              type="button"
              onClick={() => onEditSection(3)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Condition
            </button>
          </div>

          {/* Component Ratings Grid */}
          {listingData.categoryCondition && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Physical Component Ratings:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(listingData.categoryCondition).map(([key, val]) => {
                  if (typeof val !== 'string' || key === 'additionalDescription' || key === 'accessoriesNotes') return null;
                  const label = key.replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="capitalize text-slate-600 font-medium">{label}:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${ratingBadgeClass(val)}`}>
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {listingData.specs && Object.entries(listingData.specs).map(([key, val]) => {
              if (!val || (Array.isArray(val) && val.length === 0)) return null;
              const formattedVal = Array.isArray(val) ? val.join(', ') : String(val);
              return (
                <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">{formattedVal}</p>
                </div>
              );
            })}
          </div>

          {listingData.conditionNotes && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
              <span className="font-bold">Owner Condition Notes: </span>
              {listingData.conditionNotes}
            </div>
          )}
        </div>

        {/* SECTION 3: Product Location, Pricing & Rules */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Product Rental Location, Pricing & Rules</span>
            </h3>
            <button
              type="button"
              onClick={() => onEditSection(4)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Terms
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[11px] text-slate-500 font-medium">Rental Rate</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                ₹{listingData.pricing?.price}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {listingData.pricing?.period}
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Security Deposit</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                ₹{listingData.pricing?.securityDeposit}{' '}
                <span className="text-xs font-normal text-emerald-600">(Refundable)</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Product Availability Site</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {productLoc?.area || productLoc?.city}, {productLoc?.city}
              </p>
            </div>
          </div>

          {/* Location Privacy Note */}
          <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span>Private street address is kept confidential. Only neighborhood area and calculated distance are displayed on marketplace cards.</span>
          </div>

          {/* Active Rules */}
          {listingData.rules && listingData.rules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Owner Rental Rules ({listingData.rules.length}):
              </p>
              <div className="space-y-1">
                {listingData.rules.map((rule, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Owner Confirmation Checkbox */}
      <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasConfirmedTruth}
            onChange={(e) => setHasConfirmedTruth(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-900">
              I confirm that all owner information, component condition ratings, and product availability locations are accurate.
            </span>
            <p className="text-slate-500 mt-0.5">
              I am the rightful owner / custodian of this product and agree to Rentora's Peer-to-Peer Rental Terms and Security Deposit Handling Policy.
            </p>
          </div>
        </label>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={!hasConfirmedTruth || isPublishing}
        onClick={onConfirmPublish}
        className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPublishing ? (
          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <>
            <FileCheck className="w-5 h-5" />
            <span>Publish Listing to Rentora Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};
