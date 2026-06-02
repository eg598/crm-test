import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsApi } from '../../api/tickets.api';
import { useUsers } from '../../hooks/useUsers';
import { useClients } from '../../hooks/useClients';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Ticket, TicketStatus, Priority, TicketComment } from '../../types';
import './TicketDetailPage.scss';

const STATUS_OPTIONS: TicketStatus[] = ['new', 'in_progress', 'waiting', 'resolved', 'closed'];
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'critical'];

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUsers();
  const { clients } = useClients();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Reloads the full ticket (including history) from the server
  const refreshTicket = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ticketsApi.getById(Number(id));
      setTicket(res.data);
    } catch { /* ignore — stale state is better than a crash */ }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    ticketsApi.getById(Number(id))
      .then((res) => setTicket(res.data))
      .catch(() => setError('Ticket not found'))
      .finally(() => setIsLoading(false));

    ticketsApi.listComments(Number(id))
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [id]);

  const handleSaveField = async (field: string, value: unknown) => {
    if (!ticket) return;
    setSaving(true);
    try {
      await ticketsApi.update(ticket.id, { [field]: value || null });
      await refreshTicket();
      setEditField(null);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setSaving(true);
    try {
      await ticketsApi.updateStatus(ticket.id, status);
      await refreshTicket();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (assignedUserId: number | null) => {
    if (!ticket) return;
    setSaving(true);
    try {
      if (assignedUserId) {
        await ticketsApi.assign(ticket.id, assignedUserId);
      } else {
        await ticketsApi.update(ticket.id, { assignedUserId: undefined });
      }
      await refreshTicket();
    } catch {
      setError('Failed to reassign ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket || !confirm('Delete this ticket?')) return;
    try {
      await ticketsApi.delete(ticket.id);
      navigate('/tickets');
    } catch {
      setError('Failed to delete ticket');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !commentBody.trim()) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await ticketsApi.addComment(ticket.id, commentBody.trim());
      setComments((prev) => [...prev, res.data]);
      setCommentBody('');
    } catch {
      setCommentError('Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (isLoading) return <div className="ticket-detail-page"><div className="ticket-detail-page__loading">Loading...</div></div>;
  if (!ticket) return <div className="ticket-detail-page"><div className="error-message">{error || 'Ticket not found'}</div></div>;

  const operators = users.filter((u) => u.role === 'operator');
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  // Operators can only set these statuses
  const allowedStatuses: TicketStatus[] = isOperator
    ? ['in_progress', 'waiting', 'resolved']
    : STATUS_OPTIONS;

  return (
    <div className="ticket-detail-page">
      <div className="ticket-detail-page__toolbar">
        <button className="ticket-detail-page__back" onClick={() => navigate(-1)}>← Back</button>
        <div className="ticket-detail-page__actions">
          {isSupervisor && (
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="ticket-detail-page__content">
        <div className="ticket-detail-page__main">
          {/* Title */}
          <div className="ticket-detail-page__field">
            {editField === 'title' ? (
              <div className="ticket-detail-page__inline-edit">
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                <Button size="sm" isLoading={saving} onClick={() => handleSaveField('title', editValue)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditField(null)}>Cancel</Button>
              </div>
            ) : (
              <h1
                className="ticket-detail-page__title"
                onClick={isSupervisor ? () => { setEditField('title'); setEditValue(ticket.title); } : undefined}
                title={isSupervisor ? 'Click to edit' : undefined}
                style={{ cursor: isSupervisor ? 'pointer' : 'default' }}
              >
                {ticket.title}
              </h1>
            )}
          </div>

          {/* Description */}
          <div className="ticket-detail-page__field">
            <div className="ticket-detail-page__field-label">Description</div>
            {editField === 'description' ? (
              <div className="ticket-detail-page__inline-edit">
                <textarea
                  className="input-field__input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  rows={4}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" isLoading={saving} onClick={() => handleSaveField('description', editValue)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditField(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div
                className="ticket-detail-page__description"
                onClick={isSupervisor ? () => { setEditField('description'); setEditValue(ticket.description ?? ''); } : undefined}
                title={isSupervisor ? 'Click to edit' : undefined}
                style={{ cursor: isSupervisor ? 'pointer' : 'default' }}
              >
                {ticket.description || <span style={{ color: '#94a3b8' }}>No description</span>}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="ticket-detail-page__history">
            <div className="ticket-detail-page__field-label">Comments</div>
            {comments.length > 0 ? (
              <div className="ticket-history">
                {comments.map((c) => (
                  <div key={c.id} className="ticket-history__entry">
                    <div className="ticket-history__action">{c.body}</div>
                    <div className="ticket-history__meta">
                      {c.author?.name && <span>{c.author.name} ({c.author.role}) · </span>}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>No comments yet</div>
            )}

            {(isSupervisor || isOperator) && (
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <textarea
                  className="input-field__input"
                  placeholder="Add a comment..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                />
                {commentError && <div className="error-message">{commentError}</div>}
                <div>
                  <Button type="submit" size="sm" isLoading={commentSubmitting} disabled={!commentBody.trim()}>
                    Add Comment
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Activity History — always fresh after refreshTicket */}
          <div className="ticket-detail-page__history" style={{ marginTop: 24 }}>
            <div className="ticket-detail-page__field-label">Activity History</div>
            {ticket.history && ticket.history.length > 0 ? (
              <div className="ticket-history">
                {[...ticket.history].reverse().map((entry) => (
                  <div key={entry.id} className="ticket-history__entry">
                    <div className="ticket-history__action">{entry.action}</div>
                    <div className="ticket-history__meta">
                      {entry.actor?.name && <span>{entry.actor.name} · </span>}
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No history yet</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="ticket-detail-page__sidebar">
          <div className="ticket-detail-page__meta-card">
            {/* Status */}
            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Status</span>
              <select
                className="input-field__input"
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={saving}
              >
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Priority</span>
              {isSupervisor ? (
                <select
                  className="input-field__input"
                  value={ticket.priority}
                  onChange={(e) => handleSaveField('priority', e.target.value)}
                  disabled={saving}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <span className={`badge badge--${ticket.priority}`}>{ticket.priority}</span>
              )}
            </div>

            {/* Assignee */}
            {isSupervisor ? (
              <div className="ticket-detail-page__meta-item">
                <span className="ticket-detail-page__meta-label">Assignee</span>
                <select
                  className="input-field__input"
                  value={ticket.assignedUserId ?? ''}
                  onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                  disabled={saving}
                >
                  <option value="">Unassigned</option>
                  {operators.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="ticket-detail-page__meta-item">
                <span className="ticket-detail-page__meta-label">Assignee</span>
                <span>{ticket.assignedUser?.name ?? 'Unassigned'}</span>
              </div>
            )}

            {/* Client */}
            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Client</span>
              {isSupervisor ? (
                <select
                  className="input-field__input"
                  value={ticket.clientId ?? ''}
                  onChange={(e) => handleSaveField('clientId', e.target.value ? Number(e.target.value) : null)}
                  disabled={saving}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <span>{ticket.client?.name ?? 'None'}</span>
              )}
            </div>

            {/* Category */}
            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Category</span>
              {editField === 'category' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                  <Button size="sm" isLoading={saving} onClick={() => handleSaveField('category', editValue)}>✓</Button>
                </div>
              ) : (
                <span
                  onClick={isSupervisor ? () => { setEditField('category'); setEditValue(ticket.category ?? ''); } : undefined}
                  style={{ cursor: isSupervisor ? 'pointer' : 'default' }}
                  title={isSupervisor ? 'Click to edit' : undefined}
                >
                  {ticket.category || 'None'}
                </span>
              )}
            </div>

            {/* Deadline */}
            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Deadline</span>
              {isSupervisor ? (
                <Input
                  type="date"
                  value={ticket.deadline ? ticket.deadline.slice(0, 10) : ''}
                  onChange={(e) => handleSaveField('deadline', e.target.value)}
                />
              ) : (
                <span>{ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : 'None'}</span>
              )}
            </div>

            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Created</span>
              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="ticket-detail-page__meta-item">
              <span className="ticket-detail-page__meta-label">Updated</span>
              <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
