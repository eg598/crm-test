import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { TicketCard } from '../../components/TicketCard';
import { ticketsApi } from '../../api/tickets.api';
import { Ticket } from '../../types';
import './DashboardPage.scss';

interface Stats {
  total: number;
  open: number;
  critical: number;
  overdue: number;
  unassigned: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, critical: 0, overdue: 0, unassigned: 0 });
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [unassigned, setUnassigned] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  useEffect(() => {
    async function load() {
      try {
        const [allRes, openRes, criticalRes, overdueRes, recentRes] = await Promise.all([
          ticketsApi.list({ limit: 1 }),
          ticketsApi.list({ status: 'new', limit: 1 }),
          ticketsApi.list({ priority: 'critical', limit: 1 }),
          ticketsApi.list({ overdue: true, limit: 1 }),
          ticketsApi.list({ limit: 5 }),
        ]);

        setStats({
          total: allRes.data.total,
          open: openRes.data.total,
          critical: criticalRes.data.total,
          overdue: overdueRes.data.total,
          unassigned: 0,
        });
        setRecent(recentRes.data.data);

        if (isSupervisor) {
          try {
            const allRes2 = await ticketsApi.list({ limit: 500 });
            const unassignedList = allRes2.data.data.filter((t) => !t.assignedUserId);
            setUnassigned(unassignedList);
            setStats((prev) => ({ ...prev, unassigned: unassignedList.length }));
          } catch { /* non-critical */ }
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isSupervisor]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Dashboard</h1>
        <p className="dashboard-page__subtitle">Welcome back, {user?.name}</p>
      </div>

      {isLoading ? (
        <div className="dashboard-page__loading">Loading...</div>
      ) : (
        <>
          {isSupervisor && (
            <div className="dashboard-page__stats">
              <StatCard label="Total Tickets" value={stats.total} />
              <StatCard label="New Tickets" value={stats.open} variant="default" />
              <StatCard label="Critical" value={stats.critical} variant="danger" />
              <StatCard label="Overdue" value={stats.overdue} variant="warning" />
              <StatCard label="Unassigned" value={stats.unassigned} variant="warning" />
            </div>
          )}

          {/* Unassigned alert for supervisors */}
          {isSupervisor && unassigned.length > 0 && (
            <div className="dashboard-page__section">
              <div className="dashboard-page__section-header">
                <h2 className="dashboard-page__section-title dashboard-page__section-title--warn">
                  Unassigned Tickets ({unassigned.length})
                </h2>
                <Link to="/tickets" className="dashboard-page__link">View all →</Link>
              </div>
              <div className="dashboard-page__tickets">
                {unassigned.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                    <TicketCard ticket={ticket} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Workload quick-link for supervisors */}
          {isSupervisor && (
            <div className="dashboard-page__section">
              <div className="dashboard-page__section-header">
                <h2 className="dashboard-page__section-title">Operator Workload</h2>
                <Link to="/workload" className="dashboard-page__link">Manage operators →</Link>
              </div>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                View operator ticket counts, search and sort operators, and reassign tickets from the Operator Workload page.
              </p>
            </div>
          )}

          {/* Recent tickets */}
          <div className="dashboard-page__section">
            <div className="dashboard-page__section-header">
              <h2 className="dashboard-page__section-title">Recent Tickets</h2>
              <Link to="/tickets" className="dashboard-page__link">View all →</Link>
            </div>
            <div className="dashboard-page__tickets">
              {recent.map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                  <TicketCard ticket={ticket} />
                </Link>
              ))}
              {recent.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__text">No tickets yet</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
