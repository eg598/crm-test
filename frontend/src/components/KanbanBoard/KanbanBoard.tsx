import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, Ticket, TicketStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import './KanbanBoard.scss';

const COLUMNS: { status: TicketStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'waiting', label: 'Waiting' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'closed', label: 'Closed' },
];

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: number, status: TicketStatus) => void;
  user?: AuthUser | null;
}

export function KanbanBoard({ tickets, onStatusChange, user }: KanbanBoardProps) {
  const navigate = useNavigate();

  const columnMap = useMemo(() => {
    const map: Record<TicketStatus, Ticket[]> = {
      new: [],
      in_progress: [],
      waiting: [],
      resolved: [],
      closed: [],
    };
    for (const ticket of tickets) {
      if (map[ticket.status]) {
        map[ticket.status].push(ticket);
      }
    }
    return map;
  }, [tickets]);

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          label={col.label}
          tickets={columnMap[col.status]}
          onDrop={onStatusChange}
          onTicketClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
          user={user}
        />
      ))}
    </div>
  );
}
