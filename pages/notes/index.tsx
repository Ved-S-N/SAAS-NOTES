import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Crown,
  UserPlus,
  LogOut,
  KeyRound,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type Note = { id: string; title: string; content: string; createdAt: string };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [role, setRole] = useState(""); // ADMIN / MEMBER
  const [tenantPlan, setTenantPlan] = useState("FREE");
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

    try {
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
      setNotes(data.notes || []);
      setTenantPlan(data.tenantPlan || "FREE"); // use latest tenant plan
    } catch (err) {
      setError("Failed to fetch notes");
    }
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

    // dynamic limit per member if FREE
    if (tenantPlan === "FREE" && role !== "ADMIN" && notes.length >= 3) {
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

    setSuccess("Upgraded to Pro!");
    fetchNotes(); // <-- refresh tenantPlan and notes
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("role");
    router.push("/");
  }

  // Editing & Delete handlers remain unchanged
  function startEditing(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

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

  async function handleDelete(id: string) {
    const token = getToken();
    if (!token) return router.push("/");

    try {
      const resp = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await resp.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {}
      }
      if (!resp.ok) return setError(data?.error || "Delete failed");

      setSuccess(data?.message || "Note deleted successfully!");
      fetchNotes();
    } catch (err) {
      setError("An unexpected error occurred");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Notes</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/change-password")}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <KeyRound size={16} /> <span>Change Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} /> <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="mr-3" size={20} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="mr-3" size={20} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Create Note */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Create a New Note</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                required
              />
              <textarea
                placeholder="Content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition h-28 resize-none"
                required
              />
              <button className="w-full flex items-center justify-center py-3 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors">
                <Plus size={18} className="mr-2" /> Create Note
              </button>
            </form>
          </div>

          {/* Plan & Admin */}
          <div className="space-y-8">
            {/* Plan */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <h2 className="text-lg font-semibold mb-4">Your Plan</h2>
              <p
                className={`text-4xl font-bold ${
                  tenantPlan === "PRO" ? "text-green-600" : "text-orange-500"
                }`}
              >
                {tenantPlan}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Notes: {notes.length} /{" "}
                {tenantPlan === "FREE" && role !== "ADMIN" ? 3 : "Unlimited"}
              </p>
              {role === "ADMIN" && tenantPlan === "FREE" && (
                <button
                  onClick={handleUpgrade}
                  className="mt-4 w-full flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Crown size={16} className="mr-2" /> Upgrade Tenant to Pro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
              >
                {editingId === note.id ? (
                  <form
                    onSubmit={(e) => handleUpdate(note.id, e)}
                    className="p-4 space-y-3"
                  >
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 h-24 resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="submit"
                        className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="p-5 flex-grow">
                      <h3 className="font-semibold text-lg mb-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{note.content}</p>
                    </div>
                    <div className="bg-gray-50 p-3 flex justify-end items-center space-x-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 mr-auto">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => startEditing(note)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
