'use client';

import {useEffect, useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminUser, getUsers} from '@/lib/api';
import {money} from '@/lib/adminUi';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const nextUsers = await getUsers();
    setUsers(nextUsers);
  };

  useEffect(() => {
    loadData().catch(() =>
      setMessage('Could not load users. Check that the API is running.'),
    );
  }, []);

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
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
