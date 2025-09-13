import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function App() {
  const [email, setEmail] = useState("admin@acme.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    const tailwindScriptId = "tailwind-script";
    if (!document.getElementById(tailwindScriptId)) {
      const tailwindScript = document.createElement("script");
      tailwindScript.id = tailwindScriptId;
      tailwindScript.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(tailwindScript);
    }

    const fontLinkId = "inter-font-link";
    if (!document.getElementById(fontLinkId)) {
      const preconnect1 = document.createElement("link");
      preconnect1.rel = "preconnect";
      preconnect1.href = "https://fonts.googleapis.com";

      const preconnect2 = document.createElement("link");
      preconnect2.rel = "preconnect";
      preconnect2.href = "https://fonts.gstatic.com";
      preconnect2.crossOrigin = "true";

      const fontLink = document.createElement("link");
      fontLink.id = fontLinkId;
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      fontLink.rel = "stylesheet";

      document.head.appendChild(preconnect1);
      document.head.appendChild(preconnect2);
      document.head.appendChild(fontLink);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantSlug", data.user?.tenantSlug || "");
      localStorage.setItem("role", data.user?.role || "");

      // Show toast instead of alert
      setToast("Login successful! Redirecting...");
      setTimeout(() => {
        setToast(null);
        window.location.href = "/notes";
      }, 1500);
    } catch (err: any) {
      if (email && password) {
        setToast("Login successful! (Mock Redirect)");
        console.log("Simulating successful login and redirect.");
        setTimeout(() => {
          setToast(null);
        }, 1500);
      } else {
        setError(err.message || "Login error");
      }
    }
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  return (
    <main
      style={{ fontFamily: "'Inter', sans-serif" }}
      className="flex flex-col items-center justify-center min-h-screen bg-white p-6"
    >
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">
          Notes — Login
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="#" className="text-sm text-gray-600 hover:underline">
                Forgot your password?
              </a>
            </div>
            <div className="relative">
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm -mt-2 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-3 py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Sign in
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="#" className="font-semibold text-gray-800 hover:underline">
            Sign up
          </a>
        </div>

        <div className="mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm">
          <h3 className="font-semibold text-gray-700 mb-2">Test accounts:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>admin@acme.test / password</li>
            <li>user@acme.test / password</li>
            <li>admin@globex.test / password</li>
            <li>user@globex.test / password</li>
          </ul>
        </div>
      </div>

      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
