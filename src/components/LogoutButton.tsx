'use client';

import {useRouter} from 'next/navigation';
import {LogOut} from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin-login', {method: 'DELETE'});
    router.replace('/login');
    router.refresh();
  };

  return (
    <button className="ghostButton" onClick={handleLogout} type="button">
      <LogOut size={17} />
      Logout
    </button>
  );
}

