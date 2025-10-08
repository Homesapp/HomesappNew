import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

const defaultConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, defaultConfig);
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  textFields: (keyof T)[],
  htmlFields: (keyof T)[] = []
): T {
  const sanitized = { ...obj };
  
  textFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  });
  
  htmlFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHtml(sanitized[field] as string) as T[keyof T];
    }
  });
  
  return sanitized;
}

// Enhanced validation functions using validator.js

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return validator.isEmail(email, {
    allow_display_name: false,
    require_tld: true,
    allow_utf8_local_part: false,
  });
}

export function isValidURL(url: string): boolean {
  if (!url) return false;
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
  });
}

export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Accepts Mexican phone numbers (+52) and international format
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
}

export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-numeric and non-plus characters
  return phone.replace(/[^0-9+]/g, '');
}

export function isValidAlphanumeric(text: string, locale: 'es-ES' | 'en-US' = 'es-ES'): boolean {
  if (!text) return false;
  // Allow alphanumeric, spaces, and common Spanish characters
  return validator.isAlphanumeric(text.replace(/[\s\u00C0-\u00FF]/g, ''), locale);
}

export function sanitizeNumericString(value: string | null | undefined): string {
  if (!value) return '';
  // Remove all non-numeric and non-decimal characters
  return value.replace(/[^0-9.]/g, '');
}

export function isValidCurrency(value: string): boolean {
  if (!value) return false;
  return validator.isCurrency(value, {
    allow_negatives: false,
    thousands_separator: ',',
    decimal_separator: '.',
  });
}

export function isStrongPassword(password: string): boolean {
  if (!password) return false;
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  });
}

export function sanitizeUsername(username: string | null | undefined): string {
  if (!username) return '';
  // Remove special characters, keep only alphanumeric and underscores
  return validator.trim(username.replace(/[^a-zA-Z0-9_]/g, ''));
}

export function normalizeEmail(email: string): string {
  if (!email) return '';
  return validator.normalizeEmail(email, {
    gmail_remove_dots: true,
    gmail_remove_subaddress: true,
    outlookdotcom_remove_subaddress: true,
    yahoo_remove_subaddress: true,
  }) || '';
}

export function escapeString(text: string | null | undefined): string {
  if (!text) return '';
  return validator.escape(text);
}

export function stripLowChars(text: string | null | undefined): string {
  if (!text) return '';
  return validator.stripLow(text, true);
}

// SQL Injection prevention helpers
export function containsSQLKeywords(text: string): boolean {
  if (!text) return false;
  const sqlKeywords = /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bUNION\b|\bWHERE\b|\b--\b|\b;\b)/gi;
  return sqlKeywords.test(text);
}

// XSS prevention helpers
export function containsScriptTags(text: string): boolean {
  if (!text) return false;
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return scriptPattern.test(text);
}
