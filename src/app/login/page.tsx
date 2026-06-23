'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockKeyhole, LogIn } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to login.');
      }

      const nextPath = searchParams.get('next') || '/';
      router.replace(nextPath.startsWith('/') ? nextPath : '/');
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to login.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="loginPage">
      <section className="loginPanel">
        <div className="loginBrand">
          <div className="brandMark">UP</div>
          <div>
            <p className="eyebrow">Admin access</p>
            <h1>UstaadPro Admin</h1>
          </div>
        </div>

        <div className="loginIcon">
          <LockKeyhole size={28} />
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              inputMode="email"
              onChange={event => setEmail(event.target.value)}
              placeholder="admin@email.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={event => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="loginError">{error}</p> : null}

          <button className="primaryButton loginButton" disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
