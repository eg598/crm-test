import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { useClients } from '../../hooks/useClients';
import { useUsers } from '../../hooks/useUsers';
import { FilterBar } from '../../components/FilterBar';
import { TicketCard } from '../../components/TicketCard';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { ticketsApi } from '../../api/tickets.api';
import { clientsApi } from '../../api/clients.api';
import { CreateClientDto, CreateTicketDto, Priority } from '../../types';
import { FieldErrors, isValidEmail, notEmpty } from '../../utils/validate';
import './TicketsPage.scss';

// ─── Ticket validation ───────────────────────────────────────────────────────

type TicketErrors = FieldErrors<{
  title: string;
  description: string;
  category: string;
  clientId: string;
  assignedUserId: string;
  deadline: string;
}>;

function validateTicket(form: Partial<CreateTicketDto>): TicketErrors {
  const e: TicketErrors = {};
  if (!notEmpty(form.title))          e.title          = 'Required';
  if (!notEmpty(form.description))    e.description    = 'Required';
  if (!notEmpty(form.category))       e.category       = 'Required';
  if (!form.clientId)                 e.clientId       = 'Required';
  if (!form.assignedUserId)           e.assignedUserId = 'Required';
  if (!notEmpty(form.deadline))       e.deadline       = 'Required';
  return e;
}

// ─── Client validation ───────────────────────────────────────────────────────

type ClientErrors = FieldErrors<CreateClientDto>;

const EMPTY_CLIENT: Partial<CreateClientDto> = {
  name: '', contactPerson: '', email: '', phone: '', address: '', comment: '',
};

function validateClientForm(data: Partial<CreateClientDto>): ClientErrors {
  const e: ClientErrors = {};
  if (!notEmpty(data.name))          e.name          = 'Required';
  if (!notEmpty(data.contactPerson)) e.contactPerson = 'Required';
  if (!notEmpty(data.email))         e.email         = 'Required';
  else if (!isValidEmail(data.email!)) e.email       = 'Invalid email';
  if (!notEmpty(data.phone))         e.phone         = 'Required';
  if (!notEmpty(data.address))       e.address       = 'Required';
  if (!notEmpty(data.comment))       e.comment       = 'Required';
  return e;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, total, nextCursor, isLoading, error, filters, setFilters, fetchTickets, addTicket } = useTickets();
  const { clients, addClient } = useClients();
  const { users } = useUsers();

  // Ticket form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Partial<CreateTicketDto>>({});
  const [ticketErrors, setTicketErrors] = useState<TicketErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Inline new-client form
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState<Partial<CreateClientDto>>(EMPTY_CLIENT);
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [newClientSubmitting, setNewClientSubmitting] = useState(false);

  const closeCreate = () => {
    setShowCreate(false);
    setShowNewClient(false);
    setForm({});
    setTicketErrors({});
    setNewClientForm(EMPTY_CLIENT);
    setClientErrors({});
    setServerError('');
  };

  // ── Ticket handlers ──────────────────────────────────────────────────────

  const setTicketField = <K extends keyof CreateTicketDto>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = (e.target.value || undefined) as CreateTicketDto[K];
      setForm((prev) => ({ ...prev, [field]: value }));
      if ((ticketErrors as Record<string, unknown>)[field])
        setTicketErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateTicket(form);
    if (Object.keys(errs).length > 0) { setTicketErrors(errs); return; }

    setSubmitting(true);
    setServerError('');
    try {
      const res = await ticketsApi.create(form as CreateTicketDto);
      addTicket(res.data);
      closeCreate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Client inline handlers ───────────────────────────────────────────────

  const setClientField = (field: keyof CreateClientDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setNewClientForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (clientErrors[field]) setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleClientSelectChange = (value: string) => {
    if (value === '__new__') {
      setShowNewClient(true);
      setNewClientForm(EMPTY_CLIENT);
      setClientErrors({});
    } else {
      setForm((prev) => ({ ...prev, clientId: value ? Number(value) : undefined }));
      if (ticketErrors.clientId) setTicketErrors((prev) => ({ ...prev, clientId: undefined }));
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateClientForm(newClientForm);
    if (Object.keys(errs).length > 0) { setClientErrors(errs); return; }

    setNewClientSubmitting(true);
    try {
      const dto: CreateClientDto = {
        name:          newClientForm.name!.trim(),
        contactPerson: newClientForm.contactPerson!.trim(),
        email:         newClientForm.email!.trim(),
        phone:         newClientForm.phone!.trim(),
        address:       newClientForm.address!.trim(),
        comment:       newClientForm.comment!.trim(),
      };
      const res = await clientsApi.create(dto);
      addClient(res.data);
      setForm((prev) => ({ ...prev, clientId: res.data.id }));
      if (ticketErrors.clientId) setTicketErrors((prev) => ({ ...prev, clientId: undefined }));
      setShowNewClient(false);
      setNewClientForm(EMPTY_CLIENT);
      setClientErrors({});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setClientErrors((prev) => ({ ...prev, name: msg || 'Failed to create client' }));
    } finally {
      setNewClientSubmitting(false);
    }
  };

  const selectedClientName = form.clientId
    ? (clients.find((c) => c.id === form.clientId)?.name ?? '')
    : '';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="tickets-page">
      <div className="tickets-page__header">
        <div>
          <h1 className="tickets-page__title">Tickets</h1>
          <p className="tickets-page__count">{total} total</p>
        </div>
        {user?.role === 'supervisor' && (
          <Button onClick={() => setShowCreate(true)}>+ New Ticket</Button>
        )}
      </div>

      <div className="tickets-page__filters">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading && tickets.length === 0 ? (
        <div className="tickets-page__loading">Loading tickets...</div>
      ) : (
        <>
          <div className="tickets-page__list">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => navigate(`/tickets/${ticket.id}`)} />
            ))}
          </div>
          {tickets.length === 0 && !isLoading && (
            <div className="empty-state"><div className="empty-state__text">No tickets found</div></div>
          )}
          {nextCursor && (
            <div className="tickets-page__load-more">
              <Button variant="secondary" isLoading={isLoading} onClick={() => fetchTickets(true)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── New Ticket modal ── */}
      <Modal isOpen={showCreate} onClose={closeCreate} title="New Ticket">
        <form onSubmit={handleCreate} className="ticket-form" noValidate>

          {/* Title */}
          <Input
            label="Title *"
            value={form.title ?? ''}
            onChange={setTicketField('title')}
            error={ticketErrors.title}
            autoFocus
          />

          {/* Description */}
          <div className="input-field">
            <label className="input-field__label">Description *</label>
            <textarea
              className={`input-field__input ${ticketErrors.description ? 'input-field__input--error' : ''}`}
              value={form.description ?? ''}
              onChange={setTicketField('description')}
              rows={3}
            />
            {ticketErrors.description && <span className="input-field__error">{ticketErrors.description}</span>}
          </div>

          {/* Priority + Category */}
          <div className="ticket-form__row">
            <div className="input-field">
              <label className="input-field__label">Priority *</label>
              <select
                className="input-field__input"
                value={form.priority ?? 'medium'}
                onChange={setTicketField('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Input
              label="Category *"
              value={form.category ?? ''}
              onChange={setTicketField('category')}
              error={ticketErrors.category}
            />
          </div>

          {/* Client */}
          <div className="input-field">
            <label className={`input-field__label ${ticketErrors.clientId ? 'input-field__label--error' : ''}`}>
              Client *
            </label>
            {showNewClient ? (
              /* ── Inline new-client form ── */
              <div className="ticket-form__new-client">
                <div className="ticket-form__new-client-header">
                  <span className="ticket-form__new-client-title">New Client</span>
                  <button type="button" className="ticket-form__new-client-cancel" onClick={() => setShowNewClient(false)}>
                    ✕ Cancel
                  </button>
                </div>
                <div className="ticket-form__row">
                  <Input label="Name *"           value={newClientForm.name ?? ''}          onChange={setClientField('name')}          error={clientErrors.name} autoFocus />
                  <Input label="Contact Person *"  value={newClientForm.contactPerson ?? ''} onChange={setClientField('contactPerson')} error={clientErrors.contactPerson} />
                </div>
                <div className="ticket-form__row">
                  <Input label="Email *"  type="email" value={newClientForm.email ?? ''}  onChange={setClientField('email')}  error={clientErrors.email} />
                  <Input label="Phone *"             value={newClientForm.phone ?? ''}  onChange={setClientField('phone')}  error={clientErrors.phone} />
                </div>
                <Input label="Address *" value={newClientForm.address ?? ''} onChange={setClientField('address')} error={clientErrors.address} />
                <div className="input-field">
                  <label className="input-field__label">Comment *</label>
                  <textarea
                    className={`input-field__input ${clientErrors.comment ? 'input-field__input--error' : ''}`}
                    value={newClientForm.comment ?? ''}
                    onChange={setClientField('comment')}
                    rows={2}
                  />
                  {clientErrors.comment && <span className="input-field__error">{clientErrors.comment}</span>}
                </div>
                <div>
                  <Button size="sm" isLoading={newClientSubmitting} onClick={handleCreateClient} type="button">
                    Create Client &amp; Select
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <select
                  className={`input-field__input ${ticketErrors.clientId ? 'input-field__input--error' : ''}`}
                  value={form.clientId ?? ''}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="__new__">+ New Client</option>
                </select>
                {ticketErrors.clientId && <span className="input-field__error">{ticketErrors.clientId}</span>}
                {form.clientId && (
                  <span style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Selected: {selectedClientName}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Assignee */}
          <div className="input-field">
            <label className={`input-field__label ${ticketErrors.assignedUserId ? 'input-field__label--error' : ''}`}>
              Assignee *
            </label>
            <select
              className={`input-field__input ${ticketErrors.assignedUserId ? 'input-field__input--error' : ''}`}
              value={form.assignedUserId ?? ''}
              onChange={(e) => {
                setTicketField('assignedUserId')(e);
              }}
            >
              <option value="">Select an operator...</option>
              {users.filter((u) => u.role === 'operator').map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {ticketErrors.assignedUserId && (
              <span className="input-field__error">{ticketErrors.assignedUserId}</span>
            )}
          </div>

          {/* Deadline */}
          <Input
            label="Deadline *"
            type="date"
            value={form.deadline ?? ''}
            onChange={setTicketField('deadline')}
            error={ticketErrors.deadline}
          />

          {serverError && <div className="error-message">{serverError}</div>}

          <div className="ticket-form__actions">
            <Button type="button" variant="secondary" onClick={closeCreate}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Create Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
