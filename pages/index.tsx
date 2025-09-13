import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@acme.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const router = useRouter();

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

      // ✅ Save token, tenantSlug, and role
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantSlug", data.user?.tenantSlug || "");
      localStorage.setItem("role", data.user?.role || "");

      router.push("/notes");
    } catch (err: any) {
      setError(err.message || "Login error");
    }
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
      <h1 style={{ marginBottom: 8 }}>Notes — Login</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ padding: "8px 12px" }}>
          Login
        </button>
      </form>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <strong>Test accounts:</strong>
        <ul>
          <li>admin@acme.test / password</li>
          <li>user@acme.test / password</li>
          <li>admin@globex.test / password</li>
          <li>user@globex.test / password</li>
        </ul>
      </div>
    </div>
  );
}
