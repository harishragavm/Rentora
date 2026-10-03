import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  User, 
  Phone, 
  MapPin, 
  Building,
  Hash,
  Sparkles,
  Bike,
  Camera,
  Laptop,
  Plane,
  Gamepad2,
  Wrench,
  Tent,
  Speaker,
  Package,
  CheckCircle2
} from 'lucide-react';
import type { 
  ProductCategory, 
  ProductCondition, 
  ProductListing, 
  ProductLocation, 
  AvailabilityConfig, 
  RentalPricing, 
  CategoryConditionDetails 
} from '../../types/marketplace';
import { CATEGORIES_LIST } from '../../data/categoryFields';
import { type UserAccount, AuthSessionService } from '../../services/authSession';
import { DynamicSpecForm } from './DynamicSpecForm';
import { ImageUploadSection } from './ImageUploadSection';
import { AvailabilityPricingForm } from './AvailabilityPricingForm';
import {
  validateFullName,
  validateIndianMobile,
  validateAddress,
  validateCity,
  validatePincode,
} from '../../utils/validationUtils';

interface ListProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  editingListing?: ProductListing | null;
  onPublishSuccess: (listingData: Omit<ProductListing, 'id' | 'ownerId' | 'owner' | 'createdAt' | 'viewsCount' | 'rentalCount'>) => void;
  onUpdateSuccess?: (id: string, updates: Partial<ProductListing>) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Bike: <Bike className="w-5 h-5" />,
  Camera: <Camera className="w-5 h-5" />,
  Laptop: <Laptop className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
  Gamepad2: <Gamepad2 className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  Tent: <Tent className="w-5 h-5" />,
  Speaker: <Speaker className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
};

export const ListProductWizard: React.FC<ListProductWizardProps> = ({
  isOpen,
  onClose,
  currentUser,
  editingListing,
  onPublishSuccess,
  onUpdateSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // OWNER CONTACT & ADDRESS STATE (Initially empty or from active session)
  const [ownerName, setOwnerName] = useState(currentUser.name || '');
  const [ownerMobile, setOwnerMobile] = useState(currentUser.phone || '');
  const [ownerAddress, setOwnerAddress] = useState(currentUser.address || '');
  const [ownerCity, setOwnerCity] = useState(currentUser.city || '');
  const [ownerPincode, setOwnerPincode] = useState(currentUser.pincode || '');

  // PRODUCT DETAILS STATE
  const [category, setCategory] = useState<ProductCategory>('bikes');
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [condition, setCondition] = useState<ProductCondition>('like_new');
  const [conditionNotes, setConditionNotes] = useState('');
  const [categoryCondition, setCategoryCondition] = useState<CategoryConditionDetails>({
    overall: 'excellent',
  });
  const [specs, setSpecs] = useState<Record<string, any>>({});
  
  // INDEPENDENT PRODUCT RENTAL LOCATION STATE
  const [productLocation, setProductLocation] = useState<ProductLocation>({
    city: currentUser.city || '',
    area: '',
    address: currentUser.address || '',
    pincode: currentUser.pincode || '',
    pickupInstructions: 'Available for handover at landmark or residence lobby.',
    deliveryAvailable: false,
  });

  const [availability, setAvailability] = useState<AvailabilityConfig>({
    openEnded: true,
    pickupTimeStart: '08:00',
    pickupTimeEnd: '21:00',
    minDuration: 1,
    minDurationUnit: 'days',
  });
  const [pricing, setPricing] = useState<RentalPricing>({
    price: 1200,
    period: 'day',
    securityDeposit: 3000,
    lateFeePerHour: 100,
    cancellationPolicy: 'Flexible (100% refund up to 24h prior)',
  });
  const [rules, setRules] = useState<string[]>([
    'Valid Government-issued ID required upon pickup',
    'Refundable security deposit collected before handover',
    'Return the item in the same clean condition as received',
  ]);

  // Load editingListing if present
  useEffect(() => {
    if (editingListing) {
      setOwnerName(editingListing.ownerName || editingListing.owner?.name || currentUser.name || '');
      setOwnerMobile(editingListing.ownerMobile || editingListing.owner?.phone || currentUser.phone || '');
      setOwnerAddress(editingListing.ownerLocation?.address || currentUser.address || '');
      setOwnerCity(editingListing.ownerLocation?.city || editingListing.owner?.city || currentUser.city || '');
      setOwnerPincode(editingListing.ownerLocation?.pincode || currentUser.pincode || '');
      setCategory(editingListing.category);
      setTitle(editingListing.title);
      setBrand(editingListing.brand);
      setModel(editingListing.model);
      setDescription(editingListing.description || '');
      setImages(editingListing.images || []);
      setPrimaryImageIndex(editingListing.primaryImageIndex || 0);
      setCondition(editingListing.condition);
      setConditionNotes(editingListing.conditionNotes || '');
      setCategoryCondition(editingListing.categoryCondition || { overall: 'excellent' });
      setSpecs(editingListing.specs || {});
      setProductLocation(editingListing.productLocation || editingListing.location);
      setAvailability(editingListing.availability);
      setPricing(editingListing.pricing);
      setRules(editingListing.rules || []);
      setCurrentStep(0);
      setPublishSuccess(false);
    } else {
      // Clean start from active user profile
      setOwnerName(currentUser.name || '');
      setOwnerMobile(currentUser.phone || '');
      setOwnerAddress(currentUser.address || '');
      setOwnerCity(currentUser.city || '');
      setOwnerPincode(currentUser.pincode || '');
      setCategory('bikes');
      setTitle('');
      setBrand('');
      setModel('');
      setDescription('');
      setImages([]);
      setPrimaryImageIndex(0);
      setCondition('like_new');
      setConditionNotes('');
      setCategoryCondition({ overall: 'excellent' });
      setSpecs({});
      setProductLocation({
        city: currentUser.city || '',
        area: '',
        address: currentUser.address || '',
        pincode: currentUser.pincode || '',
        pickupInstructions: 'Available for handover at landmark or residence lobby.',
        deliveryAvailable: false,
      });
      setAvailability({
        openEnded: true,
        pickupTimeStart: '08:00',
        pickupTimeEnd: '21:00',
        minDuration: 1,
        minDurationUnit: 'days',
      });
      setPricing({
        price: 1200,
        period: 'day',
        securityDeposit: 3000,
        lateFeePerHour: 100,
        cancellationPolicy: 'Flexible (100% refund up to 24h prior)',
      });
      setRules([
        'Valid Government-issued ID required upon pickup',
        'Refundable security deposit collected before handover',
        'Return the item in the same clean condition as received',
      ]);
      setCurrentStep(0);
      setPublishSuccess(false);
    }
  }, [editingListing, isOpen, currentUser]);

  if (!isOpen) return null;

  const steps = [
    { title: 'Owner Information', description: 'Contact & address' },
    { title: 'Basic Product Info', description: 'Category & model' },
    { title: 'Photos & Condition', description: 'Physical photos & specs' },
    { title: 'Location & Pricing', description: 'Pickup & rates' },
  ];

  const handleSpecChange = (fieldId: string, val: any) => {
    setSpecs((prev) => ({ ...prev, [fieldId]: val }));
  };

  const validateStep = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      const nameVal = validateFullName(ownerName);
      if (!nameVal.isValid) {
        alert(nameVal.error);
        return false;
      }
      const mobileVal = validateIndianMobile(ownerMobile);
      if (!mobileVal.isValid) {
        alert(mobileVal.error);
        return false;
      }
      const addrVal = validateAddress(ownerAddress);
      if (!addrVal.isValid) {
        alert(addrVal.error);
        return false;
      }
      const cityVal = validateCity(ownerCity);
      if (!cityVal.isValid) {
        alert(cityVal.error);
        return false;
      }
      const pinVal = validatePincode(ownerPincode);
      if (!pinVal.isValid) {
        alert(pinVal.error);
        return false;
      }
    }
    if (stepIdx === 1) {
      if (!title.trim() || !brand.trim() || !model.trim()) {
        alert('Please fill in Product Title, Brand, and Model.');
        return false;
      }
    }
    if (stepIdx === 2) {
      if (images.length === 0) {
        alert('Please take or upload at least 1 actual physical photo of your product.');
        return false;
      }
    }
    if (stepIdx === 3) {
      if (!productLocation.city.trim()) {
        alert('Please provide the Product Rental Location (City/Town).');
        return false;
      }
      if (pricing.price <= 0) {
        alert('Please specify a valid rental price.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handlePublish = () => {
    if (!validateStep(currentStep)) return;

    setIsPublishing(true);

    const cleanMobile = ownerMobile.replace(/\D/g, '').slice(-10);

    // Synchronize owner profile in database/session
    AuthSessionService.updateUserProfile(currentUser.id, {
      name: ownerName.trim(),
      phone: cleanMobile,
      address: ownerAddress.trim(),
      city: ownerCity.trim(),
      pincode: ownerPincode.trim(),
    });

    const ownerLocationPayload: ProductLocation = {
      city: ownerCity.trim(),
      area: ownerCity.trim(),
      address: ownerAddress.trim(),
      pincode: ownerPincode.trim(),
    };

    setTimeout(() => {
      const listingPayload = {
        title: title.trim(),
        category,
        brand: brand.trim(),
        model: model.trim(),
        description: description.trim() || `Physical ${brand} ${model} available for rent in ${productLocation.city}. Maintained in ${condition} condition with complete accessories.`,
        images,
        primaryImageIndex,
        condition,
        conditionNotes,
        categoryCondition,
        healthStatus: specs.healthStatus || 'Verified and functional',
        specs,
        accessoriesIncluded: Array.isArray(specs.includedAccessories) ? specs.includedAccessories : ['Standard accessories'],
        documentsProvided: Array.isArray(specs.documentsProvided) ? specs.documentsProvided : undefined,
        ownerName: ownerName.trim(),
        ownerMobile: cleanMobile,
        ownerLocation: ownerLocationPayload,
        location: productLocation,
        productLocation,
        availability,
        pricing,
        rules,
        status: 'active' as const,
      };

      if (editingListing && onUpdateSuccess) {
        onUpdateSuccess(editingListing.id, listingPayload);
      } else {
        onPublishSuccess(listingPayload);
      }

      setIsPublishing(false);
      setPublishSuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Rentora Owner Portal
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {editingListing ? 'Edit Product Listing' : 'List Your Physical Product for Rent'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Stepper */}
        {!publishSuccess && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={index} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-slate-900 text-white ring-2 ring-emerald-600/30'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-slate-400">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-[2px] mx-2 hidden sm:block ${isCompleted ? 'bg-emerald-600' : 'bg-slate-100'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Step Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {publishSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {editingListing ? 'Listing Updated Successfully!' : 'Product Listed Successfully!'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                Your product <strong>"{title}"</strong> is now active in the Rentora marketplace with your verified contact information.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
              >
                Go to My Listings
              </button>
            </div>
          ) : (
            <div>
              {/* STEP 0: OWNER CONTACT & ADDRESS */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-xs">Owner Profile & Contact Information</h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Please provide your full contact and address details. Renters will see your name, mobile number, and city for rental coordination.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Owner Full Name <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    {/* Mobile Phone Number */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mobile Phone Number <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs font-semibold">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={ownerMobile}
                          onChange={(e) => setOwnerMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter mobile number"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full Address */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Address (Street, Building, Locality) <span className="text-rose-500">*</span></span>
                    </label>
                    <textarea
                      rows={2}
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      placeholder="Enter address"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                      required
                    />
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>City / Town <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={ownerCity}
                        onChange={(e) => {
                          setOwnerCity(e.target.value);
                          if (!productLocation.city) {
                            setProductLocation((prev) => ({ ...prev, city: e.target.value }));
                          }
                        }}
                        placeholder="Enter city or town"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pincode <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={ownerPincode}
                        onChange={(e) => setOwnerPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter pincode"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: CATEGORY & TITLE/MODEL */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Select Product Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CATEGORIES_LIST.map((cat) => {
                        const isCatSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                              isCatSelected
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-950'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl flex-shrink-0 ${
                                isCatSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {CATEGORY_ICONS[cat.iconName] || <Package className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold leading-tight">{cat.label}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Product Listing Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Product listing title"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Brand / Manufacturer <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="Brand name"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Model Name / Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Model name / number"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Product Description
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Product description"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PHOTOS & SPECS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <ImageUploadSection
                    images={images}
                    primaryImageIndex={primaryImageIndex}
                    onImagesChange={setImages}
                    onPrimaryChange={setPrimaryImageIndex}
                  />

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Category Specifications & Condition
                    </h4>
                    <DynamicSpecForm
                      category={category}
                      specs={specs}
                      condition={condition}
                      conditionNotes={conditionNotes}
                      categoryCondition={categoryCondition}
                      onSpecChange={handleSpecChange}
                      onConditionChange={setCondition}
                      onConditionNotesChange={setConditionNotes}
                      onCategoryConditionChange={setCategoryCondition}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: LOCATION & PRICING */}
              {currentStep === 3 && (
                <AvailabilityPricingForm
                  location={productLocation}
                  onLocationChange={setProductLocation}
                  availability={availability}
                  onAvailabilityChange={setAvailability}
                  pricing={pricing}
                  onPricingChange={setPricing}
                  rules={rules}
                  onRulesChange={setRules}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!publishSuccess && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0 || isPublishing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  {isPublishing ? (
                    <span>Publishing listing...</span>
                  ) : (
                    <>
                      <span>{editingListing ? 'Save Changes' : 'Publish Product Listing'}</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
