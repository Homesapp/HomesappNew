import crypto from 'crypto';

// Use AES-256-GCM for authenticated encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Gets the encryption key from environment or generates one for development
 * In production, this MUST be set via environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in environment. Using default key for development.');
    console.warn('⚠️  This is NOT secure for production. Set ENCRYPTION_KEY environment variable.');
    // Default key for development only - DO NOT use in production
    return crypto.scryptSync('development-default-key-change-in-production', 'salt', 32);
  }
  
  // Derive a proper 32-byte key from the environment variable
  return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Prefixed base64 string (ENC:v1:...) containing IV + auth tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  // If already encrypted, return as-is (idempotent)
  if (isEncrypted(plaintext)) {
    return plaintext;
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + auth tag + ciphertext into single string
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(ciphertext, 'base64')
  ]);
  
  // Add version prefix for identification
  return ENCRYPTION_PREFIX + combined.toString('base64');
}

/**
 * Prefix added to all encrypted values for identification
 * Format: ENC:v1: followed by base64 encrypted data
 */
const ENCRYPTION_PREFIX = 'ENC:v1:';

/**
 * Checks if a value is encrypted
 * @param value - The value to check
 * @returns true if the value appears to be encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encrypted - Base64 encoded string from encrypt() with ENC:v1: prefix
 * @returns Original plaintext
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return '';
  
  // If not encrypted, return as-is (for backward compatibility with legacy data)
  if (!isEncrypted(encrypted)) {
    return encrypted;
  }
  
  try {
    const key = getEncryptionKey();
    // Remove prefix before decoding
    const base64Data = encrypted.substring(ENCRYPTION_PREFIX.length);
    const combined = Buffer.from(base64Data, 'base64');
    
    // Extract IV, auth tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertext, undefined, 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Data may be corrupted or key may have changed.');
  }
}

/**
 * Hash a value using SHA-256 (one-way hash for searching)
 * Useful for indexing encrypted values
 */
export function hash(value: string): string {
  if (!value) return '';
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Securely compare two strings in constant time to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
