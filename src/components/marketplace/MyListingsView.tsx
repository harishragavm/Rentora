import React from 'react';
import type { ProductListing } from '../../types/marketplace';
import { 
  PlusCircle, 
  Eye, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  TrendingUp, 
  Package,
  Edit3
} from 'lucide-react';

interface MyListingsViewProps {
  myListings: ProductListing[];
  onOpenListProduct: () => void;
  onEditListing: (listing: ProductListing) => void;
  onToggleStatus: (id: string) => void;
  onDeleteListing: (id: string) => void;
  onViewDetails: (listing: ProductListing) => void;
}

export const MyListingsView: React.FC<MyListingsViewProps> = ({
  myListings,
  onOpenListProduct,
  onEditListing,
  onToggleStatus,
  onDeleteListing,
  onViewDetails,
}) => {
  const activeCount = myListings.filter((l) => l.status === 'active').length;
  const totalViews = myListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
  const totalRentals = myListings.reduce((sum, l) => sum + (l.rentalCount || 0), 0);

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Owner Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              My Listed Products ({myListings.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your physical items, pause availability, or list new gear.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenListProduct}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>List Another Product</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Inventory</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {activeCount} / {myListings.length}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Live on Rentora Marketplace
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Product Views</span>
              <Eye className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Unique renter impressions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed Rentals</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalRentals} Completed
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              100% Security Deposits Returned
            </p>
          </div>
        </div>

        {/* Listings Table / Cards */}
        {myListings.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Your Physical Products
              </h2>
              <span className="text-xs text-slate-500">
                Click any item to view full renter sheet
              </span>
            </div>

            {myListings.map((listing) => {
              const primaryImg = listing.images[listing.primaryImageIndex || 0] || listing.images[0];
              const isPaused = listing.status === 'paused';

              return (
                <div
                  key={listing.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Thumbnail & Title */}
                  <div
                    onClick={() => onViewDetails(listing)}
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                  >
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <img src={primaryImg} alt={listing.title} className="w-full h-full object-cover" />
                      {isPaused && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          Paused
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {listing.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {listing.location.area}, {listing.location.city}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-emerald-700">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Rate: <strong className="text-slate-900">₹{listing.pricing.price}</strong> / {listing.pricing.period} • Deposit: ₹{listing.pricing.securityDeposit}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => onEditListing(listing)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                      title="Edit Product Information"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(listing.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                        isPaused
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Activate Listing' : 'Pause Listing'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteListing(listing.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No products listed yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Start earning by listing your bikes, cameras, laptops, tools, or gear on Rentora.
            </p>
            <button
              type="button"
              onClick={onOpenListProduct}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all"
            >
              List Your First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
