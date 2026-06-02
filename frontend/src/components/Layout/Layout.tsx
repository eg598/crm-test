import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import './Layout.scss';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`layout ${sidebarOpen ? 'layout--sidebar-open' : ''}`}>
      <div className="layout__overlay" onClick={() => setSidebarOpen(false)} />
      <Sidebar onClose={() => setSidebarOpen(false)} />
      <main className="layout__main">
        <button
          className="layout__burger"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
