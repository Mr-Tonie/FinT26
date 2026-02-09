import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { useNavigate } from "react-router-dom";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import {
  isBiometricAvailable,
  hasBiometricRegistered,
  disableBiometric,
  registerBiometric,
  getAvailableBiometrics
} from "@/shared/utils/biometric";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";

export function Settings() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      setCurrentUser({
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email
      });
    }

    // Check biometric availability
    const checkBiometric = async () => {
      const available = isBiometricAvailable();
      setBiometricAvailable(available);
      setBiometricEnabled(hasBiometricRegistered());

      if (available) {
        const types = await getAvailableBiometrics();
        setBiometricTypes(types);
      }
    };

    checkBiometric();
  }, []);

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      // Disable biometric
      if (confirm("Are you sure you want to disable biometric login?")) {
        disableBiometric();
        setBiometricEnabled(false);
        alert("Biometric authentication disabled");
      }
    } else {
      // Enable biometric - need current credentials
      const email = currentUser?.email;
      const password = prompt("Enter your password to enable biometric login:");

      if (!password) {
        alert("Password required to enable biometric authentication");
        return;
      }

      try {
        // Verify password by attempting to sign in
        const result = await firebaseAuthService.login(email, password);
        if (result.success) {
          // Password is correct, register biometric
          const biometricResult = await registerBiometric(email, password);
          if (biometricResult.success) {
            setBiometricEnabled(true);
            alert("Biometric authentication enabled successfully!");
          } else {
            alert(
              biometricResult.error ||
                "Failed to enable biometric authentication"
            );
          }
        } else {
          alert("Incorrect password");
        }
      } catch (error) {
        alert("Failed to verify password");
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validation
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);

    try {
      const user = firebaseAuthService.getCurrentUser();
      if (!user || !user.email) {
        setPasswordError("User not found");
        setPasswordLoading(false);
        return;
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Success
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);

      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("New password is too weak");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError(
          "Please log out and log back in before changing password"
        );
      } else {
        setPasswordError(error.message || "Failed to change password");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }

    try {
      const user = firebaseAuthService.getCurrentUser();
      if (user) {
        // Ask for password before deletion (security measure)
        const password = prompt(
          "Enter your password to confirm account deletion:"
        );
        if (!password) {
          alert("Password required to delete account");
          return;
        }

        // Re-authenticate before deletion
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);

        // Delete user from Firebase Authentication
        await user.delete();

        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Delete account error:", error);

      if (error.code === "auth/wrong-password") {
        alert("Incorrect password");
      } else if (error.code === "auth/requires-recent-login") {
        alert("Please log out and log back in before deleting your account");
      } else {
        alert("Failed to delete account: " + error.message);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Settings</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Account Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Name
              </label>
              <p className="mt-1 text-neutral-900">
                {currentUser?.name || "Loading..."}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                Email
              </label>
              <p className="mt-1 text-neutral-900">
                {currentUser?.email || "Loading..."}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                User ID
              </label>
              <p className="mt-1 text-xs text-neutral-500 font-mono">
                {currentUser?.id || "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Security
          </h3>

          {/* Biometric Authentication */}
          {biometricAvailable && biometricTypes.length > 0 ? (
            <div className="flex items-center justify-between py-3 border-b border-neutral-200">
              <div>
                <p className="font-medium text-neutral-900">Biometric Login</p>
                <p className="text-sm text-neutral-500">
                  {biometricTypes.join(", ")}
                </p>
              </div>
              <button
                onClick={handleBiometricToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  biometricEnabled ? "bg-primary-600" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    biometricEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ) : (
            <div className="py-3 border-b border-neutral-200">
              <p className="text-sm text-neutral-500">
                Biometric authentication is not available on this device
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn btn-outline"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-2 border-danger/20">
          <h3 className="text-lg font-semibold text-danger mb-4">
            Danger Zone
          </h3>

          <p className="text-sm text-neutral-600 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-danger text-white hover:bg-danger/90"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label text-danger">
                  Type "DELETE" to confirm account deletion
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="input border-danger"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE"}
                  className="btn bg-danger text-white hover:bg-danger/90 flex-1 disabled:opacity-50"
                >
                  Permanently Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
                  <p className="text-sm text-danger">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setPasswordError("");
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn btn-primary flex-1"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
