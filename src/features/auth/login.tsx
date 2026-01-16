import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/shared/utils/auth";
import {
  sanitizeInput,
  validatePasswordStrength
} from "@/shared/utils/encryption";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const passwordValidation = validatePasswordStrength(formData.password);
        if (!passwordValidation.isValid) {
          setError(
            passwordValidation.errors[0] || "Password is not strong enough"
          );
          setLoading(false);
          return;
        }

        const { registerUser } = await import("@/shared/utils/auth");
        const result = await registerUser(
          sanitizeInput(formData.email),
          formData.password,
          sanitizeInput(formData.name)
        );

        if (!result.success) {
          setError(result.error || "Registration failed");
          setLoading(false);
          return;
        }

        // Auto-login after registration
        const loginResult = await loginUser(formData.email, formData.password);
        if (loginResult.success) {
          onLogin();
          navigate("/");
        }
      } else {
        // Login
        const result = await loginUser(formData.email, formData.password);

        if (!result.success) {
          setError(result.error || "Login failed");
          setLoading(false);
          return;
        }

        onLogin();
        navigate("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FinT26</h1>
          <p className="text-neutral-600">Personal Finance Intelligence</p>
        </div>

        {/* Login/Register Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-md">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="label" htmlFor="name">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="Uncle Tony"
                  required
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="input"
                placeholder="tony@example.com"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="input"
                placeholder="••••••••"
                required
              />
              {isRegisterMode && (
                <p className="text-xs text-neutral-600 mt-1">
                  Must be 8+ characters with uppercase, lowercase, number, and
                  special character
                </p>
              )}
            </div>

            {isRegisterMode && (
              <div>
                <label className="label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))
                  }
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading
                ? "Please wait..."
                : isRegisterMode
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: ""
                });
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isRegisterMode
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            Your data is encrypted and stored securely on your device
          </p>
        </div>
      </div>
    </div>
  );
}
