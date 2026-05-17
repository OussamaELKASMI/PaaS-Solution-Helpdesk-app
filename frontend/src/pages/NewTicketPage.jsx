import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createTicket, getStaffUsers } from "../lib/api";

const initialForm = {
  title: "",
  description: "",
  priority: "medium",
  assigned_to: "",
};

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [staffUsers, setStaffUsers] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStaffUsers() {
      if (user?.role === "user") {
        return;
      }

      setIsLoadingStaff(true);
      try {
        const response = await getStaffUsers(token);
        setStaffUsers(response);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingStaff(false);
      }
    }

    loadStaffUsers();
  }, [token, user?.role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const ticket = await createTicket(token, {
        ...form,
        assigned_to: form.assigned_to || null,
      });
      navigate(`/tickets/${ticket.id}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">New Request</span>
          <h2>Create a Ticket</h2>
          <p>
            {user?.role === "user"
              ? "Describe the issue clearly so the support team can act quickly."
              : "You can create tickets on behalf of users or for internal tracking."}
          </p>
        </div>
      </header>

      <form className="panel form-stack" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows="6"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </label>

        <label>
          Priority
          <select
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        {user?.role !== "user" ? (
          <label>
            Assign To
            <select
              value={form.assigned_to}
              onChange={(event) => setForm((current) => ({ ...current, assigned_to: event.target.value }))}
            >
              <option value="">Unassigned</option>
              {staffUsers.map((staffUser) => (
                <option key={staffUser.id} value={staffUser.id}>
                  {staffUser.full_name} ({staffUser.role})
                </option>
              ))}
            </select>
            <span className="field-hint">
              {isLoadingStaff
                ? "Loading available staff..."
                : "Only support agents and admins can be assigned to a ticket."}
            </span>
          </label>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </button>
      </form>
    </section>
  );
}
