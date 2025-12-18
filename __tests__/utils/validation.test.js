import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateURL,
  validateFileSize,
  validateFileType,
  validateFutureDate,
  validateTextLength,
  validateNumberRange,
  sanitizeText,
  validateCommunityName,
  validateEventTitle,
  validateDescription,
} from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true });
      expect(validateEmail('user.name@domain.co.uk')).toEqual({ valid: true });
      expect(validateEmail('test+tag@example.com')).toEqual({ valid: true });
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('missing@domain')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('@domain.com')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toEqual({
        valid: false,
        error: 'Email is required',
      });
      expect(validateEmail(null)).toEqual({
        valid: false,
        error: 'Email is required',
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with minimum length', () => {
      expect(validatePassword('password123')).toEqual({ valid: true });
      expect(validatePassword('123456')).toEqual({ valid: true });
    });

    it('should reject short passwords', () => {
      expect(validatePassword('12345')).toEqual({
        valid: false,
        error: 'Password must be at least 6 characters',
      });
      expect(validatePassword('abc')).toEqual({
        valid: false,
        error: 'Password must be at least 6 characters',
      });
    });

    it('should reject empty password', () => {
      expect(validatePassword('')).toEqual({
        valid: false,
        error: 'Password is required',
      });
    });
  });

  describe('validateDisplayName', () => {
    it('should validate correct display names', () => {
      expect(validateDisplayName('John Doe')).toEqual({ valid: true });
      expect(validateDisplayName('AB')).toEqual({ valid: true });
    });

    it('should reject names that are too short', () => {
      expect(validateDisplayName('A')).toEqual({
        valid: false,
        error: 'Name must be at least 2 characters',
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51);
      expect(validateDisplayName(longName)).toEqual({
        valid: false,
        error: 'Name must be less than 50 characters',
      });
    });

    it('should reject empty names', () => {
      expect(validateDisplayName('')).toEqual({
        valid: false,
        error: 'Name is required',
      });
      expect(validateDisplayName('   ')).toEqual({
        valid: false,
        error: 'Name is required',
      });
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toEqual({ valid: true });
      expect(validateURL('http://test.co.uk/path')).toEqual({ valid: true });
    });

    it('should allow empty URLs (optional field)', () => {
      expect(validateURL('')).toEqual({ valid: true });
      expect(validateURL(null)).toEqual({ valid: true });
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not a url')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
      expect(validateURL('missing-protocol.com')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
    });
  });

  describe('validateFileSize', () => {
    it('should validate files within size limit', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      expect(validateFileSize(5 * 1024 * 1024, maxSize)).toEqual({ valid: true });
      expect(validateFileSize(maxSize, maxSize)).toEqual({ valid: true });
    });

    it('should reject files exceeding size limit', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const result = validateFileSize(11 * 1024 * 1024, maxSize);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size must be less than 10MB');
    });
  });

  describe('validateFileType', () => {
    it('should validate allowed file types', () => {
      const allowedTypes = ['pdf', 'doc', 'docx'];
      expect(validateFileType('document.pdf', allowedTypes)).toEqual({ valid: true });
      expect(validateFileType('file.DOC', allowedTypes)).toEqual({ valid: true });
    });

    it('should reject disallowed file types', () => {
      const allowedTypes = ['pdf', 'doc'];
      const result = validateFileType('image.jpg', allowedTypes);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('jpg');
      expect(result.error).toContain('not allowed');
    });
  });

  describe('validateFutureDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(validateFutureDate(futureDate)).toEqual({ valid: true });
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const result = validateFutureDate(pastDate);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date must be in the future');
    });

    it('should reject empty dates', () => {
      expect(validateFutureDate(null)).toEqual({
        valid: false,
        error: 'Date is required',
      });
    });
  });

  describe('validateTextLength', () => {
    it('should validate text within range', () => {
      expect(validateTextLength('Hello', 3, 10)).toEqual({ valid: true });
      expect(validateTextLength('Test', 4, 4)).toEqual({ valid: true });
    });

    it('should reject text that is too short', () => {
      const result = validateTextLength('Hi', 5, 10, 'Message');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message must be at least 5 characters');
    });

    it('should reject text that is too long', () => {
      const result = validateTextLength('Hello World', 1, 5, 'Message');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message must be less than 5 characters');
    });

    it('should reject empty text', () => {
      const result = validateTextLength('   ', 1, 10, 'Field');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Field is required');
    });
  });

  describe('validateNumberRange', () => {
    it('should validate numbers within range', () => {
      expect(validateNumberRange(5, 1, 10)).toEqual({ valid: true });
      expect(validateNumberRange(10, 10, 10)).toEqual({ valid: true });
    });

    it('should reject numbers below minimum', () => {
      const result = validateNumberRange(0, 1, 10, 'Count');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Count must be at least 1');
    });

    it('should reject numbers above maximum', () => {
      const result = validateNumberRange(11, 1, 10, 'Count');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Count must be at most 10');
    });

    it('should reject non-numeric values', () => {
      const result = validateNumberRange('abc', 1, 10, 'Value');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Value must be a number');
    });

    it('should reject empty values', () => {
      const result = validateNumberRange('', 1, 10, 'Value');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Value is required');
    });
  });

  describe('sanitizeText', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const output = sanitizeText(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('</script>');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const output = sanitizeText(input);
      expect(output).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  Hello World  ')).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
    });
  });

  describe('validateCommunityName', () => {
    it('should validate community names within range', () => {
      expect(validateCommunityName('Study Group')).toEqual({ valid: true });
    });

    it('should reject names that are too short', () => {
      const result = validateCommunityName('Ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Community name');
    });
  });

  describe('validateEventTitle', () => {
    it('should validate event titles within range', () => {
      expect(validateEventTitle('Weekly Meetup')).toEqual({ valid: true });
    });

    it('should reject titles that are too short', () => {
      const result = validateEventTitle('Ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Event title');
    });
  });

  describe('validateDescription', () => {
    it('should allow empty descriptions', () => {
      expect(validateDescription('')).toEqual({ valid: true });
      expect(validateDescription(null)).toEqual({ valid: true });
    });

    it('should validate descriptions within limit', () => {
      const desc = 'A'.repeat(400);
      expect(validateDescription(desc, 500)).toEqual({ valid: true });
    });

    it('should reject descriptions that are too long', () => {
      const desc = 'A'.repeat(501);
      const result = validateDescription(desc, 500);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('500 characters');
    });
  });
});
