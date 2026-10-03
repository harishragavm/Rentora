import React, { useState } from 'react';
import { Camera, Upload, Trash2, Star, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { CameraModal } from './CameraModal';

interface ImageUploadSectionProps {
  images: string[];
  primaryImageIndex: number;
  onImagesChange: (newImages: string[]) => void;
  onPrimaryChange: (index: number) => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  primaryImageIndex,
  onImagesChange,
  onPrimaryChange,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImagePromises: Promise<string>[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) resolve(e.target.result as string);
        };
        reader.readAsDataURL(file);
      });
      newImagePromises.push(promise);
    });

    Promise.all(newImagePromises).then((loadedImages) => {
      onImagesChange([...images, ...loadedImages]);
    });
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    onImagesChange([...images, imageDataUrl]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
    if (primaryImageIndex >= updated.length) {
      onPrimaryChange(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Callout */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-slate-900">Authentic Physical Photos Required</h4>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Please capture or upload actual photos of your item showing its true physical condition, accessories, and any cosmetic marks. Rentora does not accept generic catalog or stock pictures.
          </p>
        </div>
      </div>

      {/* Main Upload Dropzone & Camera Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option A: Take with Camera */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 mb-3 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
            Take Live Camera Photo
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Snap current condition with your phone/webcam
          </span>
        </button>

        {/* Option B: Upload from files */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm mb-3">
            <Upload className="w-6 h-6 text-slate-600" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Upload Product Images
          </span>
          <span className="text-xs text-slate-500 mt-1">
            PNG, JPG, HEIC, WebP (Upload 1 to 8 photos)
          </span>
        </label>
      </div>

      {/* Image Gallery & Cover Selector */}
      {images.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Uploaded Physical Photos ({images.length})
            </h4>
            <span className="text-xs text-slate-500">
              Click the star icon to set primary cover
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {images.map((imgUrl, index) => {
              const isPrimary = index === primaryImageIndex;
              return (
                <div
                  key={index}
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden border bg-slate-100 group shadow-sm transition-all ${
                    isPrimary ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Product photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Cover Badge */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Cover Photo
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => onPrimaryChange(index)}
                        className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white hover:text-emerald-600 text-xs font-semibold shadow-md transition-colors"
                        title="Set as Cover Photo"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-semibold shadow-md transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-6 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">No photos added yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Add at least 1 authentic photo to proceed.</p>
        </div>
      )}

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

