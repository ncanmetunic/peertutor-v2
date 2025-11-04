/**
 * Form validation utilities
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  return { valid: true };
};

/**
 * Validate display name
 */
export const validateDisplayName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }

  return { valid: true };
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
  if (!url) {
    return { valid: true }; // URL is optional
  }

  try {
    new URL(url);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate file size
 */
export const validateFileSize = (fileSize, maxSize) => {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (fileName, allowedTypes) => {
  const extension = fileName.split('.').pop().toLowerCase();

  if (!allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Validate date (must be in the future)
 */
export const validateFutureDate = (date) => {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  const now = new Date();
  const selectedDate = new Date(date);

  if (selectedDate <= now) {
    return { valid: false, error: 'Date must be in the future' };
  }

  return { valid: true };
};

/**
 * Validate text length
 */
export const validateTextLength = (text, minLength, maxLength, fieldName = 'Field') => {
  if (!text || !text.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedText = text.trim();

  if (minLength && trimmedText.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (maxLength && trimmedText.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${maxLength} characters`
    };
  }

  return { valid: true };
};

/**
 * Validate number range
 */
export const validateNumberRange = (number, min, max, fieldName = 'Value') => {
  if (number === null || number === undefined || number === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const num = Number(number);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true };
};

/**
 * Sanitize text input (remove potential XSS)
 */
export const sanitizeText = (text) => {
  if (!text) return '';

  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, ''); // Strip HTML tags
};

/**
 * Validate community name
 */
export const validateCommunityName = (name) => {
  return validateTextLength(name, 3, 50, 'Community name');
};

/**
 * Validate event title
 */
export const validateEventTitle = (title) => {
  return validateTextLength(title, 3, 100, 'Event title');
};

/**
 * Validate description
 */
export const validateDescription = (description, maxLength = 500) => {
  if (!description || !description.trim()) {
    return { valid: true }; // Description is optional
  }

  if (description.length > maxLength) {
    return {
      valid: false,
      error: `Description must be less than ${maxLength} characters`
    };
  }

  return { valid: true };
};
