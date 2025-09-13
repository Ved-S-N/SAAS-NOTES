// pages/change-password.tsx
import { useState } from "react";
import { useRouter } from "next/router";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Not logged in");
      return;
    }

    const resp = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      setError(data?.error || "Change password failed");
      return;
    }

    setSuccess("Password changed successfully! Please log in again.");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // Logout user after password change
    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("role");
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "6rem auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h1 style={{ marginBottom: 16 }}>Change Password</h1>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {success && (
        <div style={{ color: "green", marginBottom: 12 }}>{success}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Old Password
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" style={{ padding: "8px 12px" }}>
          Update Password
        </button>
      </form>
    </div>
  );
}
