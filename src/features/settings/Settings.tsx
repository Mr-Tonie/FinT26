import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { logoutUser } from "@/shared/utils/auth";
import { authAPI } from "@/shared/services/api";
import {
  isBiometricAvailable,
  getAvailableBiometrics,
  registerBiometric,
  hasBiometricRegistered,
  removeBiometric
} from "@/shared/utils/biometric";

export function Settings() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await authAPI.getCurrentUser();
      if (result.data?.user) {
        setCurrentUser(result.data.user);

        if (result.data.user.id) {
          const enabled = hasBiometricRegistered(
            result.data.user.id.toString()
          );
          setBiometricEnabled(enabled);
        }
      }
    };

    fetchUser();

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

  const handleEnableBiometric = async () => {
    if (!currentUser) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      setSuccess("📱 Please scan your fingerprint or face when prompted...");

      const result = await registerBiometric(
        currentUser.id.toString(),
        currentUser.name,
        currentUser.email
      );

      if (result.success) {
        setSuccess("✓ Biometric authentication enabled successfully!");
        setBiometricEnabled(true);
        setLoading(false);
      } else {
        setError(result.error || "Failed to enable biometric");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to enable biometric authentication");
      setLoading(false);
    }
  };

  const handleDisableBiometric = () => {
    if (!currentUser) return;

    setError("");
    setSuccess("");

    const result = removeBiometric(currentUser.id.toString());

    if (result) {
      setSuccess("✓ Biometric authentication disabled");
      setBiometricEnabled(false);
    } else {
      setError("Failed to disable biometric");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and ALL data. This action cannot be undone. Are you absolutely sure?"
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== "DELETE") {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch("http://127.0.0.1:5001/api/auth/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Clear ALL localStorage data
        localStorage.clear();

        // Clear session storage too
        sessionStorage.clear();

        alert("✓ Account deleted successfully");

        // Force reload to clear any cached data
        window.location.href = "/login";
      } else {
        const data = await response.json();
        alert(`Failed to delete account: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting account");
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Settings</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your account and security preferences
          </p>
        </div>

        {/* Account Information */}
        <div className="card">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            Account Information
          </h3>

          {currentUser ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <div>
                  <p className="text-sm text-neutral-600">Name</p>
                  <p className="font-medium text-neutral-900">
                    {currentUser.name}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-medium text-neutral-900">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm text-neutral-600">User ID</p>
                  <p className="font-mono text-xs text-neutral-700">
                    {currentUser.id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-500">Loading user information...</p>
            </div>
          )}
        </div>

        {/* Biometric Authentication */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Biometric Authentication
              </h3>
              <p className="text-sm text-neutral-600">
                Use fingerprint or face recognition to login quickly
              </p>
            </div>
            {biometricEnabled && (
              <span className="px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">
                ✓ Enabled
              </span>
            )}
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

          {!biometricAvailable ? (
            <div className="p-4 bg-neutral-100 rounded-md">
              <p className="text-sm text-neutral-600">
                ⚠️ Biometric authentication is not available on this device
              </p>
            </div>
          ) : biometricTypes.length === 0 ? (
            <div className="p-4 bg-neutral-100 rounded-md">
              <p className="text-sm text-neutral-600">
                ⚠️ No biometric sensors detected on this device
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">👆</span>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">
                      Available: {biometricTypes.join(" or ")}
                    </h4>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span>Login instantly without typing password</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span>More secure than remembering passwords</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span>
                          Your biometric data stays on your device only
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {!biometricEnabled && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">ℹ️</span>
                    How to enable:
                  </h4>
                  <ol className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-start">
                      <span className="font-bold text-primary-600 mr-2">
                        1.
                      </span>
                      <span>
                        Click the "Enable Biometric Login" button below
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-primary-600 mr-2">
                        2.
                      </span>
                      <span>
                        Your device will prompt you to scan your fingerprint or
                        face
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-primary-600 mr-2">
                        3.
                      </span>
                      <span>
                        Scan when prompted (usually takes 1-2 seconds)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-primary-600 mr-2">
                        4.
                      </span>
                      <span>
                        Done! You can now use biometric login on this device
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex space-x-3">
                {!biometricEnabled ? (
                  <button
                    onClick={handleEnableBiometric}
                    disabled={loading || !currentUser}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? "⏳ Setting up..." : "👆 Enable Biometric Login"}
                  </button>
                ) : (
                  <>
                    <div className="flex-1 p-4 bg-success/5 border border-success/20 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 text-success">
                        <span className="text-2xl">✓</span>
                        <span className="font-semibold">
                          Biometric login is active
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 text-center mt-2">
                        You can now login using {biometricTypes.join(" or ")}
                      </p>
                    </div>
                    <button
                      onClick={handleDisableBiometric}
                      className="btn btn-outline text-danger border-danger hover:bg-danger/10"
                    >
                      Disable
                    </button>
                  </>
                )}
              </div>

              <div className="mt-4 p-3 bg-neutral-50 rounded-md">
                <p className="text-xs text-neutral-600 flex items-start">
                  <span className="mr-2">🔒</span>
                  <span>
                    Your biometric data (fingerprint/face) is stored securely on
                    your device hardware and never sent to our servers or stored
                    in the cloud.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="card">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            Security
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-900">Session Timeout</p>
                <p className="text-sm text-neutral-600">
                  JWT token valid for 7 days
                </p>
              </div>
              <span className="text-sm text-success font-medium">Active</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-neutral-100">
              <div>
                <p className="font-medium text-neutral-900">Data Encryption</p>
                <p className="text-sm text-neutral-600">
                  All data encrypted in transit and at rest
                </p>
              </div>
              <span className="text-sm text-success font-medium">Enabled</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-neutral-900">
                  Password Protection
                </p>
                <p className="text-sm text-neutral-600">
                  Strong password requirements enforced
                </p>
              </div>
              <span className="text-sm text-success font-medium">Enabled</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-danger/20">
          <h3 className="text-xl font-semibold text-danger mb-4">
            Danger Zone
          </h3>

          <div className="p-4 bg-danger/5 border border-danger/20 rounded-lg">
            <h4 className="font-semibold text-neutral-900 mb-2">
              Delete Account
            </h4>
            <p className="text-sm text-neutral-600 mb-4">
              Once you delete your account, there is no going back. This will
              permanently delete your account and all associated data including
              transactions, savings goals, and investments.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="btn bg-danger text-white hover:bg-red-700"
            >
              Delete My Account
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="card">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            Account Actions
          </h3>

          <button onClick={handleLogout} className="btn btn-danger w-full">
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}
