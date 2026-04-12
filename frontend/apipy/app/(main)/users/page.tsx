"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/types";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "user" });
  const [formError, setFormError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null,
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.createUser(formData.username, formData.email, formData.password, formData.role);
      setFormData({ username: "", email: "", password: "", role: "user" });
      setShowDialog(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;
    try {
      await api.deleteUser(deleteDialog.userId);
      setDeleteDialog({ isOpen: false, userId: null });
      loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <p style={{ color: "#4A7C65", fontSize: 14 }}>Access denied</p>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#F5F0E8",
    border: "1px solid #C8DDD0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    color: "#0D5C45",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#4A7C65",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em" }}>
          Users
        </h1>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
          style={{ background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#0a4a37"}
          onMouseLeave={e => e.currentTarget.style.background = "#0D5C45"}
        >
          <Plus size={15} /> Create user
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10" style={{ color: "#4A7C65" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>
              {users.length} user{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition"
                style={{ background: "#F5F0E8", border: "1px solid #C8DDD0" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#0D5C45"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#C8DDD0"}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>{u.username}</p>
                  <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 2 }}>{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1"
                    style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "capitalize",
                      background: u.role === "admin" ? "#DCFCE7" : "#F5F0E8",
                      color: u.role === "admin" ? "#166534" : "#4A7C65",
                      border: u.role === "admin" ? "1px solid #BBF7D0" : "1px solid #C8DDD0",
                    }}
                  >
                    {u.role}
                  </span>
                  {u.id !== user?.id && (
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, userId: u.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
                      style={{ fontSize: 12, fontWeight: 500, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FCA5A5", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FECACA"}
                      onMouseLeave={e => e.currentTarget.style.background = "#FEE2E2"}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(13,92,69,0.25)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDialog(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between mb-5">
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0D5C45" }}>Create new user</p>
              <button
                onClick={() => setShowDialog(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#4A7C65", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              {formError && (
                <div className="rounded-xl px-3 py-2" style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-2.5 transition"
                style={{ background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = "#0a4a37"}
                onMouseLeave={e => e.currentTarget.style.background = "#0D5C45"}
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, userId: null })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description="Are you sure you want to delete this user? This action will permanently remove their access to the system."
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}