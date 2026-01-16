import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { logoutUser, getCurrentUser } from "@/shared/utils/auth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">FinT26</h1>
              <span className="ml-2 text-sm text-neutral-500">
                Personal Finance Intelligence
              </span>
            </div>

            <nav className="flex items-center space-x-8">
              <Link
                to="/"
                className={`font-medium transition-colors ${
                  isActive("/")
                    ? "text-primary-600"
                    : "text-neutral-700 hover:text-primary-600"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className={`font-medium transition-colors ${
                  isActive("/transactions")
                    ? "text-primary-600"
                    : "text-neutral-700 hover:text-primary-600"
                }`}
              >
                Transactions
              </Link>
              <Link
                to="/savings"
                className={`font-medium transition-colors ${
                  isActive("/savings")
                    ? "text-primary-600"
                    : "text-neutral-700 hover:text-primary-600"
                }`}
              >
                Savings
              </Link>
              <Link
                to="/investments"
                className={`font-medium transition-colors ${
                  isActive("/investments")
                    ? "text-primary-600"
                    : "text-neutral-700 hover:text-primary-600"
                }`}
              >
                Investments
              </Link>
              <Link
                to="/analytics"
                className={`font-medium transition-colors ${
                  isActive("/analytics")
                    ? "text-primary-600"
                    : "text-neutral-700 hover:text-primary-600"
                }`}
              >
                Analytics
              </Link>

              {/* User Info and Logout */}
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-neutral-300">
                <span className="text-sm text-neutral-600">
                  👤 {getCurrentUser()?.name || "User"}
                </span>
                <button
                  onClick={() => {
                    logoutUser();
                    window.location.href = "/login";
                  }}
                  className="text-sm text-danger hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} FinT26. Built for Payton's financial
            reality.
          </p>
        </div>
      </footer>
    </div>
  );
}
