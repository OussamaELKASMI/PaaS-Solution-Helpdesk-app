import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getAdminStats, getUsers, updateUserRoleRequest } from "../lib/api";

const statCards = [
  { key: "total_users", label: "Users" },
  { key: "total_tickets", label: "Total Tickets" },
  { key: "open_tickets", label: "Open" },
  { key: "in_progress_tickets", label: "In Progress" },
  { key: "resolved_tickets", label: "Resolved" },
  { key: "closed_tickets", label: "Closed" },
];

export default function AdminDashboardPage() {
  const { token, user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResponse, usersResponse] = await Promise.all([getAdminStats(token), getUsers(token)]);
        setStats(statsResponse);
        setUsers(usersResponse);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadDashboard();
  }, [token]);

  async function handleRoleUpdate(userId, role) {
    setError("");
    setUpdatingUserId(userId);

    try {
      const updatedUser = await updateUserRoleRequest(token, userId, role);
      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === updatedUser.id ? updatedUser : item))
      );
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingUserId("");
    }
  }

  if (error && !stats) {
    return <p className="error-text">{error}</p>;
  }

  if (!stats) {
    return <p>Loading admin dashboard...</p>;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin View</span>
          <h2>Operational Snapshot</h2>
          <p>This is the first monitoring-style dashboard for the local MVP.</p>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.key} className="panel stat-card">
            <span>{card.label}</span>
            <strong>{stats[card.key]}</strong>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>User Role Management</h3>
            <p className="muted-text">
              New accounts start as regular users. Promote them here when they should handle support tickets.
            </p>
          </div>
        </div>

        <div className="user-list">
          {users.map((user) => (
            <div key={user.id} className="user-row">
              <div>
                <strong>{user.full_name}</strong>
                <p className="muted-text">
                  {user.email} - created {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <label className="role-editor">
                <span>Role</span>
                <select
                  value={user.role}
                  onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                  disabled={updatingUserId === user.id || user.id === currentUser?.id}
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
                {user.id === currentUser?.id ? (
                  <span className="field-hint">Current admin account</span>
                ) : null}
              </label>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
