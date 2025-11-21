/**
 * Phone Validator Utility
 * Validates phone numbers in E.164 format
 */

/**
 * Validates phone number in E.164 format
 * Format: +[country code][number]
 * Example: +919876543210
 *
 * @param phone - Phone number to validate
 * @returns boolean - true if valid, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  // E.164 format: +[1-9][0-9]{1,14}
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Formats phone number to E.164 format
 * Adds + prefix if missing
 *
 * @param phone - Phone number to format
 * @returns string - Formatted phone number
 */
export const formatPhoneToE164 = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Add + prefix if missing
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Validates Indian phone number
 * Format: +91[10 digits]
 *
 * @param phone - Phone number to validate
 * @returns boolean - true if valid Indian number
 */
export const validateIndianPhone = (phone: string): boolean => {
  const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
  return indianPhoneRegex.test(phone);
};

/**
 * Gets formatted phone display
 * Example: +919876543210 → +91 98765 43210
 *
 * @param phone - Phone number in E.164 format
 * @returns string - Formatted display string
 */
export const getPhoneDisplay = (phone: string): string => {
  if (!phone) return '';

  // For Indian numbers
  if (phone.startsWith('+91') && phone.length === 13) {
    return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }

  // For other numbers, just add space after country code
  return phone.replace(/^(\+\d{1,3})(\d+)$/, '$1 $2');
};

/**
 * Error messages for phone validation
 */
export const PHONE_ERRORS = {
  INVALID_FORMAT: 'Invalid phone number format. Use E.164 format (e.g., +919876543210)',
  MISSING_COUNTRY_CODE: 'Please include country code (e.g., +91)',
  INVALID_INDIAN_NUMBER: 'Invalid Indian phone number. Must be 10 digits starting with 6-9',
  TOO_SHORT: 'Phone number is too short',
  TOO_LONG: 'Phone number is too long',
};

/**
 * Get specific error message for phone validation
 *
 * @param phone - Phone number to validate
 * @returns string | null - Error message or null if valid
 */
export const getPhoneValidationError = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }

  if (!phone.startsWith('+')) {
    return PHONE_ERRORS.MISSING_COUNTRY_CODE;
  }

  if (phone.length < 10) {
    return PHONE_ERRORS.TOO_SHORT;
  }

  if (phone.length > 16) {
    return PHONE_ERRORS.TOO_LONG;
  }

  if (!validatePhone(phone)) {
    return PHONE_ERRORS.INVALID_FORMAT;
  }

  return null;
};
