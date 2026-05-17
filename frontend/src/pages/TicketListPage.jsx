import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { getTickets } from "../lib/api";

const initialFilters = {
  status: "",
  priority: "",
};

export default function TicketListPage() {
  const { token, user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getTickets(token, filters);
        setTickets(response);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTickets();
  }, [filters, token]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h2>Ticket Inbox</h2>
          <p>
            {user?.role === "user"
              ? "This view shows the tickets you created."
              : "This view shows the active support workload."}
          </p>
        </div>
        <Link to="/tickets/new" className="primary-button">
          Create Ticket
        </Link>
      </header>

      <div className="panel filter-grid">
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={filters.priority}
            onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {isLoading ? <p>Loading tickets...</p> : null}

      {!isLoading && tickets.length === 0 ? (
        <div className="panel empty-state">
          <h3>No tickets yet</h3>
          <p>Create the first support ticket to start testing the workflow.</p>
        </div>
      ) : null}

      <div className="ticket-grid">
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="ticket-card">
            <div className="ticket-card-top">
              <h3>{ticket.title}</h3>
              <StatusBadge label={ticket.status.replaceAll("_", " ")} tone={ticket.status} />
            </div>
            <div className="ticket-card-bottom">
              <StatusBadge label={ticket.priority} tone={ticket.priority} />
              <div className="ticket-meta">
                <span>Created by: {ticket.creator.full_name}</span>
                <span>Assigned to: {ticket.assignee?.full_name || "Unassigned"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
