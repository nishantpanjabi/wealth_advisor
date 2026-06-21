import { Navigate } from "react-router";
import DashboardLayout from "./DashboardLayout";
import { isAuthenticated } from "../lib/auth";

export default function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
}
