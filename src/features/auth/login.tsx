import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import {
  isBiometricAvailable,
  getAvailableBiometrics,
  loginWithBiometric
} from "@/shared/utils/biometric";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);

  useEffect(() => {
    // Check if biometric is available
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
    setLoading(true);

    try {
      const result = await loginWithBiometric();

      if (result.success && result.credentials) {
        // Use stored credentials to login
        const loginResult = await firebaseAuthService.login(
          result.credentials.email,
          result.credentials.password
        );

        if (loginResult.success) {
          onLogin();
          navigate("/");
        } else {
          setError(loginResult.error || "Login failed");
        }
      } else {
        setError(result.error || "Biometric authentication failed");
      }
    } catch (err: any) {
      setError("Biometric login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }

        const result = await firebaseAuthService.register(
          email,
          password,
          name
        );

        if (result.success) {
          onLogin();
          navigate("/");
        } else {
          setError(result.error || "Registration failed");
        }
      } else {
        const result = await firebaseAuthService.login(email, password);

        if (result.success) {
          onLogin();
          navigate("/");
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FinT26</h1>
          <p className="text-neutral-600">
            {isRegistering ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Biometric Login Button (only show on login, not register) */}
        {!isRegistering && biometricAvailable && biometricTypes.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleBiometricLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <span className="font-medium">
                Login with {biometricTypes.join(" or ")}
              </span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-neutral-300"></div>
              <span className="px-4 text-sm text-neutral-500">or</span>
              <div className="flex-1 border-t border-neutral-300"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Uncle Tony"
                required
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="uncletony@gmail.com"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              : isRegistering
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>

        {!isRegistering && (
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Forgot password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
