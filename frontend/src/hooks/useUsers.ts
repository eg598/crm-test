import { useEffect, useState } from 'react';
import { User } from '../types';
import { usersApi } from '../api/users.api';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = (user: User) => setUsers((prev) => [user, ...prev]);
  const updateUser = (updated: User) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  const removeUser = (id: number) => setUsers((prev) => prev.filter((u) => u.id !== id));

  return { users, isLoading, error, fetchUsers, addUser, updateUser, removeUser };
}
