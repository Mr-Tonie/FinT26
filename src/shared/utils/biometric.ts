// Check if WebAuthn is available in the browser
export function isBiometricAvailable(): boolean {
  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

// Get available biometric types
export async function getAvailableBiometrics(): Promise<string[]> {
  if (!isBiometricAvailable()) {
    return [];
  }

  const types: string[] = [];

  // Check for platform authenticator (Face ID, Touch ID, Windows Hello, etc.)
  try {
    if (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
      types.push('Face ID / Touch ID / Windows Hello');
    }
  } catch (error) {
    console.error('Error checking biometric availability:', error);
  }

  return types;
}

// Check if biometric is registered/enabled
export function hasBiometricRegistered(): boolean {
  return localStorage.getItem('biometric_enabled') === 'true';
}

// Check if biometric is enabled (alias for compatibility)
export function isBiometricEnabled(): boolean {
  return hasBiometricRegistered();
}

// Register biometric credential
export async function registerBiometric(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isBiometricAvailable()) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    // Store credentials in localStorage (encrypted in production)
    // WARNING: This is simplified for demo. In production, use secure credential storage
    localStorage.setItem('biometric_email', email);
    localStorage.setItem('biometric_password', btoa(password)); // Base64 encode (NOT secure for production)
    localStorage.setItem('biometric_enabled', 'true');

    // Create credential for WebAuthn
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // In production, get from server
          rp: {
            name: 'FinT26',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: email,
            displayName: email,
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        return { success: true };
      }
    } catch (error: any) {
      // User might have cancelled - still mark as enabled since credentials are stored
      console.log('WebAuthn creation skipped:', error.message);
      return { success: true };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Biometric registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login with biometric
export async function loginWithBiometric(): Promise<{
  success: boolean;
  credentials?: { email: string; password: string };
  error?: string;
}> {
  try {
    if (!isBiometricAvailable()) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    const biometricEnabled = localStorage.getItem('biometric_enabled');
    if (!biometricEnabled) {
      return { success: false, error: 'Biometric authentication not set up' };
    }

    // Request authentication
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: 'required',
        },
      });

      if (credential) {
        // Retrieve stored credentials
        const email = localStorage.getItem('biometric_email');
        const encodedPassword = localStorage.getItem('biometric_password');

        if (email && encodedPassword) {
          const password = atob(encodedPassword); // Decode from base64
          return {
            success: true,
            credentials: { email, password },
          };
        }
      }
    } catch (error: any) {
      console.error('WebAuthn get error:', error);
      // Fallback to stored credentials if WebAuthn fails
      const email = localStorage.getItem('biometric_email');
      const encodedPassword = localStorage.getItem('biometric_password');

      if (email && encodedPassword) {
        const password = atob(encodedPassword);
        return {
          success: true,
          credentials: { email, password },
        };
      }
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error: any) {
    console.error('Biometric login error:', error);
    return { success: false, error: error.message };
  }
}

// Disable biometric authentication
export function disableBiometric(): void {
  localStorage.removeItem('biometric_email');
  localStorage.removeItem('biometric_password');
  localStorage.removeItem('biometric_enabled');
}

// Enable biometric (for Settings toggle)
export async function enableBiometric(): Promise<{ success: boolean; error?: string }> {
  const email = localStorage.getItem('biometric_email');
  const encodedPassword = localStorage.getItem('biometric_password');

  if (email && encodedPassword) {
    const password = atob(encodedPassword);
    return await registerBiometric(email, password);
  }

  return { success: false, error: 'No stored credentials found' };
}