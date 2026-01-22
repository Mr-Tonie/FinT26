import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  resetPasswordWithEmail,
  validatePasswordStrength
} from "@/shared/utils/auth";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Move to reset step
    setStep("reset");
    setSuccess("Email verified! Now set your new password.");
  };

  const handlePasswordReset = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setError(validation.errors[0] || "Password is not strong enough");
      setLoading(false);
      return;
    }

    // Reset password
    const result = resetPasswordWithEmail(email, newPassword);

    if (!result.success) {
      setError(result.error || "Failed to reset password");
      setLoading(false);
      return;
    }

    setSuccess("✓ Password reset successfully!");
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FinT26</h1>
          <p className="text-neutral-600">Personal Finance Intelligence</p>
        </div>

        {/* Forgot Password Card */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {step === "email" ? "Forgot Password?" : "Reset Your Password"}
            </h2>
            <p className="text-sm text-neutral-600">
              {step === "email"
                ? "Enter your email address to reset your password"
                : "Create a new strong password for your account"}
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

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="tony@example.com"
                  required
                  autoFocus
                />
                <p className="text-xs text-neutral-600 mt-1">
                  Enter the email you used to register
                </p>
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-md mb-4">
                <p className="text-sm text-primary-700">
                  <strong>Email:</strong> {email}
                </p>
              </div>

              <div>
                <label className="label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
                <p className="text-xs text-neutral-600 mt-1">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label className="label" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-700">
                    Password Requirements:
                  </p>
                  <div className="space-y-1">
                    <div
                      className={`text-xs flex items-center ${
                        newPassword.length >= 8
                          ? "text-success"
                          : "text-neutral-500"
                      }`}
                    >
                      {newPassword.length >= 8 ? "✓" : "○"} At least 8
                      characters
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        /[A-Z]/.test(newPassword)
                          ? "text-success"
                          : "text-neutral-500"
                      }`}
                    >
                      {/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase
                      letter
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        /[a-z]/.test(newPassword)
                          ? "text-success"
                          : "text-neutral-500"
                      }`}
                    >
                      {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase
                      letter
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        /[0-9]/.test(newPassword)
                          ? "text-success"
                          : "text-neutral-500"
                      }`}
                    >
                      {/[0-9]/.test(newPassword) ? "✓" : "○"} One number
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setSuccess("");
                  }}
                  className="btn btn-outline flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            🔒 For security, this is a demo password reset. In production, you
            would receive an email with a reset link.
          </p>
        </div>
      </div>
    </div>
  );
}
