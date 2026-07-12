import { localStorageKeys } from "../config/challengeConfig";
import type { AuthState, LoginPayload, User } from "../types/auth";
import { readStorage, removeStorage, writeStorage } from "./localStorageService";

const mockUser: User = {
  id: "ebba-1",
  name: "Ebba",
  email: "ebba@example.com",
};

const validCredentials = {
  email: "ebba@example.com",
  password: "challenge90",
};

function defaultAuthState(): AuthState {
  return {
    isAuthenticated: false,
    rememberMe: false,
    user: null,
  };
}

export function getAuthState(): AuthState {
  return readStorage<AuthState>(localStorageKeys.auth, defaultAuthState());
}

export function getCurrentUser(): User | null {
  const state = getAuthState();
  return state.isAuthenticated ? state.user : null;
}

export function loginUser(payload: LoginPayload): { success: true } | { success: false; message: string } {
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (
    normalizedEmail !== validCredentials.email ||
    payload.password !== validCredentials.password
  ) {
    return {
      success: false,
      message: "Incorrect email or password. Please try again.",
    };
  }

  const authState: AuthState = {
    isAuthenticated: true,
    rememberMe: payload.rememberMe,
    user: mockUser,
  };

  writeStorage(localStorageKeys.auth, authState);

  return { success: true };
}

export function logoutUser(): void {
  removeStorage(localStorageKeys.auth);
}

export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated;
}
