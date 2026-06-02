import { Ticket } from '../../types';
import './TicketCard.scss';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isOverdue?: boolean;
}

export function TicketCard({ ticket, onClick, draggable, onDragStart, isOverdue }: TicketCardProps) {
  const deadline = ticket.deadline ? new Date(ticket.deadline) : null;
  const overdue = isOverdue ?? (deadline ? deadline < new Date() && !['resolved', 'closed'].includes(ticket.status) : false);

  return (
    <div
      className={`ticket-card ${overdue ? 'ticket-card--overdue' : ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      style={{ cursor: onClick || draggable ? 'pointer' : 'default' }}
    >
      <div className="ticket-card__header">
        <span className={`badge badge--${ticket.priority}`}>{ticket.priority}</span>
        <span className="ticket-card__id">#{ticket.id}</span>
      </div>

      <div className="ticket-card__title">{ticket.title}</div>

      <div className="ticket-card__meta">
        {ticket.client && (
          <span className="ticket-card__meta-item">{ticket.client.name}</span>
        )}
        {ticket.assignedUser && (
          <span className="ticket-card__meta-item ticket-card__meta-item--assignee">
            {ticket.assignedUser.name}
          </span>
        )}
      </div>

      {deadline && (
        <div className={`ticket-card__deadline ${overdue ? 'ticket-card__deadline--overdue' : ''}`}>
          {overdue ? '⚠ Overdue: ' : 'Due: '}
          {deadline.toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
