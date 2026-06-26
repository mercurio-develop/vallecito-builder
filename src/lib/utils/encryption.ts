import crypto from 'crypto';

// Use a 32-byte (64 hex character) key for AES-256-GCM. 
// In production, this MUST be set in your .env file.
const DEV_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEV_KEY;
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a string securely using AES-256-GCM.
 * Returns the format `iv:authTag:encryptedText`.
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return text as null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed for sensitive data.');
  }
}

/**
 * Decrypts a string previously encrypted with AES-256-GCM.
 */
export function decrypt(text: string | null | undefined): string | null {
  if (!text) return text as null;
  
  const parts = text.split(':');
  if (parts.length !== 3) return text; // Fallback if not encrypted
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null; // Don't leak partially decrypted or corrupted data
  }
}
