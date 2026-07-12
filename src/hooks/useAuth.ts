import { useMemo } from "react";
import { getCurrentUser, isAuthenticated, logoutUser } from "../services/authService";

export function useAuth() {
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  return useMemo(
    () => ({
      isAuthenticated: authenticated,
      user,
      logout: logoutUser,
    }),
    [authenticated, user],
  );
}
