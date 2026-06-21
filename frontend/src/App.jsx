import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoadingState from "./components/feedback/LoadingState";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const PredictionsPage = lazy(() => import("./pages/PredictionsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RiskPage = lazy(() => import("./pages/RiskPage"));
const SimulationPage = lazy(() => import("./pages/SimulationPage"));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-6"><LoadingState label="Loading page..." /></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="risk" element={<RiskPage />} />
              <Route path="predictions" element={<PredictionsPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="simulation" element={<SimulationPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
