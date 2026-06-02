import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', roles: ['operator', 'supervisor', 'admin'] },
  { path: '/tickets', label: 'Tickets', roles: ['operator', 'supervisor', 'admin'] },
  { path: '/kanban', label: 'Kanban Board', roles: ['operator', 'supervisor', 'admin'] },
  { path: '/workload', label: 'Operator Workload', roles: ['supervisor', 'admin'] },
  { path: '/clients', label: 'Clients', roles: ['operator', 'supervisor', 'admin'] },
  { path: '/users', label: 'Users', roles: ['admin'] },
] as const;

export function Sidebar() {
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter((item) =>
    user ? (item.roles as readonly string[]).includes(user.role) : false
  );

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Service Desk</div>

      <nav className="sidebar__nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-name">{user?.name}</div>
          <div className="sidebar__user-role">{user?.role}</div>
        </div>
        <button className="sidebar__logout" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
