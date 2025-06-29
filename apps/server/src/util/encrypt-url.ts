import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.STATE_ENCRYPTION_KEY!;
const IV_LENGTH = 12;

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('STATE_ENCRYPTION_KEY must be exactly 32 bytes');
}

export function encryptState(payload: object): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);

  const jsonData = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(jsonData, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]).toString('base64url');
  return result;
}

export function decryptState(state: string) {
  const raw = Buffer.from(state, 'base64url');
  const iv = raw.slice(0, IV_LENGTH);
  const authTag = raw.slice(IV_LENGTH, IV_LENGTH + 16);
  const encryptedText = raw.slice(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
