"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/types";
import { 
  IconLoader2, 
  IconPlus, 
  IconTrash, 
  IconX 
} from "@tabler/icons-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { UserAvatar } from "@/components/UserAvatar";

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
      <div className="container container-slim py-4">
        <div className="text-center text-secondary">
          Access denied.
        </div>
      </div>
    );
  }

  return (
    <div className="container-xl">
      {/* Page Header */}
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title fw-bold tracking-tight">
              Users
            </h2>
            <div className="text-secondary mt-1">Manage system administrators and operators.</div>
          </div>
          <div className="col-auto ms-auto d-print-none">
            <button
              onClick={() => setShowDialog(true)}
              className="btn btn-primary btn-sm d-none d-sm-inline-flex align-items-center"
            >
              <IconPlus size={16} className="me-1" />
              Create new user
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="row row-cards">
        <div className="col-12">
          <div className="card card-premium shadow-sm">
            <div className="card-header">
              <h3 className="card-title">System Users</h3>
            </div>
            
            {isLoading ? (
              <div className="card-body py-5 text-center text-secondary">
                <IconLoader2 className="animate-spin mb-2" size={24} />
                <div className="small">Loading users...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter table-mobile-md card-table">
                  <thead>
                    <tr>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Username</th>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Email</th>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Role</th>
                      <th className="w-1 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="cursor-pointer hover:bg-light transition-colors">
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <span className="table-accent-bar" style={{ backgroundColor: '#4f7ef8' }}></span>
                            <UserAvatar 
                              email={u.email} 
                              username={u.username} 
                              size="sm" 
                              className="me-3" 
                            />
                            <div className="fw-bold">{u.username}</div>
                          </div>
                        </td>
                        <td className="text-secondary">
                          {u.email}
                        </td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "bg-purple-lt" : "bg-blue-lt"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => setDeleteDialog({ isOpen: true, userId: u.id })}
                              className="btn btn-ghost-danger btn-icon"
                              title="Delete user"
                            >
                              <IconTrash size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showDialog && (
        <div className="modal modal-blur fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create new user</h5>
                <button type="button" className="btn-close" onClick={() => setShowDialog(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger mb-3" role="alert">
                      {formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-link link-secondary me-auto" onClick={() => setShowDialog(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create User
                  </button>
                </div>
              </form>
            </div>
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
