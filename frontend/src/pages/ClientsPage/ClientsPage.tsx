import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClients } from '../../hooks/useClients';
import { clientsApi } from '../../api/clients.api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Client, CreateClientDto } from '../../types';
import { FieldErrors, isValidEmail, notEmpty } from '../../utils/validate';
import './ClientsPage.scss';

type ClientErrors = FieldErrors<CreateClientDto>;

function validateClient(data: Partial<CreateClientDto>): ClientErrors {
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

const EMPTY: Partial<CreateClientDto> = {
  name: '', contactPerson: '', email: '', phone: '', address: '', comment: '',
};

export function ClientsPage() {
  const { user } = useAuth();
  const { clients, total, isLoading, error, search, setSearch, addClient, updateClient, removeClient } = useClients();

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<CreateClientDto>>(EMPTY);
  const [errors, setErrors] = useState<ClientErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const canWrite = user?.role === 'supervisor' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const setField = (field: keyof CreateClientDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const openCreate = () => {
    setEditingClient(null);
    setForm(EMPTY);
    setErrors({});
    setServerError('');
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name:          client.name,
      contactPerson: client.contactPerson ?? '',
      email:         client.email ?? '',
      phone:         client.phone ?? '',
      address:       client.address ?? '',
      comment:       client.comment ?? '',
    });
    setErrors({});
    setServerError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateClient(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError('');
    try {
      if (editingClient) {
        const res = await clientsApi.update(editingClient.id, form as CreateClientDto);
        updateClient(res.data);
      } else {
        const res = await clientsApi.create(form as CreateClientDto);
        addClient(res.data);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete client "${client.name}"?`)) return;
    try {
      await clientsApi.delete(client.id);
      removeClient(client.id);
    } catch {
      alert('Failed to delete client');
    }
  };

  return (
    <div className="clients-page">
      <div className="clients-page__header">
        <div>
          <h1 className="clients-page__title">Clients</h1>
          <p className="clients-page__count">{total} total</p>
        </div>
        {canWrite && <Button onClick={openCreate}>+ New Client</Button>}
      </div>

      <div className="clients-page__search">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading && clients.length === 0 ? (
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      ) : (
        <div className="clients-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="clients-table__name">{client.name}</td>
                  <td>{client.contactPerson || '—'}</td>
                  <td>{client.email || '—'}</td>
                  <td>{client.phone || '—'}</td>
                  {canWrite && (
                    <td>
                      <div className="clients-table__actions">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(client)}>Edit</Button>
                        {canDelete && (
                          <Button size="sm" variant="danger" onClick={() => handleDelete(client)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__text">No clients found</div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <form onSubmit={handleSubmit} className="client-form" noValidate>
          <Input
            label="Name *"
            value={form.name ?? ''}
            onChange={setField('name')}
            error={errors.name}
            autoFocus
          />
          <Input
            label="Contact Person *"
            value={form.contactPerson ?? ''}
            onChange={setField('contactPerson')}
            error={errors.contactPerson}
          />
          <Input
            label="Email *"
            type="email"
            value={form.email ?? ''}
            onChange={setField('email')}
            error={errors.email}
          />
          <Input
            label="Phone *"
            value={form.phone ?? ''}
            onChange={setField('phone')}
            error={errors.phone}
          />
          <Input
            label="Address *"
            value={form.address ?? ''}
            onChange={setField('address')}
            error={errors.address}
          />
          <div className="input-field">
            <label className="input-field__label">Comment *</label>
            <textarea
              className={`input-field__input ${errors.comment ? 'input-field__input--error' : ''}`}
              value={form.comment ?? ''}
              onChange={setField('comment')}
              rows={2}
            />
            {errors.comment && <span className="input-field__error">{errors.comment}</span>}
          </div>

          {serverError && <div className="error-message">{serverError}</div>}

          <div className="client-form__actions">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>{editingClient ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
