/**
 * Authentication utilities
 */

import { hashPassword, verifyPassword, generateSessionToken } from './encryption';
import { saveToStorage, loadFromStorage } from './storage';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
}

const USERS_KEY = 'users';
const SESSION_KEY = 'current_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  // Validate email
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  // Check if user already exists
  const users = loadFromStorage<User[]>(USERS_KEY) || [];
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    return { success: false, error: 'User with this email already exists' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: email.toLowerCase(),
    passwordHash,
    name,
    createdAt: new Date(),
  };

  users.push(newUser);
  saveToStorage(USERS_KEY, users);

  return { success: true };
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; name: string } }> {
  const users = loadFromStorage<User[]>(USERS_KEY) || [];
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  
  if (!isValidPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Create session
  const session: Session = {
    userId: user.id,
    token: generateSessionToken(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT),
    lastActivity: new Date(),
  };

  saveToStorage(SESSION_KEY, session);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

/**
 * Logout user
 */
export function logoutUser(): void {
  localStorage.removeItem('fint26_' + SESSION_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = loadFromStorage<Session>(SESSION_KEY);
  
  if (!session) {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const lastActivity = new Date(session.lastActivity);

  // Check if session expired
  if (now > expiresAt) {
    logoutUser();
    return false;
  }

  // Check if inactive for too long
  const inactiveTime = now.getTime() - lastActivity.getTime();
  if (inactiveTime > SESSION_TIMEOUT) {
    logoutUser();
    return false;
  }

  // Update last activity
  session.lastActivity = now;
  saveToStorage(SESSION_KEY, session);

  return true;
}

/**
 * Get current user
 */
export function getCurrentUser(): { id: string; email: string; name: string } | null {
  if (!isAuthenticated()) {
    return null;
  }

  const session = loadFromStorage<Session>(SESSION_KEY);
  if (!session) {
    return null;
  }

  const users = loadFromStorage<User[]>(USERS_KEY) || [];
  const user = users.find(u => u.id === session.userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

/**
 * Update user activity timestamp
 */
export function updateActivity(): void {
  const session = loadFromStorage<Session>(SESSION_KEY);
  if (session) {
    session.lastActivity = new Date();
    saveToStorage(SESSION_KEY, session);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const users = loadFromStorage<User[]>(USERS_KEY) || [];
  const user = users.find(u => u.id === currentUser.id);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Hash new password
  user.passwordHash = await hashPassword(newPassword);
  saveToStorage(USERS_KEY, users);

  return { success: true };
}
