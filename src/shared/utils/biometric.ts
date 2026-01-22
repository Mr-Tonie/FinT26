/**
 * Biometric authentication using WebAuthn API
 * Supports fingerprint, face recognition, and security keys
 */

import { saveToStorage, loadFromStorage } from './storage';

interface BiometricCredential {
  id: string;
  publicKey: string;
  userId: string;
  createdAt: Date;
}

const CREDENTIALS_KEY = 'biometric_credentials';

/**
 * Check if biometric authentication is available
 */
export function isBiometricAvailable(): boolean {
  return window.PublicKeyCredential !== undefined && 
         navigator.credentials !== undefined;
}

/**
 * Get available biometric types
 */
export async function getAvailableBiometrics(): Promise<string[]> {
  if (!isBiometricAvailable()) {
    return [];
  }

  const available: string[] = [];

  try {
    // Check for platform authenticator (fingerprint, face)
    const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (platformAvailable) {
      available.push('fingerprint/face');
    }
  } catch (error) {
    console.error('Error checking biometric availability:', error);
  }

  return available;
}

/**
 * Register biometric credential for a user
 */
export async function registerBiometric(
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricAvailable()) {
    return { 
      success: false, 
      error: 'Biometric authentication is not available on this device' 
    };
  }

  try {
    // Generate challenge (in production, this should come from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'FinT26',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // ES256
        },
        {
          type: 'public-key',
          alg: -257, // RS256
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (fingerprint/face)
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create biometric credential' };
    }

    // Store credential info
    const credentials = loadFromStorage<BiometricCredential[]>(CREDENTIALS_KEY) || [];
    
    const newCredential: BiometricCredential = {
      id: credential.id,
      publicKey: arrayBufferToBase64(credential.rawId),
      userId,
      createdAt: new Date(),
    };

    credentials.push(newCredential);
    saveToStorage(CREDENTIALS_KEY, credentials);

    return { success: true };
  } catch (error: unknown) {
    console.error('Biometric registration error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric registration was cancelled' };
      }
      if (error.name === 'NotSupportedError') {
        return { success: false, error: 'Biometric authentication is not supported' };
      }
    }
    
    return { success: false, error: 'Failed to register biometric' };
  }
}

/**
 * Authenticate using biometric
 */
export async function authenticateWithBiometric(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  if (!isBiometricAvailable()) {
    return { 
      success: false, 
      error: 'Biometric authentication is not available' 
    };
  }

  try {
    const credentials = loadFromStorage<BiometricCredential[]>(CREDENTIALS_KEY) || [];
    
    if (credentials.length === 0) {
      return { 
        success: false, 
        error: 'No biometric credentials registered. Please register first.' 
      };
    }

    // Generate challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Get credential options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: credentials.map(cred => ({
        id: base64ToArrayBuffer(cred.publicKey),
        type: 'public-key' as const,
        transports: ['internal'] as AuthenticatorTransport[],
      })),
      timeout: 60000,
      userVerification: 'required',
    };

    // Get credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Biometric authentication failed' };
    }

    // Find matching credential
    const matchingCredential = credentials.find(
      cred => cred.id === assertion.id
    );

    if (!matchingCredential) {
      return { success: false, error: 'Invalid biometric credential' };
    }

    return {
      success: true,
      userId: matchingCredential.userId,
    };
  } catch (error: unknown) {
    console.error('Biometric authentication error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric authentication was cancelled' };
      }
    }
    
    return { success: false, error: 'Biometric authentication failed' };
  }
}

/**
 * Check if user has registered biometric
 */
export function hasBiometricRegistered(userId: string): boolean {
  const credentials = loadFromStorage<BiometricCredential[]>(CREDENTIALS_KEY) || [];
  return credentials.some(cred => cred.userId === userId);
}

/**
 * Remove biometric credential
 */
export function removeBiometric(userId: string): boolean {
  const credentials = loadFromStorage<BiometricCredential[]>(CREDENTIALS_KEY) || [];
  const filtered = credentials.filter(cred => cred.userId !== userId);
  
  if (filtered.length === credentials.length) {
    return false;
  }
  
  saveToStorage(CREDENTIALS_KEY, filtered);
  return true;
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}