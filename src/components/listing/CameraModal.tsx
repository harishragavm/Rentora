import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(() => {
    setIsInitializing(true);
    setCapturedImage(null);
    setError(null);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isOpen || capturedImage) return;

    let active = true;
    let localStream: MediaStream | null = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported by your browser.');
      setIsInitializing(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    }).then((mediaStream) => {
      if (!active) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStream = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
    }).catch((err: any) => {
      if (!active) return;
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please grant browser camera access to snap physical product photos.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device detected on this system. You can upload photos directly from your files.');
      } else {
        setError(err.message || 'Unable to access camera. Please use file upload instead.');
      }
      setIsInitializing(false);
    });

    return () => {
      active = false;
      if (localStream) {
        (localStream as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, retryTrigger, capturedImage]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Take Live Product Photo</h3>
              <p className="text-xs text-slate-500">Capture the actual physical condition of your item</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Canvas / Video */}
        <div className="p-6">
          <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {error ? (
              <div className="p-6 text-center text-slate-200 max-w-sm">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h4 className="font-semibold text-sm text-white mb-1">Camera Unavailable</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{error}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Retry Camera Access
                </button>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Physical Product"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isInitializing && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-xs gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    Starting Camera...
                  </div>
                )}
                {/* Visual Guidelines Overlay */}
                <div className="absolute inset-4 border border-dashed border-white/40 rounded-xl pointer-events-none flex items-end justify-center pb-2">
                  <span className="text-[11px] font-medium bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full">
                    Center the item in good lighting
                  </span>
                </div>
              </>
            )}

            {/* Hidden canvas for snapshot rendering */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Bar */}
          <div className="mt-5 flex items-center justify-between gap-3">
            {!capturedImage && !error ? (
              <>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <SwitchCamera className="w-4 h-4 text-slate-500" />
                  <span>Switch Camera</span>
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </button>
              </>
            ) : capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close & Upload via Files
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

