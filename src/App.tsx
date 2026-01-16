import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { Transactions } from "@/features/transactions/Transactions";
import { Savings } from "@/features/savings/Savings";
import { Investments } from "@/features/investments/Investments";
import { Analytics } from "@/features/analytics/Analytics";
import { Login } from "@/features/auth/Login";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { isAuthenticated, updateActivity } from "@/shared/utils/auth";

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated()) {
        updateActivity();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);

    // Check authentication every minute
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
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/savings"
          element={
            <ProtectedRoute>
              <Savings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <Investments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
