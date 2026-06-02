import React, { useState } from 'react';
import { AuthUser, Ticket, TicketStatus } from '../../../types';
import { TicketCard } from '../../TicketCard';
import './KanbanColumn.scss';

const OPERATOR_ALLOWED_STATUSES: TicketStatus[] = ['in_progress', 'waiting', 'resolved'];

interface KanbanColumnProps {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
  onDrop: (ticketId: number, newStatus: TicketStatus) => void;
  onTicketClick: (ticket: Ticket) => void;
  user?: AuthUser | null;
}

export function KanbanColumn({ status, label, tickets, onDrop, onTicketClick, user }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isOperator = user?.role === 'operator';
  // Operators cannot drop into 'new' or 'closed'
  const isDropAllowed = !isOperator || OPERATOR_ALLOWED_STATUSES.includes(status);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropAllowed) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isDropAllowed) return;
    const ticketId = Number(e.dataTransfer.getData('ticketId'));
    if (ticketId) onDrop(ticketId, status);
  };

  const canDragTicket = (ticket: Ticket) => {
    if (!isOperator) return true;
    return ticket.assignedUserId === user?.id;
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? 'kanban-column--drag-over' : ''} ${!isDropAllowed ? 'kanban-column--locked' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="kanban-column__header">
        <span className="kanban-column__label">{label}</span>
        <span className="kanban-column__count">{tickets.length}</span>
      </div>

      <div className="kanban-column__body">
        {tickets.map((ticket) => {
          const draggable = canDragTicket(ticket);
          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              draggable={draggable}
              onDragStart={draggable ? (e) => {
                e.dataTransfer.setData('ticketId', String(ticket.id));
                e.dataTransfer.effectAllowed = 'move';
              } : undefined}
              onClick={() => onTicketClick(ticket)}
            />
          );
        })}
        {tickets.length === 0 && (
          <div className="kanban-column__empty">
            {isDropAllowed ? 'Drop tickets here' : 'No access'}
          </div>
        )}
      </div>
    </div>
  );
}
