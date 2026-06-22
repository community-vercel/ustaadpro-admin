'use client';

import {useEffect, useState} from 'react';
import {RefreshCw, Trash2} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminUser, deleteUser, getUsers} from '@/lib/api';
import {money} from '@/lib/adminUi';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    const nextUsers = await getUsers();
    setUsers(nextUsers);
  };

  useEffect(() => {
    loadData().catch(() =>
      setMessage('Could not load users. Check that the API is running.'),
    );
  }, []);

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = confirm(
      `Delete ${user.name}? This will remove the user and their orders, addresses, reviews, and shop orders.`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(user.id);
      await deleteUser(user.id);
      setUsers(current => current.filter(item => item.id !== user.id));
      setMessage(`${user.name} deleted.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not delete user.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell
      eyebrow="Customers"
      title="Users"
      action={
        <button className="ghostButton" onClick={() => loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Registered customers</p>
            <h3>App Users</h3>
          </div>
          <span className="countPill">{users.length} users</span>
        </div>
        <div className="userTable">
          <div className="userRow userRowHead">
            <span>Name</span>
            <span>Contact</span>
            <span>Orders</span>
            <span>Total Spend</span>
            <span>Action</span>
          </div>
          {users.map(user => (
            <div className="userRow" key={user.id}>
              <strong>{user.name}</strong>
              <span>
                {user.phone}
                <br />
                {user.email}
              </span>
              <span>{user.totalOrders}</span>
              <span>{money(user.totalSpend)}</span>
              <button
                className="dangerIconButton"
                onClick={() => void handleDeleteUser(user)}
                disabled={deletingId === user.id}
                title={`Delete ${user.name}`}
              >
                <Trash2 size={16} />
                {deletingId === user.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
