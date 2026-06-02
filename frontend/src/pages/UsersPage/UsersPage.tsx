import { useRef, useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { User, CreateUserDto, Role } from '../../types';
import './UsersPage.scss';

export function UsersPage() {
  const { users, isLoading, error, fetchUsers, addUser, updateUser, removeUser } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<CreateUserDto>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);

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
      setFormError(msg || 'Failed to save user. Please try again.');
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
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    try {
      const text = (await file.text()).replace(/^﻿/, ''); // strip UTF-8 BOM
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        alert('Import failed: invalid JSON file. Please check the file format.');
        return;
      }

      if (!Array.isArray(parsed)) {
        alert('Import failed: the JSON file must contain an array of users.');
        return;
      }

      const res = await usersApi.import(parsed as CreateUserDto[]);
      setImportResult(res.data);
      setShowImportResult(true);
      if (res.data.imported > 0) fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Import failed. Please check the file format and try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h1 className="users-page__title">Users</h1>
          <p className="users-page__count">{users.length} total</p>
        </div>
        <div className="users-page__actions">
          <Button variant="secondary" isLoading={importing} onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button onClick={openCreate}>+ New User</Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && <div className="error-message">{error}</div>}

      {isLoading && users.length === 0 ? (
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      ) : (
        <div className="users-table">
          <div className="users-table__scroll">
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
          </div>
          {users.length === 0 && (
            <div className="empty-state"><div className="empty-state__text">No users found</div></div>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
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

      {/* Import result modal */}
      <Modal isOpen={showImportResult} onClose={() => setShowImportResult(false)} title="Import Result" size="sm">
        {importResult && (
          <div className="import-result">
            <div className="import-result__stats">
              <span className="import-result__stat import-result__stat--success">
                {importResult.imported} imported
              </span>
              {importResult.skipped > 0 && (
                <span className="import-result__stat import-result__stat--warn">
                  {importResult.skipped} skipped
                </span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <ul className="import-result__errors">
                {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button onClick={() => setShowImportResult(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
