import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedLayout from "./components/ProtectedLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PortfolioList from "./pages/PortfolioList";
import AddInvestment from "./pages/AddInvestment";
import PortfolioDetail from "./pages/PortfolioDetail";
import GoalsList from "./pages/GoalsList";
import CreateGoal from "./pages/CreateGoal";
import GoalDetail from "./pages/GoalDetail";
import RiskAnalysis from "./pages/RiskAnalysis";
import Predictions from "./pages/Predictions";
import Recommendations from "./pages/Recommendations";
import Simulation from "./pages/Simulation";
import Insights from "./pages/Insights";
import Admin from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "profile", Component: Profile },
      { path: "portfolio", Component: PortfolioList },
      { path: "portfolio/add", Component: AddInvestment },
      { path: "portfolio/:id", Component: PortfolioDetail },
      { path: "goals", Component: GoalsList },
      { path: "goals/create", Component: CreateGoal },
      { path: "goals/:id", Component: GoalDetail },
      { path: "risk-analysis", Component: RiskAnalysis },
      { path: "predictions", Component: Predictions },
      { path: "recommendations", Component: Recommendations },
      { path: "simulation", Component: Simulation },
      { path: "insights", Component: Insights },
      { path: "admin", Component: Admin },
    ],
  },
]);
