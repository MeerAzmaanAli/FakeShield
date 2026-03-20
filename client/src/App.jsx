import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// ── Public Pages ───────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// ── User Pages ─────────────────────────────────────────────────────────
import UserDashboard from "./pages/user/UserDashboard";
import AnalyzePage from "./pages/user/AnalyzePage";
import ReportHistoryPage from "./pages/user/ReportHistoryPage";

// ── Agency Pages ───────────────────────────────────────────────────────
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AllReportsPage from "./pages/agency/AllReportsPage";
import CaseDetailPage from "./pages/agency/CaseDetailPage";
import BlockchainAuditPage from "./pages/agency/BlockchainAuditPage";
import AgencyAnalyzePage from "./pages/agency/AgencyAnalyzePage";

const App = () => {
  const { isAuthenticated, isAgency } = useAuth();

  return (
    <Routes>

      {/* ── Public Routes ─────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* if already logged in, redirect away from login/register */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={isAgency ? "/agency/dashboard" : "/dashboard"} replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to={isAgency ? "/agency/dashboard" : "/dashboard"} replace />
            : <Register />
        }
      />

      {/* ── User Routes ───────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyze"
        element={
          <ProtectedRoute>
            <AnalyzePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute>
            <ReportHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* ── Agency Routes ─────────────────────────────────────────── */}
      <Route
        path="/agency/dashboard"
        element={
          <ProtectedRoute role="agency">
            <AgencyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/reports"
        element={
          <ProtectedRoute role="agency">
            <AllReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/reports/:id"
        element={
          <ProtectedRoute role="agency">
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/audit"
        element={
          <ProtectedRoute role="agency">
            <BlockchainAuditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/analyze"
        element={
          <ProtectedRoute role="agency">
            <AgencyAnalyzePage />
          </ProtectedRoute>
        }
      />

      {/* ── Catch All → 404 ───────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default App;