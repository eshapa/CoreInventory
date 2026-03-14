import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Role "${user.role}" not authorized for this route.`);
    // Redirect to login if role is invalid/missing, or a safe page that isn't this one
    // To be safest for the 4pm deadline, we'll force a logout if the session role is corrupt/missing
    return <Navigate to="/login" replace />;
  }

  // Outlet correctly passes React Router context to nested <DashboardLayout>
  return <Outlet />;
};
