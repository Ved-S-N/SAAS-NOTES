import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Note = { id: string; title: string; content: string; createdAt: string };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [role, setRole] = useState(""); // user role
  const [tenantPlan, setTenantPlan] = useState("FREE"); // Free / Pro
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const router = useRouter();

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  async function fetchNotes() {
    setError("");
    setSuccess("");
    const token = getToken();
    if (!token) return router.push("/");

    const resp = await fetch("/api/notes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data?.error || "Failed to load notes");
      if (resp.status === 401) {
        localStorage.removeItem("token");
        router.push("/");
      }
      return;
    }
    setNotes(data.notes || data); // assuming backend returns { notes, plan }
    setTenantPlan(data.plan || "FREE");
  }

  useEffect(() => {
    const ts = localStorage.getItem("tenantSlug") || "";
    const r = localStorage.getItem("role") || "";
    setTenantSlug(ts);
    setRole(r);
    fetchNotes();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (tenantPlan === "FREE" && notes.length >= 3) {
      setError("Free plan limit reached! Upgrade to Pro to add more notes.");
      return;
    }

    const token = getToken();
    if (!token) return router.push("/");

    const resp = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    const data = await resp.json();
    if (!resp.ok) return setError(data?.error || "Create failed");

    setTitle("");
    setContent("");
    setSuccess("Note created successfully!");
    fetchNotes();
  }

  async function handleDelete(id: string) {
    const token = getToken();
    if (!token) return router.push("/");

    const resp = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) return setError(data?.error || "Delete failed");

    setSuccess("Note deleted successfully!");
    fetchNotes();
  }

  function startEditing(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  // Inside your NotesPage component
  async function handleUpdate(id: string, e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = getToken();
    if (!token) return router.push("/");

    const resp = await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });
    const data = await resp.json();
    if (!resp.ok) return setError(data?.error || "Update failed");

    setEditingId(null);
    setSuccess("Note updated successfully!");
    fetchNotes();
  }

  async function handleUpgrade() {
    setError("");
    setSuccess("");
    const token = getToken();
    if (!token || !tenantSlug) return setError("Cannot upgrade");

    const resp = await fetch(`/api/tenants/${tenantSlug}/upgrade`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) return setError(data?.error || "Upgrade failed");

    setTenantPlan("PRO");
    setSuccess("Upgraded to Pro!");
    fetchNotes();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = getToken();
    if (!token || !tenantSlug) return setError("Cannot invite");

    const resp = await fetch(`/api/tenants/${tenantSlug}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await resp.json();
    if (!resp.ok) return setError(data?.error || "Invite failed");

    setSuccess(`Invited ${inviteEmail} as ${inviteRole}`);
    setInviteEmail("");
    setInviteRole("MEMBER");
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Notes (tenant: {tenantSlug})</h1>

      {/* Plan & Note Count */}
      <p>
        Plan:{" "}
        <strong style={{ color: tenantPlan === "PRO" ? "green" : "orange" }}>
          {tenantPlan}
        </strong>{" "}
        | Notes: {notes.length} / {tenantPlan === "FREE" ? 3 : "∞"}
      </p>

      {/* Notifications */}
      {success && (
        <div style={{ color: "green", marginBottom: 12 }}>{success}</div>
      )}
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {/* Create Note */}
      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 8, width: "45%", marginRight: 8 }}
        />
        <input
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: 8, width: "45%", marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>
          Create
        </button>
      </form>

      {/* Notes List */}
      <div style={{ marginBottom: 30 }}>
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 8,
              borderRadius: 6,
            }}
          >
            {editingId === note.id ? (
              <form
                onSubmit={(e) => handleUpdate(note.id, e)}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{note.title}</strong>
                  <div>
                    <button
                      onClick={() => startEditing(note)}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p>{note.content}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Admin Tools */}
      {role === "ADMIN" && (
        <div style={{ marginBottom: 30 }}>
          <h2>Admin Tools</h2>
          <button onClick={handleUpgrade} style={{ marginBottom: 12 }}>
            Upgrade to Pro
          </button>

          <form onSubmit={handleInvite}>
            <h3>Invite User</h3>
            <input
              placeholder="User email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ padding: 8, width: "60%", marginRight: 8 }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" style={{ padding: "8px 12px" }}>
              Invite
            </button>
          </form>
        </div>
      )}

      {/* Logout / Change Password */}
      <div>
        <button
          onClick={() => router.push("/change-password")}
          style={{ marginRight: 8 }}
        >
          Change Password
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("tenantSlug");
            localStorage.removeItem("role");
            router.push("/");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
