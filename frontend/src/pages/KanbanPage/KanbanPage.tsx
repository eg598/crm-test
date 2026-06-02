import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { KanbanBoard } from '../../components/KanbanBoard';
import './KanbanPage.scss';

export function KanbanPage() {
  const { user } = useAuth();
  const { tickets, isLoading, error, updateTicketStatus } = useTickets({ status: undefined });

  return (
    <div className="kanban-page">
      <div className="kanban-page__header">
        <h1 className="kanban-page__title">Kanban Board</h1>
        <p className="kanban-page__hint">Drag and drop tickets between columns to update status</p>
      </div>

      {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}

      {isLoading && tickets.length === 0 ? (
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      ) : (
        <KanbanBoard tickets={tickets} onStatusChange={updateTicketStatus} user={user} />
      )}
    </div>
  );
}
