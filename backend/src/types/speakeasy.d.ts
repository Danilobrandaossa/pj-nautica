declare module 'speakeasy' {
  export function generateSecret(options: any): any;
  export function verifyToken(options: any): boolean;
  export function generateBackupCodes(options: any): string[];
  export const totp: any;
}
