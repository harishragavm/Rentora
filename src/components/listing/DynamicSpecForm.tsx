import React from 'react';
import type { 
  ProductCategory, 
  ProductCondition, 
  CategoryConditionDetails, 
  ComponentConditionRating 
} from '../../types/marketplace';
import { CATEGORY_SPEC_FIELDS, CATEGORIES_LIST } from '../../data/categoryFields';
import { Sparkles, Check, Activity } from 'lucide-react';

interface DynamicSpecFormProps {
  category: ProductCategory;
  specs: Record<string, any>;
  condition: ProductCondition;
  conditionNotes: string;
  categoryCondition?: CategoryConditionDetails;
  onSpecChange: (fieldId: string, value: any) => void;
  onConditionChange: (condition: ProductCondition) => void;
  onConditionNotesChange: (notes: string) => void;
  onCategoryConditionChange: (details: CategoryConditionDetails) => void;
}

interface ComponentConditionDef {
  key: keyof CategoryConditionDetails;
  label: string;
  description: string;
}

export const DynamicSpecForm: React.FC<DynamicSpecFormProps> = ({
  category,
  specs,
  condition,
  conditionNotes,
  categoryCondition = {},
  onSpecChange,
  onConditionChange,
  onConditionNotesChange,
  onCategoryConditionChange,
}) => {
  const fields = CATEGORY_SPEC_FIELDS[category] || CATEGORY_SPEC_FIELDS.other;
  const currentCategoryMeta = CATEGORIES_LIST.find((c) => c.id === category);

  // Define category-aware component conditions
  const getCategoryConditionComponents = (cat: ProductCategory): ComponentConditionDef[] => {
    switch (cat) {
      case 'bikes':
        return [
          { key: 'engine', label: 'Engine & Transmission', description: 'Starts cleanly, smooth shifting, no oil leaks or strange noises' },
          { key: 'tyre', label: 'Tyre Condition & Tread', description: 'Grip depth, no cracks, punctures, or uneven bald spots' },
          { key: 'brake', label: 'Brakes & ABS System', description: 'Pad thickness, responsive bite, discs clean and calibrated' },
          { key: 'battery', label: 'Battery & Electricals', description: 'Starter motor, headlamps, indicators, and console meters' },
          { key: 'exterior', label: 'Chassis & Exterior Paint', description: 'Body panels, fuel tank, mirrors, crash guards, and rust status' },
        ];
      case 'cameras':
        return [
          { key: 'body', label: 'Camera Body & Ergonomics', description: 'Grip rubber, dials, buttons, hot shoe, and battery door' },
          { key: 'lens', label: 'Lens Optics & Autofocus', description: 'Clean glass, zero fungus/haze, smooth zoom and quiet AF motor' },
          { key: 'sensor', label: 'Sensor Cleanliness & IBIS', description: 'Spotless sensor, zero dead pixels, stabilizer calibrated' },
          { key: 'battery', label: 'Battery & Charging Health', description: 'Holds full charge cycle, fast charging dock functioning' },
        ];
      case 'laptops':
        return [
          { key: 'display', label: 'Display & Hinges', description: 'Zero dead pixels, no backlight bleed, sturdy hinge tension' },
          { key: 'battery', label: 'Battery Life & Health', description: 'Low cycle count, holds rated runtime without sudden drops' },
          { key: 'keyboardTrackpad', label: 'Keyboard & Trackpad', description: 'All keys tactile, zero sticky buttons, haptics working' },
          { key: 'performance', label: 'CPU/GPU & Thermal Cooling', description: 'Silent fans, passes load tests without thermal throttling' },
        ];
      case 'drones':
        return [
          { key: 'body', label: 'Airframe & Propellers', description: 'Arms, folding joints, zero crash marks, balanced props' },
          { key: 'sensor', label: 'Gimbal & Camera Sensor', description: '3-axis smooth pan/tilt, clean optical obstacle sensors' },
          { key: 'battery', label: 'Intelligent Flight Batteries', description: 'Zero cell swelling, full flight duration capacity' },
        ];
      case 'gaming':
        return [
          { key: 'body', label: 'Console Chassis & HDMI', description: 'Clean vents, quiet fan, pristine HDMI 2.1 display port' },
          { key: 'performance', label: 'Wireless Controllers', description: 'Zero analog stick drift, haptic triggers & buttons responsive' },
        ];
      default:
        return [
          { key: 'engine', label: 'Core Mechanism / Motor', description: 'Primary working components operate smoothly under load' },
          { key: 'exterior', label: 'Exterior Cosmetic Finish', description: 'Clean appearance with normal or minimal signs of use' },
          { key: 'battery', label: 'Power Supply / Battery', description: 'Power cords, plugs, switches, or battery pack reliability' },
        ];
    }
  };

  const conditionComponents = getCategoryConditionComponents(category);

  const ratingOptions: { value: ComponentConditionRating; label: string; badge: string; border: string }[] = [
    { value: 'excellent', label: 'Excellent', badge: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-500 bg-emerald-50/50' },
    { value: 'good', label: 'Good', badge: 'bg-amber-50 text-amber-700', border: 'border-amber-500 bg-amber-50/50' },
    { value: 'poor', label: 'Poor', badge: 'bg-rose-50 text-rose-700', border: 'border-rose-500 bg-rose-50/50' },
  ];

  const handleComponentRatingChange = (key: keyof CategoryConditionDetails, rating: ComponentConditionRating) => {
    onCategoryConditionChange({
      ...categoryCondition,
      [key]: rating,
    });
  };

  const handleTagToggle = (fieldId: string, tagOption: string) => {
    const currentTags: string[] = Array.isArray(specs[fieldId]) ? specs[fieldId] : [];
    const exists = currentTags.includes(tagOption);
    const updated = exists
      ? currentTags.filter((t) => t !== tagOption)
      : [...currentTags, tagOption];
    onSpecChange(fieldId, updated);
  };

  return (
    <div className="space-y-8">
      {/* Category Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Selected Category
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
            {currentCategoryMeta?.label}
          </h3>
        </div>
        <div className="text-xs text-slate-500 text-right">
          Category-Aware Condition Active
        </div>
      </div>

      {/* 1. OVERALL PRODUCT CONDITION SELECTOR */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Overall Condition Rating <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-500">Owner input is the source of truth</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ratingOptions.map((opt) => {
            const currentOverall = categoryCondition.overall || (condition === 'brand_new' || condition === 'like_new' ? 'excellent' : condition === 'good' ? 'good' : 'poor');
            const isSelected = currentOverall === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  handleComponentRatingChange('overall', opt.value);
                  if (opt.value === 'excellent') onConditionChange('like_new');
                  else if (opt.value === 'good') onConditionChange('good');
                  else onConditionChange('fair');
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? `${opt.border} ring-2 ring-emerald-600/20 shadow-xs font-bold text-slate-900`
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                  <span className="text-xs">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CATEGORY-AWARE COMPONENT CONDITION MATRIX */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {currentCategoryMeta?.label} Component Health Checklist
            </h4>
            <p className="text-[11px] text-slate-500">
              Rate each physical component honestly (Owner Source of Truth)
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
          {conditionComponents.map((comp) => {
            const selectedVal = (categoryCondition[comp.key] as ComponentConditionRating) || 'excellent';

            return (
              <div
                key={comp.key}
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 pr-2">
                  <h5 className="text-xs font-bold text-slate-900">{comp.label}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{comp.description}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ratingOptions.map((opt) => {
                    const isPicked = selectedVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleComponentRatingChange(comp.key, opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isPicked
                            ? `${opt.badge} border-emerald-600/40 ring-1 ring-emerald-600/30 shadow-2xs font-bold`
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Condition Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Additional Condition Description & Accessories
          </label>
          <input
            type="text"
            value={conditionNotes}
            onChange={(e) => {
              onConditionNotesChange(e.target.value);
              onCategoryConditionChange({
                ...categoryCondition,
                additionalDescription: e.target.value,
              });
            }}
            placeholder="Additional condition notes"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>
      </div>

      {/* 3. DYNAMIC CATEGORY FIELDS */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Category Specifications for {currentCategoryMeta?.label}</span>
        </h4>

        <div className="space-y-5">
          {fields.map((field) => {
            const val = specs[field.id] || '';

            if (field.type === 'select') {
              return (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={val}
                    onChange={(e) => onSpecChange(field.id, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  >
                    <option value="">-- Select {field.label} --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'tags') {
              const selectedTags: string[] = Array.isArray(val) ? val : [];
              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.helperText && (
                      <span className="text-[11px] text-slate-400">{field.helperText}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {field.options?.map((tagOpt) => {
                      const isTagSelected = selectedTags.includes(tagOpt);
                      return (
                        <button
                          key={tagOpt}
                          type="button"
                          onClick={() => handleTagToggle(field.id, tagOpt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isTagSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isTagSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{tagOpt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={val}
                    onChange={(e) => onSpecChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                </div>
              );
            }

            // Default: text or number
            return (
              <div key={field.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.helperText && (
                    <span className="text-[11px] text-slate-400">{field.helperText}</span>
                  )}
                </div>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={val}
                  onChange={(e) => onSpecChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
