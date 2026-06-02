import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import './Layout.scss';

export function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
