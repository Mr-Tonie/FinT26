import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validatePasswordStrength } from "@/shared/utils/auth";
import {
  isBiometricAvailable,
  getAvailableBiometrics,
  registerBiometric,
  authenticateWithBiometric
} from "@/shared/utils/biometric";
import { authAPI } from "@/shared/services/api";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [justRegisteredUserId, setJustRegisteredUserId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        const types = await getAvailableBiometrics();
        setBiometricTypes(types);
      }
    };

    checkBiometric();
  }, []);

  const handleBiometricLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authenticateWithBiometric();

      if (!result.success) {
        setError(result.error || "Biometric authentication failed");
        setLoading(false);
        return;
      }

      if (result.userId) {
        // Login with biometric - the token is already stored by the biometric system
        setSuccess("✓ Logged in successfully!");
        setTimeout(() => {
          onLogin();
          navigate("/");
        }, 500);
      }
    } catch (err) {
      setError("Biometric authentication error");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      // Registration
      const result = await authAPI.register(email, password, name);

      if (result.error) {
        setError(result.error);
      } else if (result.data?.accessToken) {
        // Store access token
        localStorage.setItem("auth_token", result.data.accessToken);

        // Store refresh token
        if (result.data.refreshToken) {
          localStorage.setItem("refresh_token", result.data.refreshToken);
        }

        onLogin();
        navigate("/");
      }
    } else {
      // Login
      const result = await authAPI.login(email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.data?.accessToken) {
        // Store access token
        localStorage.setItem("auth_token", result.data.accessToken);

        // Store refresh token
        if (result.data.refreshToken) {
          localStorage.setItem("refresh_token", result.data.refreshToken);
        }

        onLogin();
        navigate("/");
      }
    }
  };

  const handleSetupBiometric = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Get current user from backend
      const userResult = await authAPI.getCurrentUser();

      if (userResult.error || !userResult.data?.user) {
        setError("Failed to get user information");
        setLoading(false);
        return;
      }

      const currentUser = userResult.data.user;

      setSuccess("📱 Please scan your fingerprint or face when prompted...");

      const result = await registerBiometric(
        currentUser.id.toString(),
        currentUser.name,
        currentUser.email
      );

      if (result.success) {
        setSuccess("✓ Biometric authentication enabled!");
        setTimeout(() => {
          onLogin();
          navigate("/");
        }, 1500);
      } else {
        setError(result.error || "Failed to setup biometric");
        setLoading(false);
      }
    } catch (err) {
      setError("Biometric setup failed");
      setLoading(false);
    }
  };

  const skipBiometricSetup = () => {
    onLogin();
    navigate("/");
  };

  // Biometric Setup Screen
  if (showBiometricSetup) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">FinT26</h1>
          </div>

          <div className="card">
            <div className="text-center">
              <div className="text-7xl mb-6">👆</div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Enable Quick Login
              </h2>
              <p className="text-neutral-700 mb-2 text-lg">
                Use your{" "}
                <strong className="text-primary-600">
                  {biometricTypes.join(" or ")}
                </strong>{" "}
                to login
              </p>
              <p className="text-neutral-600 mb-8 text-sm">
                No more passwords to remember - just scan and go!
              </p>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center">
                  <span className="text-xl mr-2">ℹ️</span>
                  How it works:
                </h3>
                <ol className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-start">
                    <span className="font-bold text-primary-600 mr-2">1.</span>
                    <span>Click "Enable Biometric Login" below</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-primary-600 mr-2">2.</span>
                    <span>
                      Your device will ask you to scan your fingerprint or face
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-primary-600 mr-2">3.</span>
                    <span>Done! Next time, just scan to login instantly</span>
                  </li>
                </ol>
              </div>

              <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-success font-medium flex items-center justify-center">
                  <span className="mr-2">🔒</span>
                  Your biometric data never leaves your device
                </p>
              </div>

              {success && (
                <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md">
                  <p className="text-sm text-success font-medium">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-md">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSetupBiometric}
                  disabled={loading}
                  className="btn btn-primary w-full text-lg py-3"
                >
                  {loading ? "⏳ Setting up..." : "👆 Enable Biometric Login"}
                </button>
                <button
                  onClick={skipBiometricSetup}
                  disabled={loading}
                  className="btn btn-outline w-full"
                >
                  Skip - Use Password Only
                </button>
              </div>

              <p className="text-xs text-neutral-500 mt-4">
                You can always enable this later in Settings
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Login/Register Screen
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FinT26</h1>
          <p className="text-neutral-600">Personal Finance Intelligence</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md">
              <p className="text-sm text-success font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-md">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {!isRegisterMode &&
            biometricAvailable &&
            biometricTypes.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-3"
                >
                  <span className="text-3xl">👆</span>
                  <div className="text-left">
                    <div className="text-sm font-medium">Quick Login</div>
                    <div className="text-xs opacity-90">
                      Use {biometricTypes.join(" or ")}
                    </div>
                  </div>
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-neutral-500">
                      Or use password
                    </span>
                  </div>
                </div>
              </div>
            )}

          {isRegisterMode &&
            biometricAvailable &&
            biometricTypes.length > 0 && (
              <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-md">
                <p className="text-xs text-primary-700">
                  ✨ After registration, you can enable{" "}
                  {biometricTypes.join(" or ")} login for quick access
                </p>
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
                  placeholder="Mr Tony"
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
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0" htmlFor="password">
                  Password
                </label>
                {!isRegisterMode && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
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
                autoComplete={
                  isRegisterMode ? "new-password" : "current-password"
                }
              />
              {isRegisterMode && (
                <p className="text-xs text-neutral-600 mt-1">
                  Must be 8+ characters with uppercase, lowercase, and number
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
                  autoComplete="new-password"
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
                  : "Sign In with Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
                setSuccess("");
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

        <div className="mt-6 text-center space-y-2">
          {biometricAvailable ? (
            <>
              <p className="text-xs text-success font-medium flex items-center justify-center">
                <span className="mr-1">✓</span>
                Biometric authentication available on this device
              </p>
              <p className="text-xs text-neutral-500">
                Your fingerprint/face data is stored securely on your device
                only
              </p>
            </>
          ) : (
            <p className="text-xs text-neutral-500">
              🔒 Your data is encrypted and stored securely on your device
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
