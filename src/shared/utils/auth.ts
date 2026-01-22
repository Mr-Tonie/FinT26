/**
 * Authentication utilities – frontend (localStorage based)
 */

import { saveToStorage, loadFromStorage } from "./storage";

/* =======================
   Types
======================= */

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
}

/* =======================
   Constants
======================= */

const USERS_KEY = "users";
const SESSION_KEY = "current_session";
const AUTH_TOKEN_KEY = "auth_token";
const SESSION_TIMEOUT = 30 * 60 * 1000;

/* =======================
   Helpers
======================= */

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =======================
   Public API
======================= */

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain a number");

  return { isValid: errors.length === 0, errors };
}

export function registerUser(
  email: string,
  password: string,
  name: string
): { success: boolean; error?: string } {
  if (!isValidEmail(email)) {
    return { success: false, error: "Invalid email address" };
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    return { success: false, error: passwordCheck.errors[0] };
  }

  const users = loadFromStorage<User[]>(USERS_KEY) || [];

  if (users.some(u => u.email === email.toLowerCase())) {
    return { success: false, error: "User already exists" };
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    email: email.toLowerCase(),
    password: simpleHash(password + email),
    name,
    createdAt: new Date(),
  };

  users.push(newUser);
  saveToStorage(USERS_KEY, users);

  return { success: true };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; error?: string } {
  const users = loadFromStorage<User[]>(USERS_KEY) || [];
  const user = users.find(u => u.email === email.toLowerCase());

  if (!user || user.password !== simpleHash(password + email)) {
    return { success: false, error: "Invalid email or password" };
  }

  const session: Session = {
    userId: user.id,
    token: generateSessionToken(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT),
    lastActivity: new Date(),
  };

  saveToStorage(SESSION_KEY, session);
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);

  return { success: true };
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function getCurrentUser(): User | null {
  return null; // Placeholder for backend integration
}
export function updateActivity(): void {
  // Placeholder for future backend session activity tracking
}


export function resetPasswordWithEmail(
  email: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = loadFromStorage<any[]>("users") || [];

  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return { success: false, error: "No account found with this email" };
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.isValid) {
    return { success: false, error: passwordCheck.errors[0] };
  }

  user.password = simpleHash(newPassword + user.email);
  saveToStorage("users", users);

  return { success: true };
}

