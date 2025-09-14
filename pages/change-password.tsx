import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/router";

// --- PasswordInput component moved outside to prevent cursor jump ---
const PasswordInput = ({
  label,
  value,
  onChange,
  field,
  visibility,
  toggleVisibility,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  field: "old" | "new" | "confirm";
  visibility: { old: boolean; new: boolean; confirm: boolean };
  toggleVisibility: (field: "old" | "new" | "confirm") => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <input
        type={visibility[field] ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        required
      />
      <button
        type="button"
        onClick={() => toggleVisibility(field)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
      >
        {visibility[field] ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

export default function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [visibility, setVisibility] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Load Tailwind & fonts
  useEffect(() => {
    if (!document.getElementById("tailwind-script")) {
      const t = document.createElement("script");
      t.id = "tailwind-script";
      t.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(t);
    }
    if (!document.getElementById("inter-font-link")) {
      const pre1 = document.createElement("link");
      pre1.rel = "preconnect";
      pre1.href = "https://fonts.googleapis.com";
      const pre2 = document.createElement("link");
      pre2.rel = "preconnect";
      pre2.href = "https://fonts.gstatic.com";
      pre2.crossOrigin = "true";
      const link = document.createElement("link");
      link.id = "inter-font-link";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(pre1);
      document.head.appendChild(pre2);
      document.head.appendChild(link);
    }
  }, []);

  const toggleVisibility = (field: "old" | "new" | "confirm") => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Not logged in");
      return;
    }

    try {
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

      setSuccess("Password changed successfully! Redirecting to login...");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      localStorage.removeItem("token");
      localStorage.removeItem("tenantSlug");
      localStorage.removeItem("role");

      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message || "Change password failed");
    }
  }

  return (
    <main
      style={{ fontFamily: "'Inter', sans-serif" }}
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
    >
      {/* Fullscreen Background Image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/coolbackgrounds-fractalize-cool_backgrounds.png"
          className="w-full h-full object-cover"
          alt="Background"
        />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600 mt-2">
            Update your password for enhanced security.
          </p>
        </div>
        <div className="max-w-6xl mx-auto mt-4 p-1 pb-4 bg-[linear-gradient(to_right,#f2f2f2,#f2f2f2,#f2f2f2,#d0f7fa,#d7b2fe,#f18d7d)] w-full rounded-3xl">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="mr-3 flex-shrink-0" size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="mr-3 flex-shrink-0" size={20} />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordInput
                  label="Old Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  field="old"
                  visibility={visibility}
                  toggleVisibility={toggleVisibility}
                />
                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  field="new"
                  visibility={visibility}
                  toggleVisibility={toggleVisibility}
                />
                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  field="confirm"
                  visibility={visibility}
                  toggleVisibility={toggleVisibility}
                />

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center py-3 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  <KeyRound size={18} className="mr-2" /> Update Password
                </button>
              </form>
            )}
          </div>
          <div className="text-center pt-2 mb-0 text-sm font-bold">
            Powered by ved (v1)
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/notes")}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Notes
          </button>
        </div>
      </div>
    </main>
  );
}
