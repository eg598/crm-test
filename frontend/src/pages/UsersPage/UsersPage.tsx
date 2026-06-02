import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { User, CreateUserDto, Role } from '../../types';
import './UsersPage.scss';

export function UsersPage() {
  const { users, isLoading, error, addUser, updateUser, removeUser } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<CreateUserDto>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => { setEditingUser(null); setForm({ role: 'operator' }); setFormError(''); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, role: u.role });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setFormError('Name and email are required'); return; }
    if (!editingUser && !form.password) { setFormError('Password is required'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingUser) {
        const res = await usersApi.update(editingUser.id, form);
        updateUser(res.data);
      } else {
        const res = await usersApi.create(form as CreateUserDto);
        addUser(res.data);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try {
      await usersApi.delete(u.id);
      removeUser(u.id);
    } catch {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h1 className="users-page__title">Users</h1>
          <p className="users-page__count">{users.length} total</p>
        </div>
        <Button onClick={openCreate}>+ New User</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading && users.length === 0 ? (
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="users-table__name">{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="users-table__actions">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__text">No users found</div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingUser ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSubmit} className="user-form">
          <Input label="Name *" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Email *" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
            type="password"
            value={form.password ?? ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="input-field">
            <label className="input-field__label">Role</label>
            <select
              className="input-field__input"
              value={form.role ?? 'operator'}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="operator">Operator</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {formError && <div className="error-message">{formError}</div>}
          <div className="user-form__actions">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>{editingUser ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
