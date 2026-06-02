import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketsApi } from '../../api/tickets.api';
import { usersApi } from '../../api/users.api';
import { Input } from '../../components/Input';
import { Ticket, User } from '../../types';
import './OperatorWorkloadPage.scss';

type SortKey = 'name_asc' | 'name_desc' | 'count_desc' | 'count_asc';
type WorkloadLevel = 'none' | 'low' | 'medium' | 'high';

interface OperatorRow {
  user: User;
  count: number;
}

function workloadLevel(count: number): WorkloadLevel {
  if (count === 0) return 'none';
  if (count <= 3) return 'low';
  if (count <= 7) return 'medium';
  return 'high';
}

export function OperatorWorkloadPage() {
  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [allOperators, setAllOperators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('count_desc');

  // Expanded operator state
  const [expandedOpId, setExpandedOpId] = useState<number | null>(null);
  const [opTickets, setOpTickets] = useState<Record<number, Ticket[]>>({});
  const [loadingOpId, setLoadingOpId] = useState<number | null>(null);
  const [reassigning, setReassigning] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, ticketsRes] = await Promise.all([
          usersApi.list(),
          ticketsApi.list({ limit: 500 }),
        ]);
        const operators = usersRes.data.filter((u) => u.role === 'operator');
        setAllOperators(operators);

        const countMap: Record<number, number> = {};
        for (const t of ticketsRes.data.data) {
          if (t.assignedUserId && t.status !== 'closed') {
            countMap[t.assignedUserId] = (countMap[t.assignedUserId] ?? 0) + 1;
          }
        }
        setRows(operators.map((op) => ({ user: op, count: countMap[op.id] ?? 0 })));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const displayRows = useMemo(() => {
    let filtered = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = rows.filter((r) => r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name_asc':  return a.user.name.localeCompare(b.user.name);
        case 'name_desc': return b.user.name.localeCompare(a.user.name);
        case 'count_asc': return a.count - b.count;
        case 'count_desc':
        default:          return b.count - a.count;
      }
    });
  }, [rows, search, sort]);

  const toggleOperator = async (opId: number) => {
    if (expandedOpId === opId) {
      setExpandedOpId(null);
      return;
    }
    setExpandedOpId(opId);
    if (opTickets[opId]) return; // already loaded
    setLoadingOpId(opId);
    try {
      const res = await ticketsApi.list({ assignedUserId: opId, limit: 100 });
      setOpTickets((prev) => ({ ...prev, [opId]: res.data.data }));
    } finally {
      setLoadingOpId(null);
    }
  };

  const handleReassign = async (fromOpId: number, ticketId: number, toOpId: number) => {
    setReassigning(ticketId);
    try {
      await ticketsApi.assign(ticketId, toOpId);
      // Remove ticket from source operator's list
      setOpTickets((prev) => ({
        ...prev,
        [fromOpId]: (prev[fromOpId] ?? []).filter((t) => t.id !== ticketId),
        // Invalidate target operator's cached list so it reloads on next expand
        [toOpId]: undefined as unknown as Ticket[],
      }));
      // Update counts
      setRows((prev) =>
        prev.map((r) => {
          if (r.user.id === fromOpId) return { ...r, count: Math.max(0, r.count - 1) };
          if (r.user.id === toOpId) return { ...r, count: r.count + 1 };
          return r;
        })
      );
    } finally {
      setReassigning(null);
    }
  };

  return (
    <div className="workload-page">
      <div className="workload-page__header">
        <div>
          <h1 className="workload-page__title">Operator Workload</h1>
          <p className="workload-page__subtitle">{rows.length} operators</p>
        </div>
      </div>

      <div className="workload-page__controls">
        <Input
          placeholder="Search operators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field__input workload-page__sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="count_desc">Most tickets first</option>
          <option value="count_asc">Fewest tickets first</option>
          <option value="name_asc">Name A → Z</option>
          <option value="name_desc">Name Z → A</option>
        </select>
      </div>

      {isLoading ? (
        <div className="workload-page__loading">Loading...</div>
      ) : displayRows.length === 0 ? (
        <div className="empty-state"><div className="empty-state__text">No operators found</div></div>
      ) : (
        <div className="workload-list">
          {displayRows.map(({ user: op, count }) => {
            const level = workloadLevel(count);
            const isExpanded = expandedOpId === op.id;
            const tickets = opTickets[op.id] ?? [];
            const isLoadingTickets = loadingOpId === op.id;

            return (
              <div key={op.id} className={`workload-card ${isExpanded ? 'workload-card--expanded' : ''}`}>
                {/* Operator row */}
                <div className="workload-card__row" onClick={() => toggleOperator(op.id)}>
                  <div className="workload-card__identity">
                    <span className="workload-card__name">{op.name}</span>
                    <span className="workload-card__email">{op.email}</span>
                  </div>
                  <span className="workload-card__count">{count} ticket{count !== 1 ? 's' : ''}</span>
                  <span className={`workload-badge workload-badge--${level}`}>{level}</span>
                  <span className="workload-card__toggle">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded ticket list */}
                {isExpanded && (
                  <div className="workload-card__tickets">
                    {isLoadingTickets && <div className="workload-card__loading">Loading tickets...</div>}

                    {!isLoadingTickets && tickets.length === 0 && (
                      <div className="workload-card__empty">No active tickets</div>
                    )}

                    {!isLoadingTickets && tickets.length > 0 && (
                      <table className="workload-ticket-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Reassign to</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr key={ticket.id}>
                              <td className="workload-ticket-table__id">
                                <Link to={`/tickets/${ticket.id}`}>#{ticket.id}</Link>
                              </td>
                              <td className="workload-ticket-table__title">
                                <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                              </td>
                              <td>
                                <span className={`badge badge--${ticket.priority}`}>{ticket.priority}</span>
                              </td>
                              <td className="workload-ticket-table__status">
                                {ticket.status.replace('_', ' ')}
                              </td>
                              <td>
                                <select
                                  className="input-field__input workload-ticket-table__reassign"
                                  defaultValue=""
                                  disabled={reassigning === ticket.id}
                                  onChange={(e) => {
                                    if (e.target.value) handleReassign(op.id, ticket.id, Number(e.target.value));
                                  }}
                                >
                                  <option value="">Move to...</option>
                                  {allOperators
                                    .filter((o) => o.id !== op.id)
                                    .map((o) => (
                                      <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
