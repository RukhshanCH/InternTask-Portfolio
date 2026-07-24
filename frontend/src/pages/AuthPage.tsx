// ============================================
// pages/AuthPage.tsx — Login & Signup (FIXED)
// Uses Supabase Auth with proper redirect handling
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signIn, signUp, getSession } from '../utils/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check if already logged in on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    const session = await getSession();
    if (session) {
      console.log('Already logged in, redirecting to', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (!isLogin) {
        // SIGN UP
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { data, error: signUpError } = await signUp(email, password);

        if (signUpError) throw signUpError;

        // Check if user already exists (identities array empty)
        if (data.user?.identities?.length === 0) {
          setMessage('Account already exists. Please sign in.');
          setIsLogin(true);
          setLoading(false);
          return;
        }

        // If email confirmation is required, session will be null
        if (!data.session) {
          setMessage('Check your email for confirmation link, or sign in if email confirmation is disabled.');
          setLoading(false);
          return;
        }

        // Auto-login after signup (if email confirmation disabled)
        console.log('Signup successful, session exists, redirecting...');
        navigate(redirectTo, { replace: true });

      } else {
        // SIGN IN
        const { data, error: signInError } = await signIn(email, password);

        if (signInError) {
          // Provide helpful error messages
          let msg = signInError.message;
          if (signInError.message.includes('Invalid login credentials')) {
            msg = 'Invalid email or password.';
          }
          if (signInError.message.includes('Email not confirmed')) {
            msg = 'Email not confirmed. Check your inbox, or ask the admin to disable email confirmation in Supabase settings.';
          }
          throw new Error(msg);
        }

        if (data.session) {
          console.log('Login successful, session:', data.session.user?.email);
          console.log('Redirecting to:', redirectTo);
          // Small delay to ensure session is propagated
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 100);
        } else {
          throw new Error('No session returned. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {isLogin 
            ? 'Sign in to manage your portfolios' 
            : 'Sign up to start building your portfolio'}
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading 
              ? (isLogin ? 'Signing in...' : 'Creating account...') 
              : (isLogin ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <p style={styles.switchText}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            style={styles.switchButton}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-background, #0f172a)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    border: '1px solid var(--color-gray, #334155)',
  },
  title: {
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '13px',
    fontWeight: 500,
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  error: {
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '16px',
  },
  success: {
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    fontSize: '13px',
    marginBottom: '16px',
  },
  switchText: {
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '24px',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary, #3b82f6)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
};