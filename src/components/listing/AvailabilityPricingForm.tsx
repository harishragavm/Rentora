import React, { useState, useEffect } from 'react';
import type { 
  ProductLocation, 
  AvailabilityConfig, 
  RentalPricing, 
  PricingPeriod 
} from '../../types/marketplace';
import { COMMON_RENTAL_RULES } from '../../data/categoryFields';
import { 
  getLiveBrowserPosition,
  searchLocationsReal,
  type GeocodedLocation 
} from '../../utils/locationUtils';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Shield, 
  Plus, 
  X, 
  Check, 
  Navigation, 
  Lock,
  Loader2,
  Search
} from 'lucide-react';

interface AvailabilityPricingFormProps {
  location: ProductLocation;
  availability: AvailabilityConfig;
  pricing: RentalPricing;
  rules: string[];
  onLocationChange: (loc: ProductLocation) => void;
  onAvailabilityChange: (avail: AvailabilityConfig) => void;
  onPricingChange: (pricing: RentalPricing) => void;
  onRulesChange: (rules: string[]) => void;
}

export const AvailabilityPricingForm: React.FC<AvailabilityPricingFormProps> = ({
  location,
  availability,
  pricing,
  rules,
  onLocationChange,
  onAvailabilityChange,
  onPricingChange,
  onRulesChange,
}) => {
  const [customRuleText, setCustomRuleText] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

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
        console.warn('[AvailabilityPricingForm] Location search error:', err);
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

  const handleUseLiveLocation = async () => {
    setIsDetectingLocation(true);
    setLocationSuccessMsg(null);
    try {
      const pos = await getLiveBrowserPosition();
      onLocationChange({
        ...location,
        city: pos.city,
        area: pos.area,
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
      setLocationSuccessMsg(`Live location captured: ${pos.area}, ${pos.city}`);
    } catch (err: any) {
      alert(err.message || 'Could not detect live GPS location. Please search or enter your city and area below.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSelectSearchResult = (res: GeocodedLocation) => {
    onLocationChange({
      ...location,
      city: res.city,
      area: res.area,
      latitude: res.latitude,
      longitude: res.longitude,
    });
    setLocationSuccessMsg(`Location set: ${res.area}, ${res.city}`);
    setSearchLocationQuery('');
    setSearchResults([]);
  };

  const handleAddCustomRule = () => {
    if (!customRuleText.trim()) return;
    if (!rules.includes(customRuleText.trim())) {
      onRulesChange([...rules, customRuleText.trim()]);
    }
    setCustomRuleText('');
  };

  const handleRemoveRule = (ruleToRemove: string) => {
    onRulesChange(rules.filter((r) => r !== ruleToRemove));
  };

  const handleToggleCommonRule = (commonRule: string) => {
    if (rules.includes(commonRule)) {
      onRulesChange(rules.filter((r) => r !== commonRule));
    } else {
      onRulesChange([...rules, commonRule]);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. LOCATION SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Rental Location</h3>
              <p className="text-[11px] text-slate-500">Specify where this physical product is located for pickup</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseLiveLocation}
            disabled={isDetectingLocation}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Use Current Location (GPS)</span>
          </button>
        </div>

        {/* Location Success Toast */}
        {locationSuccessMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{locationSuccessMsg}</span>
          </div>
        )}

        {/* Real Geocoding Search Input */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Search Location / Neighborhood:
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchLocationQuery}
              onChange={(e) => setSearchLocationQuery(e.target.value)}
              placeholder="Search area, neighborhood, or city name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            {isSearchingLocation && (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-2.5 top-3" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 max-h-48 overflow-y-auto space-y-1 z-20 relative">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2 rounded-xl text-xs hover:bg-emerald-50 text-slate-900 flex flex-col transition-colors"
                >
                  <span className="font-bold text-slate-900">{res.area}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{res.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Physical Handover Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={location.address || ''}
              onChange={(e) => onLocationChange({ ...location, address: e.target.value })}
              placeholder="Enter address"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              City / Town <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => onLocationChange({ ...location, city: e.target.value })}
              placeholder="Enter city or town"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Pincode <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={location.pincode || ''}
              onChange={(e) => onLocationChange({ ...location, pincode: e.target.value.replace(/\D/g, '') })}
              placeholder="Enter pincode"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Handover & Pickup Guidance for Renter
            </label>
            <input
              type="text"
              value={location.pickupInstructions || ''}
              onChange={(e) => onLocationChange({ ...location, pickupInstructions: e.target.value })}
              placeholder="Enter handover guidance"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Privacy Notice Banner */}
          <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Location Privacy Protection: </span>
              Exact street addresses are stored securely and never exposed publicly on marketplace cards. Renters will only see the approximate neighborhood area and calculated distance.
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="deliveryAvailable"
              checked={location.deliveryAvailable || false}
              onChange={(e) => onLocationChange({ ...location, deliveryAvailable: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="deliveryAvailable" className="text-xs text-slate-700 cursor-pointer">
              I can offer local doorstep drop-off / pickup within 10 km (delivery fee can be coordinated).
            </label>
          </div>
        </div>
      </div>

      {/* 2. AVAILABILITY & SCHEDULES */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Availability & Daily Hours</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="openEnded"
                checked={availability.openEnded}
                onChange={() => onAvailabilityChange({ ...availability, openEnded: true, startDate: undefined, endDate: undefined })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Always Available / Ongoing</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="openEnded"
                checked={!availability.openEnded}
                onChange={() => onAvailabilityChange({ ...availability, openEnded: false })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Specific Date Window</span>
            </label>
          </div>

          {!availability.openEnded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Available From Date
                </label>
                <input
                  type="date"
                  value={availability.startDate || ''}
                  onChange={(e) => onAvailabilityChange({ ...availability, startDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Available Until Date
                </label>
                <input
                  type="date"
                  value={availability.endDate || ''}
                  onChange={(e) => onAvailabilityChange({ ...availability, endDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Daily Handover Hours & Min Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Daily Pickup Opens
              </label>
              <input
                type="time"
                value={availability.pickupTimeStart}
                onChange={(e) => onAvailabilityChange({ ...availability, pickupTimeStart: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Daily Drop Closes
              </label>
              <input
                type="time"
                value={availability.pickupTimeEnd}
                onChange={(e) => onAvailabilityChange({ ...availability, pickupTimeEnd: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Minimum Rental Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={availability.minDuration}
                  onChange={(e) => onAvailabilityChange({ ...availability, minDuration: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 text-center focus:outline-none focus:border-emerald-600"
                />
                <select
                  value={availability.minDurationUnit}
                  onChange={(e) => onAvailabilityChange({ ...availability, minDurationUnit: e.target.value as 'hours' | 'days' })}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="days">Day(s)</option>
                  <option value="hours">Hour(s)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRICING & SECURITY DEPOSIT */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Rental Pricing & Security Deposit</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Rental Rate (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                min={0}
                value={pricing.price || ''}
                onChange={(e) => onPricingChange({ ...pricing, price: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Pricing Period <span className="text-rose-500">*</span>
            </label>
            <select
              value={pricing.period}
              onChange={(e) => onPricingChange({ ...pricing, period: e.target.value as PricingPeriod })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              <option value="day">Per Day (24 Hours)</option>
              <option value="hour">Per Hour</option>
              <option value="week">Per Week</option>
              <option value="month">Per Month</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Refundable Security Deposit (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                min={0}
                value={pricing.securityDeposit || ''}
                onChange={(e) => onPricingChange({ ...pricing, securityDeposit: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Cancellation & Refund Policy
          </label>
          <select
            value={pricing.cancellationPolicy}
            onChange={(e) => onPricingChange({ ...pricing, cancellationPolicy: e.target.value as any })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          >
            <option value="Flexible (100% refund up to 24h prior)">
              Flexible (100% refund up to 24 hours prior to booking start)
            </option>
            <option value="Moderate (50% refund up to 48h prior)">
              Moderate (50% refund up to 48 hours prior)
            </option>
            <option value="Strict (Non-refundable)">
              Strict (Non-refundable upon booking confirmation)
            </option>
          </select>
        </div>
      </div>

      {/* 4. RENTAL RULES */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Owner Rental Rules & Requirements</h3>
        </div>

        {/* Common Quick Toggles */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-slate-500">Quickly enable standard owner rules:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMON_RENTAL_RULES.map((ruleText) => {
              const isEnabled = rules.includes(ruleText);
              return (
                <button
                  key={ruleText}
                  type="button"
                  onClick={() => handleToggleCommonRule(ruleText)}
                  className={`p-2.5 rounded-xl text-xs text-left border flex items-start gap-2 transition-all ${
                    isEnabled
                      ? 'bg-emerald-50/60 border-emerald-600 text-slate-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isEnabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] leading-tight">{ruleText}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Rule Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customRuleText}
            onChange={(e) => setCustomRuleText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomRule();
              }
            }}
            placeholder="Add a custom rental rule"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            onClick={handleAddCustomRule}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        {/* Active Rules List */}
        {rules.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
