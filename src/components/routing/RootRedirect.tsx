import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../services/authService";

export function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />;
}
