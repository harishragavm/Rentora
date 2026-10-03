import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Hash, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  Mail, 
  AlertCircle, 
  Shield,
  KeyRound
} from 'lucide-react';
import {
  validateFullName,
  validateIndianMobile,
  validateAddress,
  validateCity,
  validatePincode,
} from '../../utils/validationUtils';
import type { UserLocation, RenterProfile } from '../../types/marketplace';
import { type UserAccount, AuthSessionService } from '../../services/authSession';
import { OtpService } from '../../services/otpService';

interface ProfileAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdateUserAccount: (updated: UserAccount) => void;
  onUpdateRenterLocation: (loc: UserLocation) => void;
  mode?: 'user' | 'renter';
}

export const ProfileAddressModal: React.FC<ProfileAddressModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUserAccount,
  onUpdateRenterLocation,
  mode = 'renter',
}) => {
  const [profileType, setProfileType] = useState<'user' | 'renter'>(mode);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [avatar, setAvatar] = useState('');

  // Isolated Verification States
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // OTP Verification Dialog Sub-States
  const [activeOtpModal, setActiveOtpModal] = useState<'none' | 'phone' | 'email'>('none');
  const [otpInput, setOtpInput] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errors, setErrors] = useState<{
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    address?: string;
    city?: string;
    pincode?: string;
    avatar?: string;
  }>({});

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Countdown timer for 60s OTP expiration
  useEffect(() => {
    let timer: any;
    if (activeOtpModal !== 'none' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeOtpModal, otpCountdown]);

  // Load existing profile strictly for currentUser on open
  useEffect(() => {
    if (isOpen) {
      setProfileType(mode);
      setErrors({});
      setSaveSuccess(false);
      setActiveOtpModal('none');
      setOtpInput('');
      setOtpError('');
      setOtpCountdown(60);

      if (mode === 'renter') {
        const existingRenter = AuthSessionService.getRenterProfile(currentUser?.id);
        if (existingRenter) {
          setFullName(existingRenter.name || '');
          setMobileNumber(existingRenter.phone || '');
          setEmail(existingRenter.email || currentUser.email || '');
          setAddress(existingRenter.address || '');
          setCity(existingRenter.city || '');
          setPincode(existingRenter.pincode || '');
          setAvatar(existingRenter.avatar || currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(existingRenter.name || 'User')}&backgroundColor=047857`);
          setPhoneVerified(Boolean(existingRenter.phoneVerified));
          setEmailVerified(Boolean(existingRenter.emailVerified || currentUser.emailVerified));
        } else {
          setFullName(currentUser.name || '');
          setMobileNumber(currentUser.phone || '');
          setEmail(currentUser.email || '');
          setAddress(currentUser.address || '');
          setCity(currentUser.city || '');
          setPincode(currentUser.pincode || '');
          setAvatar(currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'User')}&backgroundColor=047857`);
          setPhoneVerified(Boolean(currentUser.phoneVerified));
          setEmailVerified(Boolean(currentUser.emailVerified));
        }
      } else {
        setFullName(currentUser.name || '');
        setMobileNumber(currentUser.phone || '');
        setEmail(currentUser.email || '');
        setAddress(currentUser.address || '');
        setCity(currentUser.city || '');
        setPincode(currentUser.pincode || '');
        setAvatar(currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'User')}&backgroundColor=047857`);
        setPhoneVerified(Boolean(currentUser.phoneVerified));
        setEmailVerified(Boolean(currentUser.emailVerified));
      }
    }
  }, [isOpen, mode, currentUser]);

  if (!isOpen) return null;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(reader.result.toString());
        if (errors.avatar) setErrors({ ...errors, avatar: undefined });
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Phone OTP Send via backend RPC
  const handleRequestPhoneOtp = async () => {
    const mobileVal = validateIndianMobile(mobileNumber);
    if (!mobileVal.isValid) {
      setErrors({ ...errors, mobileNumber: mobileVal.error });
      return;
    }
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await OtpService.requestOtp('phone', mobileNumber);
      if (res.success) {
        setOtpNotice(res.message || `Verification code sent to +91 ${mobileNumber}.`);
        setOtpCountdown(res.expiresInSeconds || 60);
        setActiveOtpModal('phone');
        setOtpInput('');
      } else {
        setOtpError(res.error || 'Failed to request verification code.');
        alert(res.error || 'Failed to request verification code.');
      }
    } catch {
      setOtpError('Failed to send SMS OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Trigger Email OTP Send via backend RPC
  const handleRequestEmailOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await OtpService.requestOtp('email', email);
      if (res.success) {
        setOtpNotice(res.message || `Verification code sent to ${email}.`);
        setOtpCountdown(res.expiresInSeconds || 60);
        setActiveOtpModal('email');
        setOtpInput('');
      } else {
        setOtpError(res.error || 'Failed to request verification code.');
        alert(res.error || 'Failed to request verification code.');
      }
    } catch {
      setOtpError('Failed to send Email OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify Phone OTP Submission via backend RPC
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await OtpService.verifyOtp('phone', mobileNumber, otpInput.trim());
      if (res.success) {
        setPhoneVerified(true);
        setActiveOtpModal('none');
        setOtpInput('');
        setOtpError('');
      } else {
        setOtpError(res.error || 'Invalid OTP code. Please check the code and try again.');
      }
    } catch {
      setOtpError('Error verifying code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Verify Email OTP Submission via backend RPC
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await OtpService.verifyOtp('email', email, otpInput.trim());
      if (res.success) {
        setEmailVerified(true);
        setActiveOtpModal('none');
        setOtpInput('');
        setOtpError('');
      } else {
        setOtpError(res.error || 'Invalid OTP code. Please check the code and try again.');
      }
    } catch {
      setOtpError('Error verifying code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameVal = validateFullName(fullName);
    const mobileVal = validateIndianMobile(mobileNumber);
    const addrVal = validateAddress(address);
    const cityVal = validateCity(city);
    const pinVal = validatePincode(pincode);

    const newErrors: typeof errors = {};
    if (!nameVal.isValid) newErrors.fullName = nameVal.error;
    if (!mobileVal.isValid) newErrors.mobileNumber = mobileVal.error;
    if (!addrVal.isValid) newErrors.address = addrVal.error;
    if (!cityVal.isValid) newErrors.city = cityVal.error;
    if (!pinVal.isValid) newErrors.pincode = pinVal.error;
    if (!avatar) newErrors.avatar = 'Profile photo is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cleanName = nameVal.formatted || fullName.trim();
    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
    const cleanAddress = addrVal.formatted || address.trim();
    const cleanCity = cityVal.formatted || city.trim();
    const cleanPincode = pinVal.formatted || pincode.trim();

    if (profileType === 'renter') {
      const renterProfile: RenterProfile = {
        id: `renter-${currentUser.id}`,
        name: cleanName,
        phone: cleanMobile,
        email: email || currentUser.email,
        address: cleanAddress,
        city: cleanCity,
        pincode: cleanPincode,
        avatar: avatar || currentUser.avatar,
        phoneVerified,
        emailVerified,
      };
      AuthSessionService.setRenterProfile(renterProfile, currentUser.id);

      const renterLocation: UserLocation = {
        city: cleanCity,
        area: cleanCity,
        address: cleanAddress,
        pincode: cleanPincode,
        district: cleanCity,
        formattedAddress: `${cleanAddress}, ${cleanCity} - ${cleanPincode}`,
        isManual: true,
        isLive: false,
        permissionState: 'granted',
      };
      AuthSessionService.setRenterLocation(renterLocation);
      onUpdateRenterLocation(renterLocation);
    } else {
      const updatedUser = AuthSessionService.updateUserProfile(currentUser.id, {
        name: cleanName,
        phone: cleanMobile,
        email: email || currentUser.email,
        address: cleanAddress,
        city: cleanCity,
        pincode: cleanPincode,
        avatar,
        phoneVerified,
        emailVerified,
      });
      onUpdateUserAccount(updatedUser);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn my-6">
        
        {/* Subtle Green Top Brand Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>

        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {profileType === 'renter' ? 'Renter Profile & Verification' : 'User (Owner) Profile & Verification'}
              </h3>
              <p className="text-slate-500 text-xs">Required for secure peer-to-peer handovers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Mode Toggle */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfileType('renter')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              profileType === 'renter'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Renter Profile
          </button>
          <button
            type="button"
            onClick={() => setProfileType('user')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              profileType === 'user'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            User (Owner) Profile
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
              <h4 className="font-bold text-slate-900 text-base">Profile & Verification Details Saved</h4>
              <p className="text-xs text-slate-500">Your information is isolated and securely stored.</p>
            </div>
          ) : (
            <>
              {/* 1. REQUIRED PROFILE PHOTO SECTION */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Profile Photo <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-white flex-shrink-0 shadow-xs">
                    <img
                      src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || 'User')}&backgroundColor=047857`}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Upload Profile Photo</span>
                    </button>
                    <p className="text-[10px] text-slate-500">
                      Clear face photo required for rental handover identification.
                    </p>
                  </div>
                </div>
                {errors.avatar && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.avatar}</p>
                )}
              </div>

              {/* 2. FULL NAME */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  placeholder="Enter full name"
                  className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                    errors.fullName
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* 3. MOBILE NUMBER WITH OTP VERIFICATION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile Number (10 Digits) <span className="text-rose-500">*</span></span>
                  </label>

                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Mobile Verified (OTP)
                    </span>
                  ) : mobileNumber.length === 10 ? (
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={handleRequestPhoneOtp}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{isSendingOtp ? 'Sending...' : 'Verify Mobile via OTP'}</span>
                    </button>
                  ) : null}
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-xs font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMobileNumber(val);
                      if (val !== mobileNumber) {
                        setPhoneVerified(false);
                      }
                      if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: undefined });
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full bg-white border rounded-xl pl-12 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                      errors.mobileNumber
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              {/* 4. EMAIL WITH OTP VERIFICATION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>

                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Email Verified
                    </span>
                  ) : email ? (
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={handleRequestEmailOtp}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{isSendingOtp ? 'Sending...' : 'Verify Email via OTP'}</span>
                    </button>
                  ) : null}
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerified(false);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="Enter email address"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* 5. FULL ADDRESS */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Address (Street, Building, Locality) <span className="text-rose-500">*</span></span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: undefined });
                  }}
                  placeholder="Enter address"
                  className={`w-full bg-white border rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-colors ${
                    errors.address
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.address}</p>
                )}
              </div>

              {/* 6. CITY / TOWN & PINCODE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>City / Town <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors({ ...errors, city: undefined });
                    }}
                    placeholder="Enter city or town"
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                      errors.city
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pincode <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPincode(val);
                      if (errors.pincode) setErrors({ ...errors, pincode: undefined });
                    }}
                    placeholder="Enter pincode"
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                      errors.pincode
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>

              {/* 7. VERIFICATION NOTICE & DISCLAIMER */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Trust & Verification Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  OTP verification confirms control of your mobile number and email. Profile photos assist peer-to-peer verification during handovers. Information is strictly isolated to your account.
                </p>
              </div>

              {/* 8. SUBMIT BUTTONS */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Save Profile & Details
                </button>
              </div>
            </>
          )}
        </form>

        {/* OTP SUB-MODAL OVERLAY */}
        {activeOtpModal !== 'none' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-30 p-6 flex flex-col justify-center animate-fadeIn">
            <div className="max-w-xs mx-auto w-full text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                {activeOtpModal === 'phone' ? 'Verify Mobile Number' : 'Verify Email Address'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {otpNotice || 'Enter the 6-digit verification code sent to you.'}
              </p>

              <div className="text-[11px] text-slate-500">
                {otpCountdown > 0 ? (
                  <span>Code expires in <strong className="text-emerald-700 font-mono font-bold">{otpCountdown}s</strong></span>
                ) : (
                  <span className="text-rose-500 font-semibold">Code expired. Please close and request a new code.</span>
                )}
              </div>

              <form 
                onSubmit={activeOtpModal === 'phone' ? handleVerifyPhoneOtp : handleVerifyEmailOtp} 
                className="space-y-3 pt-1"
              >
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                    if (otpError) setOtpError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-widest font-black text-lg bg-slate-50 border border-slate-200 rounded-xl py-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  autoFocus
                />

                {otpError && (
                  <p className="text-[11px] text-rose-500 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{otpError}</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOtpModal('none');
                      setOtpInput('');
                      setOtpError('');
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpInput.trim().length !== 6 || otpCountdown <= 0}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>{isVerifyingOtp ? 'Verifying...' : 'Submit OTP'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
