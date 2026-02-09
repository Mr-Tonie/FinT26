import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../config/firebase';

export const firebaseAuthService = {
  async register(email: string, password: string, name: string) {
    try {
      console.log('Attempting registration for:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('User created, updating profile...');
      await updateProfile(userCredential.user, { displayName: name });
      
      console.log('Registration successful!');
      return {
        success: true,
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          name: name,
        },
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = error.message;
      
      // Parse Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password authentication is not enabled in Firebase Console';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error - check your internet connection';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async login(email: string, password: string) {
    try {
      console.log('Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Login successful!');
      return {
        success: true,
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          name: userCredential.user.displayName || email,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = error.message;
      
      // Parse Firebase error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error - check your internet connection';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password authentication is not enabled';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};