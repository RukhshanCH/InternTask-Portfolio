// ============================================
// pages/InvitePage.tsx — Accept Invitation
// User clicks invite link, signs up/logs in, joins portfolio
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvitation, getCurrentUser, signIn, signUp } from '../utils/supabase';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<'checking' | 'login' | 'accepting' | 'success' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');
//   const [portfolioTitle, setPortfolioTitle] = useState('');

  // Login form state (if not already logged in)
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthAndAccept();
  }, []);

  async function checkAuthAndAccept() {
    const user = await getCurrentUser();

    if (user) {
      // Already logged in — try to accept immediately
      setStep('accepting');
      const success = await acceptInvitation(token!);
      if (success) {
        setStep('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStep('error');
        setErrorMsg('Invalid or expired invitation link.');
      }
    } else {
      // Need to login/signup first
      setStep('login');
      // Pre-fill email if passed in query params
      const inviteEmail = searchParams.get('email');
      if (inviteEmail) setEmail(inviteEmail);
    }
  }

  async function handleAuthAndAccept(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let authError = null;

      if (!isLogin) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error } = await signUp(email, password);
        authError = error;
        if (!error) {
          setErrorMsg('Account created! Please check your email to confirm, then come back to this link.');
          setLoading(false);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        authError = error;
      }

      if (authError) throw authError;

      // Now accept the invitation
      setStep('accepting');
      const success = await acceptInvitation(token!);

      if (success) {
        setStep('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        throw new Error('Failed to accept invitation. It may be expired or already used.');
      }
    } catch (err: any) {
      setStep('login');
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'checking' || step === 'accepting') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.text}>
            {step === 'checking' ? 'Checking invitation...' : 'Accepting invitation...'}
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.title}>Invitation Accepted!</h2>
          <p style={styles.text}>
            You've been added to the portfolio. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.title}>Invitation Error</h2>
          <p style={styles.errorText}>{errorMsg}</p>
          <button onClick={() => navigate('/')} style={styles.button}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Login/Signup form
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.inviteIcon}>📨</div>
        <h2 style={styles.title}>You're Invited!</h2>
        <p style={styles.subtitle}>
          {isLogin 
            ? 'Sign in to accept this portfolio invitation' 
            : 'Create an account to join this portfolio'}
        </p>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleAuthAndAccept} style={styles.form}>
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
              ? 'Processing...' 
              : (isLogin ? 'Sign In & Accept' : 'Create Account & Accept')
            }
          </button>
        </form>

        <p style={styles.switchText}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
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
    maxWidth: '440px',
    background: 'var(--color-surface, #1e293b)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid var(--color-gray, #334155)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-gray, #334155)',
    borderTopColor: 'var(--color-primary, #3b82f6)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  inviteIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--color-text, #e2e8f0)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: '0 0 24px 0',
  },
  text: {
    fontSize: '15px',
    color: 'var(--color-text-muted, #94a3b8)',
    margin: 0,
  },
  errorText: {
    fontSize: '14px',
    color: '#ef4444',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text, #e2e8f0)',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--color-gray, #334155)',
    background: 'var(--color-background, #0f172a)',
    color: 'var(--color-text, #e2e8f0)',
    fontSize: '15px',
    outline: 'none',
  },
  button: {
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-primary, #3b82f6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  switchText: {
    color: 'var(--color-text-muted, #94a3b8)',
    fontSize: '14px',
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