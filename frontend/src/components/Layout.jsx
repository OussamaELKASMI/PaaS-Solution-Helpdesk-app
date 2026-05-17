import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function navClassName({ isActive }) {
  return `nav-link${isActive ? ' active' : ''}`;
}

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">MH</div>
          <div>
            <h1>Mini Helpdesk</h1>
            <p>Cloud PaaS MVP - Build 2</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/tickets" className={navClassName}>
            Tickets
          </NavLink>
          <NavLink to="/tickets/new" className={navClassName}>
            New Ticket
          </NavLink>
          {user?.role === 'admin' ? (
            <NavLink to="/admin" className={navClassName}>
              Admin Dashboard
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <strong>{user?.full_name}</strong>
            <span>{user?.role}</span>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
