import crypto from 'crypto';

export default function tokenGenerator(): string {
  return crypto.randomBytes(32).toString('hex');
}
