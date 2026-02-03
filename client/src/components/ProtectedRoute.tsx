import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  // Retrieve user from local storage (set during login in Auth.tsx)
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // 1. Check if user is authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Check if user has the required role (if roles are specified)
  if (allowedRoles && !allowedRoles.includes(user.role_type)) {
    // If not authorized, redirect to their allowed home (e.g., dashboard)
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;