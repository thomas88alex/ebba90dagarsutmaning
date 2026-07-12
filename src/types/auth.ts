export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  rememberMe: boolean;
  user: User | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}
