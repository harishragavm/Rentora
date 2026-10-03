/**
 * Validation utilities for Rentora User & Renter Profile Contact & Address information.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates a 10-digit Indian mobile number.
 * Accepts numbers starting with 6, 7, 8, or 9 with optional +91 or 0 prefix.
 */
export function validateIndianMobile(raw: string): ValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  // Strip all non-digit characters
  const digitsOnly = raw.replace(/\D/g, '');

  let tenDigitNumber = digitsOnly;
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigitNumber = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigitNumber = digitsOnly.slice(1);
  }

  if (tenDigitNumber.length === 0) {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  if (tenDigitNumber.length !== 10) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  // Check valid Indian mobile starting digits: 6, 7, 8, or 9
  if (!/^[6-9]/.test(tenDigitNumber)) {
    return {
      isValid: false,
      error: 'Indian mobile number must start with 6, 7, 8, or 9.',
    };
  }

  return {
    isValid: true,
    formatted: `+91 ${tenDigitNumber.slice(0, 5)} ${tenDigitNumber.slice(5)}`,
  };
}

/**
 * Validates Full Name.
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.' };
  }
  return { isValid: true, formatted: trimmed };
}

/**
 * Validates Full Address.
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = (address || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full address is required.' };
  }
  if (trimmed.length < 5) {
    return { isValid: false, error: 'Please enter a complete address (street, building, or locality).' };
  }
  return { isValid: true, formatted: trimmed };
}

/**
 * Validates City / Town.
 */
export function validateCity(city: string): ValidationResult {
  const trimmed = (city || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'City or town is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Please enter a valid city or town.' };
  }
  return { isValid: true, formatted: trimmed };
}

/**
 * Validates 6-digit Indian Postal Pincode.
 */
export function validatePincode(pincode: string): ValidationResult {
  const digits = (pincode || '').replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, error: 'Pincode is required.' };
  }
  if (digits.length !== 6 || !/^[1-9]\d{5}$/.test(digits)) {
    return { isValid: false, error: 'Please enter a valid 6-digit postal pincode.' };
  }
  return { isValid: true, formatted: digits };
}
