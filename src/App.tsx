import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { Transactions } from "@/features/transactions/Transactions";
import { Savings } from "@/features/savings/Savings";
import { Investments } from "@/features/investments/Investments";
import { Analytics } from "@/features/analytics/Analytics";
import { Settings } from "@/features/settings/Settings";
import { Login } from "@/features/auth/Login";
import { ForgotPassword } from "@/features/auth/ForgotPassword";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { isAuthenticated, updateActivity } from "@/shared/utils/auth";
import { Calendar } from "@/features/calendar/Calendar";

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated()) {
        updateActivity();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);

    const interval = setInterval(() => {
      setAuthenticated(isAuthenticated());
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("click", handleActivity);
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={() => setAuthenticated(true)} />
            )
          }
        />

        <Route
          path="/forgot-password"
          element={
            authenticated ? <Navigate to="/" replace /> : <ForgotPassword />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/savings"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Savings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Investments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Calendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute authenticated={authenticated}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
