import crypto from 'crypto';

export function signHmacSHA256(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function verifyHmacSHA256(payload: string, secret: string, signature: string) {
  const expected = signHmacSHA256(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}





