import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ role, requiredRole, children }) => {
  if (role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

export default RoleProtectedRoute;